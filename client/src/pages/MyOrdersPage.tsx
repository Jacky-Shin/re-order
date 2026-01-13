import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useLanguage } from '../contexts/LanguageContext';
import { adminApi } from '../api/client';
import { Order } from '../types';
import { onDatabaseUpdate } from '../utils/storageSync';
import { firebaseService } from '../services/firebaseService';
import LanguageSwitcher from '../components/LanguageSwitcher';
import BottomNav from '../components/BottomNav';

export default function MyOrdersPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUser();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 如果未登录，跳转到首页
    if (!isAuthenticated || !user) {
      navigate('/home');
      return;
    }
    loadOrders();
  }, [isAuthenticated, user, navigate]);

  // 监听数据库更新
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const unsubscribes: (() => void)[] = [];
    
    const localStorageUnsubscribe = onDatabaseUpdate((key: string) => {
      if (key === 'db_orders') {
        loadOrders();
      }
    });
    unsubscribes.push(localStorageUnsubscribe);
    
    if (firebaseService.isAvailable()) {
      const firebaseUnsubscribe = firebaseService.onOrdersChange(() => {
        loadOrders();
      });
      unsubscribes.push(firebaseUnsubscribe);
    }
    
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [isAuthenticated, user]);

  const loadOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await adminApi.getAllOrders();
      // 筛选当前用户的订单（根据电话号码）
      const userOrders = response.data
        .filter(order => order.phone === user.phone)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(userOrders);
    } catch (error) {
      console.error('加载订单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    const colorMap = {
      pending: 'bg-yellow-100 text-yellow-800',
      preparing: 'bg-blue-100 text-blue-800',
      ready: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colorMap[status];
  };

  const getStatusText = (status: Order['status']) => {
    const statusMap = {
      pending: t('admin.orders.status.pending'),
      preparing: t('admin.orders.status.preparing'),
      ready: t('admin.orders.status.ready'),
      completed: t('admin.orders.status.completed'),
      cancelled: t('admin.orders.status.cancelled'),
    };
    return statusMap[status];
  };

  if (!isAuthenticated || !user) {
    return null; // 会跳转到首页
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Mis Pedidos</h1>
          <LanguageSwitcher />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sb-green"></div>
            <p className="mt-4 text-gray-500">{t('common.loading')}</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500 mb-4">No hay pedidos</p>
            <button
              onClick={() => navigate('/menu')}
              className="px-6 py-2 bg-sb-green text-white rounded-lg hover:bg-opacity-90"
            >
              Hacer un pedido
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => navigate(`/order-status/${order.id}`)}
                className="bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {t('admin.orders.orderNumber')}: {order.orderNumber}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    {order.orderCode && (
                      <p className="text-sm text-gray-600 mb-2">
                        {t('order.orderCode')}: <span className="font-mono">{order.orderCode}</span>
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleString('es-ES', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {/* 订单商品预览 */}
                <div className="mb-4">
                  <div className="space-y-2">
                    {order.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center gap-3 text-sm">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=Starbucks';
                          }}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-gray-500">x{item.quantity}</div>
                        </div>
                        <div className="text-sb-green font-semibold">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-sm text-gray-500 text-center">
                        ... y {order.items.length - 3} más
                      </p>
                    )}
                  </div>
                </div>

                {/* 订单总金额 */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold text-sb-green">
                    ${order.totalAmount.toFixed(2)}
                  </span>
                </div>

                {/* 取单号 */}
                {order.pickupNumber && (
                  <div className="mt-3 p-2 bg-sb-light-green rounded-lg text-center">
                    <p className="text-xs text-gray-600 mb-1">{t('order.pickupNumber')}</p>
                    <p className="text-2xl font-bold text-sb-green">{order.pickupNumber}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

