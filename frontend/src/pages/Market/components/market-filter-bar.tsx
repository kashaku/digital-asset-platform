import { SearchIcon, SlidersHorizontalIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MarketAssetCategory, MarketSort } from "@/types/market";

interface MarketFilterBarProps {
  keyword: string;
  category: MarketAssetCategory;
  sort: MarketSort;
  onKeywordChange: (keyword: string) => void;
  onCategoryChange: (category: MarketAssetCategory) => void;
  onSortChange: (sort: MarketSort) => void;
  onReset: () => void;
}

const categoryOptions: Array<{ label: string; value: MarketAssetCategory }> = [
  { label: "全部分类", value: "all" },
  { label: "数字艺术", value: "art" },
  { label: "摄影作品", value: "photo" },
  { label: "音乐资产", value: "music" },
  { label: "数字藏品", value: "collectible" },
  { label: "文档凭证", value: "document" },
];

const sortOptions: Array<{ label: string; value: MarketSort }> = [
  { label: "最新上架", value: "latest" },
  { label: "价格从低到高", value: "price-asc" },
  { label: "价格从高到低", value: "price-desc" },
  { label: "版税比例优先", value: "royalty-desc" },
];

export function MarketFilterBar({
  keyword,
  category,
  sort,
  onKeywordChange,
  onCategoryChange,
  onSortChange,
  onReset,
}: MarketFilterBarProps) {
  return (
    <Card>
      <CardContent className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_180px_180px_auto] md:items-center">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
            placeholder="搜索资产名称、Token ID、创作者地址"
            className="pl-9"
          />
        </div>

        <Select
          value={category}
          onValueChange={(value) => onCategoryChange(value as MarketAssetCategory)}
        >
          <SelectTrigger>
            <SelectValue placeholder="选择分类" />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sort}
          onValueChange={(value) => onSortChange(value as MarketSort)}
        >
          <SelectTrigger>
            <SelectValue placeholder="排序方式" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button type="button" variant="outline" onClick={onReset} className="gap-2">
          <SlidersHorizontalIcon className="size-4" />
          重置
        </Button>
      </CardContent>
    </Card>
  );
}
