import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderApi, paymentApi } from '../api/client';
import { Order, Payment } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

export default function OrderStatusPage() {
  const { orderNumber, orderId } = useParams<{ orderNumber?: string; orderId?: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    if (orderId) {
      loadOrderById(orderId);
    } else if (orderNumber) {
      loadOrderByNumber(orderNumber);
    }
  }, [orderId, orderNumber]);

  useEffect(() => {
    if (!polling || !order) return;

    const interval = setInterval(() => {
      if (orderId) {
        loadOrderById(orderId);
      } else if (orderNumber) {
        loadOrderByNumber(orderNumber);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [polling, orderId, orderNumber]);

  const loadOrderById = async (id: string) => {
    try {
      const response = await orderApi.getById(id);
      setOrder(response.data);
      setLoading(false);
      
      // 加载支付信息
      if (response.data.paymentId) {
        try {
          const paymentResponse = await paymentApi.getById(response.data.paymentId);
          setPayment(paymentResponse.data);
        } catch (error) {
          console.error('加载支付信息失败:', error);
        }
      }
      
      // 如果订单已完成或已取消，停止轮询
      if (response.data.status === 'completed' || response.data.status === 'cancelled') {
        setPolling(false);
      }
    } catch (error) {
      console.error('加载订单失败:', error);
      setLoading(false);
    }
  };

  const loadOrderByNumber = async (num: string) => {
    try {
      const response = await orderApi.getByNumber(num);
      setOrder(response.data);
      setLoading(false);
      
      // 加载支付信息
      if (response.data.paymentId) {
        try {
          const paymentResponse = await paymentApi.getById(response.data.paymentId);
          setPayment(paymentResponse.data);
        } catch (error) {
          console.error('加载支付信息失败:', error);
        }
      }
      
      // 如果订单已完成或已取消，停止轮询
      if (response.data.status === 'completed' || response.data.status === 'cancelled') {
        setPolling(false);
      }
    } catch (error) {
      console.error('加载订单失败:', error);
      setLoading(false);
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
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{t('common.error')}</p>
          <button
            onClick={() => navigate('/menu')}
            className="text-sb-green hover:underline"
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center">
          <button
            onClick={() => navigate('/menu')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h1 className="ml-4 text-lg font-semibold">{t('orderStatus.title')}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Notification Banner */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          {order.status === 'pending' && (
            <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <span className="text-2xl">⏳</span>
              <div>
                <h3 className="font-semibold text-yellow-900">{t('orderStatus.notification.queuing')}</h3>
                <p className="text-sm text-yellow-700 mt-1">{t('orderStatus.notification.queuingDesc')}</p>
              </div>
            </div>
          )}
          {order.status === 'preparing' && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-2xl">👨‍🍳</span>
              <div>
                <h3 className="font-semibold text-blue-900">{t('orderStatus.notification.preparing')}</h3>
                <p className="text-sm text-blue-700 mt-1">{t('orderStatus.notification.preparingDesc')}</p>
              </div>
            </div>
          )}
          {order.status === 'ready' && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-2xl">✅</span>
              <div>
                <h3 className="font-semibold text-green-900">{t('orderStatus.notification.ready')}</h3>
                <p className="text-sm text-green-700 mt-1">{t('orderStatus.notification.readyDesc')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Order Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 text-center">
          <div className={`inline-block px-4 py-2 rounded-full mb-4 ${getStatusColor(order.status)}`}>
            {getStatusText(order.status)}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('order.orderNumber')}: {order.orderNumber}</h2>
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
                    {t('order.readyNotification.paymentAmount')}: <span className="text-lg">¥{order.totalAmount.toFixed(2)}</span>
                  </p>
                </div>
              )}
              <p className={`text-xs mt-2 ${
                order.paymentMethod === 'cash' && order.paymentStatus === 'pending'
                  ? 'text-yellow-600'
                  : 'text-green-600'
              }`}>
                {t('order.readyNotification.notifiedAt')}: {new Date(order.notifiedAt).toLocaleString()}
              </p>
            </div>
          )}
          
          <p className="text-gray-500 text-sm mt-3">
            {t('order.createdAt')}: {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <h3 className="text-lg font-semibold mb-4">订单明细</h3>
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
                  ¥{(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t mt-4 pt-4 flex justify-between items-center">
            <span className="text-lg font-semibold">总计</span>
            <span className="text-2xl font-bold text-sb-green">¥{order.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Customer Info */}
        {(order.customerName || order.phone) && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <h3 className="text-lg font-semibold mb-4">联系信息</h3>
            <div className="space-y-2 text-sm">
              {order.customerName && (
                <div className="flex justify-between">
                  <span className="text-gray-500">姓名:</span>
                  <span className="font-medium">{order.customerName}</span>
                </div>
              )}
              {order.phone && (
                <div className="flex justify-between">
                  <span className="text-gray-500">手机号:</span>
                  <span className="font-medium">{order.phone}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Info */}
        {payment && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <h3 className="text-lg font-semibold mb-3">支付信息</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">支付方式</span>
                <span className="font-medium">{getPaymentMethodText(payment.method)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">支付状态</span>
                <span className={`font-medium ${
                  payment.status === 'completed' ? 'text-green-600' :
                  payment.status === 'processing' ? 'text-blue-600' :
                  payment.status === 'failed' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {payment.status === 'completed' ? '已支付' :
                   payment.status === 'processing' ? '处理中' :
                   payment.status === 'failed' ? '支付失败' : '待支付'}
                </span>
              </div>
              {payment.transactionId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">交易号</span>
                  <span className="font-mono text-xs">{payment.transactionId}</span>
                </div>
              )}
              {payment.paidAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">支付时间</span>
                  <span className="text-gray-700">
                    {new Date(payment.paidAt).toLocaleString('zh-CN')}
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
            className="w-full bg-sb-green text-white py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors mb-4"
          >
            {order.paymentStatus === 'processing' ? '支付处理中...' : '立即支付'}
          </button>
        )}

        {order.status === 'ready' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-green-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold">您的订单已准备好，请前往取餐台取餐</span>
            </div>
          </div>
        )}

        <button
          onClick={() => navigate('/menu')}
          className="w-full border-2 border-sb-green text-sb-green py-3 rounded-lg font-semibold hover:bg-sb-light-green transition-colors"
        >
          继续点餐
        </button>
      </div>
    </div>
  );
}
