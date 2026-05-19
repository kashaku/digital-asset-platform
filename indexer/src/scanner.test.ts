import { describe, it, expect, beforeEach } from 'vitest';
import { _handleEvent } from './scanner.js';
import { store } from './store.js';

function log(eventName: string, args: unknown[]) {
  return { eventName, args } as unknown as import('ethers').EventLog;
}

describe('Scanner 事件处理', () => {
  beforeEach(() => store.reset());

  it('AssetMinted → store 中有对应 NFT', () => {
    _handleEvent(log('AssetMinted', [0n, '0xcreator', 'ipfs://test']));
    expect(store.getNFT(0)).toMatchObject({ tokenId: 0, creator: '0xcreator' });
  });

  it('AssetListed → store 中有对应 Listing', () => {
    _handleEvent(log('AssetMinted', [0n, '0xcreator', 'ipfs://test']));
    _handleEvent(log('AssetListed', [0n, 1_000_000_000_000_000_000n, '0xseller']));

    const listing = store.getListing(0);
    expect(listing?.price).toBe(1_000_000_000_000_000_000n);
    expect(listing?.seller).toBe('0xseller');
    expect(listing?.tokenURI).toBe('ipfs://test');
    expect(listing?.creator).toBe('0xcreator');
  });

  it('AssetListed 对未索引的 NFT 回退 creator 为 seller', () => {
    _handleEvent(log('AssetListed', [99n, 100n, '0xseller']));
    expect(store.getListing(99)?.creator).toBe('0xseller');
  });

  it('AssetSold → 清除对应 listing', () => {
    _handleEvent(log('AssetMinted', [0n, '0xcreator', 'ipfs://test']));
    _handleEvent(log('AssetListed', [0n, 1_000_000_000_000_000_000n, '0xseller']));
    _handleEvent(log('AssetSold', [0n, 1_000_000_000_000_000_000n, '0xseller', '0xbuyer']));

    expect(store.getListing(0)).toBeUndefined();
  });

  it('ListingCancelled → 清除对应 listing', () => {
    _handleEvent(log('AssetMinted', [0n, '0xcreator', 'ipfs://test']));
    _handleEvent(log('AssetListed', [0n, 100n, '0xseller']));
    _handleEvent(log('ListingCancelled', [0n]));

    expect(store.getListing(0)).toBeUndefined();
  });

  it('OfferMade → store 中有对应 Offer', () => {
    _handleEvent(log('OfferMade', [1n, '0xbuyer', 500n, 2000000000n]));

    const offers = store.getOffers(1);
    expect(offers).toHaveLength(1);
    expect(offers[0].buyer).toBe('0xbuyer');
    expect(offers[0].price).toBe(500n);
  });

  it('OfferAccepted → 清除对应 offer', () => {
    _handleEvent(log('OfferMade', [1n, '0xbuyer', 500n, 2000000000n]));
    _handleEvent(log('OfferAccepted', [1n, '0xbuyer', 500n, '0xseller']));

    expect(store.getOffers(1)).toEqual([]);
  });

  it('OfferCancelled → 清除对应 offer', () => {
    _handleEvent(log('OfferMade', [1n, '0xbuyer', 500n, 2000000000n]));
    _handleEvent(log('OfferCancelled', [1n, '0xbuyer']));

    expect(store.getOffers(1)).toEqual([]);
  });

  it('多个出价：接受其中一个不影响其他', () => {
    _handleEvent(log('OfferMade', [1n, '0xA', 100n, 2000000000n]));
    _handleEvent(log('OfferMade', [1n, '0xB', 200n, 2000000000n]));
    _handleEvent(log('OfferAccepted', [1n, '0xA', 100n, '0xseller']));

    expect(store.getOffers(1)).toHaveLength(1);
    expect(store.getOffers(1)[0].buyer).toBe('0xB');
  });

  it('完整流程：铸造 → 上架 → 出售', () => {
    _handleEvent(log('AssetMinted', [0n, '0xcreator', 'ipfs://test']));
    _handleEvent(log('AssetListed', [0n, 1000n, '0xseller']));

    expect(store.stats()).toMatchObject({ totalNFTs: 1, activeListings: 1 });

    _handleEvent(log('AssetSold', [0n, 1000n, '0xseller', '0xbuyer']));

    expect(store.stats()).toMatchObject({ totalNFTs: 1, activeListings: 0 });
    expect(store.getNFT(0)).toBeDefined();
    expect(store.getListing(0)).toBeUndefined();
  });
});
