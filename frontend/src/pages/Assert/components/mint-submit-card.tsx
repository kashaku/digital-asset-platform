import { CheckCircle2Icon, HammerIcon, Loader2Icon, RotateCcwIcon } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { MintStep } from "@/types/mint";

type MintSubmitCardProps = {
  step: MintStep;
  progress: number;
  error: string | null;
  mediaCid: string;
  tokenURI: string;
  onSubmit: () => void;
  onReset: () => void;
};

const stepText: Record<MintStep, string> = {
  idle: "点击后将唤起 MetaMask 插件进行签名并支付少量 Gas 费用",
  "uploading-media": "正在上传媒体文件到 IPFS...",
  "uploading-metadata": "正在生成并上传 metadata.json...",
  "waiting-signature": "等待接入 MetaMask 签名...",
  confirmed: "链上铸造已完成。若想在市场展示，请前往个人中心先上架资产。",
  failed: "流程执行失败，请检查表单或网络状态",
};

export function MintSubmitCard({
  step,
  progress,
  error,
  mediaCid,
  tokenURI,
  onSubmit,
  onReset,
}: MintSubmitCardProps) {
  const isPending =
    step === "uploading-media" ||
    step === "uploading-metadata" ||
    step === "waiting-signature";

  return (
    <section className="space-y-4 pt-2">
      {progress > 0 ? <Progress value={progress} /> : null}

      {mediaCid || tokenURI ? (
        <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
          {mediaCid ? (
            <div>
              <p className="mb-1 font-semibold text-slate-700">媒体 CID</p>
              <p className="break-all">{mediaCid}</p>
            </div>
          ) : null}

          {tokenURI ? (
            <div>
              <p className="mb-1 font-semibold text-slate-700">Token URI</p>
              <p className="break-all">{tokenURI}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>铸造流程失败</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Button
        className="h-14 w-full bg-gradient-to-r from-purple-600 to-blue-600 text-base font-bold shadow-lg shadow-purple-500/25 hover:from-purple-700 hover:to-blue-700"
        disabled={isPending}
        type="button"
        onClick={onSubmit}
      >
        {isPending ? (
          <Loader2Icon className="size-5 animate-spin" />
        ) : step === "confirmed" ? (
          <CheckCircle2Icon className="size-5" />
        ) : (
          <HammerIcon className="size-5" />
        )}
        铸造数字资产（Mint）
      </Button>

      <Button
        className="w-full"
        disabled={isPending}
        type="button"
        variant="outline"
        onClick={onReset}
      >
        <RotateCcwIcon className="size-4" />
        重置表单
      </Button>

      <p className="text-center text-xs leading-5 text-slate-500">
        {stepText[step]}
      </p>
    </section>
  );
}
