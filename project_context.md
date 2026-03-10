# Prompt Library Project Context

**这是给未来 AI 助手阅读的项目备忘录。当你在新对话中接手这个项目时，请务必先仔细阅读这份文档，以便快速恢复对项目背景、技术栈和文件结构的记忆。**

## 1. 项目概览 (Project Overview)
- **项目名称**: React Prompt Library (提示词库应用)
- **项目路径**: `C:\Users\ADMIN\.gemini\antigravity\scratch\prompt-library-app`
- **核心功能**: 一个允许用户浏览、搜索、收藏以及登录后创建/管理提示词（Prompts）的 Web 应用。支持区分“公开（社区分享）”和“私有（仅自己可见）”提示词。

## 2. 技术栈 (Tech Stack)
- **前端框架**: React (使用 Vite 构建)
- **样式方案**: Vanilla CSS (主要集中在 `index.css` 和少量的内联组件样式，**未使用** TailwindCSS)
- **后端/数据库/认证**: Supabase
- **部署方式**: 通过外部 Python 脚本自动推送到 GitHub，由 Vercel 触发自动部署。

## 3. 核心功能与架构 (Key Features & Architecture)

### 3.1 前端核心组件
- `App.jsx`: 应用主入口，负责全局状态（登录会话 `session`、收藏列表 `favorites`）管理、公开页面的展示（搜索、分类过滤）、视图切换（`public` | `auth` | `admin`）。
- `components/PromptCard.jsx`: 单个提示词卡片组件。包含点击弹出 Modal（弹窗）查看完整内容的功能、一键复制功能、以及基于 `session` 的收藏点赞功能。
- `components/AdminDashboard.jsx`: 用户控制台组件。
  - **普通登录用户**: 被称为“我的创作空间”，只能看到和管理（新增/编辑/删除）自己创建的提示词。新增时可选择是否公开 (`is_public`)。
  - **超级管理员**: 可以看到全站所有提示词，并可以访问“用户与数据统计”标签页查看注册用户列表，拥有一键导入旧数据的权限。
- `components/Auth.jsx`: Supabase 提供的账号密码登录/注册组件。注意：在 Supabase 面板中已关闭了“注册邮箱验证 (Confirm email)”功能，用户注册后可直接登录。
- `supabaseClient.js`: Supabase 实例初始化配置。

### 3.2 数据库结构 (Supabase PostgreSQL)
- **`prompts` 表**: 存储提示词主数据。
  - 核心字段: `id` (UUID), `created_at`, `title` (标题), `content` (提示词内容), `description` (说明), `category` (分类), `is_public` (布尔值，是否公开), `user_id` (创建者 UID)。
- **`favorites` 表**: 存储用户收藏关系。
  - 核心字段: `id`, `user_id` (收藏者), `prompt_id` (提示词 ID)。
- **`profiles` 表**: 用户配置表。通常通过 Supabase Auth 触发器自动创建。
  - 核心字段: `id` (关联 auth.uid()), `is_admin` (布尔值，标记超级管理员)。

### 3.3 数据库安全策略 (RLS - Row Level Security)
`prompts` 表启用了严格的 RLS 策略，前端即使被绕过也能保证数据安全：
- **SELECT**: 允许读取 `is_public = true` 的数据，或 `auth.uid() = user_id` 的私有数据，超级管理员可读全部。
- **INSERT**: 用户必须登录，且只能插入 `user_id` 为自己的数据。
- **UPDATE / DELETE**: 用户只能修改/删除自己的数据，超级管理员可修改/删除全部。

## 4. 部署与发布工作流 (Deployment Workflow)
- **部署脚本路径**: `C:\Users\ADMIN\.gemini\antigravity\scratch\push_react_app.py`
- **说明**: 这是一个 Python 脚本，使用 GitHub Token 调用 API，自动过滤掉 `node_modules` 并将当前最新的 React 代码（覆盖式地）推送到 GitHub 仓库 `yang280052-blip/react-prompt-library`。
- **操作步骤**: 如果 AI 助手修改了代码并且用户确认功能无误，AI 助手应该直接在终端运行 `python push_react_app.py`（在脚本所在目录执行）。Vercel 监听到仓库更新会自动完成线上部署。

---
**给 AI 助手的指示**: 在阅读完这份文档后，你已经了解了该项目的全部核心上下文。请直接向用户询问：“我已经加载了项目记忆，接下来需要我为你修改什么功能？”
