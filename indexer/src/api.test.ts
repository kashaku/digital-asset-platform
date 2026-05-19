import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import apiRoutes from './api.js';
import { store } from './store.js';

function app() {
  const app = express();
  app.use(cors());
  app.use('/api', apiRoutes);
  return app;
}

describe('API', () => {
  beforeEach(() => store.reset());

  describe('GET /api/stats', () => {
    it('空状态返回零值', async () => {
      const res = await request(app()).get('/api/stats');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        totalNFTs: 0,
        activeListings: 0,
        activeOffers: 0,
        lastBlock: 0,
      });
    });
  });

  describe('GET /api/listings', () => {
    it('分页查询 listings', async () => {
      for (let i = 0; i < 5; i++) {
        store.setListing({
          tokenId: i,
          price: BigInt((i + 1) * 1_000_000_000_000_000_000),
          seller: `0xseller${i}`,
          tokenURI: `ipfs://test-${i}`,
          creator: `0xcreator${i}`,
        });
      }

      const res = await request(app()).get('/api/listings?page=1&pageSize=2');
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(5);
      expect(res.body.items).toHaveLength(2);
      expect(res.body.items[0].tokenId).toBe(4);
      expect(res.body.items[0].price).toBe('5000000000000000000');
    });

    it('默认分页参数', async () => {
      const res = await request(app()).get('/api/listings');
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(0);
    });

    it('price 序列化为字符串', async () => {
      store.setListing({
        tokenId: 0,
        price: 500_000_000_000_000_000n,
        seller: '0xseller0',
        tokenURI: 'ipfs://test-0',
        creator: '0xcreator0',
      });

      const res = await request(app()).get('/api/listings');
      expect(typeof res.body.items[0].price).toBe('string');
    });
  });

  describe('GET /api/listings/:tokenId', () => {
    it('返回单个 listing', async () => {
      store.setListing({
        tokenId: 5,
        price: 100n,
        seller: '0xseller5',
        tokenURI: 'ipfs://test-5',
        creator: '0xcreator5',
      });

      const res = await request(app()).get('/api/listings/5');
      expect(res.status).toBe(200);
      expect(res.body.tokenId).toBe(5);
    });

    it('不存在的 listing 返回 404', async () => {
      const res = await request(app()).get('/api/listings/99');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/offers/:tokenId', () => {
    it('返回 token 的所有出价（降序）', async () => {
      store.setOffer({ tokenId: 1, buyer: '0xA', price: 100n, expiresAt: 2000000000 });
      store.setOffer({ tokenId: 1, buyer: '0xB', price: 200n, expiresAt: 2000000000 });

      const res = await request(app()).get('/api/offers/1');
      expect(res.status).toBe(200);
      expect(res.body.offers).toHaveLength(2);
      expect(res.body.offers[0].price).toBe('200');
      expect(res.body.offers[1].price).toBe('100');
    });

    it('无出价时返回空数组', async () => {
      const res = await request(app()).get('/api/offers/1');
      expect(res.status).toBe(200);
      expect(res.body.offers).toEqual([]);
    });
  });

  describe('GET /api/nfts', () => {
    it('分页查询', async () => {
      for (let i = 0; i < 3; i++) {
        store.setNFT({ tokenId: i, tokenURI: `ipfs://test-${i}`, creator: `0xcreator${i}` });
      }

      const res = await request(app()).get('/api/nfts?page=2&pageSize=2');
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(3);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].tokenId).toBe(0);
    });
  });

  describe('GET /api/nfts/:tokenId', () => {
    it('返回单个 NFT', async () => {
      store.setNFT({ tokenId: 1, tokenURI: 'ipfs://test', creator: '0xcreator' });

      const res = await request(app()).get('/api/nfts/1');
      expect(res.status).toBe(200);
      expect(res.body.tokenURI).toBe('ipfs://test');
    });

    it('不存在返回 404', async () => {
      const res = await request(app()).get('/api/nfts/99');
      expect(res.status).toBe(404);
    });
  });
});
