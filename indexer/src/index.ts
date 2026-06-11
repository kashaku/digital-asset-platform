import { Contract, ethers } from 'ethers';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';
import express from 'express';
import cors from 'cors';
import { startScanner, type WatchedContract } from './scanner.js';
import apiRoutes from './api.js';
import ipfsRoutes from './ipfs.js';

const envPath = resolve(import.meta.dirname, '../.env');
if (existsSync(envPath)) config({ path: envPath });

const PORT = parseInt(process.env.PORT || '3001');
const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545';

const NFT_ADDRESS = process.env.NFT_ADDRESS;
const FIXED_PRICE_ADDRESS = process.env.FIXED_PRICE_ADDRESS;
const OFFER_ADDRESS = process.env.OFFER_ADDRESS;

const ABI_DIR = resolve(import.meta.dirname, 'abis');

function loadABI(contractName: string) {
  const path = resolve(ABI_DIR, `${contractName}.json`);
  const abi = JSON.parse(readFileSync(path, 'utf-8')).abi;
  if (!Array.isArray(abi) || abi.length === 0) {
    throw new Error(`${contractName}: ABI 为空 (${path}) — 请先运行 deploy`);
  }
  return abi;
}

async function main() {
  if (!NFT_ADDRESS || !FIXED_PRICE_ADDRESS) {
    throw new Error(
      'NFT_ADDRESS 和 FIXED_PRICE_ADDRESS 未设置。\n' +
      '方式 1: 运行 deploy 脚本（自动生成 .env）\n' +
      '方式 2: 手动设置环境变量'
    );
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);

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

  if (OFFER_ADDRESS) {
    watched.push({
      contract: new Contract(OFFER_ADDRESS, loadABI('OfferMarket'), provider),
      events: ['OfferMade', 'OfferAccepted', 'OfferRejected', 'OfferCancelled'],
    });
  }

  await startScanner(provider, watched);

  const app = express();
  app.use(cors());
  app.use('/api', ipfsRoutes);
  app.use('/api', apiRoutes);

  app.listen(PORT, () => {
    console.log(`[api] 索引 API 已启动: http://localhost:${PORT}/api`);
  });
}

main().catch(err => {
  console.error('启动失败:', err);
  process.exit(1);
});
