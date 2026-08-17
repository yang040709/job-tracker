import { create } from 'zustand';
import type { Application, Stage, TimelineEntry, SavedView, FilterState, StatusBucket } from '../types';
import * as db from '../db';

interface AppState {
  // Data
  applications: Application[];
  stages: Stage[];
  timeline: TimelineEntry[];
  savedViews: SavedView[];

  // UI State
  darkMode: boolean;
  filters: FilterState;
  selectedAppId: string | null;

  // Actions
  loadData: () => Promise<void>;
  toggleDarkMode: () => void;
  setFilters: (filters: FilterState) => void;
  setSelectedAppId: (id: string | null) => void;

  // Application actions
  createApplication: (data: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Application>;
  updateApplication: (id: string, data: Partial<Application>) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
  advanceStage: (appId: string) => Promise<void>;
  changeStage: (appId: string, fromStageId: string, toStageId: string) => Promise<void>;

  // Timeline actions
  addNote: (appId: string, content: string) => Promise<void>;

  // Stage actions
  createStage: (data: Omit<Stage, 'id'>) => Promise<void>;
  updateStage: (id: string, data: Partial<Stage>) => Promise<void>;
  deleteStage: (id: string) => Promise<void>;
  reorderStages: (stages: Stage[]) => Promise<void>;
  resetStages: (presets: Omit<Stage, 'id'>[]) => Promise<void>;

  // Saved views
  saveView: (name: string, filters: FilterState) => Promise<void>;
  deleteView: (id: string) => Promise<void>;

  // Import/Export
  exportData: () => Promise<string>;
  importData: (jsonStr: string) => Promise<void>;
  importCSV: (csvText: string) => Promise<number>;
  clearAllData: () => Promise<void>;

  // Derived
  getFilteredApplications: () => Application[];
  getApplicationsByBucket: (bucket: StatusBucket) => Application[];
  getApplicationsByStage: (stageId: string) => Application[];
}

const initialFilters: FilterState = {
  keyword: '',
  buckets: [],
  categories: [],
  channels: [],
  dateRange: null,
};

export const useAppStore = create<AppState>((set, get) => ({
  applications: [],
  stages: [],
  timeline: [],
  savedViews: [],
  darkMode: localStorage.getItem('darkMode') === 'true',
  filters: initialFilters,
  selectedAppId: null,

  loadData: async () => {
    await db.initializeDB();
    const [applications, stages, timeline, savedViews] = await Promise.all([
      db.db.applications.toArray(),
      db.db.stages.orderBy('order').toArray(),
      db.db.timeline.toArray(),
      db.db.savedViews.toArray(),
    ]);
    set({ applications, stages, timeline, savedViews });
  },

  toggleDarkMode: () => {
    const newMode = !get().darkMode;
    localStorage.setItem('darkMode', String(newMode));
    set({ darkMode: newMode });
  },
  setFilters: (filters) => set({ filters }),
  setSelectedAppId: (id) => set({ selectedAppId: id }),

  createApplication: async (data) => {
    const app = await db.createApplication(data);
    await get().loadData();
    return app;
  },

  updateApplication: async (id, data) => {
    await db.updateApplication(id, data);
    await get().loadData();
  },

  deleteApplication: async (id) => {
    await db.deleteApplication(id);
    await get().loadData();
  },

  advanceStage: async (appId) => {
    await db.advanceStage(appId);
    await get().loadData();
  },

  changeStage: async (appId, fromStageId, toStageId) => {
    await db.changeStage(appId, fromStageId, toStageId);
    await get().loadData();
  },

  addNote: async (appId, content) => {
    await db.addTimelineNote(appId, content);
    const timeline = await db.db.timeline.toArray();
    set({ timeline });
  },

  createStage: async (data) => {
    const stage: Stage = { ...data, id: crypto.randomUUID() };
    await db.db.stages.add(stage);
    const stages = await db.db.stages.orderBy('order').toArray();
    set({ stages });
  },

  updateStage: async (id, data) => {
    await db.db.stages.update(id, data);
    const stages = await db.db.stages.orderBy('order').toArray();
    set({ stages });
  },

  deleteStage: async (id) => {
    // Migrate applications to first available stage in same bucket
    const stage = get().stages.find((s) => s.id === id);
    if (!stage) return;
    const remainingStages = get().stages.filter((s) => s.id !== id && s.bucket === stage.bucket);
    const fallbackStage = remainingStages.sort((a, b) => a.order - b.order)[0];
    if (!fallbackStage) return; // Don't delete last stage in bucket

    const affectedApps = get().applications.filter((a) => a.stageId === id);
    for (const app of affectedApps) {
      await db.db.applications.update(app.id, {
        stageId: fallbackStage.id,
        statusBucket: fallbackStage.bucket,
        updatedAt: Date.now(),
      });
    }
    await db.db.stages.delete(id);
    const stages = await db.db.stages.orderBy('order').toArray();
    set({ stages });
    await get().loadData();
  },

  reorderStages: async (newOrder) => {
    for (const s of newOrder) {
      await db.db.stages.update(s.id, { order: s.order });
    }
    const stages = await db.db.stages.orderBy('order').toArray();
    set({ stages });
  },

  resetStages: async (presets) => {
    await db.resetStages(presets);
    await get().loadData();
  },

  saveView: async (name, filters) => {
    const view: SavedView = {
      id: crypto.randomUUID(),
      name,
      filters,
      createdAt: Date.now(),
    };
    await db.db.savedViews.add(view);
    const savedViews = await db.db.savedViews.toArray();
    set({ savedViews });
  },

  deleteView: async (id) => {
    await db.db.savedViews.delete(id);
    const savedViews = await db.db.savedViews.toArray();
    set({ savedViews });
  },

  exportData: async () => {
    const data = await db.exportAllData();
    return JSON.stringify(data, null, 2);
  },

  importData: async (jsonStr) => {
    const data = JSON.parse(jsonStr);
    await db.importAllData(data);
    await get().loadData();
  },

  importCSV: async (csvText) => {
    const lines = csvText.split('\n').filter((l) => l.trim());
    if (lines.length < 2) return 0;

    const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1);

    const stages = get().stages;
    const defaultStage = stages[0];

    const apps = rows.map((line) => {
      const values = line.split(',').map((v) => v.trim().replace(/"/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = values[i] || '';
      });

      return {
        company: row['company'] || row['公司'] || '未知公司',
        position: row['position'] || row['岗位'] || '未知岗位',
        city: row['city'] || row['城市'] || '',
        applyDate: row['applyDate'] || row['投递日期'] || new Date().toISOString().slice(0, 10),
        channel: row['channel'] || row['渠道'] || '其他',
        jdLink: row['jdLink'] || row['JD链接'] || undefined,
        referrer: row['referrer'] || row['内推人'] || undefined,
        salary: row['salary'] || row['薪资'] || undefined,
        notes: row['notes'] || row['备注'] || undefined,
        category: row['category'] || row['类别'] || '校招',
        stageId: defaultStage?.id || '',
        statusBucket: (defaultStage?.bucket || '流程中') as StatusBucket,
      };
    });

    return await db.importApplications(apps);
  },

  clearAllData: async () => {
    await db.clearAllData();
    set({ applications: [], stages: [], timeline: [], savedViews: [] });
    // Re-initialize default stages
    await db.initializeDB();
    await get().loadData();
  },

  getFilteredApplications: () => {
    const { applications, filters } = get();
    let result = [...applications];

    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      result = result.filter(
        (a) =>
          a.company.toLowerCase().includes(kw) ||
          a.position.toLowerCase().includes(kw) ||
          a.city.toLowerCase().includes(kw) ||
          a.channel.toLowerCase().includes(kw) ||
          (a.referrer && a.referrer.toLowerCase().includes(kw)) ||
          (a.salary && a.salary.toLowerCase().includes(kw)) ||
          (a.notes && a.notes.toLowerCase().includes(kw)) ||
          (a.jdLink && a.jdLink.toLowerCase().includes(kw))
      );
    }

    if (filters.buckets.length > 0) {
      result = result.filter((a) => filters.buckets.includes(a.statusBucket));
    }

    if (filters.categories.length > 0) {
      result = result.filter((a) => filters.categories.includes(a.category));
    }

    if (filters.channels.length > 0) {
      result = result.filter((a) => filters.channels.includes(a.channel));
    }

    if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
      result = result.filter(
        (a) => a.applyDate >= filters.dateRange![0]! && a.applyDate <= filters.dateRange![1]!
      );
    }

    return result;
  },

  getApplicationsByBucket: (bucket) => {
    return get().getFilteredApplications().filter((a) => a.statusBucket === bucket);
  },

  getApplicationsByStage: (stageId) => {
    return get().getFilteredApplications().filter((a) => a.stageId === stageId);
  },
}));
