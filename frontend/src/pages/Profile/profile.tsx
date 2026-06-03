import { AlertCircleIcon, WalletIcon } from 'lucide-react';

import HeadBar from '@/components/head-bar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useProfileAssets } from '@/hooks/useProfileAssets';
import { useWallet } from '@/hooks/useWallet';
import { ProfileAssetTabs } from '@/pages/Profile/components/profile-asset-tabs';
import { ProfileSummaryCard } from '@/pages/Profile/components/profile-summary-card';
import { useUserStore } from '@/store/user-store';

export default function ProfilePage() {
  const user = useUserStore((state) => state.user);
  const wallet = useWallet();
  const isAuthenticated = Boolean(wallet.address && wallet.signature && user);
  const address = isAuthenticated ? wallet.address : null;
  const displayName = user?.profile?.displayName ?? '钱包用户';

  const { data, isLoading, error } = useProfileAssets(address);

  return (
    <div className="min-h-screen bg-slate-50">
      <HeadBar />

      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10 2xl:px-14">
        <div className="mx-auto w-full max-w-7xl space-y-8">
          {!isAuthenticated ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                <WalletIcon className="size-7" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-950">请先连接钱包并完成签名</h1>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
                个人中心使用真实 MetaMask 地址作为用户身份。连接成功后需要完成一次签名验证，系统才会展示该钱包对应的资产信息。
              </p>

              <div className="mt-6 flex flex-col items-center gap-3">
                <Button
                  type="button"
                  disabled={wallet.isConnecting || wallet.isSigning}
                  className="rounded-lg bg-violet-600 px-6 font-bold text-white hover:bg-violet-700"
                  onClick={() => {
                    void wallet.connect();
                  }}
                >
                  {wallet.isConnecting ? '连接中...' : wallet.isSigning ? '等待签名...' : '连接钱包'}
                </Button>

                {wallet.error ? (
                  <a
                    href={wallet.metamaskDownloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-red-500"
                  >
                    {wallet.error}
                  </a>
                ) : null}
              </div>
            </section>
          ) : (
            <>
              <ProfileSummaryCard
                address={address}
                chainId={wallet.chainId}
                displayName={displayName}
                isVerified={Boolean(wallet.signature)}
                signedAt={wallet.signedAt}
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
                    正在加载当前钱包的资产数据...
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
            </>
          )}
        </div>
      </main>
    </div>
  );
}
