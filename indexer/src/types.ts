export interface NFTRecord {
  tokenId: number;
  tokenURI: string;
  creator: string;
  owner: string;
}

export interface ListingRecord {
  tokenId: number;
  price: bigint;
  seller: string;
  tokenURI: string;
  creator: string;
}

export interface OfferRecord {
  tokenId: number;
  buyer: string;
  price: bigint;
  expiresAt: number;
}

export interface MarketStats {
  totalNFTs: number;
  activeListings: number;
  activeOffers: number;
  lastBlock: number;
}
