import { useCallback, useState } from "react";

import { FIXED_PRICE_ADDRESS, NFT_ADDRESS } from "@/config/contract";
import { LOCAL_CHAIN_ID, LOCAL_CHAIN_ID_HEX } from "@/store/wallet";

type NetworkCheckReason =
  | "OK"
  | "NO_METAMASK"
  | "WRONG_CHAIN"
  | "NFT_CONTRACT_MISSING"
  | "MARKET_CONTRACT_MISSING"
  | "RPC_ERROR";

export type NetworkCheckResult = {
  ok: boolean;
  reason: NetworkCheckReason;
  message: string;
  chainId?: number;
  chainIdHex?: string;
  contracts?: {
    nft: boolean;
    market: boolean;
  };
};

function toHexString(value: unknown) {
  return typeof value === "string" ? value.toLowerCase() : "";
}

function hasContractCode(value: unknown) {
  return typeof value === "string" && value !== "0x";
}

export function useNetworkCheck() {
  const [result, setResult] = useState<NetworkCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkNetwork = useCallback(async () => {
    setIsChecking(true);

    try {
      const ethereum = window.ethereum;

      if (!ethereum?.isMetaMask) {
        const next: NetworkCheckResult = {
          ok: false,
          reason: "NO_METAMASK",
          message: "请先安装 MetaMask",
        };
        setResult(next);
        return next;
      }

      const chainIdHex = toHexString(
        await ethereum.request({ method: "eth_chainId" }),
      );

      if (chainIdHex !== LOCAL_CHAIN_ID_HEX) {
        const next: NetworkCheckResult = {
          ok: false,
          reason: "WRONG_CHAIN",
          message: `当前不是本地链，请切换到 Chain ID ${LOCAL_CHAIN_ID}`,
          chainId: Number.parseInt(chainIdHex, 16),
          chainIdHex,
        };
        setResult(next);
        return next;
      }

      const [nftCode, marketCode] = await Promise.all([
        ethereum.request({
          method: "eth_getCode",
          params: [NFT_ADDRESS, "latest"],
        }),
        ethereum.request({
          method: "eth_getCode",
          params: [FIXED_PRICE_ADDRESS, "latest"],
        }),
      ]);

      const hasNftContract = hasContractCode(nftCode);
      const hasMarketContract = hasContractCode(marketCode);

      if (!hasNftContract) {
        const next: NetworkCheckResult = {
          ok: false,
          reason: "NFT_CONTRACT_MISSING",
          message: "当前网络未部署 NFT 合约，请重新 deploy/sync",
          chainId: LOCAL_CHAIN_ID,
          chainIdHex,
          contracts: {
            nft: false,
            market: hasMarketContract,
          },
        };
        setResult(next);
        return next;
      }

      if (!hasMarketContract) {
        const next: NetworkCheckResult = {
          ok: false,
          reason: "MARKET_CONTRACT_MISSING",
          message: "当前网络未部署市场合约，请重新 deploy/sync",
          chainId: LOCAL_CHAIN_ID,
          chainIdHex,
          contracts: {
            nft: true,
            market: false,
          },
        };
        setResult(next);
        return next;
      }

      const next: NetworkCheckResult = {
        ok: true,
        reason: "OK",
        message: "网络和合约状态正常",
        chainId: LOCAL_CHAIN_ID,
        chainIdHex,
        contracts: {
          nft: true,
          market: true,
        },
      };
      setResult(next);
      return next;
    } catch (error) {
      const next: NetworkCheckResult = {
        ok: false,
        reason: "RPC_ERROR",
        message: error instanceof Error ? error.message : "网络检测失败",
      };
      setResult(next);
      return next;
    } finally {
      setIsChecking(false);
    }
  }, []);

  return {
    result,
    isChecking,
    checkNetwork,
  };
}
