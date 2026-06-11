import type { MarketAsset, MarketStats } from "@/types/market";
import { BrowserProvider, Contract } from "ethers";
import { FIXED_PRICE_ADDRESS, NFT_ADDRESS } from "@/config/contract";
import DigitalAssetNFTABI from "@/abis/DigitalAssetNFT.json";
import { fetchListings, type ListingItem } from "@/services/indexer";
import {
  ipfsUriToGatewayUrl,
  resolveTokenMetadata,
  type TokenMetadata,
} from "@/services/ipfs-api";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

type ApiResponse<T> = {
  code: number;
  message: string;
  data: T | null;
};

type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type MarketApiSort = "latest" | "price_asc" | "price_desc";

export type GetMarketAssetsParams = {
  page?: number;
  pageSize?: number;
  minPrice?: string;
  maxPrice?: string;
  seller?: string;
  sort?: MarketApiSort;
};

type MarketAssetCategoryValue = MarketAsset["category"];

export type ApiMarketAssetItem = {
  tokenId: string;
  name: string;
  description?: string;
  imageUrl: string;
  tokenURI?: string;
  owner: string;
  creator: string;
  seller?: string;
  isListed?: boolean;
  price: string;
  contractAddress?: string;
  category?: string;
  chain?: string;
  listedAt?: string;
  createdAt?: string;
  royaltyBps?: number;
  royaltyRate?: number;
  metadata?: {
    name?: string;
    description?: string;
    image?: string;
    imageUrl?: string;
    attributes?: Array<{
      trait_type?: string;
      value?: string;
    }>;
    properties?: {
      cid?: string;
      mime?: string;
    };
  };
  listing?: {
    isListed?: boolean;
    price?: string;
    seller?: string;
  };
  royalty?: {
    receiver?: string;
    amountForCurrentPrice?: string;
    bps?: number;
    rate?: number;
  };
};

export type ApiMarketListingItem = {
  tokenId: string;
  price: string;
  seller: string;
  txHash?: string;
  blockNumber?: number;
  timestamp?: number;
  status?: "listed" | "cancelled";
};

export type ApiMarketSaleItem = {
  tokenId: string;
  price: string;
  seller: string;
  buyer: string;
  txHash?: string;
  blockNumber?: number;
  timestamp?: number;
};

export const mockMarketAssets: MarketAsset[] = [
  {
    id: "asset-001",
    tokenId: "1",
    title: "交大风华 - 银杏叶",
    description: "拍摄于秋季校园主干道的数字影像作品，已完成链上确权与 IPFS 存储。",
    category: "photo",
    imageUrl:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=900&auto=format&fit=crop",
    creator: "0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa",
    owner: "0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa",
    price: 0.5,
    currency: "MATIC",
    royaltyRate: 10,
    chain: "Polygon",
    contractAddress: "0x8a92Bf201AaAaAaAaAaAaAaAaAaAaAaAaAaAaAa",
    ipfsCid: "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
    listedAt: "2026-05-01T10:30:00.000Z",
    status: "listed",
  },
  {
    id: "asset-082",
    tokenId: "82",
    title: "数字几何 #082",
    description: "基于程序生成的抽象几何图案，适合用作数字收藏与版权展示。",
    category: "art",
    imageUrl:
      "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=900&auto=format&fit=crop",
    creator: "0xBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBb",
    owner: "0xCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCc",
    price: 1.2,
    currency: "MATIC",
    royaltyRate: 8,
    chain: "Polygon",
    contractAddress: "0x8a92Bf201AaAaAaAaAaAaAaAaAaAaAaAaAaAaAa",
    ipfsCid: "bafybeicqk2qz5mockgeometry082",
    listedAt: "2026-05-05T08:20:00.000Z",
    status: "listed",
  },
  {
    id: "asset-045",
    tokenId: "45",
    title: "复古游戏机",
    description: "记录复古电子设备外观的数字资产，包含高清图像和元数据说明。",
    category: "collectible",
    imageUrl:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=900&auto=format&fit=crop",
    creator: "0xDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDd",
    owner: "0xEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEeEe",
    price: 0.8,
    currency: "MATIC",
    royaltyRate: 7.5,
    chain: "Polygon",
    contractAddress: "0x8a92Bf201AaAaAaAaAaAaAaAaAaAaAaAaAaAaAa",
    ipfsCid: "bafybeibretrogame045mock",
    listedAt: "2026-05-03T13:10:00.000Z",
    status: "listed",
  },
  {
    id: "asset-116",
    tokenId: "116",
    title: "链上证书样张",
    description: "用于演示文档类资产确权流程的 PDF 样张，包含文件哈希与元数据 CID。",
    category: "document",
    imageUrl:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=900&auto=format&fit=crop",
    creator: "0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa",
    owner: "0xFfFfFfFfFfFfFfFfFfFfFfFfFfFfFfFfFfFfFfFf",
    price: 0.35,
    currency: "MATIC",
    royaltyRate: 5,
    chain: "Polygon",
    contractAddress: "0x8a92Bf201AaAaAaAaAaAaAaAaAaAaAaAaAaAaAa",
    ipfsCid: "bafybeidocument116mock",
    listedAt: "2026-05-08T17:40:00.000Z",
    status: "listed",
  },
];

