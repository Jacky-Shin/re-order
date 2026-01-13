import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderApi, paymentApi, adminApi } from '../api/client';
import { Order, Payment } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { onDatabaseUpdate } from '../utils/storageSync';
import { firebaseService } from '../services/firebaseService';
import LanguageSwitcher from '../components/LanguageSwitcher';
import BottomNav from '../components/BottomNav';
import { withTimeout, safeAsync, debounce } from '../utils/errorHandler';

export default function OrderStatusPage() {
  const { orderNumber, orderId } = useParams<{ orderNumber?: string; orderId?: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(true);
  const [queueInfo, setQueueInfo] = useState<{ currentOrderNumber: string | null; aheadCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);
  const MAX_RETRIES = 5;

  useEffect(() => {
    if (orderId) {
      loadOrderById(orderId);
    } else if (orderNumber) {
      loadOrderByNumber(orderNumber);
    }
  }, [orderId, orderNumber]);

  // 实时监听订单更新（Firebase + localStorage）
  useEffect(() => {
    if (!order) return;

    const unsubscribes: (() => void)[] = [];
    
    // localStorage同步
    const localStorageUnsubscribe = onDatabaseUpdate((key: string) => {
      if (key === 'db_orders') {
        console.log('📢 检测到订单更新，刷新订单状态...');
        if (orderId) {
          loadOrderById(orderId);
        } else if (orderNumber) {
          loadOrderByNumber(orderNumber);
        }
      }
    });
    unsubscribes.push(localStorageUnsubscribe);
    
    // Firebase实时同步
    if (firebaseService.isAvailable() && orderId) {
      console.log('📢 启用Firebase实时监听订单更新...', orderId);
      const firebaseUnsubscribe = firebaseService.onOrdersChange((orders: Order[]) => {
        const updatedOrder = orders.find(o => o.id === orderId);
        if (updatedOrder) {
          console.log('📢 Firebase订单状态已更新:', updatedOrder.status);
          setOrder(updatedOrder);
          // 如果订单已完成或已取消，停止轮询
          if (updatedOrder.status === 'completed' || updatedOrder.status === 'cancelled') {
            setPolling(false);
          }
          // 加载支付信息
          if (updatedOrder.paymentId) {
            paymentApi.getById(updatedOrder.paymentId)
              .then(response => setPayment(response.data))
              .catch(error => console.error('加载支付信息失败:', error));
          }
        }
      });
      unsubscribes.push(firebaseUnsubscribe);
    }
    
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [order, orderId, orderNumber]);

  // 轮询作为后备方案（如果实时监听不可用）- 优化：增加间隔，添加错误处理
  useEffect(() => {
    if (!polling || !order) return;

    // 清理之前的轮询
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    // 使用防抖的加载函数，避免频繁请求
    const debouncedLoad = debounce(async () => {
      try {
        if (orderId) {
          await loadOrderById(orderId);
          retryCountRef.current = 0; // 成功后重置重试计数
        } else if (orderNumber) {
          await loadOrderByNumber(orderNumber);
          retryCountRef.current = 0;
        }
      } catch (error) {
        retryCountRef.current += 1;
        if (retryCountRef.current >= MAX_RETRIES) {
          console.error('轮询失败次数过多，停止轮询');
          setPolling(false);
          setError('无法获取订单更新，请刷新页面');
        }
      }
    }, 500);

    // 初始延迟后开始轮询，然后每5秒轮询一次（减少频率）
    pollingRef.current = setInterval(() => {
      debouncedLoad();
    }, 5000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [polling, orderId, orderNumber, order]);

  const loadOrderById = async (id: string) => {
    try {
      setError(null);
      // 添加超时处理，避免长时间等待
      const response = await withTimeout(
        orderApi.getById(id),
        10000,
        '加载订单超时，请检查网络连接'
      );
      
      setOrder(response.data);
      setLoading(false);
      
      // 加载支付信息（使用安全异步，避免阻塞）
      if (response.data.paymentId) {
        await safeAsync(async () => {
          const paymentResponse = await withTimeout(
            paymentApi.getById(response.data.paymentId!),
            5000,
            '加载支付信息超时'
          );
          setPayment(paymentResponse.data);
        }, (err) => {
          console.warn('加载支付信息失败（非关键）:', err);
        });
      }
      
      // 加载排队信息（使用安全异步）
      await safeAsync(async () => {
        await loadQueueInfo(response.data);
      }, (err) => {
        console.warn('加载排队信息失败（非关键）:', err);
      });
      
      // 如果订单已完成或已取消，停止轮询
      if (response.data.status === 'completed' || response.data.status === 'cancelled') {
        setPolling(false);
      }
    } catch (error: any) {
      console.error('加载订单失败:', error);
      setError(error.message || '加载订单失败，请刷新页面重试');
      setLoading(false);
      // 如果是超时错误，不停止轮询，继续尝试
      if (!error.message?.includes('超时')) {
        retryCountRef.current += 1;
        if (retryCountRef.current >= MAX_RETRIES) {
          setPolling(false);
        }
      }
    }
  };

  const loadQueueInfo = async (currentOrder: Order) => {
    try {
      // 添加超时处理，避免长时间等待
      const response = await withTimeout(
        adminApi.getAllOrders(),
        8000,
        '加载排队信息超时'
      );
      
      const allOrders = response.data;
      
      // 限制处理的数据量，避免性能问题
      const maxOrders = 100;
      const limitedOrders = allOrders.slice(0, maxOrders);
      
      // 筛选出待处理和制作中的订单，按创建时间排序
      const pendingOrders = limitedOrders
        .filter(o => o.status === 'pending' || o.status === 'preparing')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      // 找到当前正在制作的订单（第一个 preparing 状态的订单）
      const currentPreparingOrder = pendingOrders.find(o => o.status === 'preparing');
      const currentOrderNumber = currentPreparingOrder?.orderNumber || null;
      
      // 计算前方还有多少订单
      const currentOrderIndex = pendingOrders.findIndex(o => o.id === currentOrder.id);
      const aheadCount = currentOrderIndex > 0 ? currentOrderIndex : 0;
      
      setQueueInfo({
        currentOrderNumber,
        aheadCount,
      });
    } catch (error: any) {
      console.error('加载排队信息失败:', error);
      // 排队信息加载失败不影响主流程，静默处理
    }
  };

  const loadOrderByNumber = async (num: string) => {
    try {
      setError(null);
      // 添加超时处理
      const response = await withTimeout(
        orderApi.getByNumber(num),
        10000,
        '加载订单超时，请检查网络连接'
      );
      
      setOrder(response.data);
      setLoading(false);
      
      // 加载支付信息（使用安全异步）
      if (response.data.paymentId) {
        await safeAsync(async () => {
          const paymentResponse = await withTimeout(
            paymentApi.getById(response.data.paymentId!),
            5000,
            '加载支付信息超时'
          );
          setPayment(paymentResponse.data);
        }, (err) => {
          console.warn('加载支付信息失败（非关键）:', err);
        });
      }
      
      // 加载排队信息（使用安全异步）
      await safeAsync(async () => {
        await loadQueueInfo(response.data);
      }, (err) => {
        console.warn('加载排队信息失败（非关键）:', err);
      });
      
      // 如果订单已完成或已取消，停止轮询
      if (response.data.status === 'completed' || response.data.status === 'cancelled') {
        setPolling(false);
      }
    } catch (error: any) {
      console.error('加载订单失败:', error);
      setError(error.message || '加载订单失败，请刷新页面重试');
      setLoading(false);
      // 如果是超时错误，不停止轮询，继续尝试
      if (!error.message?.includes('超时')) {
        retryCountRef.current += 1;
        if (retryCountRef.current >= MAX_RETRIES) {
          setPolling(false);
        }
      }
    }
  };


  const getStatusText = (status: Order['status']) => {
    const statusMap = {
      pending: order?.paymentStatus === 'processing' ? t('order.status.pending') : t('order.status.pending'),
      preparing: t('order.status.preparing'),
      ready: t('order.status.ready'),
      completed: t('order.status.completed'),
      cancelled: t('order.status.cancelled'),
    };
    return statusMap[status];
  };

  const getPaymentMethodText = (method?: string) => {
    const methodMap: Record<string, string> = {
      cash: t('payment.cash'),
      card: t('payment.card'),
      visa: t('payment.visa'),
    };
    return methodMap[method || ''] || t('common.all');
  };

  const getStatusColor = (status: Order['status']) => {
    const colorMap = {
      pending: 'text-yellow-600 bg-yellow-100',
      preparing: 'text-blue-600 bg-blue-100',
      ready: 'text-green-600 bg-green-100',
      completed: 'text-gray-600 bg-gray-100',
      cancelled: 'text-red-600 bg-red-100',
    };
    return colorMap[status];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sb-green"></div>
          <p className="mt-4 text-gray-500">{t('common.loading')}</p>
          {error && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-yellow-800">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  if (orderId) {
                    loadOrderById(orderId);
                  } else if (orderNumber) {
                    loadOrderByNumber(orderNumber);
                  }
                }}
                className="mt-2 text-sm text-yellow-600 hover:text-yellow-800 underline"
              >
                重试
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{error || t('common.error')}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                if (orderId) {
                  loadOrderById(orderId);
                } else if (orderNumber) {
                  loadOrderByNumber(orderNumber);
                }
              }}
              className="px-4 py-2 bg-sb-green text-white rounded-lg hover:bg-opacity-90"
            >
              重试
            </button>
            <button
              onClick={() => navigate('/menu')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              {t('common.back')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sb-light-green/20 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/menu')}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h1 className="ml-4 text-xl font-bold text-gray-900">{t('orderStatus.title')}</h1>
          </div>
          <LanguageSwitcher variant="light" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 错误提示 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  if (orderId) {
                    loadOrderById(orderId);
                  } else if (orderNumber) {
                    loadOrderByNumber(orderNumber);
                  }
                }}
                className="text-sm text-red-600 hover:text-red-800 underline"
              >
                重试
              </button>
            </div>
          </div>
        )}
        
        {/* Order Status */}
        <div className="card p-8 mb-6 text-center">
          <div className={`inline-block px-6 py-3 rounded-2xl mb-6 text-lg font-bold shadow-lg ${getStatusColor(order.status)}`}>
            {getStatusText(order.status)}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('order.orderNumber')}: <span className="bg-gradient-to-r from-sb-green to-sb-dark-green bg-clip-text text-transparent">{order.orderNumber}</span></h2>
          {order.orderCode && (
            <p className="text-lg text-gray-600 mb-4">
              {t('order.orderCode')}: <span className="font-mono font-semibold text-gray-800">{order.orderCode}</span>
            </p>
          )}
          
          {/* 排队提示 */}
          {(order.status === 'pending' || order.status === 'preparing') && queueInfo && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="text-sm text-blue-700 mb-2 font-medium">
                {t('orderStatus.queueInfo.yourOrder')}: <span className="font-bold text-lg">{order.orderNumber}</span>
              </div>
              {queueInfo.currentOrderNumber && (
                <div className="text-sm text-blue-700 mb-2">
                  {t('orderStatus.queueInfo.currentPreparing')}: <span className="font-semibold">{queueInfo.currentOrderNumber}</span>
                </div>
              )}
              {queueInfo.aheadCount > 0 && (
                <div className="text-sm text-blue-700">
                  {t('orderStatus.queueInfo.aheadCount')}: <span className="font-bold text-lg text-blue-900">{queueInfo.aheadCount}</span>
                </div>
              )}
            </div>
          )}
          {order.pickupNumber && (
            <div className="mb-3">
              <p className="text-lg font-semibold text-sb-green">
                {t('order.pickupNumber')}: <span className="text-3xl">{order.pickupNumber}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">{t('orderStatus.rememberPickupNumber')}</p>
            </div>
          )}
          {order.tableNumber && (
            <div className="mb-3 p-3 bg-sb-light-green rounded-lg inline-block">
              <p className="text-sm text-gray-600 mb-1">{t('order.tableNumber')}</p>
              <p className="text-2xl font-bold text-sb-green">{order.tableNumber}</p>
            </div>
          )}
        </div>

        {/* Notification Banner - 移到核心位置 */}
        <div className="card mb-6 overflow-hidden">
          {order.status === 'pending' && (
            <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400">
              <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center text-3xl">
                ⏳
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-yellow-900 text-lg">{t('orderStatus.notification.queuing')}</h3>
                <p className="text-sm text-yellow-700 mt-1 font-medium">{t('orderStatus.notification.queuingDesc')}</p>
              </div>
            </div>
          )}
          {order.status === 'preparing' && (
            <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl">
                👨‍🍳
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-blue-900 text-lg">{t('orderStatus.notification.preparing')}</h3>
                <p className="text-sm text-blue-700 mt-1 font-medium">{t('orderStatus.notification.preparingDesc')}</p>
              </div>
            </div>
          )}
          {order.status === 'ready' && (
            <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-400">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-3xl">
                ✅
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-green-900 text-lg">{t('orderStatus.notification.ready')}</h3>
                <p className="text-sm text-green-700 mt-1 font-medium">{t('orderStatus.notification.readyDesc')}</p>
              </div>
            </div>
          )}
        </div>

        {/* 订单准备通知 */}
        {order.status === 'ready' && order.notifiedAt && (
            <div className={`mb-4 mt-4 p-4 rounded-lg border-2 animate-pulse ${
              order.paymentMethod === 'cash' && order.paymentStatus === 'pending'
                ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300'
                : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300'
            }`}>
              <div className="flex items-center justify-center gap-2 mb-2">
                {order.paymentMethod === 'cash' && order.paymentStatus === 'pending' ? (
                  <span className="text-3xl">💵</span>
                ) : (
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                )}
                <h3 className={`text-xl font-bold ${
                  order.paymentMethod === 'cash' && order.paymentStatus === 'pending'
                    ? 'text-yellow-700'
                    : 'text-green-700'
                }`}>
                  {order.paymentMethod === 'cash' && order.paymentStatus === 'pending'
                    ? t('order.readyNotification.cashTitle')
                    : t('order.readyNotification.title')}
                </h3>
              </div>
              <p className={`text-base font-semibold mb-2 ${
                order.paymentMethod === 'cash' && order.paymentStatus === 'pending'
                  ? 'text-yellow-800'
                  : 'text-green-800'
              }`}>
                {order.paymentMethod === 'cash' && order.paymentStatus === 'pending'
                  ? t('order.readyNotification.cashMessage')
                  : t('order.readyNotification.message')}
              </p>
              {order.paymentMethod === 'cash' && order.paymentStatus === 'pending' && (
                <div className="bg-white bg-opacity-50 rounded-lg p-3 mb-2">
                  <p className="text-sm font-semibold text-yellow-900">
                    {t('order.readyNotification.paymentAmount')}: <span className="text-lg">${order.totalAmount.toFixed(2)}</span>
                  </p>
                </div>
              )}
              <p className={`text-xs mt-2 ${
                order.paymentMethod === 'cash' && order.paymentStatus === 'pending'
                  ? 'text-yellow-600'
                  : 'text-green-600'
              }`}>
                {t('order.readyNotification.notifiedAt')}: {new Date(order.notifiedAt).toLocaleString('es-ES', {
                  year: 'numeric',
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </p>
            </div>
          )}

        {/* Order Items */}
        <div className="card p-6 mb-6">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-gradient-to-b from-sb-green to-sb-dark-green rounded-full"></div>
            {t('orderStatus.orderItems')}
          </h3>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=星巴克';
                  }}
                />
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  {item.size && <div className="text-sm text-gray-500">{item.size}</div>}
                  {item.customizations && item.customizations.length > 0 && (
                    <div className="text-sm text-gray-500">
                      {item.customizations.map((c, idx) => (
                        <span key={idx}>
                          {c.name}
                          {idx < item.customizations!.length - 1 && ', '}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="text-sm text-gray-500">x{item.quantity}</div>
                </div>
                <div className="text-sb-green font-semibold">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t mt-4 pt-4 flex justify-between items-center">
            <span className="text-lg font-semibold">{t('order.total')}</span>
            <span className="text-2xl font-bold text-sb-green">${order.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Customer Info */}
        {(order.customerName || order.phone) && (
          <div className="card p-6 mb-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-sb-green to-sb-dark-green rounded-full"></div>
              {t('orderStatus.contactInfo')}
            </h3>
            <div className="space-y-2 text-sm">
              {order.customerName && (
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('orderStatus.name')}:</span>
                  <span className="font-medium">{order.customerName}</span>
                </div>
              )}
              {order.phone && (
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('orderStatus.phone')}:</span>
                  <span className="font-medium">{order.phone}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Info */}
        {payment && (
          <div className="card p-6 mb-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-sb-green to-sb-dark-green rounded-full"></div>
              {t('orderStatus.paymentInfo')}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('orderStatus.paymentMethod')}</span>
                <span className="font-medium">{getPaymentMethodText(payment.method)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('orderStatus.paymentStatus')}</span>
                <span className={`font-medium ${
                  payment.status === 'completed' ? 'text-green-600' :
                  payment.status === 'processing' ? 'text-blue-600' :
                  payment.status === 'failed' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {payment.status === 'completed' ? t('orderStatus.paid') :
                   payment.status === 'processing' ? t('orderStatus.processing') :
                   payment.status === 'failed' ? t('orderStatus.failed') : t('orderStatus.pending')}
                </span>
              </div>
              {payment.transactionId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('orderStatus.transactionId')}</span>
                  <span className="font-mono text-xs">{payment.transactionId}</span>
                </div>
              )}
              {payment.paidAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('orderStatus.paidAt')}</span>
                  <span className="text-gray-700">
                    {new Date(payment.paidAt).toLocaleString('es-ES', {
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        {order.status === 'pending' && order.paymentStatus !== 'completed' && (
          <button
            onClick={() => navigate(`/payment/${order.id}`)}
            className="btn-primary w-full mb-4"
          >
            {order.paymentStatus === 'processing' ? t('orderStatus.paymentProcessing') : t('orderStatus.payNow')}
          </button>
        )}

        {order.status === 'ready' && (
          <div className="card-gradient border-2 border-green-300 rounded-2xl p-6 mb-6 shadow-lg">
            <div className="flex items-center gap-3 text-green-700">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-bold text-lg">{t('orderStatus.orderReadyMessage')}</span>
            </div>
          </div>
        )}

        <button
          onClick={() => navigate('/menu')}
          className="btn-secondary w-full mb-20"
        >
          {t('orderStatus.continueShopping')}
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
