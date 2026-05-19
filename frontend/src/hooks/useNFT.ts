import { useCallback, useMemo } from 'react';
import { Contract } from 'ethers';
import { useWalletStore } from '../store/wallet';
import { NFT_ADDRESS } from '../config/contract';
import DigitalAssetNFTABI from '../abis/DigitalAssetNFT.json';

/**
 * useNFT — DigitalAssetNFT 合约交互（铸造 + 查询）
 */
function assertABI(name: string, abi: readonly unknown[]): asserts abi is readonly object[] {
  if (abi.length === 0) throw new Error(`${name}: ABI 为空 — 请先运行 npm run deploy`);
}

export function useNFT() {
  assertABI("DigitalAssetNFT", DigitalAssetNFTABI.abi);
  const { provider, signer } = useWalletStore();

  const readContract = useMemo(() => {
    if (!provider) return null;
    return new Contract(NFT_ADDRESS, DigitalAssetNFTABI.abi, provider);
  }, [provider]);

  const writeContract = useMemo(() => {
    if (!signer) return null;
    return new Contract(NFT_ADDRESS, DigitalAssetNFTABI.abi, signer);
  }, [signer]);

  const mintAsset = useCallback(async (
    to: string,
    tokenURI: string,
    royaltyBps: number,
  ) => {
    if (!writeContract) throw new Error("请先连接钱包");
    const tx = await writeContract.mintAsset(to, tokenURI, royaltyBps);
    return await tx.wait();
  }, [writeContract]);

  const getTokenURI = useCallback(async (tokenId: number): Promise<string> => {
    if (!readContract) throw new Error("请先连接钱包");
    return await readContract.tokenURI(tokenId);
  }, [readContract]);

  const getOwnerOf = useCallback(async (tokenId: number): Promise<string> => {
    if (!readContract) throw new Error("请先连接钱包");
    return await readContract.ownerOf(tokenId);
  }, [readContract]);

  const getRoyaltyInfo = useCallback(async (
    tokenId: number,
    salePrice: bigint,
  ): Promise<{ receiver: string; amount: bigint }> => {
    if (!readContract) throw new Error("请先连接钱包");
    const [receiver, amount] = await readContract.royaltyInfo(tokenId, salePrice);
    return { receiver, amount };
  }, [readContract]);

  const getTotalMinted = useCallback(async (): Promise<bigint> => {
    if (!readContract) throw new Error("请先连接钱包");
    return await readContract.totalMinted();
  }, [readContract]);

  return {
    readContract,
    writeContract,
    mintAsset,
    getTokenURI,
    getOwnerOf,
    getRoyaltyInfo,
    getTotalMinted,
  };
}
