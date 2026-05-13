# 前端项目快速说明

这份文档是给刚加入小组的前端新手看的，目标是先回答三个问题：项目各个文件夹是干什么的、React 前端页面应该怎么写、Git 提交应该怎么规范。

## 一、项目目录的作用

这个仓库是一个“前后端分离 + 智能合约”的数字资产平台，常见目录职责如下。

### 1. 根目录

- `package.json`：仓库级别的统一脚本或依赖入口，通常用于整体工作流管理。
- `README.md`：项目总说明，适合放启动方式、整体介绍和协作说明。

### 2. `contracts/`

这个目录是智能合约相关代码，不是前端页面。

- `contracts/contracts/`：Solidity 合约源码，例如 NFT 合约。
- `contracts/scripts/`：部署脚本。
- `contracts/test/`：合约测试代码。
- `contracts/ignition/`：Hardhat Ignition 的部署模块。
- `contracts/hardhat.config.ts`：合约项目配置。

前端同学通常只需要了解这里暴露了哪些合约能力，例如铸造、查询、交易、版税等，真正写页面时会去调用这些合约接口。

### 3. `frontend/`

这个目录是前端主项目，页面和交互基本都在这里写。

- `frontend/src/main.tsx`：应用入口，负责把 React 挂到页面上。
- `frontend/src/App.tsx`：应用根组件，通常放路由框架或全局布局。
- `frontend/src/routes/`：路由配置，决定访问某个 URL 时显示哪个页面。
- `frontend/src/pages/`：页面级组件，每个文件对应一个页面。
- `frontend/src/components/`：可复用组件。
- `frontend/src/components/ui/`：shadcn 风格的基础 UI 组件，例如 `button`、`card`、`dialog`、`input`。
- `frontend/src/hooks/`：自定义 Hook，放复用逻辑，例如钱包连接、合约调用。
- `frontend/src/store/`：全局状态管理，例如用户信息、钱包状态。
- `frontend/src/lib/`：工具函数，例如 `cn`。
- `frontend/src/types/`：TypeScript 类型定义。
- `frontend/src/abis/`：合约 ABI 文件，前端调用智能合约时会用到。
- `frontend/src/assets/`：静态资源，例如图片、图标。
- `frontend/public/`：Vite 公开资源目录，适合放不需要打包处理的静态文件。

### 4. `documents/`

这是项目文档目录，适合放需求、架构说明、开发约定、页面说明、接口说明等内容。

## 二、React 前端页面应该怎么写


### 错误写法

- 所有页面内容堆在 `App.tsx` 里。
- 首页、市场页、个人中心页、404 页都混在一起。
- 一个文件里既写布局，又写请求，又写状态，又写工具函数。

这样做的问题是：

- 代码很快变得难以维护。
- 页面之间互相干扰，改一个地方容易坏另一个地方。
- 新人无法快速定位问题。
- 后续加路由、加组件、加状态时会非常乱。

### 正确写法

React 页面应该按“页面级组件 + 可复用组件 + 路由”的方式拆分。

#### 1. 每个页面一个文件

例如：

- `frontend/src/pages/home-page.tsx`：主页
- `frontend/src/pages/market.tsx`：交易市场页
- `frontend/src/pages/assert.tsx`：资产铸造页
- `frontend/src/pages/profile.tsx`：个人中心页
- `frontend/src/pages/not-found.tsx`：404 页面

每个页面文件只负责自己页面的结构和少量页面内逻辑。

#### 2. 页面里只做页面级拼装

页面组件建议只做这些事情：

- 组合布局。
- 调用现成组件。
- 接收并展示数据。
- 响应页面交互。

不要把很多通用按钮、卡片、弹窗逻辑重复写在每个页面里。通用内容应该抽成组件，放到 `components/` 或 `components/ui/`。

#### 3. 通用 UI 用 shadcn 组件

这个项目的 UI 风格建议统一使用 shadcn 体系。

已存在的基础组件可以直接复用，例如：

- `frontend/src/components/ui/button.tsx`
- `frontend/src/components/ui/card.tsx`
- `frontend/src/components/ui/input.tsx`
- `frontend/src/components/ui/dialog.tsx`
- `frontend/src/components/ui/tabs.tsx`
- `frontend/src/components/ui/tooltip.tsx`

如果需要新的基础 UI，先考虑是否能从 shadcn 补一个标准组件，再放进 `components/ui/`。

#### 4. 路由和页面解耦

页面不要自己决定自己怎么跳转。推荐在 `frontend/src/routes/` 里统一定义路由，在页面里只写页面内容。

#### 5. 逻辑分层

建议这样分层：

- 页面组件：负责显示。
- hooks：负责复用逻辑，例如钱包、链上数据请求。
- store：负责全局状态。
- components：负责可复用 UI。

### 一个推荐的页面写法

页面文件可以按下面思路组织：

1. 引入页面需要的组件。
2. 如果有页面内数据，先在顶部定义。
3. 返回一个清晰的 JSX 结构。
4. 尽量让一个页面只表达一个业务目标。

### 给新手的判断标准

如果你在一个页面文件里同时看到了这些内容，就说明它已经太大了：

- 超过一个屏幕的 JSX。
- 多个页面都重复的按钮和卡片。
- 大量 if/else 和数据处理。
- 既有页面结构，又有业务请求，又有全局状态操作。

这时候就应该拆分。

## 三、Git 提交规范

团队提交建议统一使用规范化提交信息，推荐参考 Conventional Commits。

### 1. 提交格式

建议格式：

```text
<type>: <summary>
```

或者更完整一点：

```text
<type>(scope): <summary>
```

例如：

