import { useMemo, useState } from "react";

import {
  uploadMediaToIpfs,
  uploadMetadataToIpfs,
} from "@/services/ipfs-api";
import { useNFT } from "@/hooks/useNFT";
import { useWalletStore } from "@/store/wallet";
import type { MintAssetForm, MintStep } from "@/types/mint";

const DEFAULT_FORM: MintAssetForm = {
  file: null,
  name: "",
  description: "",
  category: "image",
  royaltyBps: 500,
};

export function useMintAsset() {
  const [form, setForm] = useState<MintAssetForm>(DEFAULT_FORM);
  const [step, setStep] = useState<MintStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [tokenURI, setTokenURI] = useState("");
  const [mediaCid, setMediaCid] = useState("");
  const walletAddress = useWalletStore((state) => state.address);
  const { mintAsset } = useNFT();

  const progress = useMemo(() => {
    if (step === "uploading-media") return 35;
    if (step === "uploading-metadata") return 65;
    if (step === "waiting-signature") return 85;
    if (step === "confirmed") return 100;
    return 0;
  }, [step]);

  const updateForm = (partial: Partial<MintAssetForm>) => {
    setForm((current) => ({
      ...current,
      ...partial,
    }));
  };

  const reset = () => {
    setForm(DEFAULT_FORM);
    setStep("idle");
    setError(null);
    setTokenURI("");
    setMediaCid("");
  };

  const submitMint = async () => {
    setError(null);

    if (!form.file) {
      setError("请先选择要上传的资产文件。");
      return;
    }

    if (!form.name.trim()) {
      setError("请填写资产名称。");
      return;
    }

    if (form.royaltyBps < 0 || form.royaltyBps > 1000) {
      setError("版税比例应控制在 0% 到 10% 之间。");
      return;
    }

    try {
      setStep("uploading-media");
      const media = await uploadMediaToIpfs(form.file);
      setMediaCid(media.cid);

      setStep("uploading-metadata");
      const metadata = await uploadMetadataToIpfs(form, media);
      setTokenURI(metadata.tokenURI);

      /**
       * 接口文档要求铸造 NFT 是链上写操作。
       * 后续应接入 services/web3/assetContract.ts 中的 mintAsset(params)，
       * 并通过 MetaMask 完成签名。
       */
      if (!walletAddress) {
        throw new Error("请先连接钱包后再铸造资产。");
      }

      setStep("waiting-signature");
      await mintAsset(walletAddress, metadata.tokenURI, form.royaltyBps);
      setStep("confirmed");
    } catch (err) {
      setStep("failed");
      setError(err instanceof Error ? err.message : "资产铸造流程执行失败。");
    }
  };

  return {
    form,
    step,
    error,
    progress,
    tokenURI,
    mediaCid,
    updateForm,
    submitMint,
    reset,
  };
}
