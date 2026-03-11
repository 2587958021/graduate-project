# 前端学习平台 (Frontend Learning Platform)

> 毕业设计项目 - 基于 Vue3 + Node.js 的全栈前端学习平台

[![Vue](https://img.shields.io/badge/Vue-3.5.13-4FC08D?logo=vue.js)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)](https://nodejs.org/)

## 🎯 项目概述

一个集成 AI 学习助手、智能学习分析、课程管理、练习系统等功能的全栈前端学习平台。通过 AI 技术赋能，提供个性化的学习体验。

**在线演示**: [https://graduate-project-xxx.vercel.app](https://graduate-project-xxx.vercel.app) *(部署后更新)*

## ✨ 核心功能

### 1. AI 学习助手
- 集成大语言模型 API，实现智能问答
- 代码分析与学习建议
- 多场景 Prompt 模板（代码纠错、知识点讲解、学习路径规划）

### 2. 智能学习分析
- 知识点掌握度分析算法
- 基于正确率、近期趋势、难度系数计算掌握度
- 自动识别薄弱知识点

### 3. 课程管理系统
- 课程分类与搜索
- B站视频集成播放
- 学习进度追踪

### 4. 练习系统
- 多种题型支持（单选、多选、判断、填空、编程题）
- 错题本功能
- 练习历史记录

## 🛠️ 技术栈

### 前端
- **框架**: Vue 3 + Composition API
- **构建工具**: Vite
- **状态管理**: Pinia
- **UI 组件库**: Element Plus
- **图表**: ECharts, Chart.js
- **Markdown 渲染**: markdown-it

### 后端
- **运行时**: Node.js
- **框架**: Express
- **认证**: JWT
- **数据存储**: JSON 文件（演示用）

## 📁 项目结构

```
Graduate1/
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── api/             # API 接口
│   │   ├── components/      # 组件
│   │   ├── views/           # 页面
│   │   ├── router/          # 路由
│   │   ├── store/           # 状态管理
│   │   └── utils/           # 工具函数
│   ├── public/              # 静态资源
│   └── dist/                # 构建输出
├── backend/                  # 后端项目
│   ├── controllers/         # 控制器
│   ├── routes/              # 路由
│   ├── middlewares/         # 中间件
│   ├── data/                # 数据文件
│   └── server.js            # 入口文件
└── README.md
```

## 🚀 快速开始

### 环境要求
- Node.js >= 16
- npm >= 8

### 安装依赖

```bash
# 前端
cd frontend
npm install

# 后端
cd backend
npm install
```

### 开发模式

```bash
# 启动后端（端口 3000）
cd backend
npm start

# 启动前端（端口 5173）
cd frontend
npm run dev
```

### 生产构建

```bash
cd frontend
npm run build
```

## 🎨 项目亮点

| 特性 | 说明 |
|------|------|
| **AI 功能** | 开发 AI 学习助手模块，集成大语言模型 API |
| **Prompt 工程** | 设计多场景 Prompt 模板，优化 AI 回复质量 |
| **智能算法** | 实现知识点掌握度分析算法，识别薄弱知识点 |
| **全栈开发** | 前端 Vue3 + 后端 Node.js，设计 RESTful API 接口 20+ |
| **第三方集成** | 接入 B站 API 实现视频播放，调用 AI 大模型 API |

## 📸 截图

*(待添加)*

## 👤 作者

**吴叶龙**

- GitHub: [@2587958021](https://github.com/2587958021)
- Gitee: [@wyl20041025](https://gitee.com/wyl20041025)

## 📄 许可证

MIT License

---

> 本项目为毕业设计作品，展示了全栈开发能力与 AI 产品思维。