- `feat: add home page`
- `fix: resolve router navigation issue`
- `docs: add frontend project guide`
- `refactor: split home page components`

### 2. 常用 type

- `feat`：新增功能。
- `fix`：修复 bug。
- `docs`：文档修改。
- `style`：样式或格式调整，不影响逻辑。
- `refactor`：重构代码，不新增功能也不修 bug。
- `test`：测试相关修改。
- `chore`：构建、依赖、工具类调整。

### 3. 提交内容要求

一次提交尽量只做一件事。

推荐做法：

- 页面改动单独提交。
- 文档改动单独提交。
- 修 bug 单独提交。
- 重构单独提交。

不推荐把“改页面 + 改逻辑 + 改文档 + 改格式”混在同一个提交里。

### 4. 提交信息写法建议

- 用英文小写短语，动词开头。
- 描述要简洁、明确。
- 不要写“update”这种没信息量的标题。
- 不要把大段过程写进标题。

更好的例子：

- `feat: add router for home and market`
- `fix: prevent invalid hook usage in header`
- `docs: explain frontend folder structure`
- `refactor: extract shared homepage sections`

### 5. 提交前检查

提交前建议至少检查这些内容：

- 页面是否能正常打开。
- 控制台是否报错。
- 相关文件是否已经格式化。
- 是否只提交了本次任务需要的内容。

## 四、给新手的实际建议

如果你是第一次写这个项目，建议按下面顺序开始：

1. 先看 `frontend/src/pages/`，理解每个页面的作用。
2. 再看 `frontend/src/components/ui/`，优先复用现成组件。
3. 路由统一从 `frontend/src/routes/` 进入。
4. 不要把所有页面都写进一个文件。
5. 每次提交前先想清楚这次提交属于 `feat`、`fix` 还是 `docs`。

## 五、最容易犯的几个错误

- 把所有页面逻辑堆在一个文件里。
- 页面里重复写大量相同的按钮、卡片和弹窗。
- 不区分页面组件、业务逻辑和全局状态。
- 提交信息写得太随意。
- 一次提交包含太多无关改动。


## 六、如何用 zustand 写状态管理（速查）


### 1) 为什么选 zustand

- API 简单、学习成本低。
- 适合中小型应用或用作“原子”风格的局部状态管理。
- 与 React Hooks 原生契合，使用方便。

### 2) 安装（如果还没装）

在 frontend 目录执行：

```bash
npm install zustand
```

（本项目已在依赖中引用了 zustand）

### 3) 最简单的示例（计数器）

```ts
// src/store/counter.ts
import { create } from 'zustand';

type CounterState = {
	count: number;
	inc: () => void;
	dec: () => void;
	reset: () => void;
};

export const useCounter = create<CounterState>((set) => ({
	count: 0,
	inc: () => set((s) => ({ count: s.count + 1 })),
	dec: () => set((s) => ({ count: s.count - 1 })),
	reset: () => set({ count: 0 }),
}));
```

组件中使用：

```tsx
import { useCounter } from '@/store/counter';

export default function Demo() {
	const count = useCounter((s) => s.count);
	const inc = useCounter((s) => s.inc);

	return (
		<div>
			<div>{count}</div>
			<button onClick={inc}>+1</button>
		</div>
	);
}
```

注意：在组件中用选择器（useCounter(state => state.x)）可以避免组件不必要的重渲染。

### 4) 带类型的用户示例（参考项目中已有的 user-store）

```ts
// src/store/user-store.ts
import { create } from 'zustand';

type User = { address: string; profile?: { displayName?: string; avatarCid?: string } } | null;

type UserStore = {
	user: User;
	loadUser: (address?: string) => Promise<void>;
	setUser: (u: User) => void;
	logout: () => void;
};

export const useUserStore = create<UserStore>((set) => ({
	user: null,
	loadUser: async (address) => {
		// 实际项目里放异步请求或合约调用
		const mock = address ? { address } : null;
		set({ user: mock });
	},
	setUser: (u) => set({ user: u }),
	logout: () => set({ user: null }),
}));
```

在页面或组件里使用：

```tsx
const user = useUserStore((s) => s.user);
const logout = useUserStore((s) => s.logout);

// 仅订阅 displayName，避免订阅整个 user 对象导致频繁渲染
const displayName = useUserStore((s) => s.user?.profile?.displayName);
```

### 5) 使用中间件：持久化（可选）

如果希望在 localStorage 保存部分状态，可以引入 zustand/middleware 的 persist：

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Prefs = { theme: 'light' | 'dark' };

export const usePrefs = create(
	persist<Prefs>(
		(set) => ({ theme: 'light' }),
		{ name: 'app-prefs' }
	)
);
```

注意：不要把敏感信息（私钥、助记词）存到持久化存储。

### 6) 进阶用法和最佳实践

- 使用选择器（selector）来精确订阅状态，避免不必要的重渲染。
- 将大型状态拆成多个小 store（按 domain 分割），而不是把所有东西都放进一个大 store。
- 在 store 内避免写大量副作用（如大量异步逻辑），把复杂流程写在 hooks 里，store 负责保存和更新状态。
- 如果需要不可变数据深度修改，可以在 set 中使用 immer（或直接 set(old => produce(old, draft => { ... }))）。
- 测试时可以通过 create 的返回值替换或重置状态，方便测试用例隔离。

### 7) 常见问题排查

- 报错 "Invalid hook call"：不要在 store 文件里直接调用 React Hooks，只能在组件或自定义 hook 里调用 React Hooks；zustand 的 create 本身不是 Hook（它返回一个 Hook）。
- 性能问题：检查是否使用了大对象的直接订阅（例如 useStore(s => s)），改为选择性订阅。

---

