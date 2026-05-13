export type MarketAssetCategory = 'all' | 'art' | 'photo' | 'music' | 'collectible' | 'document';

export type MarketSort = 'latest' | 'price-asc' | 'price-desc' | 'royalty-desc';

export type MarketAssetStatus = 'listed' | 'sold' | 'pending';

export interface MarketAsset {
  id: string;
  tokenId: string;
  title: string;
  description: string;
  category: Exclude<MarketAssetCategory, 'all'>;
  imageUrl: string;
  creator: string;
  owner: string;
  price: number;
  currency: 'MATIC' | 'ETH';
  royaltyRate: number;
  chain: 'Polygon' | 'Ethereum';
  contractAddress: string;
  ipfsCid: string;
  listedAt: string;
  status: MarketAssetStatus;
}

export interface MarketFilters {
  keyword: string;
  category: MarketAssetCategory;
  sort: MarketSort;
}

export interface MarketStats {
  totalListed: number;
  floorPrice: number;
  totalVolume: number;
  creatorCount: number;
}
