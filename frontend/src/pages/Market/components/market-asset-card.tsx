import { ExternalLinkIcon, MoreHorizontalIcon, ShieldCheckIcon, ShoppingCartIcon, TagIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { MarketAsset } from '@/types/market';

interface MarketAssetCardProps {
  asset: MarketAsset;
  isPending?: boolean;
  onBuy: (assetId: string) => Promise<void>;
  onOffer: (assetId: string, price: number) => Promise<void>;
}

const categoryLabel: Record<MarketAsset['category'], string> = {
  art: '数字艺术',
  photo: '摄影作品',
  music: '音乐资产',
  collectible: '数字藏品',
  document: '文档凭证',
};

function shortenAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function MarketAssetCard({ asset, isPending = false, onBuy, onOffer }: MarketAssetCardProps) {
  const suggestedOffer = Math.max(asset.price * 0.95, 0.01);

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        <img
          src={asset.imageUrl}
          alt={asset.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm backdrop-blur">
          {categoryLabel[asset.category]}
        </div>
        <div className="absolute right-3 top-3 rounded-full bg-purple-600 px-3 py-1 text-xs font-medium text-white shadow-sm">
          {asset.chain}
        </div>
      </div>

      <CardHeader className="space-y-2 p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate text-lg">{asset.title}</CardTitle>
            <p className="mt-1 font-mono text-xs text-slate-400">{asset.tokenId}</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="打开资产操作菜单">
                <MoreHorizontalIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <ExternalLinkIcon className="mr-2 size-4" />
                查看链上记录
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ShieldCheckIcon className="mr-2 size-4" />
                验证 IPFS CID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>复制 Token ID</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <p className="line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{asset.description}</p>

        <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm">
          <div className="min-w-0">
            <p className="text-xs text-slate-500">创作者</p>
            <p className="mt-1 truncate font-mono text-xs font-medium text-slate-800">
              {shortenAddress(asset.creator)}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500">当前持有者</p>
            <p className="mt-1 truncate font-mono text-xs font-medium text-slate-800">
              {shortenAddress(asset.owner)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-slate-500">一口价</p>
            <p className="mt-1 truncate text-xl font-bold text-purple-600">
              {asset.price} <span className="text-sm font-medium">{asset.currency}</span>
            </p>
          </div>
          <div className="shrink-0 rounded-lg border px-3 py-2 text-right">
            <p className="text-xs text-slate-500">版税</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{asset.royaltyRate}%</p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
          <div className="flex h-10 items-start gap-2 overflow-hidden text-xs leading-5 text-slate-500">
            <TagIcon className="mt-0.5 size-4 shrink-0 text-slate-400" />
            <span className="line-clamp-2 break-all" title={`IPFS CID：${asset.ipfsCid}`}>
              IPFS CID：{asset.ipfsCid}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="mt-auto grid grid-cols-2 gap-3 p-4 pt-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button type="button" disabled={isPending} className="gap-2">
              <ShoppingCartIcon className="size-4" />
              购买
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>确认购买资产</DialogTitle>
              <DialogDescription>
                本次操作会调用市场合约购买 {asset.title}，成交后版税将按 {asset.royaltyRate}% 自动分配给创作者。
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg bg-slate-50 p-4 text-sm">
              <div className="flex justify-between gap-4 py-1">
                <span className="text-slate-500">资产编号</span>
                <span className="font-mono">{asset.tokenId}</span>
              </div>
              <div className="flex justify-between gap-4 py-1">
                <span className="text-slate-500">支付金额</span>
                <span className="font-semibold text-purple-600">
                  {asset.price} {asset.currency}
                </span>
              </div>
              <div className="flex justify-between gap-4 py-1">
                <span className="text-slate-500">合约地址</span>
                <span className="font-mono">{shortenAddress(asset.contractAddress)}</span>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">取消</Button>
              </DialogClose>
              <Button type="button" disabled={isPending} onClick={() => void onBuy(asset.id)}>
                确认购买
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => void onOffer(asset.id, Number(suggestedOffer.toFixed(3)))}
        >
          出价
        </Button>
      </CardFooter>
    </Card>
  );
}
