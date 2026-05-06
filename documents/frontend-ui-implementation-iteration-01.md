# 前端 UI 实现迭代报告 - Iteration 01

**日期**: 2026年5月6日  
**状态**: 完成基础框架

## 1. 迭代目标

- 定义应用中的用户角色与权限模型（creator/collector/guest/reviewer/developer/admin）
- 建立用户状态管理基础设施（Zustand store）
- 完成头部导航栏组件开发

## 2. 实现内容

### 创建的文件

| 文件 | 说明 |
|------|------|
| `frontend/src/types/user.ts` | 用户类型定义（UserRole、UserProfile、User）|
| `frontend/src/store/user-store.ts` | 用户状态管理，内置 mock 数据 |
| `frontend/src/components/head-bar.tsx` | 头部导航栏组件 |

### 核心功能

- **用户类型系统**：6 种角色定义，支持链上地址识别
- **状态管理**：Zustand store，含 mock 用户加载方法
- **HeadBar 组件**：
  - 未登录：占位头像，点击跳转 `/login`
  - 已登录：用户头像，hover 显示 Popover（用户信息 + 登出）
  - 导航链接：首页、交易市场、资产铸造、个人中心（占位）

## 3. 技术栈

| 层次 | 技术 |
|------|------|
| 状态管理 | Zustand |
| 组件库 | Radix UI (Popover) |
| 样式 | TailwindCSS |
| 钱包 | Ethers.js v6 |
| 构建 | Vite v8.0.8 |

## 4. 已知问题

1. Mock 数据硬编码 → 后续接入真实 API
2. 导航链接占位 → 待集成 React Router
3. 钱包与用户未关联 → 需后续绑定

## 5. 验收标准（✅ 全部完成）

- ✅ 用户类型定义完整
- ✅ 用户状态管理可用
- ✅ 头部组件正常渲染
- ✅ Popover 弹出层工作
- ✅ Vite 编译无报错
- ✅ 本地预览可用

## 6. 启动方式

```bash
cd frontend && npm run dev
# 访问 http://localhost:5173/