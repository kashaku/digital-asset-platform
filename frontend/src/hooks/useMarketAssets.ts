import { useEffect, useMemo, useState } from "react";

import { useMarket } from "@/hooks/useMarket";
import { useOfferMarket } from "@/hooks/useOfferMarket";
import { useWallet } from "@/hooks/useWallet";
import {
  calculateMarketStats,
  fetchMarketAssets,
  type MarketApiSort,
} from "@/services/market-api";
import type {
  MarketAsset,
  MarketAssetCategory,
  MarketFilters,
  MarketSort,
} from "@/types/market";

const DEFAULT_FILTERS: MarketFilters = {
  keyword: "",
  category: "all",
  sort: "latest",
};

function toApiSort(sort: MarketSort): MarketApiSort {
  if (sort === "price-asc") return "price_asc";
  if (sort === "price-desc") return "price_desc";
  return "latest";
}

function sortAssets(assets: MarketAsset[], sort: MarketSort) {
  const sortedAssets = [...assets];

  if (sort === "price-asc") {
    return sortedAssets.sort((a, b) => a.price - b.price);
  }

  if (sort === "price-desc") {
    return sortedAssets.sort((a, b) => b.price - a.price);
  }

  if (sort === "royalty-desc") {
    return sortedAssets.sort((a, b) => b.royaltyRate - a.royaltyRate);
  }

  return sortedAssets.sort(
    (a, b) => new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime(),
  );
}

export function useMarketAssets() {
  const [rawAssets, setRawAssets] = useState<MarketAsset[]>([]);
  const [filters, setFilters] = useState<MarketFilters>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);
  const market = useMarket();
  const offerMarket = useOfferMarket();
  const wallet = useWallet();

  useEffect(() => {
    let ignored = false;

    async function loadAssets() {
      setIsLoading(true);
      setError(null);

      try {
        const assets = await fetchMarketAssets({
          page: 1,
          pageSize: 48,
          sort: toApiSort(filters.sort),
        });

        if (!ignored) {
          setRawAssets(assets);
        }
      } catch (err) {
        if (!ignored) {
          setError(err instanceof Error ? err.message : "市场资产列表加载失败");
        }
      } finally {
        if (!ignored) {
          setIsLoading(false);
        }
      }
    }

    void loadAssets();

    return () => {
      ignored = true;
    };
  }, [filters.sort]);

  const assets = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();

    const filteredAssets = rawAssets.filter((asset) => {
      const matchedKeyword =
        keyword.length === 0 ||
        asset.title.toLowerCase().includes(keyword) ||
        asset.description.toLowerCase().includes(keyword) ||
        asset.tokenId.toLowerCase().includes(keyword) ||
        asset.creator.toLowerCase().includes(keyword) ||
        asset.owner.toLowerCase().includes(keyword) ||
        asset.ipfsCid.toLowerCase().includes(keyword);

      const matchedCategory =
        filters.category === "all" || asset.category === filters.category;

      return matchedKeyword && matchedCategory;
    });

    return sortAssets(filteredAssets, filters.sort);
  }, [rawAssets, filters]);

  const stats = useMemo(() => calculateMarketStats(rawAssets), [rawAssets]);

  const setKeyword = (keyword: string) => {
    setFilters((current) => ({ ...current, keyword }));
  };

  const setCategory = (category: MarketAssetCategory) => {
    setFilters((current) => ({ ...current, category }));
  };

  const setSort = (sort: MarketSort) => {
    setFilters((current) => ({ ...current, sort }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const buyAsset = async (assetId: string) => {
    const targetAsset = rawAssets.find((asset) => asset.id === assetId);

    setActiveAssetId(assetId);
    setError(null);

    try {
      if (!targetAsset) {
        throw new Error("未找到待购买资产");
      }

      await market.buyAsset(Number(targetAsset.tokenId), String(targetAsset.price));

      try {
        await offerMarket.cancelStaleOffers(Number(targetAsset.tokenId));
      } catch {
        // 清理失效报价失败不影响一口价购买结果。
      }

      setRawAssets((currentAssets) =>
        currentAssets.map((asset) =>
          asset.id === assetId ? { ...asset, status: "sold" } : asset,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "购买资产失败");
    } finally {
      setActiveAssetId(null);
    }
  };

  const submitOffer = async (assetId: string, price: number) => {
    setActiveAssetId(assetId);
    setError(null);

    try {
      const targetAsset = rawAssets.find((asset) => asset.id === assetId);

      if (!targetAsset) {
        throw new Error("未找到待出价资产");
      }

      if (!Number.isFinite(price) || price <= 0) {
        throw new Error("请输入有效的出价金额");
      }

      if (
        wallet.address &&
        targetAsset.owner.toLowerCase() === wallet.address.toLowerCase()
      ) {
        throw new Error("不能对自己持有或上架的资产出价，请切换到其他账户。");
      }

      await offerMarket.makeOffer(Number(targetAsset.tokenId), String(price));
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交出价失败");
    } finally {
      setActiveAssetId(null);
    }
  };

  return {
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
  };
}
