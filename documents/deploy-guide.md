# 部署指南

---

## 前置

```bash
# 1. 配置环境变量
cp contracts/.env.example contracts/.env
# 编辑 contracts/.env，填入 PRIVATE_KEY 和 RPC URL

# 2. 安装依赖
npm run install:all

# 3. 编译合约
npm run compile
```

---

## 本地开发流程

Hardhat 本地节点是临时链，重启后链上状态会清空。因此每次重新启动本地节点后，都需要重新部署并同步配置。

终端 A：

```bash
npm run node
```

终端 B：

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network localhost
npx hardhat run scripts/sync.ts --network localhost
```

然后再启动 indexer / frontend。

---

## 部署 + 同步

```bash
# 部署合约（本地）
cd contracts && npx hardhat run scripts/deploy.ts --network localhost

# 部署合约（测试网）
cd contracts && npx hardhat run scripts/deploy.ts --network polygonAmoy

# 同步 ABI + 生成配置（部署后自动执行，也可单独跑）
cd contracts && npx hardhat run scripts/sync.ts --network polygonAmoy
```

`deploy` 做的事：
- 部署 `DigitalAssetNFT` + `FixedPriceMarket`
- 写入 `deployments/<network>.json`

`sync` 做的事：
- 从 `deployments/<network>.json` 读取地址
- 复制 ABI → `frontend/src/abis/` + `indexer/src/abis/`
- 生成 `frontend/src/config/contract.ts`
- 生成 `indexer/.env`

---

## 启动服务

```bash
# 本地 Hardhat 节点（开发用）
npm run node

# 索引服务
npm run dev:indexer

# 前端
npm run dev
```

---

## 支持的网络

| 网络 | --network | 说明 |
|------|-----------|------|
| 本地 | `localhost` | 需先启动 `npm run node` |
| Polygon Amoy | `polygonAmoy` | 测试网 |
| Sepolia | `sepolia` | 以太坊测试网 |
