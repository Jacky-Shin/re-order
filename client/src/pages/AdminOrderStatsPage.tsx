import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../api/client';

export default function AdminOrderStatsPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getOrderStats();
      setStats(response.data);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sb-green"></div>
          <p className="mt-4 text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/admin')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="ml-4 text-lg font-semibold">订单统计详情</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">今日统计</h3>
              <span className="text-2xl">📦</span>
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {stats?.today.orders || 0}
            </div>
            <div className="text-sm text-gray-500">订单数</div>
            <div className="text-2xl font-bold text-green-600 mt-3">
              ¥{(stats?.today.revenue || 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">收入</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">本月统计</h3>
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {stats?.month.orders || 0}
            </div>
            <div className="text-sm text-gray-500">订单数</div>
            <div className="text-2xl font-bold text-green-600 mt-3">
              ¥{(stats?.month.revenue || 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">收入</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">总计</h3>
              <span className="text-2xl">💰</span>
            </div>
            <div className="text-3xl font-bold text-green-600 mb-1">
              {stats?.total.orders || 0}
            </div>
            <div className="text-sm text-gray-500">总订单数</div>
            <div className="text-2xl font-bold text-green-600 mt-3">
              ¥{(stats?.total.revenue || 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">总收入</div>
          </div>
        </div>

        {/* Last 30 Days Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">近30天订单趋势</h2>
          <div className="space-y-2">
            {stats?.last30Days?.map((day: any, index: number) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-24 text-sm text-gray-600">
                  {new Date(day.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: `${Math.min((day.count / Math.max(...(stats.last30Days.map((d: any) => d.count) || [1]))) * 100, 100)}%` }}
                      >
                        {day.count > 0 && day.count}
                      </div>
                    </div>
                    <div className="w-20 text-right text-sm font-medium">
                      {day.count} 单
                    </div>
                    <div className="w-24 text-right text-sm text-green-600 font-medium">
                      ¥{day.revenue.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
