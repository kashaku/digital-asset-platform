/**
 * Indexer API service — 封装链下索引服务 REST 接口。
 *
 * 对应文档: documents/indexer-api-reference.md
 */

// 类型与 indexer/src/types.ts 保持一致，bigint 返回时序列化为 wei 十进制字符串
export interface NFTItem {
  tokenId: number;
  tokenURI: string;
  creator: string;
  owner: string;
}

export interface ListingItem {
  tokenId: number;
  price: string;
  seller: string;
  tokenURI: string;
  creator: string;
}

export interface OfferItem {
  tokenId: number;
  buyer: string;
  price: string;
  expiresAt: number;
}

export interface MarketStats {
  totalNFTs: number;
  activeListings: number;
  activeOffers: number;
  lastBlock: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
}

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

export interface ListingFilters extends PaginationOptions {
  tokenId?: number;
  seller?: string;
  creator?: string;
  minPrice?: string | bigint;
  maxPrice?: string | bigint;
}

export class IndexerError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "IndexerError";
    this.status = status;
  }
}

let baseUrl = "http://localhost:3001/api";

export function setIndexerBaseUrl(url: string) {
  baseUrl = url.replace(/\/$/, "");
}

function buildQuery(params: Record<string, string | number | bigint | undefined>): string {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    query.set(key, value.toString());
  }

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

async function get<T>(path: string): Promise<T> {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });

  if (!res.ok) {
    throw new IndexerError(
      `GET ${path} → ${res.status} ${res.statusText}`,
      res.status,
    );
  }

  return (await res.json()) as T;
}

// ===== Listings =====

export async function fetchListings(
  filters: ListingFilters = {},
): Promise<PaginatedResponse<ListingItem>> {
  const query = buildQuery({
    page: filters.page ?? 1,
    pageSize: filters.pageSize ?? 20,
    tokenId: filters.tokenId,
    seller: filters.seller,
    creator: filters.creator,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
  });

  return get<PaginatedResponse<ListingItem>>(`/listings${query}`);
}

export async function fetchListing(
  tokenId: number,
): Promise<ListingItem | null> {
  try {
    return await get<ListingItem>(`/listings/${tokenId}`);
  } catch (e) {
    if (e instanceof IndexerError && e.status === 404) return null;
    throw e;
  }
}

// ===== Offers =====

export async function fetchOffers(tokenId: number): Promise<OfferItem[]> {
  const result = await get<{ tokenId: number; offers: OfferItem[] }>(`/offers/${tokenId}`);
  return result.offers;
}

// ===== NFTs =====

export async function fetchNFTs(
  options: PaginationOptions = {},
): Promise<PaginatedResponse<NFTItem>> {
  const query = buildQuery({
    page: options.page ?? 1,
    pageSize: options.pageSize ?? 20,
  });

  return get<PaginatedResponse<NFTItem>>(`/nfts${query}`);
}

export async function fetchNFT(tokenId: number): Promise<NFTItem | null> {
  try {
    return await get<NFTItem>(`/nfts/${tokenId}`);
  } catch (e) {
    if (e instanceof IndexerError && e.status === 404) return null;
    throw e;
  }
}

// ===== Stats =====

export async function fetchStats(): Promise<MarketStats> {
  return get<MarketStats>("/stats");
}
