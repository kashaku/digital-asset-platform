import { useEffect, useMemo, useState } from "react";

import { fetchProfileData } from "@/services/profile-api";
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
        const profileData = await fetchProfileData(normalizedAddress);

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
