import { ExternalLinkIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { ProfileAsset } from "@/types/profile";

type ProfileAssetCardProps = {
  asset: ProfileAsset;
};

export function ProfileAssetCard({ asset }: ProfileAssetCardProps) {
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
            {asset.isListed ? "已上架" : "所有者"}
          </span>

          {asset.price ? (
            <span className="text-sm font-bold text-purple-600">
              {asset.price}
            </span>
          ) : null}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full border-purple-500 text-purple-600 hover:bg-purple-600 hover:text-white"
          size="sm"
          type="button"
          variant="outline"
        >
          管理 / 出售
          <ExternalLinkIcon className="size-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
