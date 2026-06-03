import type { ListingRecord, NFTRecord, OfferRecord } from './types.js';

/**
 * 线程安全的内存数据存储。
 * 维护所有链上事件的聚合视图，供 API 直接查询。
 */
class Store {
  /** tokenId → NFTRecord */
  #nfts = new Map<number, NFTRecord>();

  /** tokenId → ListingRecord（仅活跃上架） */
  #listings = new Map<number, ListingRecord>();

  /** tokenId → (buyer → OfferRecord)（仅活跃出价） */
  #offers = new Map<number, Map<string, OfferRecord>>();

  #lastBlock = 0;

  // ===== NFT =====

  setNFT(record: NFTRecord | Omit<NFTRecord, 'owner'>) {
    const existing = this.#nfts.get(record.tokenId);
    const owner = 'owner' in record ? record.owner : existing?.owner ?? record.creator;
    this.#nfts.set(record.tokenId, { ...record, owner });
  }

  updateNFTOwner(tokenId: number, owner: string) {
    const nft = this.#nfts.get(tokenId);
    if (!nft) return;
    this.#nfts.set(tokenId, { ...nft, owner });
  }

  getNFT(tokenId: number): NFTRecord | undefined {
    return this.#nfts.get(tokenId);
  }

  getNFTs(page: number, pageSize: number): { items: NFTRecord[]; total: number } {
    const all = Array.from(this.#nfts.values()).sort((a, b) => b.tokenId - a.tokenId);
    return this.#paginate(all, page, pageSize);
  }

  // ===== Listing =====

  setListing(record: ListingRecord) {
    this.#listings.set(record.tokenId, record);
  }

  deleteListing(tokenId: number) {
    this.#listings.delete(tokenId);
  }

  getListing(tokenId: number): ListingRecord | undefined {
    return this.#listings.get(tokenId);
  }

  getListings(page: number, pageSize: number, filter?: (listing: ListingRecord) => boolean): { items: ListingRecord[]; total: number } {
    let all = Array.from(this.#listings.values()).sort((a, b) => b.tokenId - a.tokenId);
    if (filter) {
      all = all.filter(filter);
    }
    return this.#paginate(all, page, pageSize);
  }

  // ===== Offer =====

  setOffer(record: OfferRecord) {
    let tokenOffers = this.#offers.get(record.tokenId);
    if (!tokenOffers) {
      tokenOffers = new Map();
      this.#offers.set(record.tokenId, tokenOffers);
    }
    tokenOffers.set(record.buyer, record);
  }

  deleteOffer(tokenId: number, buyer: string) {
    const tokenOffers = this.#offers.get(tokenId);
    if (tokenOffers) {
      tokenOffers.delete(buyer);
      if (tokenOffers.size === 0) {
        this.#offers.delete(tokenId);
      }
    }
  }

  getOffers(tokenId: number): OfferRecord[] {
    const tokenOffers = this.#offers.get(tokenId);
    if (!tokenOffers) return [];
    return Array.from(tokenOffers.values()).sort((a, b) => a.price > b.price ? -1 : a.price < b.price ? 1 : 0);
  }

  /** 清除所有过期出价（可由定时任务调用） */
  pruneExpiredOffers(now: number): number {
    let pruned = 0;
    for (const [tokenId, tokenOffers] of this.#offers) {
      for (const [buyer, offer] of tokenOffers) {
        if (offer.expiresAt <= now) {
          tokenOffers.delete(buyer);
          pruned++;
        }
      }
      if (tokenOffers.size === 0) {
        this.#offers.delete(tokenId);
      }
    }
    return pruned;
  }

  // ===== Block tracking =====

  get lastBlock(): number {
    return this.#lastBlock;
  }

  setLastBlock(block: number) {
    this.#lastBlock = block;
  }

  // ===== Stats =====

  stats() {
    let activeOffers = 0;
    for (const tokenOffers of this.#offers.values()) {
      activeOffers += tokenOffers.size;
    }
    return {
      totalNFTs: this.#nfts.size,
      activeListings: this.#listings.size,
      activeOffers,
      lastBlock: this.#lastBlock,
    };
  }

  /** 重置所有状态（仅用于测试） */
  reset() {
    this.#nfts.clear();
    this.#listings.clear();
    this.#offers.clear();
    this.#lastBlock = 0;
  }

  // ===== Helpers =====

  #paginate<T>(arr: T[], page: number, pageSize: number) {
    const total = arr.length;
    const start = (page - 1) * pageSize;
    return { items: arr.slice(start, start + pageSize), total };
  }
}

export const store = new Store();
