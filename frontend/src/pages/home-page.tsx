import { Link } from 'react-router-dom';
import { Bot, Fingerprint, Network, WalletCards } from 'lucide-react';

import HeadBar from '@/components/head-bar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const featureCards = [
  {
    icon: Fingerprint,
    iconClassName: 'bg-violet-100 text-violet-600',
    title: '不可篡改的确权',
    description:
      '基于 ERC-721 标准，每个资产拥有全球唯一的 TokenID，秒级确权，所有权归属清晰透明。',
  },
  {
    icon: Network,
    iconClassName: 'bg-blue-100 text-blue-600',
    title: 'IPFS 分布式存储',
    description:
      '链上链下数据分离。源文件存储于 IPFS，获取唯一 CID，防篡改且永久可追溯，降低 Gas 费用。',
  },
  {
    icon: Bot,
    iconClassName: 'bg-emerald-100 text-emerald-600',
    title: '自动化版税分红',
    description:
      '智能合约自动执行，每次资产在二级市场转卖时，自动从成交额中按比例分配给初始创作者。',
  },
  {
    icon: WalletCards,
    iconClassName: 'bg-orange-100 text-orange-600',
    title: '去中心化交易',
    description:
      '属于用户钱包，私钥即全权。免去中心化平台 30%-50% 的高额佣金，拒绝账号封禁风险。',
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-950">
      <HeadBar />

      <main className="flex flex-1 flex-col">
        <section className="mx-auto flex w-full max-w-[76rem] flex-col items-center px-4 pb-24 pt-24 text-center sm:px-6 lg:px-8 lg:pb-28 lg:pt-24">
          <h1 className="!my-0 max-w-3xl text-[2.6rem] !font-black leading-[1.12] !tracking-normal text-slate-950 sm:text-5xl">
            <span className="block">基于区块链的</span>
            <span className="block bg-gradient-to-r from-violet-600 via-purple-500 to-blue-600 bg-clip-text text-transparent">
              数字资产确权与流通系统
            </span>
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600">
            由西南交通大学第13组开发。结合 Web3、IPFS 与智能合约技术，实现秒级数字化
            <br className="hidden md:block" />
            确权，数据永久可追溯，保障创作者的每一分收益。
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              className="h-12 rounded-lg bg-violet-600 px-8 text-base font-bold text-white shadow-lg shadow-violet-600/20 hover:bg-violet-700"
            >
              <Link to="/market">探索市场</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-lg border-slate-300 bg-white px-8 text-base font-bold text-slate-950 shadow-sm hover:bg-slate-50"
            >
              <Link to="/assert">立即铸造</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-[76rem] grid-cols-1 gap-6 px-4 pb-24 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
          {featureCards.map((item) => {
            const Icon = item.icon;

            return (
              <Card
                key={item.title}
                className="rounded-xl border border-slate-200 bg-white py-0 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                <CardContent className="flex h-full flex-col px-6 py-6">
                  <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${item.iconClassName}`}>
                    <Icon className="size-5" strokeWidth={2.2} />
                  </div>
                  <h2 className="mb-3 text-lg font-extrabold leading-none tracking-normal text-slate-950">
                    {item.title}
                  </h2>
                  <p className="text-sm leading-6 text-slate-600">{item.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-9 text-center text-sm text-slate-500">
        © 2024 基于区块链的数字资产确权与流通系统. All rights reserved.
      </footer>
    </div>
  );
}
