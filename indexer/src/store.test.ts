import { describe, it, expect, beforeEach } from 'vitest';
import { store } from './store.js';

function makeNFT(tokenId = 1) {
  return { tokenId, tokenURI: `ipfs://test-${tokenId}`, creator: `0xcreator${tokenId}` };
}

function makeListing(tokenId = 1, price = 1_000_000_000_000_000_000n) {
  return { tokenId, price, seller: `0xseller${tokenId}`, tokenURI: `ipfs://test-${tokenId}`, creator: `0xcreator${tokenId}` };
}

function makeOffer(tokenId = 1, buyer = '0xbuyer', price = 500_000_000_000_000_000n, expiresAt?: number) {
  return { tokenId, buyer, price, expiresAt: expiresAt ?? Math.floor(Date.now() / 1000) + 86400 };
}

describe('Store', () => {
  beforeEach(() => store.reset());

  describe('NFT', () => {
    it('setNFT + getNFT', () => {
      store.setNFT(makeNFT(1));
      expect(store.getNFT(1)).toMatchObject({ tokenId: 1, tokenURI: 'ipfs://test-1' });
    });

    it('getNFT 未找到返回 undefined', () => {
      expect(store.getNFT(99)).toBeUndefined();
    });

    it('getNFTs 分页', () => {
      for (let i = 0; i < 5; i++) store.setNFT(makeNFT(i));
      const page1 = store.getNFTs(1, 2);
      expect(page1.items).toHaveLength(2);
      expect(page1.total).toBe(5);
      // 降序排列，最新的在前
      expect(page1.items[0].tokenId).toBe(4);
      expect(page1.items[1].tokenId).toBe(3);

      const page3 = store.getNFTs(3, 2);
      expect(page3.items).toHaveLength(1);
      expect(page3.items[0].tokenId).toBe(0);
    });
  });

  describe('Listing', () => {
    it('setListing + getListing', () => {
      store.setListing(makeListing(1));
      const l = store.getListing(1);
      expect(l?.price).toBe(1_000_000_000_000_000_000n);
      expect(l?.seller).toBe('0xseller1');
    });

    it('deleteListing', () => {
      store.setListing(makeListing(1));
      store.deleteListing(1);
      expect(store.getListing(1)).toBeUndefined();
    });

    it('getListings 分页', () => {
      for (let i = 0; i < 3; i++) store.setListing(makeListing(i));
      const { items, total } = store.getListings(1, 10);
      expect(total).toBe(3);
      expect(items).toHaveLength(3);
    });

    it('deleteListing 不影响其他 listing', () => {
      store.setListing(makeListing(1));
      store.setListing(makeListing(2));
      store.deleteListing(1);
      expect(store.getListing(1)).toBeUndefined();
      expect(store.getListing(2)).toBeDefined();
    });
  });

  describe('Offer', () => {
    it('setOffer + getOffers', () => {
      store.setOffer(makeOffer(1, '0xA'));
      store.setOffer(makeOffer(1, '0xB', 800_000_000_000_000_000n));
      const offers = store.getOffers(1);
      expect(offers).toHaveLength(2);
      // 按价格降序
      expect(offers[0].price).toBe(800_000_000_000_000_000n);
      expect(offers[1].price).toBe(500_000_000_000_000_000n);
    });

    it('deleteOffer', () => {
      store.setOffer(makeOffer(1, '0xA'));
      store.setOffer(makeOffer(1, '0xB'));
      store.deleteOffer(1, '0xA');
      expect(store.getOffers(1)).toHaveLength(1);
      expect(store.getOffers(1)[0].buyer).toBe('0xB');
    });

    it('deleteOffer 最后一个 offer 后 token 条目消失', () => {
      store.setOffer(makeOffer(1, '0xA'));
      store.deleteOffer(1, '0xA');
      expect(store.getOffers(1)).toEqual([]);
    });

    it('pruneExpiredOffers 清理过期出价', () => {
      const now = Math.floor(Date.now() / 1000);
      store.setOffer(makeOffer(1, '0xA', 500n, now - 100)); // 已过期
      store.setOffer(makeOffer(1, '0xB', 500n, now + 86400)); // 未过期
      store.setOffer(makeOffer(2, '0xC', 500n, now - 3600)); // 已过期

      const pruned = store.pruneExpiredOffers(now);
      expect(pruned).toBe(2);
      expect(store.getOffers(1)).toHaveLength(1);
      expect(store.getOffers(1)[0].buyer).toBe('0xB');
      expect(store.getOffers(2)).toEqual([]);
    });
  });

  describe('Block tracking', () => {
    it('setLastBlock + lastBlock', () => {
      store.setLastBlock(12345);
      expect(store.lastBlock).toBe(12345);
    });
  });

  describe('Stats', () => {
    it('返回正确统计', () => {
      store.setNFT(makeNFT(1));
      store.setNFT(makeNFT(2));
      store.setListing(makeListing(1));
      store.setOffer(makeOffer(1, '0xA'));
      store.setOffer(makeOffer(1, '0xB'));
      store.setLastBlock(42);

      expect(store.stats()).toEqual({
        totalNFTs: 2,
        activeListings: 1,
        activeOffers: 2,
        lastBlock: 42,
      });
    });
  });
});
