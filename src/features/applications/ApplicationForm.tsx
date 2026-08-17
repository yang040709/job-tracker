import { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, message, Popconfirm, Button, Tabs, Typography, Space } from 'antd';
import { DeleteOutlined, CodeOutlined, FormOutlined, CopyOutlined } from '@ant-design/icons';
import { useAppStore } from '../../stores/appStore';
import type { Application, StatusBucket } from '../../types';
import { CATEGORY_OPTIONS, CHANNEL_OPTIONS, STATUS_BUCKETS } from '../../types';
import dayjs from 'dayjs';

const { Text } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
  editApp?: Application | null;
}

const JSON_TEMPLATE_CREATE = `{
  "company": "字节跳动",
  "position": "前端工程师",
  "city": "北京",
  "applyDate": "${dayjs().format('YYYY-MM-DD')}",
  "channel": "BOSS直聘",
  "category": "校招",
  "salary": "25-35K",
  "referrer": "",
  "jdLink": "",
  "notes": ""
}`;

function buildJsonTemplate(app: Application): string {
  return JSON.stringify(
    {
      company: app.company,
      position: app.position,
      city: app.city,
      applyDate: app.applyDate,
      channel: app.channel,
      category: app.category,
      salary: app.salary || '',
      referrer: app.referrer || '',
      jdLink: app.jdLink || '',
      notes: app.notes || '',
      stageId: app.stageId,
      statusBucket: app.statusBucket,
    },
    null,
    2
  );
}

