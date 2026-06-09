import type { ChangeEvent } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { MintAssetForm } from "@/types/mint";

type MintBasicFormProps = {
  form: MintAssetForm;
  onChange: (partial: Partial<MintAssetForm>) => void;
};

const categoryOptions: Array<{
  label: string;
  value: MintAssetForm["category"];
}> = [
  { label: "数字艺术", value: "art" },
  { label: "摄影作品", value: "photo" },
  { label: "音乐资产", value: "music" },
  { label: "数字藏品", value: "collectible" },
  { label: "文档凭证", value: "document" },
];

export function MintBasicForm({ form, onChange }: MintBasicFormProps) {
  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange({ name: event.target.value });
  };

  const handleDescriptionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ description: event.target.value });
  };

  const handleCategoryChange = (value: string) => {
    onChange({ category: value as MintAssetForm["category"] });
  };

  return (
    <section className="space-y-5">
      <div className="grid gap-2">
        <Label className="font-bold text-slate-700" htmlFor="asset-name">
          资产名称
          <span className="ml-1 text-red-500">*</span>
        </Label>

        <Input
          id="asset-name"
          placeholder="例如：校园秋景 #01"
          value={form.name}
          onChange={handleNameChange}
        />
      </div>

      <div className="grid gap-2">
        <Label className="font-bold text-slate-700" htmlFor="asset-description">
          描述
        </Label>

        <Textarea
          id="asset-description"
          placeholder="详细描述您的数字资产背景..."
          rows={4}
          value={form.description}
          onChange={handleDescriptionChange}
        />
      </div>

      <div className="grid gap-2">
        <Label className="font-bold text-slate-700">资产分类</Label>

        <Select value={form.category} onValueChange={handleCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="选择资产分类" />
          </SelectTrigger>

          <SelectContent>
            {categoryOptions.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}
