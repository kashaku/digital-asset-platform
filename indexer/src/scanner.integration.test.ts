import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Contract, ethers } from 'ethers';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';
import { startScanner, type WatchedContract } from './scanner.js';
import { store } from './store.js';
import apiRoutes from './api.js';

const envPath = resolve(import.meta.dirname, '../.env');
if (existsSync(envPath)) config({ path: envPath });

const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';
const NFT_ADDRESS = process.env.NFT_ADDRESS;
const FIXED_PRICE_ADDRESS = process.env.FIXED_PRICE_ADDRESS;

function loadABI(name: string) {
  const p = resolve(import.meta.dirname, 'abis', `${name}.json`);
  return JSON.parse(readFileSync(p, 'utf-8')).abi;
}

describe('Scanner integration', () => {
  let app: ReturnType<typeof express>;
  let server: ReturnType<ReturnType<typeof express>['listen']>;

  beforeAll(async () => {
    let provider: ethers.JsonRpcProvider;
    try {
      provider = new ethers.JsonRpcProvider(RPC_URL);
      await provider.getBlockNumber();
    } catch {
      console.warn('  [skip] RPC 不可用');
      return;
    }

    if (!NFT_ADDRESS || !FIXED_PRICE_ADDRESS) {
      console.warn('  [skip] 合约地址未配置');
      return;
    }

    const nftCode = await provider.getCode(NFT_ADDRESS);
    const marketCode = await provider.getCode(FIXED_PRICE_ADDRESS);
    if (nftCode === '0x' || marketCode === '0x') {
      console.warn('  [skip] 当前 RPC 上找不到已配置的合约，请先重新 deploy/sync');
      return;
    }

    const signer = await provider.getSigner();
    const nft = new Contract(NFT_ADDRESS, loadABI('DigitalAssetNFT'), signer);
    const market = new Contract(FIXED_PRICE_ADDRESS, loadABI('FixedPriceMarket'), signer);

    store.reset();

    const addr = await signer.getAddress();

    // 先铸造 + 上架（确保事件在历史区块中）
    const tx1 = await nft.mintAsset(addr, 'ipfs://integration-test', 500);
    await tx1.wait();

    const tokenId = Number(await nft.totalMinted()) - 1;

    const tx2 = await nft.approve(FIXED_PRICE_ADDRESS, tokenId);
    await tx2.wait();

    const tx3 = await market.listForSale(tokenId, ethers.parseEther('0.1'));
    await tx3.wait();

    // 再启动 scanner，历史回放会抓到上面的区块
    const watched: WatchedContract[] = [
      {
        contract: new Contract(NFT_ADDRESS, loadABI('DigitalAssetNFT'), provider),
        events: ['AssetMinted', 'Transfer'],
      },
      {
        contract: new Contract(FIXED_PRICE_ADDRESS, loadABI('FixedPriceMarket'), provider),
        events: ['AssetListed', 'AssetSold', 'ListingCancelled'],
      },
    ];
    await startScanner(provider, watched);

    app = express();
    app.use(cors());
    app.use('/api', apiRoutes);
    server = app.listen(0);
  });

  afterAll(() => {
    server?.close();
  });

  it('stats 应有 NFT 计数', async () => {
    if (!server) return;
    const res = await request(app).get('/api/stats');
    expect(res.status).toBe(200);
    expect(res.body.totalNFTs).toBeGreaterThanOrEqual(1);
  });

  it('listings 应包含刚上架的资产', async () => {
    if (!server) return;
    const res = await request(app).get('/api/listings');
    expect(res.status).toBe(200);
    const match = res.body.items.find(
      (l: { tokenURI: string }) => l.tokenURI === 'ipfs://integration-test',
    );
      expect(match, `Expected listing not found, found listings: ${JSON.stringify(res.body.items)}`).toBeDefined();
  });
});
