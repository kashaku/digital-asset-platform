import { Card } from '@/components/ui/card';

export default function AssertPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-slate-900">资产管理</h1>
            <p className="text-lg text-slate-600">这是资产管理占位符，待开发完成</p>
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-slate-700">
                在这里展示用户的数字资产、NFT 收藏、资产详情和管理功能
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

