import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../api/client';
import { useLanguage } from '../contexts/LanguageContext';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-sb-green text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{t('admin.dashboard.title')}</h1>
              <p className="text-sm opacity-90 mt-1">{t('menu.title')}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Language Switcher */}
              <div className="flex items-center gap-2 bg-white bg-opacity-20 rounded-lg px-3 py-2">
                <button
                  onClick={() => setLanguage('zh')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    language === 'zh' ? 'bg-white text-sb-green' : 'text-white hover:bg-white hover:bg-opacity-20'
                  }`}
                >
                  中文
                </button>
                <button
                  onClick={() => setLanguage('es')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    language === 'es' ? 'bg-white text-sb-green' : 'text-white hover:bg-white hover:bg-opacity-20'
                  }`}
                >
                  ES
                </button>
              </div>
              <button
                onClick={() => navigate('/menu')}
                className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
              >
                {t('common.back')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map((card, index) => (
            <div
              key={index}
              onClick={() => navigate(card.link)}
              className="bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm mb-1">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  {card.subtitle && (
                    <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>
                  )}
                </div>
                <div className={`${card.color} w-12 h-12 rounded-full flex items-center justify-center text-2xl`}>
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">{t('admin.dashboard.quickLinks')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => navigate(action.link)}
                className={`${action.color} border-2 rounded-lg p-4 text-left transition-colors`}
              >
                <div className="text-3xl mb-2">{action.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Order Statistics */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{t('admin.stats.orders')}</h2>
            <button
              onClick={() => navigate('/admin/orders')}
              className="text-sb-green hover:underline text-sm"
            >
              {t('common.all')}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <div className="text-sm text-gray-600 mb-1">{t('admin.dashboard.todayOrders')}</div>
              <div className="text-2xl font-bold text-blue-600">{stats?.todayOrders || 0}</div>
              <div className="text-xs text-gray-500 mt-1">{t('order.pickupNumber')}: {stats?.todayPickupCount || 0}</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
              <div className="text-sm text-gray-600 mb-1">{t('admin.dashboard.monthOrders')}</div>
              <div className="text-2xl font-bold text-purple-600">{stats?.monthOrders || 0}</div>
              <div className="text-xs text-gray-500 mt-1">{t('admin.dashboard.totalOrders')}: {stats?.totalOrders || 0}</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <div className="text-sm text-gray-600 mb-1">{t('admin.dashboard.monthRevenue')}</div>
              <div className="text-2xl font-bold text-green-600">¥{(stats?.monthRevenue || 0).toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-1">{t('admin.dashboard.totalRevenue')}: ¥{(stats?.totalRevenue || 0).toFixed(2)}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats?.pendingOrders || 0}</div>
              <div className="text-sm text-gray-600 mt-1">{t('admin.orders.status.pending')}</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats?.preparingOrders || 0}</div>
              <div className="text-sm text-gray-600 mt-1">{t('admin.orders.status.preparing')}</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats?.readyOrders || 0}</div>
              <div className="text-sm text-gray-600 mt-1">{t('admin.orders.status.ready')}</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{stats?.totalOrders || 0}</div>
              <div className="text-sm text-gray-600 mt-1">{t('admin.dashboard.totalOrders')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
