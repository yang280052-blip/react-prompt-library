# Prompt Library (提示词库应用) 维护说明

## 📋 项目概览
本应用是一个基于 React + Supabase 的提示词管理平台。用户可以浏览、搜索、收藏公开的提示词，并在登录后管理自己的私有/公开提示词。采用 “Cyber-Minimal” 设计风格，具有极强的视觉冲击力。

## 🏗️ 架构与组件逻辑
- **前端框架**: React 19 (使用 Vite 构建)
- **样式方案**: Vanilla CSS (`index.css`) + `framer-motion` (动画) + `lucide-react` (图标)。
- **后端服务**: Supabase (PostgreSQL 数据库 + Auth 认证)。
- **核心组件**:
    - `App.jsx`: 应用主入口，处理搜索过滤、视图切换（公开/个人/后台）及全局状态。
    - `components/PromptCard.jsx`: 提示词卡片，包含弹窗查看详情、复制内容、收藏功能。
    - `components/AdminDashboard.jsx`: 用户仪表盘。普通用户管理自己的提示词；管理员可查看全站数据及用户统计。
    - `components/Auth.jsx`: 处理用户登录与注册（邮箱验证已关闭，注册即登录）。

## 🛡️ 数据库与安全
- **表结构**:
    - `prompts`: 存放标题、内容、分类、公开状态 (`is_public`)、所有者 (`user_id`)。
    - `favorites`: 记录用户的收藏关系。
    - `profiles`: 扩展用户信息（如 `is_admin` 权限）。
- **RLS 策略**: 已开启行级安全策略，确保只有所有者或管理员能修改数据，普通用户仅能读公开数据。

## 🚀 部署与发布
- **本地代码目录**: `C:\Users\ADMIN\.gemini\antigravity\scratch\prompt-library-app`
- **一键部署脚本**: `C:\Users\ADMIN\.gemini\antigravity\scratch\push_react_app.py`
- **发布逻辑**: 修改代码后，在终端运行 `python push_react_app.py` 即可将最新代码推送到 GitHub，由 Vercel 完成线上部署。

## 📍 维护路径
- **主程序代码**: `src/`
- **全局样式**: `src/index.css`
- **Supabase 配置**: `src/supabaseClient.js`
