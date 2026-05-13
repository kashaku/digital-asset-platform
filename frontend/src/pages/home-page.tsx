import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Coins, Fingerprint, Globe2, Layers3, ShieldCheck, Sparkles, WalletCards } from 'lucide-react';

import HeadBar from '@/components/head-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const featureCards = [
  {
    icon: Fingerprint,
    title: '不可篡改的确权',
    description: '基于 ERC-721 与链上签名，把创作归属、版本记录和所有权状态固化到链上。',
  },
  {
    icon: Globe2,
    title: 'IPFS 分布式存储',
    description: '作品文件、元数据和预览图分离存储，兼顾可用性、可验证性与访问效率。',
  },
  {
    icon: Coins,
    title: '自动化版税分账',
    description: '二级交易自动触发收益分配，减少人工结算成本，提升创作者持续收益。',
  },
  {
    icon: WalletCards,
    title: '去中心化交易',
    description: '围绕钱包地址完成买卖、持有与授权，降低中间环节带来的风险。',
  },
];

const metrics = [
  { label: '链上确权', value: '100%' },
  { label: 'IPFS 存储', value: '分布式' },
  { label: '版税分账', value: '自动化' },
];

const steps = [
  {
    title: '连接钱包',
    description: '用钱包接入系统，完成身份和资产关系的初始化。',
  },
  {
    title: '铸造资产',
    description: '上传作品、填写信息并生成可验证的链上凭证。',
  },
  {
    title: '流通交易',
    description: '上架、购买和转售，版税在链上按规则自动分配。',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.14),_transparent_38%),linear-gradient(180deg,_#f8fafc_0%,_#f8fafc_45%,_#ffffff_100%)] text-slate-900">
      <HeadBar />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-20 px-4 py-10 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/75 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-12">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(124,58,237,0.08),transparent_35%,rgba(37,99,235,0.08)_70%,transparent)]" />
          <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div className="space-y-8">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="bg-violet-100 text-violet-700 hover:bg-violet-100">
                  Web3 数字资产平台
                </Badge>
                <Badge variant="outline" className="border-violet-200 text-violet-700">
                  链上确权 · IPFS · 版税分账
                </Badge>
              </div>

              <div className="space-y-5">
                <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                  <span className="block text-slate-950">基于区块链的</span>
                  <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-blue-600 bg-clip-text text-transparent">
                    数字资产确权与流通系统
                  </span>
                </h1>
                <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                  面向创作者与收藏者的数字资产平台，结合 Web3 钱包、IPFS 分布式存储与智能合约，
                  将作品确权、铸造、交易和收益分发串成一条清晰的链上路径。
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="gap-2 rounded-full px-6">
                  <Link to="/market">
                    探索市场
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full px-6">
                  <Link to="/assert">立即铸造</Link>
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {metrics.map((metric) => (
                  <Card key={metric.label} className="border-white/80 bg-white/80 shadow-sm">
                    <CardContent className="flex flex-col gap-1 p-5">
                      <span className="text-2xl font-bold text-slate-950">{metric.value}</span>
                      <span className="text-sm text-slate-500">{metric.label}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Card className="border-slate-200/70 bg-white/90 shadow-xl shadow-violet-100/50">
              <CardHeader className="space-y-2 border-b border-slate-100 pb-5">
                <Badge variant="subtle" className="w-fit bg-slate-100 text-slate-600">
                  平台总览
                </Badge>
                <CardTitle className="text-2xl">让确权、交易与收益分配一体化</CardTitle>
                <CardDescription className="text-base leading-7">
                  首页展示核心能力、推荐入口和平台流程，帮助用户快速理解产品定位。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-violet-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-violet-700">
                      <ShieldCheck className="size-4" />
                      链上确权
                    </div>
                    <p className="text-sm leading-6 text-slate-600">每个 Token 对应唯一资产，归属清晰、记录可追溯。</p>
                  </div>
                  <div className="rounded-2xl bg-blue-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-700">
                      <BarChart3 className="size-4" />
                      交易流转
                    </div>
                    <p className="text-sm leading-6 text-slate-600">市场价格、持有关系与交易历史都能在链上验证。</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Sparkles className="size-4 text-violet-600" />
                    快速入口
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button asChild variant="ghost" className="justify-start rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 hover:bg-slate-100">
                      <Link to="/market">
                        <div className="flex flex-col items-start gap-1 text-left">
                          <span className="font-medium text-slate-900">查看市场</span>
                          <span className="text-sm text-slate-500">浏览最新上架的数字资产</span>
                        </div>
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" className="justify-start rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 hover:bg-slate-100">
                      <Link to="/profile">
                        <div className="flex flex-col items-start gap-1 text-left">
                          <span className="font-medium text-slate-900">进入个人中心</span>
                          <span className="text-sm text-slate-500">查看钱包、持仓和创作统计</span>
                        </div>
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-600">核心能力</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">平台为什么值得使用</h2>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featureCards.map((item) => {
              const Icon = item.icon;

              return (
                <Card key={item.title} className="border-slate-200/70 bg-white/90 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg">
                  <CardHeader className="space-y-4 pb-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-blue-100 text-violet-700">
                      <Icon className="size-5" />
                    </div>
                    <div className="space-y-1.5">
                      <CardTitle className="text-xl">{item.title}</CardTitle>
                      <CardDescription className="text-sm leading-6 text-slate-600">{item.description}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-slate-200/70 bg-white/90 shadow-sm">
            <CardHeader>
              <Badge variant="secondary" className="w-fit bg-slate-100 text-slate-600">使用流程</Badge>
              <CardTitle className="text-2xl">三步完成从创作到流通</CardTitle>
              <CardDescription className="text-base leading-7">把复杂流程拆成清晰的链路，降低首次使用成本。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-6">
              {steps.map((step, index) => (
                <div key={step.title} className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-slate-900">{step.title}</h3>
                    <p className="text-sm leading-6 text-slate-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-slate-200/70 bg-gradient-to-br from-slate-950 to-violet-950 text-white shadow-lg">
            <CardHeader className="border-b border-white/10">
              <Badge variant="outline" className="w-fit border-white/20 text-white">推荐行动</Badge>
              <CardTitle className="text-2xl text-white">现在开始体验平台</CardTitle>
              <CardDescription className="text-base leading-7 text-white/75">
                先浏览市场，再进入铸造流程，最后回到个人中心查看自己的资产轨迹。
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
              <Button asChild size="lg" className="h-auto justify-start rounded-2xl px-5 py-5 text-left">
                <Link to="/market">
                  <div className="flex flex-col items-start gap-1">
                    <span className="font-semibold">进入交易市场</span>
                    <span className="text-sm text-white/70">查看上架作品与价格</span>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-auto justify-start rounded-2xl border-white/20 bg-white/5 px-5 py-5 text-left text-white hover:bg-white/10 hover:text-white">
                <Link to="/assert">
                  <div className="flex flex-col items-start gap-1">
                    <span className="font-semibold">开始铸造资产</span>
                    <span className="text-sm text-white/70">上传内容并生成链上凭证</span>
                  </div>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
