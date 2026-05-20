import type { FormEvent } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileUploadCard } from "@/pages/Assert/components/file-upload-card";
import { MintBasicForm } from "@/pages/Assert/components/mint-basic-form";
import { MintSubmitCard } from "@/pages/Assert/components/mint-submit-card";
import { RoyaltyConfigCard } from "@/pages/Assert/components/royalty-config-card";
import { useMintAsset } from "@/hooks/useMintAsset";
import HeadBar from "@/components/head-bar.tsx";

export default function AssertPage() {
  const {
    form,
    step,
    error,
    progress,
    tokenURI,
    mediaCid,
    updateForm,
    submitMint,
    reset,
  } = useMintAsset();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitMint();
  };

  return (
            <div className="min-h-screen bg-slate-50">
      <HeadBar />
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-10 2xl:px-14">
      <section className="mx-auto w-full max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            铸造新的数字资产
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            将您的创作上传至 IPFS，并通过以太坊兼容智能合约进行永久确权。
          </p>
        </div>

        <form
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8"
          onSubmit={handleSubmit}
        >
          <FileUploadCard
            file={form.file}
            onFileChange={(file) => updateForm({ file })}
          />

          <MintBasicForm form={form} onChange={updateForm} />

          <RoyaltyConfigCard
            royaltyBps={form.royaltyBps}
            onChange={(royaltyBps) => updateForm({ royaltyBps })}
          />

          <MintSubmitCard
            error={error}
            mediaCid={mediaCid}
            progress={progress}
            step={step}
            tokenURI={tokenURI}
            onReset={reset}
            onSubmit={submitMint}
          />

          {step === "confirmed" ? (
            <Alert>
              <AlertTitle>资产数据准备完成</AlertTitle>
              <AlertDescription>
                当前已获得 Token URI。后续接入 MetaMask 后，可调用
                mintAsset 完成链上铸造。
              </AlertDescription>
            </Alert>
          ) : null}
        </form>
      </section>
    </main>
   </div>
  );
}
