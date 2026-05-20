import { CopyIcon, UserRoundIcon, WalletIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ProfileStats } from "@/types/profile";

type ProfileSummaryCardProps = {
  address?: string | null;
  displayName?: string;
  stats: ProfileStats;
};

function shortenAddress(address?: string | null) {
  if (!address) {
    return "未连接钱包";
  }

  return `${address.slice(0, 7)}...${address.slice(-4)}`;
}

export function ProfileSummaryCard({
  address,
  displayName = "未命名用户",
  stats,
}: ProfileSummaryCardProps) {
  return (
    <Card className="relative overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm">
      <div className="absolute right-0 top-0 size-64 -translate-y-20 translate-x-20 rounded-full bg-purple-100 opacity-70 blur-3xl" />

      <CardContent className="relative z-10 flex flex-col items-center gap-6 p-8 md:flex-row">
        <div className="flex size-24 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg">
          <UserRoundIcon className="size-11" />
        </div>

        <div className="text-center md:text-left">
          <h1 className="text-2xl font-extrabold text-slate-950">
            {displayName}
          </h1>

          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5">
            <span className="font-mono text-sm text-slate-600">
              {shortenAddress(address)}
            </span>

            <Button
              className="size-6 rounded-full text-slate-400 hover:text-slate-700"
              size="icon-xs"
              type="button"
              variant="ghost"
            >
              <CopyIcon className="size-3.5" />
            </Button>
          </div>
        </div>

        <div className="grid w-full gap-4 text-center sm:grid-cols-2 md:ml-auto md:w-auto">
          <div className="min-w-[120px] rounded-xl border border-slate-100 bg-slate-50 px-6 py-4">
            <p className="mb-1 text-xs font-medium text-slate-500">
              钱包资产
            </p>
            <p className="text-xl font-bold text-purple-600">
              {stats.ownedTotal}
              <span className="ml-1 text-sm font-normal">件</span>
            </p>
          </div>

          <div className="min-w-[120px] rounded-xl border border-slate-100 bg-slate-50 px-6 py-4">
            <p className="mb-1 text-xs font-medium text-slate-500">
              已创建
            </p>
            <p className="text-xl font-bold text-blue-600">
              {stats.createdTotal}
              <span className="ml-1 text-sm font-normal">件</span>
            </p>
          </div>

          <div className="min-w-[120px] rounded-xl border border-slate-100 bg-slate-50 px-6 py-4">
            <p className="mb-1 text-xs font-medium text-slate-500">
              已上架
            </p>
            <p className="text-xl font-bold text-emerald-600">
              {stats.listedTotal}
              <span className="ml-1 text-sm font-normal">件</span>
            </p>
          </div>

          <div className="min-w-[120px] rounded-xl border border-slate-100 bg-slate-50 px-6 py-4">
            <p className="mb-1 flex items-center justify-center gap-1 text-xs font-medium text-slate-500">
              <WalletIcon className="size-3.5" />
              活动记录
            </p>
            <p className="text-xl font-bold text-slate-900">
              {stats.activityTotal}
              <span className="ml-1 text-sm font-normal">条</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
