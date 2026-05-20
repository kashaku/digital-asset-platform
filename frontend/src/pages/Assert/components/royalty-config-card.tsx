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

type RoyaltyConfigCardProps = {
  royaltyBps: number;
  onChange: (royaltyBps: number) => void;
};

export function RoyaltyConfigCard({
  royaltyBps,
  onChange,
}: RoyaltyConfigCardProps) {
  const handleRoyaltyChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value);
    onChange(Number.isNaN(value) ? 0 : Math.round(value * 100));
  };

  return (
    <section className="grid gap-6 border-t border-slate-100 pt-4 md:grid-cols-2">
      <div className="grid gap-2">
        <Label className="font-bold text-slate-700" htmlFor="royalty-rate">
          创作者版税比例（%）
        </Label>

        <div className="relative">
          <Input
            id="royalty-rate"
            max={10}
            min={0}
            step={0.5}
            type="number"
            value={royaltyBps / 100}
            onChange={handleRoyaltyChange}
          />

          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
            %
          </span>
        </div>

        <p className="text-xs leading-5 text-slate-500">
          智能合约将在每次二次交易时按此比例向创作者分配版税。
        </p>
      </div>

      <div className="grid gap-2">
        <Label className="font-bold text-slate-700">选择部署网络</Label>

        <Select disabled value="polygon">
          <SelectTrigger className="bg-slate-100 text-slate-500">
            <SelectValue placeholder="Polygon" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="polygon">Polygon（推荐，较低 Gas）</SelectItem>
            <SelectItem value="ethereum">Ethereum（主网）</SelectItem>
          </SelectContent>
        </Select>

        <p className="text-xs leading-5 text-slate-500">
          当前演示以 Polygon 网络为默认部署环境。
        </p>
      </div>
    </section>
  );
}
