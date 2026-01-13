import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { adminApi } from '../api/client';
import { Order } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { onDatabaseUpdate } from '../utils/storageSync';
import { firebaseService } from '../services/firebaseService';

export default function AdminOrdersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>(searchParams.get('status') || 'pending');

  useEffect(() => {
    loadOrders();
  }, []);

  // 监听数据库更新事件（当用户下单时自动刷新）
  useEffect(() => {
    const unsubscribes: (() => void)[] = [];
    let pollInterval: NodeJS.Timeout | null = null;
    
    // localStorage同步
    const localStorageUnsubscribe = onDatabaseUpdate((key: string) => {
      if (key === 'db_orders') {
        console.log('🔄 检测到订单数据更新，刷新订单列表...');
        loadOrders();
      }
    });
    unsubscribes.push(localStorageUnsubscribe);
    
    // Firebase实时同步
    if (firebaseService.isAvailable()) {
      const firebaseUnsubscribe = firebaseService.onOrdersChange((orders) => {
        console.log('🔄 Firebase订单变化，刷新订单列表...', orders.length);
        loadOrders();
      });
      unsubscribes.push(firebaseUnsubscribe);
    }
    
    // 添加轮询机制作为备用（每5秒检查一次新订单）
    // 这样可以确保即使监听机制失效，也能检测到新订单
    pollInterval = setInterval(() => {
      loadOrders().catch(err => {
        console.warn('轮询检查订单失败:', err);
      });
    }, 5000); // 每5秒轮询一次
    
    return () => {
      unsubscribes.forEach(unsub => unsub());
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, []); // 移除 orders.length 依赖，避免无限循环

  const loadOrders = async () => {
    try {
      const previousOrderCount = orders.length;
      setLoading(true);
      // 添加超时处理，避免长时间等待
      const { withTimeout } = await import('../utils/errorHandler');
      const response = await withTimeout(
        adminApi.getAllOrders(),
        15000,
        '加载订单超时，请检查网络连接'
      );
      
      // 限制订单数量，避免渲染过多数据导致卡顿
      const maxOrders = 200;
      // 按创建时间升序排序：先下单的排在最前面（最早的订单优先处理）
      const sortedOrders = response.data
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .slice(0, maxOrders);
      
      setOrders(sortedOrders);
      
      // 如果订单数量增加，说明有新订单
      if (sortedOrders.length > previousOrderCount) {
        const newOrdersCount = sortedOrders.length - previousOrderCount;
        console.log(`🆕 检测到 ${newOrdersCount} 个新订单，已自动刷新`);
        // 可以在这里添加通知或提示
      }
    } catch (error: any) {
      console.error('加载订单失败:', error);
      // 轮询时静默失败，避免频繁弹窗
      if (!error.message?.includes('轮询')) {
        alert(error.message || '加载订单失败，请刷新页面重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      console.log('📝 更新订单状态...', { orderId, newStatus });
      await adminApi.updateOrderStatus(orderId, newStatus);
      console.log('✅ 订单状态更新成功');
      await loadOrders();
    } catch (error: any) {
      console.error('❌ 更新订单状态失败:', error);
      const errorMessage = error?.response?.data?.error || error?.message || '更新状态失败';
      alert(errorMessage);
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

  const getPaymentMethodText = (method?: string) => {
    const methodMap: Record<string, string> = {
      cash: t('payment.cash'),
      card: t('payment.card'),
      visa: t('payment.visa'),
    };
    return methodMap[method || ''] || t('admin.orders.unpaid');
  };

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(o => o.status === filterStatus);

  const statusFilters = [
    { value: 'pending', label: 'Pendientes' },
    { value: 'preparing', label: t('admin.orders.status.preparing') },
    { value: 'ready', label: t('admin.orders.status.ready') },
    { value: 'completed', label: t('admin.orders.status.completed') },
    { value: 'all', label: 'Todos los pedidos' },
  ];

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
            <h1 className="ml-4 text-lg font-semibold">{t('admin.orders.title')}</h1>
          </div>
          <div className="flex items-center gap-3" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setFilterStatus(filter.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === filter.value
                    ? 'bg-sb-green text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sb-green"></div>
            <p className="mt-4 text-gray-500">{t('common.loading')}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500">{t('admin.orders.empty')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-semibold">{t('admin.orders.orderNumber')}: {order.orderNumber}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                      {order.pickupNumber && (
                        <span className="px-3 py-1 bg-sb-green text-white rounded-full text-sm font-semibold">
                          {t('admin.orders.pickupNumber')}: {order.pickupNumber}
                        </span>
                      )}
                      {order.tableNumber && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                          🪑 {t('admin.orders.tableNumber')}: {order.tableNumber}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>{t('admin.orders.createdAt')}: {new Date(order.createdAt).toLocaleString('es-ES', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}</p>
                      {order.pickupDate && (
                        <p>{t('admin.orders.pickupDate')}: {order.pickupDate}</p>
                      )}
                      {order.customerName && <p>{t('admin.orders.customer')}: {order.customerName}</p>}
                      {order.phone && <p>{t('admin.orders.phone')}: {order.phone}</p>}
                      {order.paymentMethod && (
                        <p>{t('admin.orders.paymentMethod')}: {getPaymentMethodText(order.paymentMethod)}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-sb-green mb-2">
                      ${order.totalAmount.toFixed(2)}
                    </div>
                    {order.paymentStatus === 'completed' && (
                      <span className="text-xs text-green-600">{t('admin.orders.paid')}</span>
                    )}
                    {order.paymentStatus === 'pending' && order.paymentMethod === 'cash' && (
                      <span className="text-xs text-yellow-600 font-semibold">{t('admin.orders.cashPaymentPending')}</span>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4 mb-4">
                  <h4 className="font-medium mb-2">{t('admin.orders.items')}</h4>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>
                          {item.name} {item.size && `(${item.size})`} x{item.quantity}
                        </span>
                        <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    {/* 现金支付标识 */}
                    {order.paymentMethod === 'cash' && (
                      <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                        <span className="font-semibold text-yellow-600">💵 {t('payment.cashPayment')}</span>
                        <span className="font-semibold text-yellow-600">${order.totalAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Actions */}
                {order.status !== 'completed' && order.status !== 'cancelled' && (
                  <div className="border-t pt-4">
                    <div className="flex gap-2 flex-wrap">
                      {/* 去掉开始制作步骤，pending 状态直接可以通知客户取餐 */}
                      {(order.status === 'pending' || order.status === 'preparing') && (
                        <button
                          onClick={async () => {
                            try {
                              // 如果订单是 pending 状态，先更新为 preparing，然后通知客户
                              if (order.status === 'pending') {
                                await handleStatusChange(order.id, 'preparing');
                              }
                              console.log('📢 通知客户取餐...', { orderId: order.id });
                              const response = await adminApi.notifyCustomer(order.id);
                              console.log('✅ 通知客户成功:', response);
                              alert(t('admin.orders.notified'));
                              await loadOrders();
                            } catch (error: any) {
                              console.error('❌ 通知客户失败:', error);
                              const errorMessage = error?.response?.data?.error || error?.message || t('common.error');
                              alert(errorMessage);
                            }
                          }}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
                        >
                          📢 {t('admin.orders.notifyCustomer')}
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <>
                          {order.notifiedAt && (
                            <span className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm flex items-center">
                              ✓ {t('admin.orders.notified')} ({new Date(order.notifiedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })})
                            </span>
                          )}
                          <button
                            onClick={() => handleStatusChange(order.id, 'completed')}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                          >
                            {t('admin.orders.complete')}
                          </button>
                        </>
                      )}
                      {(order.status === 'pending' || order.status === 'preparing' || order.status === 'ready') && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'cancelled')}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          {t('admin.orders.cancel')}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