export function ApplicationForm({ open, onClose, editApp }: Props) {
  const [form] = Form.useForm();
  const { stages, createApplication, updateApplication, deleteApplication } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');

  useEffect(() => {
    if (open) {
      setJsonMode(false);
      setJsonError('');
      if (editApp) {
        form.setFieldsValue({
          ...editApp,
          applyDate: editApp.applyDate ? dayjs(editApp.applyDate) : null,
        });
        setJsonText(buildJsonTemplate(editApp));
      } else {
        form.resetFields();
        const firstStage = stages[0];
        if (firstStage) {
          form.setFieldsValue({ stageId: firstStage.id, statusBucket: firstStage.bucket });
        }
        setJsonText(JSON_TEMPLATE_CREATE);
      }
    }
  }, [open, editApp, form, stages]);

  const handleStageChange = (stageId: string) => {
    const stage = stages.find((s) => s.id === stageId);
    if (stage) {
      form.setFieldValue('statusBucket', stage.bucket);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const data = {
        ...values,
        applyDate: values.applyDate?.format('YYYY-MM-DD') || '',
        stageId: values.stageId || stages[0]?.id || '',
        statusBucket: values.statusBucket || ('流程中' as StatusBucket),
      };

      if (editApp) {
        await updateApplication(editApp.id, data);
        message.success('更新成功');
      } else {
        await createApplication(data);
        message.success('创建成功');
      }
      onClose();
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleJsonSubmit = async () => {
    setJsonError('');
    try {
      const parsed = JSON.parse(jsonText);

      // Validate required fields
      if (!parsed.company || !parsed.position) {
        setJsonError('JSON 中必须包含 company 和 position 字段');
        return;
      }

      setLoading(true);

      const stageId = parsed.stageId || stages[0]?.id || '';
      const stage = stages.find((s) => s.id === stageId);
      const statusBucket = parsed.statusBucket || stage?.bucket || ('流程中' as StatusBucket);

      const data = {
        company: parsed.company,
        position: parsed.position,
        city: parsed.city || '',
        applyDate: parsed.applyDate || dayjs().format('YYYY-MM-DD'),
        channel: parsed.channel || '其他',
        category: parsed.category || '校招',
        salary: parsed.salary || undefined,
        referrer: parsed.referrer || undefined,
        jdLink: parsed.jdLink || undefined,
        notes: parsed.notes || undefined,
        stageId,
        statusBucket: statusBucket as StatusBucket,
      };

      if (editApp) {
        await updateApplication(editApp.id, data);
        message.success('更新成功');
      } else {
        await createApplication(data);
        message.success('创建成功');
      }
      onClose();
    } catch (e: any) {
      if (e instanceof SyntaxError) {
        setJsonError(`JSON 解析失败：${e.message}`);
      } else {
        message.error('操作失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editApp) return;
    await deleteApplication(editApp.id);
    message.success('已删除');
    onClose();
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(jsonMode ? jsonText : JSON_TEMPLATE_CREATE);
    message.success('已复制到剪贴板');
  };

  const formTabContent = (
    <Form form={form} layout="vertical" initialValues={{ category: '校招' }}>
      <Form.Item name="company" label="公司" rules={[{ required: true, message: '请输入公司名称' }]}>
        <Input placeholder="如：字节跳动" />
      </Form.Item>

      <Form.Item name="position" label="岗位" rules={[{ required: true, message: '请输入岗位名称' }]}>
        <Input placeholder="如：前端工程师" />
      </Form.Item>

      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="city" label="城市" style={{ flex: 1 }}>
          <Input placeholder="如：北京" />
        </Form.Item>
        <Form.Item name="salary" label="薪资" style={{ flex: 1 }}>
          <Input placeholder="如：25-35K" />
        </Form.Item>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="applyDate" label="投递日期" style={{ flex: 1 }}>
          <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
        </Form.Item>
        <Form.Item name="channel" label="渠道" style={{ flex: 1 }}>
          <Select placeholder="选择渠道" allowClear>
            {CHANNEL_OPTIONS.map((c) => (
              <Select.Option key={c} value={c}>{c}</Select.Option>
            ))}
          </Select>
        </Form.Item>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <Form.Item name="category" label="类别" style={{ flex: 1 }}>
          <Select>
            {CATEGORY_OPTIONS.map((c) => (
              <Select.Option key={c} value={c}>{c}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="stageId" label="当前阶段" style={{ flex: 1 }}>
          <Select onChange={handleStageChange}>
            {stages.map((s) => (
              <Select.Option key={s.id} value={s.id}>
                {s.name}（{s.bucket}）
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </div>

      <Form.Item name="referrer" label="内推人">
        <Input placeholder="如有内推人请填写" />
      </Form.Item>

      <Form.Item name="jdLink" label="JD 链接">
        <Input placeholder="https://..." />
      </Form.Item>

      <Form.Item name="notes" label="备注">
        <Input.TextArea rows={3} placeholder="添加备注信息..." />
      </Form.Item>
    </Form>
  );

  const jsonTabContent = (
    <div>
      <Space style={{ marginBottom: 8 }}>
        <Button icon={<CopyOutlined />} onClick={handleCopyTemplate} size="small">
          复制模板
        </Button>
        <Text type="secondary" style={{ fontSize: 12 }}>
          编辑 JSON 后点击下方按钮提交（stageId / statusBucket 可省略）
        </Text>
      </Space>
      <Input.TextArea
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        rows={18}
        style={{
          fontFamily: 'monospace',
          fontSize: 13,
          lineHeight: 1.6,
        }}
        placeholder="在此输入 JSON..."
      />
      {jsonError && (
        <div style={{ marginTop: 8, color: '#ff4d4f', fontSize: 12 }}>{jsonError}</div>
      )}
    </div>
  );

  return (
    <Modal
      title={editApp ? '编辑投递' : '新增投递'}
      open={open}
      onCancel={onClose}
      width={680}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            {editApp && (
              <Popconfirm
                title="确定要删除此投递记录吗？"
                onConfirm={handleDelete}
                okText="删除"
                cancelText="取消"
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            )}
          </div>
          <div>
            <Button onClick={onClose} style={{ marginRight: 8 }}>
              取消
            </Button>
            {jsonMode ? (
              <Button type="primary" onClick={handleJsonSubmit} loading={loading}>
                通过 JSON {editApp ? '更新' : '创建'}
              </Button>
            ) : (
              <Button type="primary" onClick={handleSubmit} loading={loading}>
                {editApp ? '保存' : '创建'}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <Tabs
        activeKey={jsonMode ? 'json' : 'form'}
        onChange={(key) => setJsonMode(key === 'json')}
        items={[
          {
            key: 'form',
            label: (
              <span><FormOutlined /> 表单模式</span>
            ),
            children: formTabContent,
          },
          {
            key: 'json',
            label: (
              <span><CodeOutlined /> JSON 模式</span>
            ),
            children: jsonTabContent,
          },
        ]}
      />
    </Modal>
  );
}
