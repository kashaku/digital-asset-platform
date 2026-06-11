# 本地 IPFS Kubo 搭建与启动指南

本文档用于说明如何在 Windows 环境下安装、初始化、启动本地 IPFS Kubo 节点，并将其接入当前数字资产平台项目。

## 1. 目标说明

本项目的 IPFS 上传链路为：

```text
frontend
  -> indexer /api/ipfs/upload
  -> 本地 Kubo API http://127.0.0.1:5001/api/v0/add
  -> 返回媒体 CID

frontend
  -> indexer /api/ipfs/metadata
  -> 本地 Kubo API http://127.0.0.1:5001/api/v0/add
  -> 返回 metadata CID

链上 NFT
  -> 保存 tokenURI: ipfs://metadataCID
```

浏览器访问 IPFS 内容时使用本地 Gateway：

```text
http://127.0.0.1:8080/ipfs/{CID}
```

## 2. 安装 Kubo

### 2.1 下载 Kubo

打开 PowerShell，执行：

```powershell
cd ~\Downloads
wget https://dist.ipfs.tech/kubo/v0.42.0/kubo_v0.42.0_windows-amd64.zip -Outfile kubo.zip
```

### 2.2 解压 Kubo

```powershell
Expand-Archive -Path kubo.zip -DestinationPath ~\Apps\kubo
```

进入解压目录并检查版本：

```powershell
cd ~\Apps\kubo\kubo
.\ipfs.exe --version
```

如果输出类似下面内容，说明安装成功：

```text
ipfs version 0.42.0
```

### 2.3 配置 PATH

为了在任意目录直接执行 `ipfs` 命令，将 Kubo 目录加入用户 PATH：

```powershell
$IPFS_PATH = "$HOME\Apps\kubo\kubo"
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$IPFS_PATH", "User")
```

关闭当前 PowerShell，重新打开一个新的 PowerShell，执行：

```powershell
ipfs --version
```

如果可以输出版本号，说明 PATH 配置成功。

## 3. 初始化本地 IPFS 节点

首次使用 Kubo 需要初始化本地仓库：

```powershell
ipfs init
```

初始化后，默认会在当前用户目录下生成 IPFS 仓库：

```text
C:\Users\你的用户名\.ipfs
```

该目录用于保存本地节点配置、节点身份和本地 pin 的数据。

## 4. 启动本地 IPFS 服务

打开一个新的 PowerShell，执行：

```powershell
ipfs daemon
```

启动成功后，应看到类似输出：

```text
API server listening on /ip4/127.0.0.1/tcp/5001
Gateway server listening on /ip4/127.0.0.1/tcp/8080
WebUI: http://127.0.0.1:5001/webui
```

关键端口说明：

| 地址 | 作用 |
| --- | --- |
| `http://127.0.0.1:5001` | Kubo API，用于上传文件和 metadata |
| `http://127.0.0.1:8080` | Kubo Gateway，用于浏览器访问 IPFS 内容 |

注意：`ipfs daemon` 窗口必须保持运行，关闭后本地 IPFS 服务也会停止。

## 5. 独立测试 IPFS

在另一个 PowerShell 中执行：

```powershell
cd F:\BlockChain\digital-asset-platform
"hello ipfs" > ipfs-test.txt
ipfs add ipfs-test.txt
```

命令会输出类似：

```text
added Qmxxxxxx ipfs-test.txt
```

其中 `Qmxxxxxx` 是 CID。

使用浏览器访问：

```text
http://127.0.0.1:8080/ipfs/Qmxxxxxx
```

如果页面显示：

```text
hello ipfs
```

说明本地 IPFS API 和 Gateway 均可用。

也可以直接测试 Kubo API：

```powershell
curl.exe -X POST -F "file=@ipfs-test.txt" "http://127.0.0.1:5001/api/v0/add"
```

正常返回内容类似：

```json
{
  "Name": "ipfs-test.txt",
  "Hash": "Qmxxxxxx",
  "Size": "..."
}
```

## 6. 配置项目后端

项目后端的 IPFS 接口位于 `indexer` 服务中。

修改或新建：

```text
F:\BlockChain\digital-asset-platform\indexer\.env
```

在已有合约地址配置后追加：

```env
PORT=3001
IPFS_API_URL=http://127.0.0.1:5001
IPFS_GATEWAY_URL=http://127.0.0.1:8080
```

完整示例：

```env
RPC_URL=http://127.0.0.1:8545
NFT_ADDRESS=你的NFT合约地址
FIXED_PRICE_ADDRESS=你的市场合约地址
OFFER_ADDRESS=你的出价合约地址

PORT=3001
IPFS_API_URL=http://127.0.0.1:5001
IPFS_GATEWAY_URL=http://127.0.0.1:8080
```

说明：

| 变量 | 作用 |
| --- | --- |
| `IPFS_API_URL` | 后端上传文件时调用的 Kubo API 地址 |
| `IPFS_GATEWAY_URL` | 后端和前端访问 CID 时使用的本地 Gateway 地址 |
| `PORT` | indexer API 服务端口，默认是 `3001` |

## 7. 配置项目前端

修改或新建：

```text
F:\BlockChain\digital-asset-platform\frontend\.env
```

写入：

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_IPFS_GATEWAY_URL=http://127.0.0.1:8080
```

说明：

| 变量 | 作用 |
| --- | --- |
| `VITE_API_BASE_URL` | 让前端调用真实 indexer 后端，不再走 mock 上传 |
| `VITE_IPFS_GATEWAY_URL` | 让前端把 `ipfs://CID` 转换成本地 Gateway URL |

