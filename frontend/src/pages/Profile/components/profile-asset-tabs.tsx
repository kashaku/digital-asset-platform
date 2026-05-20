import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { ProfileActivity, ProfileAsset } from "@/types/profile";

import { ProfileActivityList } from "./profile-activity-list";
import { ProfileAssetCard } from "./profile-asset-card";
import { ProfileEmptyState } from "./profile-empty-state";

type ProfileAssetTabsProps = {
  ownedAssets: ProfileAsset[];
  createdAssets: ProfileAsset[];
  activities: ProfileActivity[];
};

function AssetGrid({ assets }: { assets: ProfileAsset[] }) {
  if (assets.length === 0) {
    return (
      <ProfileEmptyState
        description="当前地址暂未查询到相关数字资产。"
        title="暂无资产"
      />
    );
  }

  return (
    <section className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {assets.map((asset) => (
        <ProfileAssetCard asset={asset} key={asset.tokenId} />
      ))}
    </section>
  );
}

const triggerClassName =
  "rounded-none border-0 border-b-2 border-transparent bg-transparent px-1 pb-2 text-sm font-medium text-slate-500 shadow-none transition-colors hover:text-slate-800 data-[state=active]:border-purple-600 data-[state=active]:bg-transparent data-[state=active]:text-slate-950 data-[state=active]:shadow-none data-[state=active]:ring-0";

export function ProfileAssetTabs({
  ownedAssets,
  createdAssets,
  activities,
}: ProfileAssetTabsProps) {
  return (
    <Tabs defaultValue="owned">
      <TabsList className="h-auto justify-start gap-6 rounded-none border-b border-slate-200 bg-transparent p-0 shadow-none">
        <TabsTrigger className={triggerClassName} value="owned">
          已收集（{ownedAssets.length}）
        </TabsTrigger>

        <TabsTrigger className={triggerClassName} value="created">
          已铸造（{createdAssets.length}）
        </TabsTrigger>

        <TabsTrigger className={triggerClassName} value="activities">
          交易历史
        </TabsTrigger>
      </TabsList>

      <TabsContent className="mt-6" value="owned">
        <AssetGrid assets={ownedAssets} />
      </TabsContent>

      <TabsContent className="mt-6" value="created">
        <AssetGrid assets={createdAssets} />
      </TabsContent>

      <TabsContent className="mt-6" value="activities">
        <ProfileActivityList activities={activities} />
      </TabsContent>
    </Tabs>
  );
}
