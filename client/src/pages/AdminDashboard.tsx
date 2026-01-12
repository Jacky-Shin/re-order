import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../api/client';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { databaseService } from '../services/database';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await adminApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: t('admin.dashboard.todayOrders'),
      value: stats?.todayOrders || 0,
      subtitle: `${t('order.pickupNumber')}: ${stats?.todayPickupCount || 0}`,
      icon: '📦',
      color: 'bg-blue-500',
      link: '/admin/orders',
    },
    {
      title: t('admin.dashboard.monthOrders'),
      value: stats?.monthOrders || 0,
      subtitle: `${t('admin.dashboard.totalOrders')}: ${stats?.totalOrders || 0}`,
      icon: '📊',
      color: 'bg-purple-500',
      link: '/admin/orders',
    },
    {
      title: t('admin.dashboard.todayRevenue'),
      value: `¥${(stats?.todayRevenue || 0).toFixed(2)}`,
      subtitle: `${t('admin.stats.month')}: ¥${(stats?.monthRevenue || 0).toFixed(2)}`,
      icon: '💰',
      color: 'bg-green-500',
      link: '/admin/payments',
      extraInfo: stats?.todayCashRevenue !== undefined && stats?.todayOtherRevenue !== undefined ? (
        <div className="mt-2 space-y-1">
          <p className="text-xs text-gray-500">
            {t('admin.stats.cashRevenue')}: ¥{(stats.todayCashRevenue || 0).toFixed(2)}
          </p>
          <p className="text-xs text-gray-500">
            {t('admin.stats.otherPaymentRevenue')}: ¥{(stats.todayOtherRevenue || 0).toFixed(2)}
          </p>
        </div>
      ) : null,
    },
    {
      title: t('admin.orders.pending'),
      value: stats?.pendingOrders || 0,
      subtitle: `${t('admin.orders.status.preparing')}: ${stats?.preparingOrders || 0}`,
      icon: '⏳',
      color: 'bg-yellow-500',
      link: '/admin/orders?status=pending',
    },
  ];

  const quickActions = [
    {
      title: t('admin.dashboard.manageMenu'),
      description: t('admin.menu.title'),
      icon: '📝',
      link: '/admin/menu',
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
    },
    {
      title: t('admin.dashboard.categoryManagement'),
      description: t('admin.dashboard.categoryManagementDesc'),
      icon: '📂',
      link: '/admin/categories',
      color: 'bg-teal-50 hover:bg-teal-100 border-teal-200',
    },
    {
      title: t('admin.menu.myShop'),
      description: '',
      icon: '🏪',
      link: '/admin/shop',
      color: 'bg-pink-50 hover:bg-pink-100 border-pink-200',
    },
    {
      title: t('admin.dashboard.manageOrders'),
      description: t('admin.orders.title'),
      icon: '📦',
      link: '/admin/orders',
      color: 'bg-green-50 hover:bg-green-100 border-green-200',
    },
    {
      title: t('admin.dashboard.viewStats'),
      description: t('admin.stats.title'),
      icon: '📊',
      link: '/admin/stats',
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
    },
    {
      title: t('admin.dashboard.viewPayments'),
      description: t('admin.payments.title'),
      icon: '💳',
      link: '/admin/payments',
      color: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200',
    },
    {
      title: t('merchant.bankAccounts'),
      description: t('merchant.title'),
      icon: '🏦',
      link: '/merchant/settings',
      color: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sb-green"></div>
          <p className="mt-4 text-gray-500">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // SVG pattern URL for background
  const patternUrl = "data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      {/* Header - 高级设计 */}
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url("${patternUrl}")` }}></div>
        <div className="relative max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                <span className="text-3xl">📊</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('admin.dashboard.title')}</h1>
                <p className="text-sm opacity-90 mt-1 font-medium">{t('menu.title')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <button
                onClick={() => navigate('/menu')}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl transition-all duration-300 border border-white/20 font-medium"
              >
                {t('common.back')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards - 高级卡片设计 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <div
              key={index}
              onClick={() => navigate(card.link)}
              className="card card-hover cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-14 h-14 rounded-2xl ${card.color} flex items-center justify-center text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {card.icon}
                  </div>
                  <svg className="w-6 h-6 text-gray-300 group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm font-medium mb-2">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mb-1">{card.value}</p>
                {card.subtitle && (
                  <p className="text-xs text-gray-400 font-medium">{card.subtitle}</p>
                )}
                {card.extraInfo}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions - 现代化按钮网格 */}
        <div className="card p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-gradient-to-b from-indigo-500 to-blue-500 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900">{t('admin.dashboard.quickLinks')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => navigate(action.link)}
                className={`group relative overflow-hidden rounded-xl p-6 text-left border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${action.color}`}
              >
                <div className="relative z-10">
                  <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform duration-300">
                    {action.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1 text-lg">{action.title}</h3>
                  <p className="text-sm text-gray-600 font-medium">{action.description}</p>
                </div>
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
              </button>
            ))}
          </div>
        </div>

        {/* Order Statistics - 高级统计面板 */}
        <div className="card p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-gray-900">{t('admin.stats.orders')}</h2>
            </div>
            <button
              onClick={() => navigate('/admin/orders')}
              className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm flex items-center gap-2 hover:gap-3 transition-all"
            >
              {t('admin.dashboard.viewAll')}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-6 border-2 border-blue-200">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/30 rounded-full -mr-16 -mt-16"></div>
              <div className="relative">
                <div className="text-sm text-blue-700 font-semibold mb-2">{t('admin.dashboard.todayOrders')}</div>
                <div className="text-4xl font-bold text-blue-600 mb-1">{stats?.todayOrders || 0}</div>
                <div className="text-xs text-blue-600/70 font-medium">{t('order.pickupNumber')}: {stats?.todayPickupCount || 0}</div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 p-6 border-2 border-purple-200">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/30 rounded-full -mr-16 -mt-16"></div>
              <div className="relative">
                <div className="text-sm text-purple-700 font-semibold mb-2">{t('admin.dashboard.monthOrders')}</div>
                <div className="text-4xl font-bold text-purple-600 mb-1">{stats?.monthOrders || 0}</div>
                <div className="text-xs text-purple-600/70 font-medium">{t('admin.dashboard.totalOrders')}: {stats?.totalOrders || 0}</div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100 p-6 border-2 border-green-200">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/30 rounded-full -mr-16 -mt-16"></div>
              <div className="relative">
                <div className="text-sm text-green-700 font-semibold mb-2">{t('admin.dashboard.monthRevenue')}</div>
                <div className="text-4xl font-bold text-green-600 mb-1">¥{(stats?.monthRevenue || 0).toFixed(2)}</div>
                <div className="text-xs text-green-600/70 font-medium">{t('admin.dashboard.totalRevenue')}: ¥{(stats?.totalRevenue || 0).toFixed(2)}</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-5 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
              <div className="text-3xl font-bold text-blue-600 mb-2">{stats?.pendingOrders || 0}</div>
              <div className="text-sm text-blue-700 font-semibold">{t('admin.orders.status.pending')}</div>
            </div>
            <div className="text-center p-5 rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200">
              <div className="text-3xl font-bold text-yellow-600 mb-2">{stats?.preparingOrders || 0}</div>
              <div className="text-sm text-yellow-700 font-semibold">{t('admin.orders.status.preparing')}</div>
            </div>
            <div className="text-center p-5 rounded-xl bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
              <div className="text-3xl font-bold text-green-600 mb-2">{stats?.readyOrders || 0}</div>
              <div className="text-sm text-green-700 font-semibold">{t('admin.orders.status.ready')}</div>
            </div>
            <div className="text-center p-5 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200">
              <div className="text-3xl font-bold text-gray-600 mb-2">{stats?.totalOrders || 0}</div>
              <div className="text-sm text-gray-700 font-semibold">{t('admin.dashboard.totalOrders')}</div>
            </div>
          </div>
        </div>

        {/* 数据管理区域 */}
        <div className="card p-8 border-2 border-red-200 bg-red-50/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-red-500 to-red-600 rounded-full"></div>
              <h2 className="text-2xl font-bold text-gray-900">Gestión de Datos</h2>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Esta acción eliminará todos los datos: productos, pedidos, categorías, pagos y configuraciones. Esta acción no se puede deshacer.
          </p>
          <button
            onClick={async () => {
              if (!confirm('¿Está seguro de que desea eliminar TODOS los datos? Esta acción no se puede deshacer.')) {
                return;
              }
              if (!confirm('Esta es su última oportunidad. ¿Realmente desea eliminar todos los datos?')) {
                return;
              }
              try {
                await databaseService.clearAllData();
                alert('✅ Todos los datos han sido eliminados. La página se recargará.');
                window.location.reload();
              } catch (error: any) {
                console.error('Error al limpiar datos:', error);
                alert('Error al limpiar datos: ' + (error.message || 'Error desconocido'));
              }
            }}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Limpiar Todos los Datos
          </button>
        </div>
      </div>
    </div>
  );
}
