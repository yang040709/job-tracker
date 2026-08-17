import { useState, useRef, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Popconfirm, message, Typography, Space, Tag, Row, Col, Radio } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ThunderboltOutlined, HolderOutlined, WarningOutlined } from '@ant-design/icons';
import { useAppStore } from '../../stores/appStore';
import { STATUS_BUCKETS, BUCKET_COLORS } from '../../types';
import type { Stage } from '../../types';

const { Title, Text } = Typography;

// 预设流程模板
const STAGE_PRESETS: { label: string; desc: string; stages: Omit<Stage, 'id'>[] }[] = [
  {
    label: '简单流程',
    desc: '适合快速筛选，共 4 个阶段',
    stages: [
      { name: '简历筛选', order: 0, bucket: '流程中', isDefault: true },
      { name: '面试', order: 1, bucket: '面试中', isDefault: true },
      { name: 'Offer沟通', order: 2, bucket: '已拿Offer', isDefault: true },
      { name: '已拒绝/已放弃', order: 3, bucket: '已结束', isDefault: true },
    ],
  },
  {
    label: '标准流程',
    desc: '适合大多数公司，共 6 个阶段',
    stages: [
      { name: '简历筛选', order: 0, bucket: '流程中', isDefault: true },
      { name: '技术一面', order: 1, bucket: '面试中', isDefault: true },
      { name: '技术二面', order: 2, bucket: '面试中', isDefault: true },
      { name: 'HR面', order: 3, bucket: '面试中', isDefault: true },
      { name: 'Offer沟通', order: 4, bucket: '已拿Offer', isDefault: true },
      { name: '已拒绝/已放弃', order: 5, bucket: '已结束', isDefault: true },
    ],
  },
  {
    label: '完整流程',
    desc: '适合大厂多轮面试，共 8 个阶段',
    stages: [
      { name: '简历筛选', order: 0, bucket: '流程中', isDefault: true },
      { name: '笔试', order: 1, bucket: '流程中', isDefault: true },
      { name: '技术一面', order: 2, bucket: '面试中', isDefault: true },
      { name: '技术二面', order: 3, bucket: '面试中', isDefault: true },
      { name: '技术三面', order: 4, bucket: '面试中', isDefault: true },
      { name: 'HR面', order: 5, bucket: '面试中', isDefault: true },
      { name: 'Offer沟通', order: 6, bucket: '已拿Offer', isDefault: true },
      { name: '已拒绝/已放弃', order: 7, bucket: '已结束', isDefault: true },
    ],
  },
];

