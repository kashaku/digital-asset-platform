import { useState, type FormEvent } from "react";
import { ExternalLinkIcon, Loader2Icon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useMarket } from "@/hooks/useMarket";
import type { ProfileAsset } from "@/types/profile";

type ProfileAssetCardProps = {
  asset: ProfileAsset;
};

export function ProfileAssetCard({ asset }: ProfileAssetCardProps) {
  const market = useMarket();
  const [price, setPrice] = useState("");
  const [isListed, setIsListed] = useState(asset.isListed);
  const [listedPrice, setListedPrice] = useState(asset.price);
  const [isListing, setIsListing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleListForSale = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const normalizedPrice = price.trim();
    if (!normalizedPrice || Number(normalizedPrice) <= 0) {
      setError("请输入有效的上架价格。");
      return;
    }

    try {
      setIsListing(true);
      await market.listForSale(Number(asset.tokenId), normalizedPrice);
      setIsListed(true);
      setListedPrice(`${normalizedPrice} ETH`);
      setPrice("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "上架资产失败");
    } finally {
      setIsListing(false);
    }
  };

  return (
    <Card className="flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border-slate-200 bg-white shadow-sm transition hover:border-purple-300 hover:shadow-lg">
      <div className="aspect-square overflow-hidden bg-slate-100">
        <img
          alt={asset.title}
          className="h-full w-full object-cover transition duration-500 hover:scale-110"
          src={asset.imageUrl}
        />
      </div>

      <CardContent className="flex-1 p-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="truncate text-lg font-bold text-slate-950">
            {asset.title}
          </h3>

          <span className="font-mono text-xs text-slate-400">
            #{asset.tokenId}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="rounded border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
            {isListed ? "已上架" : "所有者"}
          </span>

          {listedPrice ? (
            <span className="text-sm font-bold text-purple-600">
              {listedPrice}
            </span>
          ) : null}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Dialog>
          <DialogTrigger asChild>
            <Button
              className="w-full border-purple-500 text-purple-600 hover:bg-purple-600 hover:text-white"
              disabled={isListing}
              size="sm"
              type="button"
              variant="outline"
            >
              {isListed ? "管理 / 出售" : "上架资产"}
              <ExternalLinkIcon className="size-4" />
            </Button>
          </DialogTrigger>

          <DialogContent>
            <form onSubmit={handleListForSale}>
              <DialogHeader>
                <DialogTitle>上架资产</DialogTitle>
                <DialogDescription>
                  设置 Token #{asset.tokenId} 的一口价，确认后会先授权 NFT，再调用市场合约上架。
                </DialogDescription>
              </DialogHeader>

              <div className="my-4 space-y-3">
                <Input
                  min="0"
                  placeholder="输入价格，例如 0.1"
                  step="0.000000000000000001"
                  type="number"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                />

                {error ? (
                  <Alert variant="destructive">
                    <AlertTitle>上架失败</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}
              </div>

              <DialogFooter>
                <Button disabled={isListing} type="submit">
                  {isListing ? <Loader2Icon className="size-4 animate-spin" /> : null}
                  确认上架
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
