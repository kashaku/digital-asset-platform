import { useCallback, useMemo } from 'react';
import { Contract, ethers } from 'ethers';
import { useWalletStore } from '../store/wallet';
import { FIXED_PRICE_ADDRESS } from '../config/contract';
import FixedPriceMarketABI from '../abis/FixedPriceMarket.json';

/**
 * useMarket — FixedPriceMarket 合约交互（上架 / 购买 / 取消上架 / 查询）
 */
function assertABI(name: string, abi: readonly unknown[]): asserts abi is readonly object[] {
  if (abi.length === 0) throw new Error(`${name}: ABI 为空 — 请先运行 npm run deploy`);
}

export function useMarket() {
  assertABI("FixedPriceMarket", FixedPriceMarketABI.abi);
  const { provider, signer } = useWalletStore();

  const readContract = useMemo(() => {
    if (!provider) return null;
    return new Contract(FIXED_PRICE_ADDRESS, FixedPriceMarketABI.abi, provider);
  }, [provider]);

  const writeContract = useMemo(() => {
    if (!signer) return null;
    return new Contract(FIXED_PRICE_ADDRESS, FixedPriceMarketABI.abi, signer);
  }, [signer]);

  const listForSale = useCallback(async (tokenId: number, price: string) => {
    if (!writeContract) throw new Error("请先连接钱包");

    const approveTx = await writeContract.approve(FIXED_PRICE_ADDRESS, tokenId);
    await approveTx.wait();

    const priceWei = ethers.parseEther(price);
    const tx = await writeContract.listForSale(tokenId, priceWei);
    return await tx.wait();
  }, [writeContract]);

  const buyAsset = useCallback(async (tokenId: number, price: string) => {
    if (!writeContract) throw new Error("请先连接钱包");
    const priceWei = ethers.parseEther(price);
    const tx = await writeContract.buyAsset(tokenId, { value: priceWei });
    return await tx.wait();
  }, [writeContract]);

  const cancelListing = useCallback(async (tokenId: number) => {
    if (!writeContract) throw new Error("请先连接钱包");
    const tx = await writeContract.cancelListing(tokenId);
    return await tx.wait();
  }, [writeContract]);

  const getListing = useCallback(async (tokenId: number): Promise<{ price: bigint; seller: string }> => {
    if (!readContract) throw new Error("请先连接钱包");
    const listing = await readContract.listings(tokenId);
    return { price: listing.price, seller: listing.seller };
  }, [readContract]);

  return {
    readContract,
    writeContract,
    listForSale,
    buyAsset,
    cancelListing,
    getListing,
  };
}
