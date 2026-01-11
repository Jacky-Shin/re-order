import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../api/client';
import { Payment } from '../types';

export default function AdminPaymentsPage() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getPayments();
      setPayments(response.data.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error('加载支付记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodText = (method: string) => {
    const methodMap: Record<string, string> = {
      cash: '现金支付',
      card: '银行卡',
      visa: 'Visa',
    };
    return methodMap[method] || method;
  };

  const getStatusColor = (status: Payment['status']) => {
    const colorMap = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colorMap[status];
  };

  const getStatusText = (status: Payment['status']) => {
    const statusMap = {
      pending: '待支付',
      processing: '处理中',
      completed: '已完成',
      failed: '失败',
      cancelled: '已取消',
    };
    return statusMap[status];
  };

  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

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
            <h1 className="ml-4 text-lg font-semibold">支付记录</h1>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">总收入</div>
            <div className="text-2xl font-bold text-sb-green">¥{totalRevenue.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sb-green"></div>
            <p className="mt-4 text-gray-500">Cargando...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500">暂无支付记录</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.payments.transactionId')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">订单号</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">支付方式</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.payments.paidAt')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-mono text-gray-900">
                          {payment.transactionId || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{payment.orderId.slice(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{getPaymentMethodText(payment.method)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-sb-green">¥{payment.amount.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(payment.status)}`}>
                          {getStatusText(payment.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {payment.paidAt 
                            ? new Date(payment.paidAt).toLocaleString('zh-CN')
                            : new Date(payment.createdAt).toLocaleString('zh-CN')}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
