# 合约接口参考

---

## DigitalAssetNFT（ERC-721 资产合约）

网络: `NFT_ADDRESS`（见 `frontend/src/config/contract.ts`）

### `mintAsset`

```
function mintAsset(address to, string calldata uri, uint96 royaltyBps) external returns (uint256 tokenId)
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `to` | `address` | 接收者地址 |
| `uri` | `string` | 元数据 IPFS URI（`ipfs://Qm...`） |
| `royaltyBps` | `uint96` | 版税基点，最大 1000（10%） |

### `totalMinted`

```
function totalMinted() external view returns (uint256)
```

返回已铸造 NFT 总数。tokenId 从 0 开始自增。

### `creators`

```
function creators(uint256 tokenId) external view returns (address)
```

返回 tokenId 的原始铸造者地址。

### 事件

**`AssetMinted(uint256 indexed tokenId, address indexed creator, string tokenURI)`**

新资产铸造时触发。

---

## FixedPriceMarket（一口价市场合约）

网络: `FIXED_PRICE_ADDRESS`

### `listForSale`

```
function listForSale(uint256 tokenId, uint256 price) external
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `tokenId` | `uint256` | NFT ID |
| `price` | `uint256` | 标价（wei） |

前置条件：调用者为 NFT 所有者，且已授权合约（approve / setApprovalForAll）。

### `buyAsset`

```
function buyAsset(uint256 tokenId) external payable
```

按标价购买。ETH 会自动分配：版税 → 创作者，余款 → 卖家，超额退款。

### `cancelListing`

```
function cancelListing(uint256 tokenId) external
```

仅卖家可取消自己的挂单。

### `listings`

```
function listings(uint256 tokenId) external view returns (Listing)
```

返回 `{ price: uint256, seller: address }`。不存在的挂单返回 `{ 0, 0x0 }`。

### 事件

| 事件 | 参数 |
|------|------|
| `AssetListed` | `tokenId, price, seller` |
| `AssetSold` | `tokenId, price, seller, buyer` |
| `ListingCancelled` | `tokenId` |

---

## 前端交互

```ts
import { useMarket } from '@/hooks/useMarket';
import { useNFT } from '@/hooks/useNFT';

// 铸造（含 IPFS 上传）
const { mintAsset } = useNFT();
await mintAsset(recipient, "ipfs://Qm...", 500);  // 5% 版税

// 上架
const { listForSale } = useMarket();
await listForSale(tokenId, "1.5");  // 1.5 ETH

// 购买
const { buyAsset } = useMarket();
await buyAsset(tokenId, "1.5");
```