注意：修改 `frontend/.env` 后必须重启前端开发服务。

## 8. 启动完整项目

建议按以下顺序启动四个窗口。

### 8.1 启动本地区块链

```powershell
cd F:\BlockChain\digital-asset-platform\contracts
npx hardhat node
```

保持窗口运行。

### 8.2 部署合约

如果刚启动了新的 Hardhat 本地链，需要重新部署合约：

```powershell
cd F:\BlockChain\digital-asset-platform\contracts
npm run deploy-dev
```

部署脚本会同步生成前端和 indexer 所需的合约地址与 ABI。

### 8.3 启动 IPFS

```powershell
ipfs daemon
```

保持窗口运行。

### 8.4 启动 indexer

```powershell
cd F:\BlockChain\digital-asset-platform\indexer
npm run dev
```

看到以下输出说明启动成功：

```text
[api] 索引 API 已启动: http://localhost:3001/api
```

### 8.5 启动前端

```powershell
cd F:\BlockChain\digital-asset-platform\frontend
npm run dev
```

打开 Vite 输出的本地地址，例如：

```text
http://localhost:5173
```

## 9. 检测 IPFS 接入状态

indexer 启动后，访问：

```text
http://localhost:3001/api/ipfs/status
```

正常返回应类似：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "mode": "kubo",
    "apiUrl": "http://127.0.0.1:5001",
    "gatewayUrl": "http://127.0.0.1:8080",
    "apiReady": true,
    "gatewayReady": true,
    "ready": true
  }
}
```

字段说明：

| 字段 | 含义 |
| --- | --- |
| `apiReady` | indexer 是否能调用 Kubo API |
| `gatewayReady` | indexer 上传测试文件后，Gateway 是否能读回该 CID |
| `ready` | API 和 Gateway 是否都可用 |

只有 `ready: true` 时，才建议继续测试铸造。

## 10. 铸造后的 URL 访问格式

铸造成功后，链上保存的是：

```text
ipfs://metadataCID
```

该地址不能直接用浏览器打开，需要转换成本地 Gateway URL：

```text
http://127.0.0.1:8080/ipfs/metadataCID
```

metadata JSON 中通常包含：

```json
{
  "name": "资产名称",
  "description": "资产描述",
  "image": "ipfs://mediaCID"
}
```

其中图片或媒体文件访问地址为：

```text
http://127.0.0.1:8080/ipfs/mediaCID
```

## 11. 常见问题

### 11.1 `localhost:3001` 拒绝连接

说明 indexer 没有启动，或启动后已经退出。

检查：

```powershell
cd F:\BlockChain\digital-asset-platform\indexer
npm run dev
```

必须看到：

```text
[api] 索引 API 已启动: http://localhost:3001/api
```

### 11.2 `/api/ipfs/status` 中 `apiReady` 为 `false`

说明 indexer 不能访问 Kubo API。

检查：

```powershell
ipfs daemon
```

确认输出中包含：

```text
API server listening on /ip4/127.0.0.1/tcp/5001
```

### 11.3 `/api/ipfs/status` 中 `gatewayReady` 为 `false`

说明 Kubo Gateway 不能通过 `/ipfs/{CID}` 读回内容。

检查：

```powershell
ipfs add ipfs-test.txt
```

然后访问：

```text
http://127.0.0.1:8080/ipfs/你的CID
```

如果仍然 404，说明 Gateway 未正常工作或 CID 没有成功加入本地节点。

### 11.4 前端仍然走 mock 上传

检查 `frontend/.env` 是否存在：

```env
VITE_API_BASE_URL=http://localhost:3001
```

修改 `.env` 后，需要重启前端：

```powershell
cd F:\BlockChain\digital-asset-platform\frontend
npm run dev
```

### 11.5 铸造成功但个人中心或市场不显示

先检查 indexer 是否同步到链上事件：

```text
http://localhost:3001/api/nfts
http://localhost:3001/api/listings
```

如果 `/api/nfts` 没有新资产，说明 indexer 没同步到 mint 事件。保持 Hardhat node 和 indexer 都运行后，重新铸造测试。

如果 `/api/listings` 没有上架资产，说明上架事件没有同步。保持服务运行后，重新上架测试。

### 11.6 在项目根目录运行 `npx hardhat node` 报错

Hardhat 配置位于 `contracts` 目录，因此需要进入该目录运行：

```powershell
cd F:\BlockChain\digital-asset-platform\contracts
npx hardhat node
```

## 12. Pinata 与本地 Kubo 的区别

本地 Kubo 模式：

```env
IPFS_API_URL=http://127.0.0.1:5001
IPFS_GATEWAY_URL=http://127.0.0.1:8080
```

适合本地开发和演示。内容主要保存在本机节点中，其他公网节点不一定能立即访问。

Pinata 模式：

```env
PINATA_JWT=你的_Pinata_JWT
PINATA_GATEWAY_URL=https://gateway.pinata.cloud
```

适合公网演示和长期可访问。不要把 `PINATA_JWT` 写入前端 `.env`，只能放在后端 `indexer/.env` 中。

## 13. 推荐启动顺序速查

```powershell
# 1. 本地链
cd F:\BlockChain\digital-asset-platform\contracts
npx hardhat node

# 2. 合约部署
cd F:\BlockChain\digital-asset-platform\contracts
npm run deploy-dev

# 3. IPFS
ipfs daemon

# 4. indexer
cd F:\BlockChain\digital-asset-platform\indexer
npm run dev

# 5. frontend
cd F:\BlockChain\digital-asset-platform\frontend
npm run dev
```

