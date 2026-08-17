import { Card, Typography, Tag, Space, List } from "antd";
import {
  GithubOutlined,
  SafetyCertificateOutlined,
  CloudOutlined,
  ThunderboltOutlined,
  DatabaseOutlined,
  LockOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

const TECH_STACK = [
  { name: "React 19", desc: "UI 框架", color: "#61dafb" },
  { name: "TypeScript", desc: "类型安全", color: "#3178c6" },
  { name: "Vite", desc: "构建工具", color: "#646cff" },
  { name: "Ant Design 6", desc: "UI 组件库", color: "#1677ff" },
  { name: "Zustand", desc: "状态管理", color: "#443e38" },
  { name: "Dexie.js", desc: "IndexedDB 封装", color: "#2d97e8" },
  { name: "ECharts", desc: "数据可视化", color: "#aa3333" },
  { name: "@dnd-kit", desc: "拖拽交互", color: "#e86b2a" },
  { name: "React Router", desc: "路由管理", color: "#ca403f" },
  { name: "Day.js", desc: "日期处理", color: "#e86b2a" },
];

const FEATURES = [
  "看板视图 — 拖拽管理投递进度",
  "列表视图 — 表格筛选排序",
  "统计面板 — 漏斗、趋势、渠道分析",
  "阶段管理 — 自定义面试流程",
  "数据导入导出 — JSON / CSV",
  "暗色模式 — 护眼切换",
  "筛选视图 — 按关键词、渠道、类别筛选",
  "时间线 — 记录每次状态变更",
];

export function AboutView() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* Header */}
      <Card style={{ textAlign: "center", marginBottom: 16 }}>
        <img src="/logo.svg" alt="logo" style={{ height: 64, width: 64, marginBottom: 12, display: "block", margin: "0 auto 12px auto" }} />
        <Title level={3} style={{ marginBottom: 4 }}>投递追踪器</Title>
        <Text type="secondary">Job Application Tracker</Text>
        <div style={{ marginTop: 12 }}>
          <Tag color="blue">v1.0.0</Tag>
          <Tag color="green">开源</Tag>
          <Tag color="purple">隐私优先</Tag>
        </div>
      </Card>

      {/* About */}
      <Card title="项目介绍" style={{ marginBottom: 16 }}>
        <Paragraph>
          这是一个面向求职者的投递进度管理工具。帮助你统一管理秋招/春招/社招的所有投递记录，
          通过看板拖拽直观推进面试流程，通过统计面板洞察投递转化率和渠道 ROI。
        </Paragraph>
        <Paragraph type="secondary">
          所有数据均存储在你本地浏览器的 IndexedDB 中，不会上传到任何服务器。
          你可以随时通过导出功能备份数据。
        </Paragraph>
      </Card>

      {/* Tech Stack */}
      <Card title="技术栈" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {TECH_STACK.map((t) => (
            <Tag
              key={t.name}
              color={t.color}
              style={{ fontSize: 13, padding: "4px 10px", borderRadius: 6 }}
            >
              {t.name}
              <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>{t.desc}</Text>
            </Tag>
          ))}
        </div>
      </Card>

      {/* Features */}
      <Card title="功能特性" style={{ marginBottom: 16 }}>
        <List
          size="small"
          dataSource={FEATURES}
          renderItem={(item) => (
            <List.Item style={{ padding: "6px 0" }}>
              <Text>{item}</Text>
            </List.Item>
          )}
        />
      </Card>

      {/* Privacy */}
      <Card
        title={
          <Space>
            <LockOutlined />
            <span>隐私与数据安全</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <PrivacyItem
            icon={<SafetyCertificateOutlined style={{ fontSize: 20, color: "#52c41a", marginTop: 2 }} />}
            title="数据完全本地化"
            desc="所有投递记录、面试进度、备注信息均存储在你浏览器的 IndexedDB 中，数据不会经过任何网络请求，不会上传到第三方服务器。"
          />
          <PrivacyItem
            icon={<DatabaseOutlined style={{ fontSize: 20, color: "#1677ff", marginTop: 2 }} />}
            title="无后端服务"
            desc="本项目是纯前端应用，不依赖任何后端 API。没有用户系统、没有云端同步、没有数据收集。"
          />
          <PrivacyItem
            icon={<CloudOutlined style={{ fontSize: 20, color: "#faad14", marginTop: 2 }} />}
            title="自行备份"
            desc={<>通过「导出」功能可将所有数据导出为 JSON 文件，换设备或换浏览器时通过「导入」即可恢复全部数据。清除浏览器数据会导致记录丢失，请及时备份。</>}
          />
          <PrivacyItem
            icon={<ThunderboltOutlined style={{ fontSize: 20, color: "#722ed1", marginTop: 2 }} />}
            title="开源透明"
            desc="项目完全开源，你可以审查代码确认没有任何数据外泄行为。"
          />
        </div>
      </Card>

      {/* GitHub */}
      <Card style={{ marginBottom: 16, textAlign: "center" }}>
        <GithubOutlined style={{ fontSize: 32, marginBottom: 8 }} />
        <div>
          <Text strong>GitHub 仓库</Text>
        </div>
        <div style={{ marginTop: 8 }}>
          <Typography.Link
            href="https://github.com/yang040709/job-tracker"
            target="_blank"
          >
            github.com/yang040709/job-tracker
          </Typography.Link>
        </div>
        <Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
          如果觉得有用，欢迎 Star ⭐
        </Paragraph>
      </Card>

      <div style={{ textAlign: "center", padding: "16px 0", color: "#999", fontSize: 12 }}>
        Made with React · Ant Design · IndexedDB
      </div>
    </div>
  );
}

function PrivacyItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      {icon}
      <div>
        <Text strong>{title}</Text>
        <br />
        <Text type="secondary">{desc}</Text>
      </div>
    </div>
  );
}
