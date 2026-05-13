import { BarChart3Icon, CoinsIcon, ImagesIcon, UsersIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import type { MarketStats } from '@/types/market';

interface MarketStatsProps {
  stats: MarketStats;
}

const statItems = [
  { key: 'totalListed', label: '上架资产', icon: ImagesIcon, suffix: '件' },
  { key: 'floorPrice', label: '地板价', icon: CoinsIcon, suffix: ' MATIC' },
  { key: 'totalVolume', label: '展示总额', icon: BarChart3Icon, suffix: ' MATIC' },
  { key: 'creatorCount', label: '创作者', icon: UsersIcon, suffix: '人' },
] as const;

export function MarketStatsPanel({ stats }: MarketStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statItems.map((item) => {
        const Icon = item.icon;
        const value = stats[item.key];
        const text = typeof value === 'number' && item.key !== 'totalListed' && item.key !== 'creatorCount'
          ? value.toFixed(2)
          : value.toString();

        return (
          <Card key={item.key}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex size-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="text-xl font-semibold text-slate-950">
                  {text}
                  <span className="ml-1 text-sm font-normal text-slate-500">{item.suffix}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
