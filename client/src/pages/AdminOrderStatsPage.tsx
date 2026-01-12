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
      // 统一使用包含收入统计的接口
      const response = await adminApi.getStats();
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
            <h1 className="ml-4 text-lg font-semibold">Estadísticas de pedidos</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tarjetas resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Hoy</h3>
              <span className="text-2xl">📦</span>
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {stats?.todayOrders || 0}
            </div>
            <div className="text-sm text-gray-500">Pedidos</div>
            <div className="text-2xl font-bold text-green-600 mt-3">
              ¥{(stats?.todayRevenue || 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">Ingresos</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Este mes</h3>
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {stats?.monthOrders || 0}
            </div>
            <div className="text-sm text-gray-500">Pedidos</div>
            <div className="text-2xl font-bold text-green-600 mt-3">
              ¥{(stats?.monthRevenue || 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">Ingresos</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total</h3>
              <span className="text-2xl">💰</span>
            </div>
            <div className="text-3xl font-bold text-green-600 mb-1">
              {stats?.totalOrders || 0}
            </div>
            <div className="text-sm text-gray-500">Total de pedidos</div>
            <div className="text-2xl font-bold text-green-600 mt-3">
              ¥{(stats?.totalRevenue || 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">Ingresos totales</div>
          </div>
        </div>

        {/* Ingresos diarios（最近14天） */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Ingresos diarios (últimos 14 días)</h2>
          <div className="space-y-2">
            {stats?.dailyRevenue?.map((day: any, index: number) => {
              const maxRev = Math.max(...(stats.dailyRevenue?.map((d: any) => d.revenue) || [1]));
              const width = Math.min((day.revenue / (maxRev || 1)) * 100, 100);
              return (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                        <div
                          className="bg-green-500 h-full rounded-full flex items-center justify-center text-white text-xs font-medium"
                          style={{ width: `${width}%` }}
                        >
                          {day.revenue > 0 && `¥${day.revenue.toFixed(2)}`}
                        </div>
                      </div>
                      <div className="w-24 text-right text-sm text-green-600 font-medium">
                        ¥{day.revenue.toFixed(2)}
                      </div>
                      <div className="w-16 text-right text-sm text-gray-600">
                        {day.count} pedidos
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ingresos mensuales（最近6个月） */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Ingresos mensuales (últimos 6 meses)</h2>
          <div className="space-y-2">
            {stats?.monthlyRevenue?.map((m: any, index: number) => {
              const maxRev = Math.max(...(stats.monthlyRevenue?.map((d: any) => d.revenue) || [1]));
              const width = Math.min((m.revenue / (maxRev || 1)) * 100, 100);
              const label = new Date(`${m.month}-01`).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
              return (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-28 text-sm text-gray-600">
                    {label}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full flex items-center justify-center text-white text-xs font-medium"
                          style={{ width: `${width}%` }}
                        >
                          {m.revenue > 0 && `¥${m.revenue.toFixed(2)}`}
                        </div>
                      </div>
                      <div className="w-24 text-right text-sm text-blue-600 font-medium">
                        ¥{m.revenue.toFixed(2)}
                      </div>
                      <div className="w-16 text-right text-sm text-gray-600">
                        {m.count} pedidos
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
