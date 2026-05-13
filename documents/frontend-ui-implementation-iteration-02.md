# 前端 UI 实现迭代报告 - Iteration 02

**日期**: 2026年5月13日  
**状态**: 完成交易市场页面与接口分层实现

## 1. 迭代目标

- 新增独立的交易市场页面
- 按照“页面级组件 + 可复用组件 + Hook + 服务层 + 类型定义”的方式组织市场页代码
- 复用项目已有 `components/ui` 基础控件库
- 完成市场资产展示、筛选、统计、购买入口与出价入口展示
- 根据接口设计文档，规范市场页 REST API 与 Web3 写操作的边界

## 2. 实现内容

### 新增的文件

| 文件 | 说明 |
|------|------|
| `frontend/src/pages/market.tsx` | 新增交易市场页面入口，负责市场页整体布局与组件拼装 |
| `frontend/src/hooks/use-market-assets.ts` | 新增市场页自定义 Hook，负责资产数据、筛选、排序、页面状态和交易入口逻辑 |
| `frontend/src/services/market-api.ts` | 新增市场 REST API 服务层，负责市场资产、上架记录和成交记录的聚合查询 |
| `frontend/src/types/market.ts` | 新增交易市场相关 TypeScript 类型定义 |
| `frontend/src/components/market/market-filter-bar.tsx` | 新增市场筛选栏组件，支持关键词搜索、分类筛选和排序选择 |
| `frontend/src/components/market/market-stats.tsx` | 新增市场统计组件，用于展示资产数量、交易量、地板价等概览数据 |
| `frontend/src/components/market/market-asset-card.tsx` | 新增市场资产卡片组件，用于展示单个数字资产及其交易操作 |
| `frontend/src/components/market/market-asset-list.tsx` | 新增资产列表组件，用于统一渲染资产卡片网格 |
| `frontend/src/components/market/market-empty-state.tsx` | 新增空状态组件，用于无资产或无搜索结果时展示提示 |
| `frontend/src/components/market/market-error-alert.tsx` | 新增错误提示组件，用于展示市场页异常状态 |
| `frontend/src/components/market/market-loading-state.tsx` | 新增加载状态组件，用于展示市场资产加载过程 |

## 3. 页面实现

### 3.1 交易市场页面

`frontend/src/pages/market.tsx` 是交易市场页的页面级组件。

主要职责包括：

- 展示市场页标题和说明
- 展示市场统计数据
- 展示搜索、筛选和排序入口
- 展示资产卡片列表
- 根据页面状态展示加载、错误、空结果或正常列表
- 组合市场页相关业务组件

页面文件只负责页面级拼装，不直接承担大量资产卡片结构、筛选逻辑和数据请求逻辑。

### 3.2 市场数据逻辑

新增 `frontend/src/hooks/use-market-assets.ts`，用于集中管理市场页逻辑。

该 Hook 主要负责：

- 读取市场资产列表
- 保存搜索关键词
- 保存分类筛选条件
- 保存排序方式
- 根据筛选条件生成最终展示资产
- 计算市场统计数据
- 管理加载状态
- 管理错误状态
- 管理当前操作中的资产 ID
- 提供购买资产和提交出价的页面入口

其中，购买资产属于链上写操作，后续应接入 `services/web3/marketContract.ts` 中的合约调用；出价功能因当前 ABI 暂不支持，仅作为后续扩展入口保留。

### 3.3 市场 REST API 服务层

新增 `frontend/src/services/market-api.ts`，用于封装 Python 后端提供的市场聚合查询接口。

当前服务层包含：

```text
GET /api/market/assets
GET /api/market/listings
GET /api/market/sales
```

主要职责包括：

- 获取市场资产列表
- 获取资产上架记录
- 获取资产成交记录
- 解析统一 REST 响应格式
- 将后端返回的数据转换为前端 `MarketAsset` 类型
- 在未配置后端地址时提供 mock 数据兜底

服务层不负责链上写操作。上架、购买、取消上架等操作需要用户通过 MetaMask 签名，应由 Web3 合约服务完成。

## 4. 市场组件实现

### 4.1 市场筛选栏

新增 `market-filter-bar.tsx`，用于展示市场页筛选入口。

包含内容：

- 关键词搜索输入框
- 资产分类选择
- 排序方式选择
- 筛选操作区域

该组件复用已有 UI 控件中的 `Input`、`Select`、`Button` 和 `Card`。

### 4.2 市场统计区域

新增 `market-stats.tsx`，用于展示市场概览数据。

包含内容：

- 当前资产数量
- 总交易量
- 地板价
- 创作者数量

统计信息以卡片形式展示，便于在市场页顶部快速查看整体状态。

### 4.3 资产卡片

新增 `market-asset-card.tsx`，用于展示单个数字资产。

包含内容：

- 资产封面图
- 资产标题
- Token ID
- 创作者地址
- 当前售价
- 资产分类
- 资产状态
- IPFS CID 简要信息
- 合约地址简要信息
- 购买按钮
- 出价按钮
- 更多操作菜单

资产卡片采用纵向等高布局。底部“购买 / 出价”按钮区域固定在卡片底部，使同一行卡片按钮保持在同一水平线。

### 4.4 资产列表

新增 `market-asset-list.tsx`，用于统一渲染资产卡片网格。

主要职责包括：

- 接收资产数组
- 渲染多个 `MarketAssetCard`
- 维护响应式网格布局
- 保持同一行卡片等高排列

当前网格布局为：

```tsx
grid items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4
```

### 4.5 页面状态组件

新增三个状态展示组件：

| 组件 | 作用 |
|------|------|
| `market-loading-state.tsx` | 展示市场资产加载中状态 |
| `market-error-alert.tsx` | 展示市场数据异常状态 |
| `market-empty-state.tsx` | 展示无资产或无搜索结果状态 |

这些组件减少了 `market.tsx` 中的条件渲染代码，使页面结构更清晰。


## 5. 类型定义

新增 `frontend/src/types/market.ts`，用于描述市场页相关数据结构。

主要类型包括：

- `MarketAsset`
- `MarketAssetCategory`
- `MarketAssetStatus`
- `MarketSort`
- `MarketFilters`
- `MarketStats`

这些类型用于约束市场资产数据、筛选条件、排序方式和统计数据，为后续接入真实后端接口和链上数据提供类型基础。

## 6. 接口边界说明

根据接口设计，市场页采用 REST API 与 Web3 合约接口分层方式。

### REST API 负责

- 市场资产聚合查询
- 上架记录查询
- 成交记录查询
- 分页、筛选、缓存后的展示数据读取

### Web3 合约接口负责

- 上架资产
- 购买资产
- 取消上架
- 授权市场合约
- 查询链上权属与版税信息

因此，`market-api.ts` 只封装查询类 REST 接口，不代替用户发起链上签名交易。


## 7. 本次迭代结果

- 新增独立交易市场页面
- 新增市场页自定义 Hook
- 新增市场 REST API 服务层
- 新增市场页相关 TypeScript 类型
- 新增市场筛选栏组件
- 新增市场统计组件
- 新增资产卡片组件
- 新增资产列表组件
- 新增加载、错误和空状态组件
- 复用已有 UI 控件库完成市场页展示
- 完成响应式市场资产网格布局
- 完成资产卡片底部按钮对齐布局
- 明确 REST 查询接口与 Web3 写操作接口的职责边界

## 8. 启动方式

```bash
cd frontend
npm run dev
```

访问：

```text
http://localhost:5173/
```
