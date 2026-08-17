import Dexie, { type Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';
import type { Application, Stage, TimelineEntry, SavedView } from '../types';
import { DEFAULT_STAGES } from '../types';

class JobTrackerDB extends Dexie {
  applications!: Table<Application, string>;
  stages!: Table<Stage, string>;
  timeline!: Table<TimelineEntry, string>;
  savedViews!: Table<SavedView, string>;

  constructor() {
    super('JobApplicationTracker');
    this.version(1).stores({
      applications: 'id, company, position, city, stageId, statusBucket, category, applyDate, createdAt',
      stages: 'id, order, bucket',
      timeline: 'id, appId, createdAt',
      savedViews: 'id',
    });
  }
}

export const db = new JobTrackerDB();

// Prevent double-init (React StrictMode / race condition)
let initPromise: Promise<void> | null = null;

export function initializeDB(): Promise<void> {
  if (!initPromise) {
    initPromise = _doInit();
  }
  return initPromise;
}

async function _doInit() {
  const count = await db.stages.count();
  if (count === 0) {
    await db.stages.bulkAdd(
      DEFAULT_STAGES.map((s) => ({ ...s, id: uuidv4() })) as Stage[]
    );
  } else {
    // Deduplicate: if stages have duplicate names, keep only the first of each name
    const stages = await db.stages.orderBy('order').toArray();
    const seen = new Map<string, string>(); // name -> id to keep
    const toDelete: string[] = [];
    for (const s of stages) {
      if (seen.has(s.name)) {
        toDelete.push(s.id);
      } else {
        seen.set(s.name, s.id);
      }
    }
    if (toDelete.length > 0) {
      await db.stages.bulkDelete(toDelete);
    }
  }
}

/** Reset stages to a preset list (settings quick-config) */
export async function resetStages(presets: Omit<Stage, 'id'>[]): Promise<void> {
  await db.transaction('rw', [db.stages, db.applications], async () => {
    const oldStages = await db.stages.toArray();
    const newStages: Stage[] = presets.map((p, i) => ({
      ...p,
      id: oldStages[i]?.id ?? uuidv4(),
      order: i,
    }));

    // Migrate applications: for each old stage, map to new stage by same index or same bucket
    const oldStageMap = new Map(oldStages.map((s) => [s.id, s]));
    const newStageMap = new Map(newStages.map((s) => [s.name, s]));

    const apps = await db.applications.toArray();
    for (const app of apps) {
      const oldStage = oldStageMap.get(app.stageId);
      if (oldStage) {
        // Try to find matching new stage by name, otherwise first in same bucket
        let matched = newStageMap.get(oldStage.name);
        if (!matched) {
          matched = newStages.find((s) => s.bucket === oldStage.bucket) ?? newStages[0];
        }
        if (matched) {
          await db.applications.update(app.id, {
            stageId: matched.id,
            statusBucket: matched.bucket,
            updatedAt: Date.now(),
          });
        }
      }
    }

    // Clear old stages, insert new ones
    await db.stages.clear();
    await db.stages.bulkAdd(newStages);
  });
}

// Application CRUD
export async function createApplication(data: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>): Promise<Application> {
  const now = Date.now();
  const app: Application = {
    ...data,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };
  await db.applications.add(app);
  await db.timeline.add({
    id: uuidv4(),
    appId: app.id,
    type: 'created',
    content: `创建了投递记录：${app.company} - ${app.position}`,
    createdAt: now,
  });
  return app;
}

export async function updateApplication(id: string, data: Partial<Application>): Promise<void> {
  const existing = await db.applications.get(id);
  if (!existing) return;
  await db.applications.update(id, { ...data, updatedAt: Date.now() });
}

export async function deleteApplication(id: string): Promise<void> {
  await db.applications.delete(id);
  await db.timeline.where('appId').equals(id).delete();
}

export async function advanceStage(appId: string): Promise<void> {
  const app = await db.applications.get(appId);
  if (!app) return;

  const stages = await db.stages.orderBy('order').toArray();
  const currentIdx = stages.findIndex((s) => s.id === app.stageId);
  if (currentIdx < 0 || currentIdx >= stages.length - 1) return;

  const nextStage = stages[currentIdx + 1];
  const fromStage = stages[currentIdx].name;
  const toStage = nextStage.name;

  await db.applications.update(appId, {
    stageId: nextStage.id,
    statusBucket: nextStage.bucket,
    updatedAt: Date.now(),
  });

  await db.timeline.add({
    id: uuidv4(),
    appId,
    type: 'stage_changed',
    fromStage,
    toStage,
    content: `阶段变更：${fromStage} → ${toStage}`,
    createdAt: Date.now(),
  });
}

export async function changeStage(appId: string, fromStageId: string, toStageId: string): Promise<void> {
  const stages = await db.stages.orderBy('order').toArray();
  const from = stages.find((s) => s.id === fromStageId);
  const to = stages.find((s) => s.id === toStageId);
  if (!from || !to) return;

  await db.applications.update(appId, {
    stageId: toStageId,
    statusBucket: to.bucket,
    updatedAt: Date.now(),
  });

  await db.timeline.add({
    id: uuidv4(),
    appId,
    type: 'stage_changed',
    fromStage: from.name,
    toStage: to.name,
    content: `阶段变更：${from.name} → ${to.name}`,
    createdAt: Date.now(),
  });
}

export async function addTimelineNote(appId: string, content: string): Promise<void> {
  await db.timeline.add({
    id: uuidv4(),
    appId,
    type: 'note_added',
    content,
    createdAt: Date.now(),
  });
}

export async function importApplications(data: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<number> {
  const now = Date.now();
  const apps: Application[] = data.map((d) => ({
    ...d,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  }));
  await db.applications.bulkAdd(apps);

  const timelineEntries: TimelineEntry[] = apps.map((app) => ({
    id: uuidv4(),
    appId: app.id,
    type: 'created' as const,
    content: `导入投递记录：${app.company} - ${app.position}`,
    createdAt: now,
  }));
  await db.timeline.bulkAdd(timelineEntries);

  return apps.length;
}

export async function exportAllData() {
  const applications = await db.applications.toArray();
  const stages = await db.stages.toArray();
  const timeline = await db.timeline.toArray();
  const savedViews = await db.savedViews.toArray();
  return { applications, stages, timeline, savedViews, exportedAt: new Date().toISOString() };
}

export async function importAllData(data: {
  applications: Application[];
  stages: Stage[];
  timeline: TimelineEntry[];
  savedViews: SavedView[];
}): Promise<void> {
  await db.transaction('rw', [db.applications, db.stages, db.timeline, db.savedViews], async () => {
    await db.applications.clear();
    await db.stages.clear();
    await db.timeline.clear();
    await db.savedViews.clear();
    await db.stages.bulkAdd(data.stages);
    await db.applications.bulkAdd(data.applications);
    await db.timeline.bulkAdd(data.timeline);
    if (data.savedViews?.length) {
      await db.savedViews.bulkAdd(data.savedViews);
    }
  });
}
