# Indexer API 参考

链下索引服务——扫描合约事件、内存聚合存储、REST API 查询。

---

## 启动

```bash
cd indexer && npm run dev
```

依赖 `indexer/.env`（由 `sync.ts` 生成或手动配置）：

```env
RPC_URL=http://127.0.0.1:8545
NFT_ADDRESS=0x...
FIXED_PRICE_ADDRESS=0x...
OFFER_ADDRESS=0x...      # 可选
PORT=3001                # 可选，默认 3001
```

---

## 通用说明

- 所有 `price` 字段为 **wei** 单位的十进制字符串（`"1000000000000000000"` = 1 ETH）
- 分页参数 `page` 默认 1，`pageSize` 默认 20（最大 100）
- 数据为**降序**排列（最新在前）

---

## 类型定义

```ts
// 来源: indexer/src/types.ts

interface NFTRecord {
  tokenId: number;
  tokenURI: string;   // IPFS URI
  creator: string;    // 0x 地址
}

interface ListingRecord {
  tokenId: number;
  price: bigint;      // wei，返回时序列化为字符串
  seller: string;
  tokenURI: string;
  creator: string;
}

interface MarketStats {
  totalNFTs: number;
  activeListings: number;
  lastBlock: number;
}
```

---

## API 接口

### 一口价挂单

#### GET /api/listings

分页查询所有活跃挂单。

**Query:** `page` `pageSize`

**Response 200:**
```json
{
  "page": 1,
  "pageSize": 20,
  "pending": 1,
  "items": [
    {
      "tokenId": 0,
      "price": "1000000000000000000",
      "seller": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      "tokenURI": "ipfs://Qm...",
      "creator": "0x..."
    }
  ]
}
```

#### GET /api/listings/:tokenId

查询单个挂单。

**Response 200:** `ListingRecord`

**Response 404:** `{ "error": "Listing not found" }`

---

### NFT

#### GET /api/nfts

分页查询已铸造 NFT（含链下元数据 URI）。

**Query:** `page` `pageSize`

#### GET /api/nfts/:tokenId

查询单个 NFT。

**Response 404:** `{ "error": "NFT not found" }`

---

### 统计

#### GET /api/stats

```json
{
  "totalNFTs": 5,
  "activeListings": 2,
  "activeOffers": 1,
  "lastBlock": 100
}
```
