import { useEffect, useMemo, useState } from "react";

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
  if (sort === "price-asc") {
    return "price_asc";
  }

  if (sort === "price-desc") {
    return "price_desc";
  }

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

/**
 * 市场页数据 Hook。
 *
 * 职责：
 * - 读取 Python REST API 聚合后的市场资产列表；
 * - 在前端完成关键词、分类和版税排序等展示层筛选；
 * - 管理 loading / error / activeAssetId 等页面状态；
 * - 为页面保留购买和出价入口。
 *
 * 注意：
 * - 一口价购买属于链上写操作，应接入 services/web3/marketContract.ts；
 * - 当前 ABI 不支持 Offer，出价只作为后续扩展入口保留。
 */
export function useMarketAssets() {
  const [rawAssets, setRawAssets] = useState<MarketAsset[]>([]);
  const [filters, setFilters] = useState<MarketFilters>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);

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
    setFilters((current) => ({
      ...current,
      keyword,
    }));
  };

  const setCategory = (category: MarketAssetCategory) => {
    setFilters((current) => ({
      ...current,
      category,
    }));
  };

  const setSort = (sort: MarketSort) => {
    setFilters((current) => ({
      ...current,
      sort,
    }));
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

      /**
       * 接口文档要求购买资产通过 Web3 合约接口完成：
       * services/web3/marketContract.ts -> buyAsset(tokenId, priceWei)
       *
       * 这里先保留页面入口，避免误用 REST API 代替用户签名。
       */
      throw new Error(
        `购买资产需要接入 Web3 合约接口：buyAsset("${targetAsset.tokenId}", priceWei)。`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "购买资产失败");
    } finally {
      setActiveAssetId(null);
    }
  };

  const submitOffer = async (assetId: string) => {
    setActiveAssetId(assetId);
    setError(null);

    try {
      const targetAsset = rawAssets.find((asset) => asset.id === assetId);

      if (!targetAsset) {
        throw new Error("未找到待出价资产");
      }

      /**
       * 当前 ABI 不支持 Offer。
       * 如果后续扩展合约，再在 services/web3/marketContract.ts 中接入 createOffer。
       */
      throw new Error("当前合约 ABI 暂不支持 Offer，出价功能应作为后续扩展。");
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