export function SettingsView() {
  const { stages, createStage, updateStage, deleteStage, reorderStages, resetStages, clearAllData } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(1);
  const [form] = Form.useForm();

  // Clear data modal
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (!clearModalOpen) {
      setCountdown(5);
      setClearing(false);
      return;
    }
    setCountdown(5);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [clearModalOpen]);

  const handleClearData = async () => {
    setClearing(true);
    try {
      await clearAllData();
      message.success('所有数据已清空');
      setClearModalOpen(false);
    } catch {
      message.error('清空失败，请重试');
    } finally {
      setClearing(false);
    }
  };

  // Drag state
  const dragIndex = useRef<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);
  const [dragOverRow, setDragOverRow] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingStage(null);
    form.resetFields();
    form.setFieldsValue({ bucket: '流程中', isDefault: false });
    setModalOpen(true);
  };

  const handleEdit = (stage: Stage) => {
    setEditingStage(stage);
    form.setFieldsValues(stage);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingStage) {
      await updateStage(editingStage.id, values);
      message.success('更新成功');
    } else {
      const maxOrder = stages.length > 0 ? Math.max(...stages.map((s) => s.order)) : -1;
      await createStage({ ...values, order: maxOrder + 1 });
      message.success('创建成功');
    }
    setModalOpen(false);
  };

  const handleDelete = async (stage: Stage) => {
    if (stages.filter((s) => s.bucket === stage.bucket).length <= 1) {
      message.error('每个状态桶至少需要保留一个阶段');
      return;
    }
    await deleteStage(stage.id);
    message.success('已删除');
  };

  const handleApplyPreset = async () => {
    const preset = STAGE_PRESETS[selectedPreset];
    await resetStages(preset.stages);
    setPresetModalOpen(false);
    message.success(`已切换为「${preset.label}」流程`);
  };

  // Drag handlers
  const handleDragStart = (index: number) => {
    dragIndex.current = index;
  };

  const handleDragEnter = (index: number, id: string) => {
    dragOverIndex.current = index;
    setDragOverRow(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnd = () => {
    if (dragIndex.current !== null && dragOverIndex.current !== null && dragIndex.current !== dragOverIndex.current) {
      const newStages = [...stages];
      const [removed] = newStages.splice(dragIndex.current, 1);
      newStages.splice(dragOverIndex.current, 0, removed);
      newStages.forEach((s, i) => { s.order = i; });
      reorderStages(newStages);
    }
    dragIndex.current = null;
    dragOverIndex.current = null;
    setDragOverRow(null);
  };

  const handleDragLeave = () => {
    setDragOverRow(null);
  };

  const columns = [
    {
      title: '',
      key: 'drag',
      width: 48,
      render: (_: unknown, _record: Stage, index: number) => (
        <div
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragEnter={() => handleDragEnter(index, _record.id)}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragLeave={handleDragLeave}
          style={{
            cursor: 'grab',
            color: '#999',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 4,
            transition: 'background 0.2s',
            background: dragOverRow === _record.id ? '#e6f4ff' : 'transparent',
          }}
        >
          <HolderOutlined style={{ fontSize: 16 }} />
        </div>
      ),
    },
    {
      title: '阶段名',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '所属状态桶',
      dataIndex: 'bucket',
      key: 'bucket',
      render: (bucket: string) => (
        <Tag color={BUCKET_COLORS[bucket as keyof typeof BUCKET_COLORS]}>
          {bucket}
        </Tag>
      ),
    },
    {
      title: '类型',
      key: 'isDefault',
      render: (_: unknown, record: Stage) =>
        record.isDefault ? <Tag>内置</Tag> : <Tag color="blue">自定义</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: Stage) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除此阶段？相关投递记录将迁移至同桶的第一个阶段"
            onConfirm={() => handleDelete(record)}
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>流程阶段管理</Title>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ThunderboltOutlined />}
              onClick={() => setPresetModalOpen(true)}
            >
              快速配置
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新增阶段
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 12, color: '#999', fontSize: 12 }}>
          💡 拖拽左侧 <HolderOutlined /> 图标可调整阶段顺序
        </div>
        <Table
          columns={columns}
          dataSource={stages}
          rowKey="id"
          pagination={false}
          onRow={(record, index) => ({
            onDragStart: () => handleDragStart(index!),
            onDragEnter: () => handleDragEnter(index!, record.id),
            onDragOver: handleDragOver,
            onDragEnd: handleDragEnd,
            onDragLeave: handleDragLeave,
          })}
          rowClassName={(record) =>
            dragOverRow === record.id ? 'drag-over-row' : ''
          }
        />
      </Card>

      {/* 新增/编辑阶段 Modal */}
      <Modal
        title={editingStage ? '编辑阶段' : '新增阶段'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="阶段名" rules={[{ required: true, message: '请输入阶段名' }]}>
            <Input placeholder="如：技术三面" />
          </Form.Item>
          <Form.Item name="bucket" label="所属状态桶" rules={[{ required: true }]}>
            <Select>
              {STATUS_BUCKETS.map((b) => (
                <Select.Option key={b} value={b}>
                  <Tag color={BUCKET_COLORS[b]} style={{ marginRight: 4 }}>{b}</Tag>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 快速配置 Modal */}
      <Modal
        title={
          <Space>
            <ThunderboltOutlined />
            快速配置流程
          </Space>
        }
        open={presetModalOpen}
        onCancel={() => setPresetModalOpen(false)}
        onOk={handleApplyPreset}
        okText="应用此配置"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        width={560}
      >
        <div style={{ marginBottom: 12, color: '#999', fontSize: 13 }}>
          选择一个预设模板将替换当前所有阶段（现有投递记录会自动匹配到新阶段）
        </div>
        <Radio.Group
          value={selectedPreset}
          onChange={(e) => setSelectedPreset(e.target.value)}
          style={{ width: '100%' }}
        >
          <Row gutter={[12, 12]}>
            {STAGE_PRESETS.map((preset, idx) => (
              <Col span={24} key={idx}>
                <Radio.Button
                  value={idx}
                  style={{
                    width: '100%',
                    height: 'auto',
                    padding: '12px 16px',
                    textAlign: 'left',
                    display: 'block',
                  }}
                >
                  <div>
                    <Text strong style={{ fontSize: 14 }}>
                      {preset.label}
                    </Text>
                    <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                      {preset.desc}
                    </Text>
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {preset.stages.map((s, i) => (
                      <Tag key={i} color={BUCKET_COLORS[s.bucket]}>
                        {s.name}
                      </Tag>
                    ))}
                  </div>
                </Radio.Button>
              </Col>
            ))}
          </Row>
        </Radio.Group>

        <div style={{ marginTop: 16 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            💡 你也可以在上方表格中手动新增、删除、重命名阶段来自定义流程
          </Text>
        </div>
      </Modal>

      {/* 危险区域：清除数据 */}
      <Card
        title={
          <Space>
            <WarningOutlined style={{ color: '#ff4d4f' }} />
            <span style={{ color: '#ff4d4f' }}>危险操作</span>
          </Space>
        }
        style={{ marginTop: 16, borderColor: '#ff4d4f' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text strong>一键清除所有数据</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              清空所有投递记录、面试阶段、时间线和保存的视图。此操作不可恢复。
            </Text>
          </div>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => setClearModalOpen(true)}
          >
            清除所有数据
          </Button>
        </div>
      </Card>

      {/* 清除数据确认弹窗 */}
      <Modal
        title={
          <Space>
            <WarningOutlined style={{ color: '#ff4d4f' }} />
            <span>确认清除所有数据？</span>
          </Space>
        }
        open={clearModalOpen}
        onCancel={() => setClearModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setClearModalOpen(false)}>
            取消
          </Button>,
          <Button
            key="confirm"
            danger
            type="primary"
            disabled={countdown > 0}
            loading={clearing}
            onClick={handleClearData}
          >
            {countdown > 0 ? `确认清除（${countdown}s）` : '确认清除'}
          </Button>,
        ]}
      >
        <div style={{ padding: '8px 0' }}>
          <div style={{ background: '#fff2f0', border: '1px solid #ffccc7', borderRadius: 6, padding: 12, marginBottom: 12 }}>
            <Text style={{ color: '#ff4d4f' }}>
              ⚠️ 此操作将永久删除以下所有数据：
            </Text>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: 20, color: '#ff4d4f' }}>
              <li>所有投递记录</li>
              <li>所有面试阶段配置</li>
              <li>所有时间线记录</li>
              <li>所有保存的筛选视图</li>
            </ul>
          </div>
          <Text type="secondary" style={{ fontSize: 13 }}>
            清除后将恢复为默认阶段配置。建议先使用「导出」功能备份数据。
          </Text>
        </div>
      </Modal>

      <style>{`
        .drag-over-row td {
          background: #e6f4ff !important;
          transition: background 0.2s;
        }
      `}</style>
    </div>
  );
}
