import { useState } from 'react';
import { Drawer, Timeline, Typography, Input, Button, Space, Empty } from 'antd';
import {
  PlusOutlined,
  SwapOutlined,
  CalendarOutlined,
  FileTextOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../../stores/appStore';
import dayjs from 'dayjs';
import type { Application, TimelineEntry, TimelineEntryType } from '../../types';

const { Text } = Typography;

interface Props {
  app: Application | null;
  open: boolean;
  onClose: () => void;
}

const typeConfig: Record<TimelineEntryType, { icon: React.ReactNode; color: string }> = {
  created: { icon: <PlusOutlined />, color: '#1890ff' },
  stage_changed: { icon: <SwapOutlined />, color: '#faad14' },
  schedule_changed: { icon: <CalendarOutlined />, color: '#52c41a' },
  note_added: { icon: <FileTextOutlined />, color: '#722ed1' },
};

const typeLabels: Record<TimelineEntryType, string> = {
  created: '创建记录',
  stage_changed: '阶段变更',
  schedule_changed: '日程变更',
  note_added: '备注添加',
};

export function TimelineDrawer({ app, open, onClose }: Props) {
  const { timeline, addNote } = useAppStore();
  const [note, setNote] = useState('');

  const entries: TimelineEntry[] = app
    ? timeline
        .filter((t) => t.appId === app.id)
        .sort((a, b) => b.createdAt - a.createdAt)
    : [];

  const handleAddNote = async () => {
    if (!app || !note.trim()) return;
    await addNote(app.id, note.trim());
    setNote('');
  };

  return (
    <Drawer
      title={app ? `${app.company} - ${app.position} 的时间线` : '时间线'}
      open={open}
      onClose={onClose}
      width={480}
    >
      {app && (
        <>
          <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
            <Input
              placeholder="添加备注..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onPressEnter={handleAddNote}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleAddNote}
              disabled={!note.trim()}
            />
          </Space.Compact>

          {entries.length === 0 ? (
            <Empty description="暂无时间线记录" />
          ) : (
            <Timeline
              items={entries.map((entry) => ({
                dot: typeConfig[entry.type].icon,
                color: typeConfig[entry.type].color,
                children: (
                  <div>
                    <div style={{ marginBottom: 4 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {typeLabels[entry.type]}
                      </Text>
                    </div>
                    <div style={{ marginBottom: 4 }}>
                      <Text>{entry.content}</Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(entry.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                    </Text>
                  </div>
                ),
              }))}
            />
          )}
        </>
      )}
    </Drawer>
  );
}
