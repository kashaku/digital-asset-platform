import { useEffect, useMemo, useState } from "react";

import { fetchProfileData } from "@/services/profile-api";
import { fetchListings, fetchNFTs } from "@/services/indexer";
import { ipfsUriToGatewayUrl, resolveTokenMetadata } from "@/services/ipfs-api";
import type { ProfileData } from "@/types/profile";

const EMPTY_PROFILE_DATA: ProfileData = {
  ownedAssets: [],
  createdAssets: [],
  activities: [],
  stats: {
    ownedTotal: 0,
    createdTotal: 0,
    listedTotal: 0,
    activityTotal: 0,
  },
};

function weiToDisplayPrice(priceWei: string) {
  try {
    return `${Number(BigInt(priceWei)) / 1e18} ETH`;
  } catch {
    return "0 ETH";
  }
}

function resolveImageUrl(uri?: string) {
  if (!uri) {
    return "/favicon.svg";
  }

  if (uri.startsWith("ipfs://")) {
    return ipfsUriToGatewayUrl(uri);
  }

  return uri;
}

async function fetchIndexedProfileData(address: string): Promise<ProfileData> {
  const normalizedAddress = address.toLowerCase();
  const [nfts, listings] = await Promise.all([
    fetchNFTs({ page: 1, pageSize: 100 }),
    fetchListings({ page: 1, pageSize: 100 }),
  ]);

  const listingByTokenId = new Map(
    listings.items.map((listing) => [String(listing.tokenId), listing]),
  );

  const mapProfileAsset = async (nft: (typeof nfts.items)[number]) => {
      const listing = listingByTokenId.get(String(nft.tokenId));
      const metadata = await resolveTokenMetadata(nft.tokenURI);

      return {
        tokenId: String(nft.tokenId),
        title: metadata?.name || `Asset #${nft.tokenId}`,
        imageUrl: resolveImageUrl(metadata?.imageUrl ?? metadata?.image),
        owner: nft.owner ?? nft.creator,
        isListed: Boolean(listing),
        price: listing ? weiToDisplayPrice(listing.price) : undefined,
      };
  };

  const ownedAssets = await Promise.all(
    nfts.items
      .filter((nft) => (nft.owner ?? nft.creator).toLowerCase() === normalizedAddress)
      .map(mapProfileAsset),
  );

  const createdAssets = await Promise.all(
    nfts.items
      .filter((nft) => nft.creator.toLowerCase() === normalizedAddress)
      .map(mapProfileAsset),
  );

  return {
    ownedAssets,
    createdAssets,
    activities: [],
    stats: {
      ownedTotal: ownedAssets.length,
      createdTotal: createdAssets.length,
      listedTotal: ownedAssets.filter((asset) => asset.isListed).length,
      activityTotal: 0,
    },
  };
}

export function useProfileAssets(address?: string | null) {
  const [data, setData] = useState<ProfileData>(EMPTY_PROFILE_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedAddress = useMemo(() => address?.trim() ?? "", [address]);

  useEffect(() => {
    let ignored = false;

    async function loadProfile() {
      if (!normalizedAddress) {
        setData(EMPTY_PROFILE_DATA);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        let profileData: ProfileData;

        try {
          profileData = await fetchIndexedProfileData(normalizedAddress);
        } catch {
          profileData = await fetchProfileData(normalizedAddress);
        }

        if (!ignored) {
          setData(profileData);
        }
      } catch (err) {
        if (!ignored) {
          setError(err instanceof Error ? err.message : "个人中心数据加载失败。");
        }
      } finally {
        if (!ignored) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      ignored = true;
    };
  }, [normalizedAddress]);

  return {
    data,
    isLoading,
    error,
  };
}
