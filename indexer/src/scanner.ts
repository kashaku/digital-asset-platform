import { Contract, EventLog, type Provider } from 'ethers';
import { store } from './store.js';
import type { NFTRecord } from './types.js';

export interface WatchedContract {
  contract: Contract;
  events: string[];
}

const HANDLERS: Record<string, (log: EventLog) => void> = {
  AssetMinted(log) {
    const [tokenId, creator, tokenURI] = log.args;
    store.setNFT({ tokenId: Number(tokenId), tokenURI, creator } as NFTRecord);
  },

  AssetListed(log) {
    const [tokenId, price, seller] = log.args;
    const nft = store.getNFT(Number(tokenId));
    store.setListing({
      tokenId: Number(tokenId),
      price,
      seller,
      tokenURI: nft?.tokenURI ?? '',
      creator: nft?.creator ?? seller,
    });
  },

  AssetSold(log) {
    store.deleteListing(Number(log.args[0]));
  },

  ListingCancelled(log) {
    store.deleteListing(Number(log.args[0]));
  },

  OfferMade(log) {
    const [tokenId, buyer, price, expiresAt] = log.args;
    store.setOffer({
      tokenId: Number(tokenId),
      buyer,
      price,
      expiresAt: Number(expiresAt),
    });
  },

  OfferAccepted(log) {
    store.deleteOffer(Number(log.args[0]), log.args[1]);
  },

  OfferCancelled(log) {
    store.deleteOffer(Number(log.args[0]), log.args[1]);
  },
};

export async function startScanner(provider: Provider, watched: WatchedContract[]) {
  const chainId = Number((await provider.getNetwork()).chainId);

  const latestBlock = await provider.getBlockNumber();
  const fromBlock = store.lastBlock > 0 ? store.lastBlock + 1 : Math.max(0, latestBlock - 1000);
  console.log(`[scanner] 同步区块 ${fromBlock} → ${latestBlock} (chainId: ${chainId})`);

  await replayEvents(watched, fromBlock, latestBlock);

  store.setLastBlock(latestBlock);
  console.log(`[scanner] 历史同步完成, 已处理到块 ${latestBlock}`);

  provider.on('block', async (blockNumber: number) => {
    try {
      await replayEvents(watched, blockNumber, blockNumber);
      store.setLastBlock(blockNumber);

      if (blockNumber % 60 === 0) {
        const pruned = store.pruneExpiredOffers(Math.floor(Date.now() / 1000));
        if (pruned > 0) console.log(`[scanner] 清理 ${pruned} 条过期出价`);
      }
    } catch (err) {
      console.error(`[scanner] 处理块 ${blockNumber} 出错:`, err);
    }
  });

  console.log('[scanner] 已订阅新区块事件');
}

async function replayEvents(watched: WatchedContract[], fromBlock: number, toBlock: number) {
  const allLogs = await Promise.all(
    watched.map(w => queryEvents(w.contract, w.events, fromBlock, toBlock))
  );
  for (const logs of allLogs) {
    for (const log of logs) _handleEvent(log);
  }
}

async function queryEvents(
  contract: Contract,
  eventNames: string[],
  fromBlock: number,
  toBlock: number,
): Promise<EventLog[]> {
  if (fromBlock > toBlock) return [];

  const results = await Promise.all(
    eventNames.map(name =>
      contract.queryFilter(name, fromBlock, toBlock).catch(() => [])
    )
  );
  return results.flat() as EventLog[];
}

export function _handleEvent(log: EventLog) {
  if (!log.eventName) return;
  HANDLERS[log.eventName]?.(log);
}
