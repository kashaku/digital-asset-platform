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
import { useOfferMarket } from "@/hooks/useOfferMarket";
import { useWallet } from "@/hooks/useWallet";
import { fetchOffers, type OfferItem } from "@/services/indexer";
import type { ProfileAsset } from "@/types/profile";

type ProfileAssetCardProps = {
  asset: ProfileAsset;
};

function formatOfferPrice(priceWei: string) {
  try {
    return `${Number(BigInt(priceWei)) / 1e18} ETH`;
  } catch {
    return "0 ETH";
  }
}

function shortenAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ProfileAssetCard({ asset }: ProfileAssetCardProps) {
  const market = useMarket();
  const offerMarket = useOfferMarket();
  const wallet = useWallet();
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [isListed, setIsListed] = useState(asset.isListed);
  const [listedPrice, setListedPrice] = useState(asset.price);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [isListing, setIsListing] = useState(false);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);
  const [activeOffer, setActiveOffer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOwner =
    Boolean(wallet.address && asset.owner) &&
    wallet.address?.toLowerCase() === asset.owner?.toLowerCase();

  const loadOffers = async () => {
    setIsLoadingOffers(true);

    try {
      setOffers(await fetchOffers(Number(asset.tokenId)));
    } catch {
      setOffers([]);
    } finally {
      setIsLoadingOffers(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    setError(null);

    if (nextOpen) {
      void loadOffers();
    }
  };

  const removeOffer = (buyer: string) => {
    setOffers((currentOffers) =>
      currentOffers.filter(
        (offer) => offer.buyer.toLowerCase() !== buyer.toLowerCase(),
      ),
    );
  };

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

  const handleAcceptOffer = async (buyer: string) => {
    setActiveOffer(`accept:${buyer}`);
    setError(null);

    try {
      if (!isOwner) {
        throw new Error("只有当前 NFT 持有者可以接受出价。");
      }

      if (isListed) {
        await market.cancelListing(Number(asset.tokenId));
        setIsListed(false);
        setListedPrice(undefined);
      }

      await offerMarket.acceptOffer(Number(asset.tokenId), buyer);
      removeOffer(buyer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "接受出价失败");
    } finally {
      setActiveOffer(null);
    }
  };

  const handleRejectOffer = async (buyer: string) => {
    setActiveOffer(`reject:${buyer}`);
    setError(null);

    try {
      if (!isOwner) {
        throw new Error("只有当前 NFT 持有者可以回绝出价。");
      }

      await offerMarket.rejectOffer(Number(asset.tokenId), buyer);
      removeOffer(buyer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "回绝出价失败");
    } finally {
      setActiveOffer(null);
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
        <Dialog open={open} onOpenChange={handleOpenChange}>
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
                <DialogTitle>管理资产</DialogTitle>
                <DialogDescription>
                  设置 Token #{asset.tokenId} 的一口价，或处理买家提交的链上出价。
                </DialogDescription>
              </DialogHeader>

              <div className="my-4 space-y-5">
                <div className="space-y-3">
                  <Input
                    min="0"
                    placeholder="输入价格，例如 0.1"
                    step="0.000000000000000001"
                    type="number"
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                  />

                  <Button disabled={isListing} type="submit">
                    {isListing ? <Loader2Icon className="size-4 animate-spin" /> : null}
                    确认上架
                  </Button>
                </div>

                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-900">收到的出价</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isLoadingOffers}
                      onClick={() => void loadOffers()}
                    >
                      刷新
                    </Button>
                  </div>

                  {isLoadingOffers ? (
                    <p className="text-sm text-slate-500">正在加载出价...</p>
                  ) : offers.length === 0 ? (
                    <p className="text-sm text-slate-500">当前暂无出价。</p>
                  ) : (
                    <div className="space-y-2">
                      {offers.map((offer) => {
                        const acceptKey = `accept:${offer.buyer}`;
                        const rejectKey = `reject:${offer.buyer}`;

                        return (
                          <div
                            className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"
                            key={`${asset.tokenId}-${offer.buyer}`}
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900">
                                {formatOfferPrice(offer.price)}
                              </p>
                              <p className="truncate font-mono text-xs text-slate-500">
                                {shortenAddress(offer.buyer)}
                              </p>
                            </div>

                            <div className="flex shrink-0 gap-2">
                              <Button
                                type="button"
                                size="sm"
                                disabled={!isOwner || activeOffer !== null}
                                onClick={() => void handleAcceptOffer(offer.buyer)}
                              >
                                {activeOffer === acceptKey ? (
                                  <Loader2Icon className="size-4 animate-spin" />
                                ) : null}
                                接受
                              </Button>

                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={!isOwner || activeOffer !== null}
                                onClick={() => void handleRejectOffer(offer.buyer)}
                              >
                                {activeOffer === rejectKey ? (
                                  <Loader2Icon className="size-4 animate-spin" />
                                ) : null}
                                回绝
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {error ? (
                  <Alert variant="destructive">
                    <AlertTitle>操作失败</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : null}
              </div>

              <DialogFooter />
            </form>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
