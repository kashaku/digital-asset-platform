import { useCallback, useMemo } from 'react';
import { Contract, ethers } from 'ethers';
import { useWalletStore } from '../store/wallet';
import { CONTRACT_ADDRESS } from '../config/contract';
import DigitalAssetNFTABI from '../abis/DigitalAssetNFT.json';

/**
 * useNFTContract — 封装与 DigitalAssetNFT 智能合约交互的 React Hook。
 *
 * 提供铸造、上架、购买、取消上架、查询等操作。
 * 内部自动从 wallet store 获取 provider/signer。
 */
export function useNFTContract() {
  const { provider, signer } = useWalletStore();

  /** 只读合约实例（使用 provider） */
  const readContract = useMemo(() => {
    if (!provider) return null;
    return new Contract(CONTRACT_ADDRESS, DigitalAssetNFTABI.abi, provider);
  }, [provider]);

  /** 可写合约实例（使用 signer） */
  const writeContract = useMemo(() => {
    if (!signer) return null;
    return new Contract(CONTRACT_ADDRESS, DigitalAssetNFTABI.abi, signer);
  }, [signer]);

  /**
   * 铸造新的数字资产 NFT
   * @param to         接收者地址
   * @param tokenURI   IPFS 元数据 URI
   * @param royaltyBps 版税比例（基点，500 = 5%）
   */
  const mintAsset = useCallback(async (
    to: string,
    tokenURI: string,
    royaltyBps: number
  ) => {
    if (!writeContract) throw new Error("请先连接钱包");
    const tx = await writeContract.mintAsset(to, tokenURI, royaltyBps);
    const receipt = await tx.wait();
    return receipt;
  }, [writeContract]);

  /**
   * 将 NFT 上架出售
   * @param tokenId 要上架的 tokenId
   * @param price   出售价格（单位: ETH 字符串，如 "1.5"）
   */
  const listForSale = useCallback(async (tokenId: number, price: string) => {
    if (!writeContract) throw new Error("请先连接钱包");

    // 先授权合约转移此 NFT
    const approveTx = await writeContract.approve(CONTRACT_ADDRESS, tokenId);
    await approveTx.wait();

    // 上架
    const priceWei = ethers.parseEther(price);
    const tx = await writeContract.listForSale(tokenId, priceWei);
    const receipt = await tx.wait();
    return receipt;
  }, [writeContract]);

  /**
   * 购买已上架的 NFT
   * @param tokenId 要购买的 tokenId
   * @param price   上架价格（单位: ETH 字符串）
   */
  const buyAsset = useCallback(async (tokenId: number, price: string) => {
    if (!writeContract) throw new Error("请先连接钱包");
    const priceWei = ethers.parseEther(price);
    const tx = await writeContract.buyAsset(tokenId, { value: priceWei });
    const receipt = await tx.wait();
    return receipt;
  }, [writeContract]);

  /**
   * 取消 NFT 的上架
   * @param tokenId 要下架的 tokenId
   */
  const cancelListing = useCallback(async (tokenId: number) => {
    if (!writeContract) throw new Error("请先连接钱包");
    const tx = await writeContract.cancelListing(tokenId);
    const receipt = await tx.wait();
    return receipt;
  }, [writeContract]);

  /**
   * 查询 NFT 的 tokenURI（元数据地址）
   * @param tokenId tokenId
   */
  const getTokenURI = useCallback(async (tokenId: number): Promise<string> => {
    if (!readContract) throw new Error("请先连接钱包");
    return await readContract.tokenURI(tokenId);
  }, [readContract]);

  /**
   * 查询 NFT 的上架信息
   * @param tokenId tokenId
   */
  const getListing = useCallback(async (tokenId: number): Promise<{ price: bigint; seller: string }> => {
    if (!readContract) throw new Error("请先连接钱包");
    const [price, seller] = await readContract.getListing(tokenId);
    return { price, seller };
  }, [readContract]);

  /**
   * 查询 NFT 的版税信息
   * @param tokenId   tokenId
   * @param salePrice 假设售价（单位: wei）
   */
  const getRoyaltyInfo = useCallback(async (
    tokenId: number,
    salePrice: bigint
  ): Promise<{ receiver: string; amount: bigint }> => {
    if (!readContract) throw new Error("请先连接钱包");
    const [receiver, amount] = await readContract.royaltyInfo(tokenId, salePrice);
    return { receiver, amount };
  }, [readContract]);

  /**
   * 查询已铸造的 NFT 总数
   */
  const getTotalMinted = useCallback(async (): Promise<bigint> => {
    if (!readContract) throw new Error("请先连接钱包");
    return await readContract.totalMinted();
  }, [readContract]);

  /**
   * 查询 NFT 的所有者
   * @param tokenId tokenId
   */
  const getOwnerOf = useCallback(async (tokenId: number): Promise<string> => {
    if (!readContract) throw new Error("请先连接钱包");
    return await readContract.ownerOf(tokenId);
  }, [readContract]);

  return {
    // 合约实例
    readContract,
    writeContract,
    // 写操作
    mintAsset,
    listForSale,
    buyAsset,
    cancelListing,
    // 读操作
    getTokenURI,
    getListing,
    getRoyaltyInfo,
    getTotalMinted,
    getOwnerOf,
  };
}