function buildApiUrl(
  path: string,
  params?: Record<string, string | number | undefined>,
) {
  const searchParams = new URLSearchParams();

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  const pathname = `${API_BASE_URL}${path}`;

  return query ? `${pathname}?${query}` : pathname;
}

async function request<T>(
  path: string,
  params?: Record<string, string | number | undefined>,
): Promise<T> {
  const response = await fetch(buildApiUrl(path, params), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`请求失败：${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as ApiResponse<T>;

  if (payload.code !== 0) {
    throw new Error(payload.message || "接口返回异常");
  }

  if (payload.data === null) {
    throw new Error("接口未返回有效数据");
  }

  return payload.data;
}

function weiToMatic(priceWei?: string) {
  if (!priceWei) {
    return 0;
  }

  try {
    return Number(BigInt(priceWei)) / 1e18;
  } catch {
    return 0;
  }
}

function resolveImageUrl(uri?: string) {
  if (!uri) {
    return "/favicon.svg";
  }

  if (uri.startsWith("ipfs://")) {
    return ipfsUriToGatewayUrl(uri);
  }

  return uri;
}

function normalizeRoyaltyRate(value: unknown): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return Math.max(0, value);
}

function resolveMetadataRoyaltyRate(metadata: TokenMetadata | null): number | null {
  const directRate = normalizeRoyaltyRate(metadata?.royaltyRate);
  if (directRate !== null) {
    return directRate;
  }

  const nestedRate = normalizeRoyaltyRate(metadata?.royalty?.rate);
  if (nestedRate !== null) {
    return nestedRate;
  }

  const directBps = normalizeRoyaltyRate(metadata?.royaltyBps);
  if (directBps !== null) {
    return directBps / 100;
  }

  const propertyBps = normalizeRoyaltyRate(metadata?.properties?.royaltyBps);
  if (propertyBps !== null) {
    return propertyBps / 100;
  }

  const nestedBps = normalizeRoyaltyRate(metadata?.royalty?.bps);
  if (nestedBps !== null) {
    return nestedBps / 100;
  }

  const attributeBps = metadata?.attributes?.find((attr) => {
    const key = attr.trait_type?.toLowerCase();
    return key === "royalty_bps" || key === "royaltybps";
  })?.value;
  const parsedAttributeBps =
    typeof attributeBps === "number" ? attributeBps : Number(attributeBps);

  if (!Number.isNaN(parsedAttributeBps)) {
    return parsedAttributeBps / 100;
  }

  return null;
}

async function resolveOnChainRoyaltyRate(tokenId: number): Promise<number | null> {
  const ethereum = window.ethereum;

  if (!ethereum?.isMetaMask) {
    return null;
  }

  try {
    const provider = new BrowserProvider(ethereum);
    const nft = new Contract(NFT_ADDRESS, DigitalAssetNFTABI.abi, provider);
    const [, amount] = await nft.royaltyInfo(tokenId, 10000n);
    return Number(amount) / 100;
  } catch {
    return null;
  }
}

async function listingToMarketAsset(item: ListingItem): Promise<MarketAsset> {
  const metadata = await resolveTokenMetadata(item.tokenURI);
  const imageUrl = resolveImageUrl(metadata?.imageUrl ?? metadata?.image);
  const royaltyRate =
    resolveMetadataRoyaltyRate(metadata) ??
    (await resolveOnChainRoyaltyRate(item.tokenId)) ??
    0;
  const category =
    metadata?.attributes
      ?.find((attr) => attr.trait_type?.toLowerCase() === "category")
      ?.value ?? "art";

  return {
    id: `asset-${item.tokenId}`,
    tokenId: String(item.tokenId),
    title: metadata?.name || `Asset #${item.tokenId}`,
    description: metadata?.description || item.tokenURI || "链上数字资产",
    category: normalizeCategory({
      tokenId: String(item.tokenId),
      name: metadata?.name || "",
      imageUrl,
      owner: item.seller,
      creator: item.creator,
      price: item.price,
      category: String(category),
    }),
    imageUrl,
    creator: item.creator,
    owner: item.seller,
    price: weiToMatic(item.price),
    currency: "ETH",
    royaltyRate,
    chain: "Polygon",
    contractAddress: FIXED_PRICE_ADDRESS,
    ipfsCid: metadata?.properties?.cid ?? item.tokenURI.replace(/^ipfs:\/\//, ""),
    listedAt: new Date().toISOString(),
    status: "listed",
  };
}

function extractCid(item: ApiMarketAssetItem) {
  const candidates = [
    item.metadata?.properties?.cid,
    item.tokenURI,
    item.metadata?.image,
    item.imageUrl,
  ];

  const value = candidates.find(Boolean);

  if (!value) {
    return "";
  }

  return value
    .replace(/^ipfs:\/\//, "")
    .replace(/^https?:\/\/[^/]+\/ipfs\//, "")
    .split("/")[0];
}

function normalizeCategory(item: ApiMarketAssetItem): MarketAssetCategoryValue {
  const rawCategory =
    item.category ??
    item.metadata?.attributes?.find(
      (attr) => attr.trait_type?.toLowerCase() === "category",
    )?.value ??
    "";

  const normalized = rawCategory.toLowerCase();

  if (normalized === "art" || normalized === "艺术" || normalized === "image") {
    return "art";
  }

  if (normalized === "photo" || normalized === "photography" || normalized === "摄影") {
    return "photo";
  }

  if (normalized === "music" || normalized === "audio" || normalized === "音乐") {
    return "music";
  }

  if (normalized === "collectible" || normalized === "藏品") {
    return "collectible";
  }

  if (normalized === "document" || normalized === "pdf" || normalized === "文档") {
    return "document";
  }

  return "art";
}

function normalizeChain(chain?: string): MarketAsset["chain"] {
  return chain?.toLowerCase() === "ethereum" ? "Ethereum" : "Polygon";
}

function normalizeStatus(item: ApiMarketAssetItem): MarketAsset["status"] {
  const isListed = item.listing?.isListed ?? item.isListed ?? true;
  return isListed ? "listed" : "pending";
}

function resolveRoyaltyRate(item: ApiMarketAssetItem) {
  if (typeof item.royaltyRate === "number") {
    return item.royaltyRate;
  }

  if (typeof item.royalty?.rate === "number") {
    return item.royalty.rate;
  }

  if (typeof item.royaltyBps === "number") {
    return item.royaltyBps / 100;
  }

  if (typeof item.royalty?.bps === "number") {
    return item.royalty.bps / 100;
  }

  return 0;
}

function toMarketAsset(item: ApiMarketAssetItem): MarketAsset {
  const priceWei = item.listing?.price ?? item.price;
  const title = item.name || item.metadata?.name || `Asset #${item.tokenId}`;
  const description =
    item.description ?? item.metadata?.description ?? "链上数字资产";
  const imageUrl = item.imageUrl || item.metadata?.imageUrl || item.metadata?.image || "";

  return {
    id: `asset-${item.tokenId}`,
    tokenId: item.tokenId,
    title,
    description,
    category: normalizeCategory(item),
    imageUrl,
    creator: item.creator,
    owner: item.owner,
    price: weiToMatic(priceWei),
    currency: "MATIC",
    royaltyRate: resolveRoyaltyRate(item),
    chain: normalizeChain(item.chain),
    contractAddress: item.contractAddress ?? "",
    ipfsCid: extractCid(item),
    listedAt: item.listedAt ?? item.createdAt ?? "",
    status: normalizeStatus(item),
  };
}

/**
 * 获取市场资产列表。
 *
 * 对应接口文档：
 * GET /api/market/assets
 *
 * 该接口只负责市场列表聚合查询。上架、购买、取消上架等写操作
 * 应放在 services/web3/marketContract.ts 中，通过 MetaMask 签名后调用合约。
 */
export async function fetchMarketAssets(
  params: GetMarketAssetsParams = {},
): Promise<MarketAsset[]> {
  if (true) {
    try {
      const data = await fetchListings({
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 48,
        seller: params.seller,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
      });

      return await Promise.all(data.items.map(listingToMarketAsset));
    } catch (error) {
      if (API_BASE_URL) {
        throw error;
      }

      return mockMarketAssets;
    }
  }

  try {
    const data = await request<PaginatedResult<ApiMarketAssetItem>>(
      "/api/market/assets",
      params,
    );

    return data.items.map(toMarketAsset);
  } catch (error) {
    console.warn("市场资产接口不可用，已回退到本地 mock 数据。", error);
    return mockMarketAssets;
  }
}

/**
 * 获取市场上架记录。
 *
 * 对应接口文档：
 * GET /api/market/listings
 */
export async function fetchMarketListings(
  params: Pick<GetMarketAssetsParams, "page" | "pageSize" | "seller"> = {},
): Promise<ApiMarketListingItem[]> {
  if (!API_BASE_URL) {
    return [];
  }

  const data = await request<PaginatedResult<ApiMarketListingItem>>(
    "/api/market/listings",
    params,
  );

  return data.items;
}

/**
 * 获取市场成交记录。
 *
 * 对应接口文档：
 * GET /api/market/sales
 */
export async function fetchMarketSales(
  params: Pick<GetMarketAssetsParams, "page" | "pageSize" | "seller"> = {},
): Promise<ApiMarketSaleItem[]> {
  if (!API_BASE_URL) {
    return [];
  }

  const data = await request<PaginatedResult<ApiMarketSaleItem>>(
    "/api/market/sales",
    params,
  );

  return data.items;
}

export function calculateMarketStats(assets: MarketAsset[]): MarketStats {
  const listedAssets = assets.filter((asset) => asset.status === "listed");

  const floorPrice =
    listedAssets.length > 0
      ? Math.min(...listedAssets.map((asset) => asset.price))
      : 0;

  const totalVolume = listedAssets.reduce((sum, asset) => sum + asset.price, 0);
  const creatorCount = new Set(listedAssets.map((asset) => asset.creator)).size;

  return {
    totalListed: listedAssets.length,
    floorPrice,
    totalVolume,
    creatorCount,
  };
}
