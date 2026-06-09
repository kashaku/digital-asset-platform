import { SearchXIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface MarketEmptyStateProps {
  onReset: () => void;
}

export function MarketEmptyState({ onReset }: MarketEmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex min-h-72 flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          <SearchXIcon className="size-7" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-950">没有找到匹配的资产</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            当前筛选条件下没有可展示的已上架资产。刚铸造的 NFT 需要先到个人中心上架，之后才会出现在市场中。
          </p>
        </div>
        <Button type="button" variant="outline" onClick={onReset}>
          清空筛选条件
        </Button>
      </CardContent>
    </Card>
  );
}
