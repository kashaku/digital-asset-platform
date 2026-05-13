import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <Card className="p-12 text-center">
          <div className="space-y-6">
            <div>
              <h1 className="text-6xl font-bold text-slate-900">404</h1>
              <p className="text-2xl font-semibold text-slate-700 mt-2">页面未找到</p>
            </div>
            <p className="text-lg text-slate-600">
              抱歉，您访问的页面不存在或已移除
            </p>
            <div className="mt-8 flex gap-4 justify-center">
              <Button 
                onClick={() => navigate('/')}
                className="px-6 py-2"
              >
                返回首页
              </Button>
              <Button 
                onClick={() => navigate(-1)}
                variant="outline"
                className="px-6 py-2"
              >
                返回上一页
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
