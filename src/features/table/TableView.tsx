import { useState } from 'react';
import { Table, Tag, Button, Space, Typography, Popconfirm, message, Empty } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useAppStore } from '../../stores/appStore';
import { FilterBar } from '../../components/FilterBar';
import { ApplicationDetail } from '../../components/ApplicationDetail';
import { ApplicationForm } from '../applications/ApplicationForm';
import type { Application } from '../../types';
import { BUCKET_COLORS, CATEGORY_OPTIONS, CHANNEL_OPTIONS } from '../../types';

const { Text } = Typography;

export function TableView() {
  const {
    stages,
    getFilteredApplications,
    deleteApplication,
  } = useAppStore();

  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [editApp, setEditApp] = useState<Application | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const filteredApps = getFilteredApplications();

  const handleDelete = async (id: string) => {
    await deleteApplication(id);
    message.success('已删除');
  };

  const columns: ColumnsType<Application> = [
    {
      title: '公司',
      dataIndex: 'company',
      key: 'company',
      sorter: (a, b) => a.company.localeCompare(b.company),
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '岗位',
      dataIndex: 'position',
      key: 'position',
      sorter: (a, b) => a.position.localeCompare(b.position),
    },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
      sorter: (a, b) => a.city.localeCompare(b.city),
    },
    {
      title: '投递日期',
      dataIndex: 'applyDate',
      key: 'applyDate',
      sorter: (a, b) => a.applyDate.localeCompare(b.applyDate),
      defaultSortOrder: 'descend',
    },
    {
      title: '渠道',
      dataIndex: 'channel',
      key: 'channel',
      filters: CHANNEL_OPTIONS.map((c) => ({ text: c, value: c })),
      onFilter: (value, record) => record.channel === value,
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      filters: CATEGORY_OPTIONS.map((c) => ({ text: c, value: c })),
      onFilter: (value, record) => record.category === value,
    },
    {
      title: '当前阶段',
      dataIndex: 'stageId',
      key: 'stageId',
      filters: stages.map((s) => ({ text: s.name, value: s.id })),
      onFilter: (value, record) => record.stageId === value,
      render: (stageId: string) => {
        const stage = stages.find((s) => s.id === stageId);
        return stage ? <Tag color="blue">{stage.name}</Tag> : '-';
      },
    },
    {
      title: '状态',
      dataIndex: 'statusBucket',
      key: 'statusBucket',
      filters: ['流程中', '面试中', '已拿Offer', '已结束'].map((b) => ({ text: b, value: b })),
      onFilter: (value, record) => record.statusBucket === value,
      render: (bucket: string) => (
        <Tag color={BUCKET_COLORS[bucket as keyof typeof BUCKET_COLORS]}>
          {bucket}
        </Tag>
      ),
    },
    {
      title: '薪资',
      dataIndex: 'salary',
      key: 'salary',
      render: (text: string) => text || '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      render: (_: unknown, record: Application) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setSelectedApp(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => { setEditApp(record); setFormOpen(true); }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此投递记录？"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <FilterBar />

      {filteredApps.length === 0 ? (
        <Empty
          description="暂无投递记录"
          style={{ marginTop: 64 }}
        >
          <Button type="primary" onClick={() => setFormOpen(true)}>
            新增投递
          </Button>
        </Empty>
      ) : (
        <Table
          columns={columns}
          dataSource={filteredApps}
          rowKey="id"
          pagination={{
            defaultPageSize: 20,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1200 }}
          size="middle"
        />
      )}

      <ApplicationDetail
        app={selectedApp}
        onClose={() => setSelectedApp(null)}
        onEdit={(app) => {
          setSelectedApp(null);
          setEditApp(app);
          setFormOpen(true);
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
