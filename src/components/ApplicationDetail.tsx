import { useState, useEffect } from 'react';
import { Drawer, Tag, Typography, Timeline, Input, Button, Space, Divider, Empty } from 'antd';
import {
  EnvironmentOutlined,
  ClockCircleOutlined,
  UserOutlined,
  BankOutlined,
  LinkOutlined,
  DollarOutlined,
  EditOutlined,
  SendOutlined,
  PlusOutlined,
  FileTextOutlined,
  SwapOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useAppStore } from '../stores/appStore';
import dayjs from 'dayjs';
import type { Application, TimelineEntryType } from '../types';

const { Text, Link, Paragraph } = Typography;

interface Props {
  app: Application | null;
  onClose: () => void;
  onEdit: (app: Application) => void;
}

const typeIcons: Record<TimelineEntryType, React.ReactNode> = {
  created: <PlusOutlined style={{ color: '#1890ff' }} />,
  stage_changed: <SwapOutlined style={{ color: '#faad14' }} />,
  schedule_changed: <CalendarOutlined style={{ color: '#52c41a' }} />,
  note_added: <FileTextOutlined style={{ color: '#722ed1' }} />,
};

export function ApplicationDetail({ app, onClose, onEdit }: Props) {
  const { stages, timeline, addNote } = useAppStore();
  const [note, setNote] = useState('');

  const appTimeline = app
    ? timeline
        .filter((t) => t.appId === app.id)
        .sort((a, b) => b.createdAt - a.createdAt)
    : [];

  const handleAddNote = async () => {
    if (!app || !note.trim()) return;
    await addNote(app.id, note.trim());
    setNote('');
  };

  useEffect(() => {
    setNote('');
  }, [app?.id]);

  const stage = app ? stages.find((s) => s.id === app.stageId) : null;

  return (
    <Drawer
      title={
        <Space>
          <span>{app?.company}</span>
          {stage && <Tag color="blue">{stage.name}</Tag>}
        </Space>
      }
      open={!!app}
      onClose={onClose}
      width={520}
      extra={
        app && (
          <Button icon={<EditOutlined />} onClick={() => onEdit(app)}>
            编辑
          </Button>
        )
      }
    >
      {app && (
        <>
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: 16 }}>{app.position}</Text>
          </div>

          <Space direction="vertical" size={8} style={{ width: '100%', marginBottom: 16 }}>
            {app.city && (
              <Space>
                <EnvironmentOutlined />
                <Text>{app.city}</Text>
              </Space>
            )}
            <Space>
              <ClockCircleOutlined />
              <Text>投递日期：{app.applyDate}</Text>
            </Space>
            <Space>
              <BankOutlined />
              <Text>渠道：{app.channel}</Text>
            </Space>
            {app.salary && (
              <Space>
                <DollarOutlined />
                <Text>薪资：{app.salary}</Text>
              </Space>
            )}
            {app.referrer && (
              <Space>
                <UserOutlined />
                <Text>内推人：{app.referrer}</Text>
              </Space>
            )}
            {app.jdLink && (
              <Space>
                <LinkOutlined />
                <Link href={app.jdLink} target="_blank">
                  查看 JD
                </Link>
              </Space>
            )}
          </Space>

          {app.notes && (
            <>
              <Divider orientation="left">备注</Divider>
              <Paragraph>{app.notes}</Paragraph>
            </>
          )}

          <Divider orientation="left">时间线</Divider>

          <div style={{ marginBottom: 12 }}>
            <Space.Compact style={{ width: '100%' }}>
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
          </div>

          {appTimeline.length === 0 ? (
            <Empty description="暂无记录" />
          ) : (
            <Timeline
              items={appTimeline.map((entry) => ({
                dot: typeIcons[entry.type],
                children: (
                  <div>
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
