import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, Tag, Button, Typography, Empty, Space, message } from 'antd';
import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../../stores/appStore';
import { FilterBar } from '../../components/FilterBar';
import { ApplicationDetail } from '../../components/ApplicationDetail';
import { ApplicationForm } from '../applications/ApplicationForm';
import { BUCKET_COLORS, STATUS_BUCKETS } from '../../types';
import type { Application, StatusBucket, Stage } from '../../types';

const { Text } = Typography;

/* ─── Sortable Card ─── */

function SortableCard({
  app,
  stages,
  darkMode,
  onSelect,
}: {
  app: Application;
  stages: Stage[];
  darkMode: boolean;
  onSelect: (app: Application) => void;
}) {
  const stage = stages.find((s) => s.id === app.stageId);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: app.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    marginBottom: 8,
    cursor: 'grab',
    borderLeft: `3px solid ${BUCKET_COLORS[app.statusBucket]}`,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        size="small"
        hoverable
        onClick={() => onSelect(app)}
      >
        <div style={{ marginBottom: 4 }}>
          <Text strong style={{ fontSize: 14 }}>{app.company}</Text>
        </div>
        <div style={{ marginBottom: 4 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>{app.position}</Text>
        </div>
        <Space size={4} wrap style={{ marginTop: 4 }}>
          {app.city && (
            <Tag icon={<EnvironmentOutlined />} style={{ fontSize: 11 }}>
              {app.city}
            </Tag>
          )}
          <Tag icon={<ClockCircleOutlined />} style={{ fontSize: 11 }}>
            {app.applyDate}
          </Tag>
          {app.channel && (
            <Tag style={{ fontSize: 11 }}>{app.channel}</Tag>
          )}
          {stage && (
            <Tag color="blue" style={{ fontSize: 11 }}>{stage.name}</Tag>
          )}
          {app.salary && (
            <Tag color="green" style={{ fontSize: 11 }}>{app.salary}</Tag>
          )}
        </Space>
      </Card>
    </div>
  );
}

/* ─── Droppable Stage ─── */

function DroppableStage({
  stage,
  appIds,
  apps,
  allStages,
  darkMode,
  onSelect,
}: {
  stage: Stage;
  appIds: string[];
  apps: Application[];
  allStages: Stage[];
  darkMode: boolean;
  onSelect: (app: Application) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: stage.id });

  return (
    <div key={stage.id} style={{ marginBottom: 16 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 8,
          padding: '4px 8px',
          background: darkMode ? '#2a2a2a' : '#f0f0f0',
          borderRadius: 4,
        }}
      >
        <BankOutlined style={{ marginRight: 6, fontSize: 12, color: '#999' }} />
        <Text type="secondary" style={{ fontSize: 12 }}>{stage.name}</Text>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#999' }}>
          {appIds.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        style={{
          minHeight: 60,
          padding: 4,
          borderRadius: 6,
          background: isOver
            ? (darkMode ? 'rgba(24,144,255,0.12)' : 'rgba(24,144,255,0.06)')
            : 'transparent',
          border: isOver
            ? '2px dashed #1890ff'
            : `2px dashed ${darkMode ? '#444' : '#e8e8e8'}`,
          transition: 'background 0.15s, border-color 0.15s',
        }}
      >
        <SortableContext items={appIds} strategy={verticalListSortingStrategy}>
          {appIds.length > 0 ? (
            appIds.map((id) => {
              const app = apps.find((a) => a.id === id);
              return app ? (
                <SortableCard
                  key={app.id}
                  app={app}
                  stages={allStages}
                  darkMode={darkMode}
                  onSelect={onSelect}
                />
              ) : null;
            })
          ) : (
            <div
              style={{
                padding: 16,
                textAlign: 'center',
                color: '#ccc',
                fontSize: 12,
              }}
            >
              暂无记录
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}

/* ─── Main Kanban View ─── */

export function KanbanView() {
  const {
    stages,
    getFilteredApplications,
    changeStage,
    deleteApplication,
    darkMode,
  } = useAppStore();

  const [draggedApp, setDraggedApp] = useState<Application | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [editApp, setEditApp] = useState<Application | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const filteredApps = getFilteredApplications();

  const stagesByBucket = useMemo(() => {
    const map: Record<StatusBucket, Stage[]> = {
      '流程中': [],
      '面试中': [],
      '已拿Offer': [],
      '已结束': [],
    };
    for (const s of stages) {
      map[s.bucket].push(s);
    }
    return map;
  }, [stages]);

  const appsByStage = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const app of filteredApps) {
      if (!map[app.stageId]) map[app.stageId] = [];
      map[app.stageId].push(app.id);
    }
    return map;
  }, [filteredApps]);

  const handleDragStart = (event: DragStartEvent) => {
    const appId = event.active.id as string;
    const app = filteredApps.find((a) => a.id === appId);
    setDraggedApp(app || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggedApp(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    const app = filteredApps.find((a) => a.id === activeId);
    if (!app) return;

    // Find which stage the dragged card belongs to
    const sourceStageId = app.stageId;
    // Determine the target: could be a stage container or another card
    const targetStage = stages.find((s) => s.id === overId);
    const targetApp = filteredApps.find((a) => a.id === overId);
    const destStageId = targetStage?.id ?? targetApp?.stageId;

    if (!destStageId) return;

    if (sourceStageId !== destStageId) {
      changeStage(activeId, sourceStageId, destStageId);
    }
  };

  const renderOverlay = () => {
    if (!draggedApp) return null;
    const stage = stages.find((s) => s.id === draggedApp.stageId);
    return (
      <Card
        size="small"
        style={{
          width: 250,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          cursor: 'grabbing',
          borderLeft: `3px solid ${BUCKET_COLORS[draggedApp.statusBucket]}`,
        }}
      >
        <Text strong>{draggedApp.company}</Text>
        <br />
        <Text type="secondary">{draggedApp.position}</Text>
        {stage && (
          <div style={{ marginTop: 4 }}>
            <Tag color="blue" style={{ fontSize: 11 }}>{stage.name}</Tag>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div>
      <FilterBar />

      {filteredApps.length === 0 ? (
        <Empty
          description={
            <span>
              暂无投递记录，点击「新增投递」开始追踪你的求职进度
            </span>
          }
          style={{ marginTop: 64 }}
        >
          <Button type="primary" onClick={() => setFormOpen(true)}>
            新增投递
          </Button>
        </Empty>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 16,
              overflowX: 'auto',
            }}
          >
            {STATUS_BUCKETS.map((bucket) => (
              <div
                key={bucket}
                style={{
                  background: darkMode ? '#1f1f1f' : '#fafafa',
                  borderRadius: 8,
                  padding: 12,
                  minHeight: 400,
                }}
              >
                {/* Bucket header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: 12,
                    paddingBottom: 8,
                    borderBottom: `2px solid ${BUCKET_COLORS[bucket]}`,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: BUCKET_COLORS[bucket],
                      marginRight: 8,
                    }}
                  />
                  <Text strong>{bucket}</Text>
                  <Tag style={{ marginLeft: 'auto' }}>
                    {filteredApps.filter((a) => a.statusBucket === bucket).length}
                  </Tag>
                </div>

                {/* Stages inside this bucket */}
                {stagesByBucket[bucket].map((stage) => (
                  <DroppableStage
                    key={stage.id}
                    stage={stage}
                    appIds={appsByStage[stage.id] || []}
                    apps={filteredApps}
                    allStages={stages}
                    darkMode={darkMode}
                    onSelect={setSelectedApp}
                  />
                ))}
              </div>
            ))}
          </div>

          <DragOverlay dropAnimation={null}>
            {renderOverlay()}
          </DragOverlay>
        </DndContext>
      )}

      <ApplicationDetail
        app={selectedApp}
        onClose={() => setSelectedApp(null)}
        onEdit={(app) => {
          setSelectedApp(null);
          setEditApp(app);
          setFormOpen(true);
        }}
        onDelete={async (app) => {
          await deleteApplication(app.id);
          setSelectedApp(null);
          message.success("已删除");
        }}
      />

      <ApplicationForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditApp(null); }}
        editApp={editApp}
      />
    </div>
  );
}
