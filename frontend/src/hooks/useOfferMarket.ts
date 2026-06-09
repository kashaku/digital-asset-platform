import { useCallback, useMemo } from "react";
import { Contract, ethers } from "ethers";

import DigitalAssetNFTABI from "@/abis/DigitalAssetNFT.json";
import { NFT_ADDRESS, OFFER_ADDRESS } from "@/config/contract";
import { useWalletStore } from "@/store/wallet";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const offerMarketAddress = OFFER_ADDRESS as string;

const OFFER_MARKET_ABI = [
  "function makeOffer(uint256 tokenId,uint256 price,uint256 expiresAt) payable",
  "function acceptOffer(uint256 tokenId,address buyer)",
  "function rejectOffer(uint256 tokenId,address buyer)",
  "function cancelOffer(uint256 tokenId)",
  "function cancelStaleOffers(uint256 tokenId)",
] as const;

function assertOfferMarketAddress() {
  if (!offerMarketAddress || offerMarketAddress === ZERO_ADDRESS) {
    throw new Error("OfferMarket 尚未部署，请重新运行合约 deploy 并同步配置。");
  }
}

export function useOfferMarket() {
  const { signer } = useWalletStore();

  const offerContract = useMemo(() => {
    if (!signer || !offerMarketAddress || offerMarketAddress === ZERO_ADDRESS) {
      return null;
    }

    return new Contract(offerMarketAddress, OFFER_MARKET_ABI, signer);
  }, [signer]);

  const nftContract = useMemo(() => {
    if (!signer) return null;
    return new Contract(NFT_ADDRESS, DigitalAssetNFTABI.abi, signer);
  }, [signer]);

  const makeOffer = useCallback(
    async (tokenId: number, price: string, durationSeconds = 7 * 24 * 60 * 60) => {
      assertOfferMarketAddress();

      if (!offerContract) {
        throw new Error("请先连接钱包");
      }

      const amount = ethers.parseEther(price);
      const expiresAt = Math.floor(Date.now() / 1000) + durationSeconds;
      const tx = await offerContract.makeOffer(tokenId, amount, expiresAt, {
        value: amount,
      });
      return await tx.wait();
    },
    [offerContract],
  );

  const acceptOffer = useCallback(
    async (tokenId: number, buyer: string) => {
      assertOfferMarketAddress();

      if (!offerContract || !nftContract) {
        throw new Error("请先连接钱包");
      }

      const approveTx = await nftContract.approve(offerMarketAddress, tokenId);
      await approveTx.wait();

      const tx = await offerContract.acceptOffer(tokenId, buyer);
      return await tx.wait();
    },
    [nftContract, offerContract],
  );

  const cancelOffer = useCallback(
    async (tokenId: number) => {
      assertOfferMarketAddress();

      if (!offerContract) {
        throw new Error("请先连接钱包");
      }

      const tx = await offerContract.cancelOffer(tokenId);
      return await tx.wait();
    },
    [offerContract],
  );

  const rejectOffer = useCallback(
    async (tokenId: number, buyer: string) => {
      assertOfferMarketAddress();

      if (!offerContract) {
        throw new Error("请先连接钱包");
      }

      const tx = await offerContract.rejectOffer(tokenId, buyer);
      return await tx.wait();
    },
    [offerContract],
  );

  const cancelStaleOffers = useCallback(
    async (tokenId: number) => {
      assertOfferMarketAddress();

      if (!offerContract) {
        throw new Error("请先连接钱包");
      }

      const tx = await offerContract.cancelStaleOffers(tokenId);
      return await tx.wait();
    },
    [offerContract],
  );

  return {
    offerContract,
    makeOffer,
    acceptOffer,
    rejectOffer,
    cancelOffer,
    cancelStaleOffers,
  };
}
