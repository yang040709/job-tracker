import { useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { ConfigProvider, theme, Layout, Menu, Button, Space, Switch, Typography } from 'antd';
import {
  AppstoreOutlined,
  TableOutlined,
  BarChartOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  ExportOutlined,
  ImportOutlined,
  MoonOutlined,
  SunOutlined,
} from '@ant-design/icons';
import { useAppStore } from './stores/appStore';
import { KanbanView } from './features/kanban/KanbanView';
import { TableView } from './features/table/TableView';
import { DashboardView } from './features/dashboard/DashboardView';
import { ApplicationForm } from './features/applications/ApplicationForm';
import { SettingsView } from './features/settings/SettingsView';
import { AboutView } from './features/about/AboutView';
import { useState } from 'react';
import './index.css';

const { Header, Content } = Layout;
const { Title } = Typography;

/* ── Route ↔ Menu key mapping ── */
const ROUTE_KEY_MAP: Record<string, string> = {
  '/': 'kanban',
  '/table': 'table',
  '/dashboard': 'dashboard',
  '/settings': 'settings',
  '/about': 'about',
};

function App() {
  const { darkMode, toggleDarkMode, loadData } = useAppStore();
  const [formOpen, setFormOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedKey = ROUTE_KEY_MAP[location.pathname] || 'kanban';

  const handleExport = async () => {
    const data = await useAppStore.getState().exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      await useAppStore.getState().importData(text);
    };
    input.click();
  };

  const menuItems = [
    {
      key: 'kanban',
      icon: <AppstoreOutlined />,
      label: <Link to="/">看板视图</Link>,
    },
    {
      key: 'table',
      icon: <TableOutlined />,
      label: <Link to="/table">列表视图</Link>,
    },
    {
      key: 'dashboard',
      icon: <BarChartOutlined />,
      label: <Link to="/dashboard">统计面板</Link>,
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: <Link to="/settings">设置</Link>,
    },
    {
      key: 'about',
      icon: <InfoCircleOutlined />,
      label: <Link to="/about">关于</Link>,
    },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
        },
      }}
    >
      <Layout className={darkMode ? 'dark' : ''} style={{ minHeight: '100vh', background: darkMode ? '#141414' : '#f5f5f5' }}>
        <Header
          className="app-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            background: darkMode ? '#1f1f1f' : '#fff',
            borderBottom: `1px solid ${darkMode ? '#303030' : '#f0f0f0'}`,
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          <Space className="app-header-title">
            <img src="/logo.svg" alt="logo" style={{ height: 28, width: 28 }} />
            <Title level={4} style={{ margin: 0, color: darkMode ? '#fff' : undefined }}>
              投递追踪器
            </Title>
          </Space>

          <Menu
            mode="horizontal"
            selectedKeys={[selectedKey]}
            items={menuItems}
            style={{ border: 'none', background: 'transparent', flex: 1, justifyContent: 'center' }}
          />

          <Space className="app-header-actions">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setFormOpen(true)}
            >
              新增投递
            </Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>
              导出
            </Button>
            <Button icon={<ImportOutlined />} onClick={handleImport}>
              导入
            </Button>
            <Switch
              checked={darkMode}
              onChange={toggleDarkMode}
              checkedChildren={<MoonOutlined />}
              unCheckedChildren={<SunOutlined />}
            />
          </Space>
        </Header>

        <Content className="app-content" style={{ padding: '16px 24px', overflow: 'auto' }}>
          <Routes>
            <Route path="/" element={<KanbanView />} />
            <Route path="/table" element={<TableView />} />
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="/about" element={<AboutView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>

        <ApplicationForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
        />
      </Layout>
    </ConfigProvider>
  );
}

export default App;
