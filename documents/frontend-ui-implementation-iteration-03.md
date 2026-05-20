# 前端 UI 实现迭代报告 - Iteration 03

**日期**: 2026年5月20日  
**状态**: 完成资产铸造页与个人中心页原型化实现

## 1. 迭代目标

- 根据系统原型完善资产铸造页面
- 根据系统原型完善个人中心页面
- 按照“页面级组件 + 页面内业务组件 + Hook + 服务层 + 类型定义”的方式组织代码
- 优先复用项目已有 `components/ui` 基础控件
- 保持页面视觉风格与首页、市场页一致
- 为后续接入 IPFS、用户资产聚合接口和 Web3 链上操作预留结构

## 2. 实现内容

### 新增和调整的页面文件

| 文件 | 说明 |
|------|------|
| `frontend/src/pages/Assert/assert.tsx` | 新增资产铸造页面入口，负责资产铸造页整体布局和组件拼装 |
| `frontend/src/pages/Profile/profile.tsx` | 新增个人中心页面入口，负责个人中心整体布局和组件拼装 |

### 新增和调整的资产铸造页组件

| 文件 | 说明 |
|------|------|
| `frontend/src/pages/Assert/components/file-upload-card.tsx` | 新增文件上传区域组件，用于选择待确权的数字资产文件 |
| `frontend/src/pages/Assert/components/mint-basic-form.tsx` | 新增资产基础信息表单组件，用于填写资产名称、描述和分类 |
| `frontend/src/pages/Assert/components/royalty-config-card.tsx` | 新增版税与部署网络配置组件，用于设置创作者版税比例和展示部署网络 |
| `frontend/src/pages/Assert/components/mint-submit-card.tsx` | 新增铸造提交组件，用于展示 IPFS / metadata 进度、Token URI 和提交入口 |

### 新增和调整的个人中心组件

| 文件 | 说明 |
|------|------|
| `frontend/src/pages/Profile/components/profile-summary-card.tsx` | 新增个人信息概览卡片，展示钱包地址、用户名称和资产统计 |
| `frontend/src/pages/Profile/components/profile-asset-tabs.tsx` | 新增个人资产标签页，包含已收集、已铸造和交易历史 |
| `frontend/src/pages/Profile/components/profile-asset-card.tsx` | 新增个人资产卡片组件，用于展示用户资产缩略信息 |
| `frontend/src/pages/Profile/components/profile-activity-list.tsx` | 新增交易历史组件，用于展示用户链上活动记录 |
| `frontend/src/pages/Profile/components/profile-empty-state.tsx` | 新增空状态组件，用于无资产或无历史记录时展示提示 |

### 新增和调整的逻辑与数据文件

| 文件 | 说明 |
|------|------|
| `frontend/src/hooks/useMintAsset.ts` | 新增资产铸造页 Hook，管理文件上传、metadata 生成、进度状态和表单状态 |
| `frontend/src/hooks/useProfileAssets.ts` | 新增个人中心 Hook，管理用户资产、创建资产、活动记录和加载状态 |
| `frontend/src/services/ipfs-api.ts` | 新增 IPFS 相关 REST API 封装，用于媒体文件上传和 metadata 生成 |
| `frontend/src/services/profile-api.ts` | 新增个人中心 REST API 封装，用于读取用户资产、创建资产和活动记录 |
| `frontend/src/types/mint.ts` | 新增资产铸造相关 TypeScript 类型定义 |
| `frontend/src/types/profile.ts` | 新增个人中心相关 TypeScript 类型定义 |

## 3. 资产铸造页实现

### 3.1 页面结构

资产铸造页采用居中表单卡片布局，整体结构接近原型中的“铸造新的数字资产”页面。

页面主要包括：

- 页面标题
- 页面说明文本
- 文件上传区域
- 资产名称输入框
- 资产描述输入框
- 资产分类选择
- 创作者版税比例设置
- 部署网络展示
- 铸造提交按钮
- 上传进度展示
- 媒体 CID 和 Token URI 展示
- 操作结果提示

### 3.2 文件上传区域

`file-upload-card.tsx` 实现了原型中的虚线文件上传区。

主要功能包括：

- 点击选择本地文件
- 展示上传说明
- 展示已选择文件名称和文件大小
- 提示文件将上传至 IPFS 并生成唯一 CID

该区域优先复用已有 `Input` 控件，外层使用 Tailwind 实现虚线边框和悬停状态。

### 3.3 基础信息表单

`mint-basic-form.tsx` 负责资产基础信息填写。

包含字段：

- 资产名称
- 资产描述
- 资产分类

资产分类使用已有 `Select` 控件实现，并通过 `onValueChange` 写回页面表单状态。

### 3.4 版税与网络配置

`royalty-config-card.tsx` 负责展示版税和部署网络设置。

包含内容：

- 创作者版税比例输入
- 版税 bps 参数转换
- Polygon 部署网络展示
- 版税说明文本

版税比例保留为前端百分比输入，内部转换为 bps，便于后续传入链上合约接口。

### 3.5 铸造提交区域

`mint-submit-card.tsx` 负责铸造流程状态展示和提交入口。

包含内容：

- IPFS 上传进度
- metadata 生成进度
- 等待签名状态
- 媒体 CID 展示
- Token URI 展示
- 渐变 Mint 按钮
- 重置按钮
- 错误提示

