import { AlertCircleIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ProfileAssetTabs } from "@/pages/Profile/components/profile-asset-tabs";
import { ProfileSummaryCard } from "@/pages/Profile/components/profile-summary-card";
import { useProfileAssets } from "@/hooks/useProfileAssets";
import { useUserStore } from "@/store/user-store";
import HeadBar from "@/components/head-bar.tsx";

export default function ProfilePage() {
  const user = useUserStore((state) => state.user);
  const address = user?.address ?? null;
  const displayName = user?.profile?.displayName ?? "未命名用户";

  const { data, isLoading, error } = useProfileAssets(address);

  return (
            <div className="min-h-screen bg-slate-50">
      <HeadBar />
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10 2xl:px-14">
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <ProfileSummaryCard
          address={address}
          displayName={displayName}
          stats={data.stats}
        />

        {error ? (
          <Alert variant="destructive">
            <AlertCircleIcon className="size-4" />
            <AlertTitle>个人中心数据加载失败</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {isLoading ? (
          <section className="rounded-2xl border bg-white p-8 shadow-sm">
            <p className="mb-4 text-sm text-slate-600">
              正在加载个人资产数据...
            </p>
            <Progress value={60} />
          </section>
        ) : (
          <ProfileAssetTabs
            activities={data.activities}
            createdAssets={data.createdAssets}
            ownedAssets={data.ownedAssets}
          />
        )}
      </div>
    </main>
            </div>
  );
}
