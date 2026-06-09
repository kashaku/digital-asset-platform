import { AlertCircleIcon, Loader2Icon } from "lucide-react";

import HeadBar from "@/components/head-bar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useMarketAssets } from "@/hooks/useMarketAssets";
import { MarketAssetCard } from "@/pages/Market/components/market-asset-card";
import { MarketEmptyState } from "@/pages/Market/components/market-empty-state";
import { MarketFilterBar } from "@/pages/Market/components/market-filter-bar";
import { MarketStatsPanel } from "@/pages/Market/components/market-stats";

export default function MarketPage() {
  const {
    assets,
    stats,
    filters,
    isLoading,
    error,
    activeAssetId,
    setKeyword,
    setCategory,
    setSort,
    resetFilters,
    buyAsset,
    submitOffer,
  } = useMarketAssets();

  return (
    <div className="min-h-screen bg-slate-50">
      <HeadBar />

      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10 2xl:px-14">
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8">
          <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-600">AssetChain Marketplace</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                数字资产交易市场
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                浏览已上架的数字资产，查看价格、创作者、Token ID、IPFS CID 与版税比例。购买和出价都会触发真实链上交易。
              </p>
            </div>

            <div className="rounded-2xl border bg-white px-5 py-4 shadow-sm">
              <p className="text-xs text-slate-500">当前网络</p>
              <p className="mt-1 text-sm font-semibold text-slate-950">Hardhat Localhost / Chain ID 31337</p>
            </div>
          </section>

          <MarketStatsPanel stats={stats} />

          <MarketFilterBar
            keyword={filters.keyword}
            category={filters.category}
            sort={filters.sort}
            onKeywordChange={setKeyword}
            onCategoryChange={setCategory}
            onSortChange={setSort}
            onReset={resetFilters}
          />

          {error ? (
            <Alert variant="destructive">
              <AlertCircleIcon className="size-4" />
              <AlertTitle>市场数据处理失败</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {isLoading ? (
            <section className="rounded-2xl border bg-white p-8 shadow-sm">
              <div className="mb-4 flex items-center gap-3 text-sm text-slate-600">
                <Loader2Icon className="size-4 animate-spin" />
                正在加载市场资产列表...
              </div>
              <Progress value={60} />
            </section>
          ) : assets.length > 0 ? (
            <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {assets.map((asset) => (
                <MarketAssetCard
                  key={asset.id}
                  asset={asset}
                  isPending={activeAssetId === asset.id}
                  onBuy={buyAsset}
                  onOffer={submitOffer}
                />
              ))}
            </section>
          ) : (
            <MarketEmptyState onReset={resetFilters} />
          )}
        </div>
      </main>
    </div>
  );
}