当前页面完成 IPFS 和 metadata 准备；链上 Mint 操作后续应接入 Web3 合约服务。

## 4. 个人中心页实现

### 4.1 页面结构

个人中心页采用原型中的用户信息卡片和资产标签页结构。

页面主要包括：

- 用户信息概览卡片
- 渐变头像区域
- 钱包地址展示
- 资产统计卡片
- 已收集资产标签页
- 已铸造资产标签页
- 交易历史标签页
- 资产卡片网格
- 空状态提示

### 4.2 用户信息概览

`profile-summary-card.tsx` 实现个人中心顶部信息卡。

包含内容：

- 用户头像
- 用户名称
- 钱包地址
- 复制按钮
- 持有资产数量
- 创建资产数量
- 已上架资产数量
- 活动记录数量

该组件保留原型中的白色卡片、紫色背景装饰和渐变头像风格。

### 4.3 个人资产标签页

`profile-asset-tabs.tsx` 实现个人中心的资产标签页。

标签页包括：

- 已收集
- 已铸造
- 交易历史

选中状态采用文字变深和底部紫色线的样式，不使用框选效果，使其更接近原型中的标签页表现。

### 4.4 个人资产卡片

`profile-asset-card.tsx` 用于展示用户持有或创建的资产。

包含内容：

- 资产封面
- 资产标题
- Token ID
- 上架状态
- 资产价格
- 管理 / 出售按钮

资产卡片复用 `Card` 和 `Button`，视觉风格与市场页资产卡片保持一致。

### 4.5 交易历史

`profile-activity-list.tsx` 用于展示用户活动记录。

包含内容：

- 铸造记录
- 上架记录
- 购买记录
- 成交记录
- 交易哈希
- 时间信息

展示方式采用时间线风格，便于后续和链上事件数据对接。

## 5. Hook 与服务层实现

### 5.1 资产铸造 Hook

`useMintAsset.ts` 负责资产铸造页状态管理。

主要职责包括：

- 保存铸造表单数据
- 管理文件上传状态
- 管理 metadata 上传状态
- 管理等待签名状态
- 保存媒体 CID
- 保存 Token URI
- 保存错误信息
- 提供表单重置方法

### 5.2 IPFS API 服务层

`ipfs-api.ts` 封装 IPFS 相关 REST API。

包含接口：

```text
POST /api/ipfs/upload
POST /api/ipfs/metadata
```

该服务层只负责 IPFS 上传和 metadata 生成，不负责链上 Mint 签名。

### 5.3 个人中心 Hook

`useProfileAssets.ts` 负责个人中心数据管理。

主要职责包括：

- 根据当前钱包地址加载用户持有资产
- 加载用户创建资产
- 加载用户活动记录
- 管理加载状态
- 管理错误状态
- 生成页面统计数据

### 5.4 个人中心 API 服务层

`profile-api.ts` 封装用户相关 REST API。

包含接口：

```text
GET /api/users/{address}/assets
GET /api/users/{address}/created
GET /api/users/{address}/activities
```

该服务层用于个人中心展示数据聚合，后续可与 Python 后端或链上事件索引服务对接。

## 6. UI 控件复用

本次资产铸造页和个人中心页复用了项目已有的基础 UI 控件。

| UI 控件 | 使用场景 |
|--------|----------|
| `Button` | 铸造提交、重置、管理 / 出售、复制地址 |
| `Card` | 个人信息卡片、资产卡片、空状态卡片 |
| `Input` | 资产名称、版税比例、文件选择 |
| `Label` | 表单字段标题 |
| `Textarea` | 资产描述输入 |
| `Select` | 资产分类、部署网络展示 |
| `Tabs` | 个人中心资产标签页 |
| `Alert` | 铸造结果和错误提示 |
| `Progress` | 上传和加载进度展示 |

通过复用已有控件，新增页面与当前系统 UI 风格保持一致。

## 7. 接口边界说明

本次页面继续遵循“REST API + Web3 合约接口”的分层边界。

### REST API 负责

- IPFS 媒体文件上传
- metadata.json 生成和上传
- 用户资产列表聚合
- 用户创建资产聚合
- 用户活动记录聚合

### Web3 合约接口负责

- 链上 Mint
- 资产上架
- 购买资产
- 取消上架
- 授权市场合约
- 查询链上权属与版税信息

因此，资产铸造页当前只完成链上 Mint 前的数据准备；真正的 Mint 操作后续应通过 MetaMask 和合约接口完成。


## 8. 本次迭代结果

- 新增资产铸造页面
- 新增个人中心页面
- 新增资产铸造页业务组件
- 新增个人中心业务组件
- 新增资产铸造页 Hook
- 新增个人中心 Hook
- 新增 IPFS API 服务层
- 新增个人中心 API 服务层
- 新增资产铸造相关类型定义
- 新增个人中心相关类型定义
- 复用已有 UI 控件完成页面搭建
- 完成资产铸造页与个人中心页的原型风格适配
- 明确 IPFS / 用户聚合接口与 Web3 链上写操作的职责边界



## 9. 启动方式

```bash
cd frontend
npm run dev
```

访问：

```text
http://localhost:5173/
```
