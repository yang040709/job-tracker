# 📋 投递追踪器 — Job Tracker

秋招/春招/社招投递进度管理工具。通过看板拖拽直观管理面试流程，通过数据面板洞察投递转化率。

## ✨ 功能特性

- **看板视图** — 拖拽卡片在不同面试阶段之间自由移动
- **列表视图** — 表格筛选、排序，批量管理投递记录
- **统计面板** — 投递漏斗、趋势图、渠道分布、阶段分布
- **阶段管理** — 自定义面试流程（简历筛选 → 笔试 → 一面 → 二面 → HR面 → Offer）
- **数据导入导出** — 支持 JSON / CSV 格式
- **暗色模式** — 一键切换护眼主题
- **筛选视图** — 按关键词、渠道、类别、日期范围筛选
- **时间线** — 记录每次状态变更

## 🔒 隐私说明

> **所有数据均存储在你本地浏览器的 IndexedDB 中，不会上传到任何服务器。**

- ✅ 纯前端应用，无后端服务
- ✅ 无用户系统、无云端同步、无数据收集
- ✅ 通过「导出」功能可随时备份数据为 JSON 文件
- ⚠️ 清除浏览器数据会导致记录丢失，请及时备份

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| React 19 | UI 框架 |
| TypeScript | 类型安全 |
| Vite | 构建工具 |
| Ant Design 6 | UI 组件库 |
| Zustand | 状态管理 |
| Dexie.js | IndexedDB 封装 |
| ECharts | 数据可视化 |
| @dnd-kit | 拖拽交互 |
| React Router | 路由管理 |

## 🚀 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 📁 项目结构

```
src/
├── components/          # 公共组件
│   ├── ApplicationDetail.tsx
│   └── FilterBar.tsx
├── features/
│   ├── about/           # 关于页面
│   ├── applications/    # 新增/编辑表单
│   ├── dashboard/       # 统计面板
│   ├── kanban/          # 看板视图
│   ├── settings/        # 设置
│   └── table/           # 列表视图
├── stores/              # Zustand 状态管理
├── db/                  # IndexedDB 数据层
└── types/               # TypeScript 类型定义
```

## 📄 License

[MIT](LICENSE)
