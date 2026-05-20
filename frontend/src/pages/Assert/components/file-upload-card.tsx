import { CloudUploadIcon } from "lucide-react";
import type { ChangeEvent } from "react";

import { Input } from "@/components/ui/input";
import type { MintAssetForm } from "@/types/mint";

type FileUploadCardProps = {
  file: MintAssetForm["file"];
  onFileChange: (file: File | null) => void;
};

export function FileUploadCard({ file, onFileChange }: FileUploadCardProps) {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFileChange(event.target.files?.[0] ?? null);
  };

  return (
    <section>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        上传原始文件
        <span className="ml-1 font-normal text-slate-400">
          （将分布式存储于 IPFS）
        </span>
        <span className="ml-1 text-red-500">*</span>
      </label>

      <label className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center transition hover:border-purple-500 hover:bg-purple-50">
        <CloudUploadIcon className="mb-3 size-11 text-slate-400 transition group-hover:text-purple-500" />

        <span className="text-sm font-medium text-slate-600">
          点击或拖拽文件到此处上传
        </span>

        <span className="mt-2 text-xs leading-5 text-slate-400">
          支持 JPG、PNG、GIF、MP4 或 PDF，建议不超过 50MB
          <br />
          文件将经过哈希处理生成唯一 CID
        </span>

        <Input className="hidden" type="file" onChange={handleFileChange} />
      </label>

      {file ? (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          已选择：{file.name}（{(file.size / 1024 / 1024).toFixed(2)} MB）
        </div>
      ) : null}
    </section>
  );
}
