import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { paymentApi, orderApi } from '../api/client';
import { PaymentMethod, CardInfo } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

export default function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cardInfo, setCardInfo] = useState<CardInfo>({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });
  const [processing, setProcessing] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const response = await orderApi.getById(orderId!);
      setOrder(response.data);
    } catch (error) {
      console.error('加载订单失败:', error);
      alert(t('payment.loadOrderFailed'));
      navigate('/menu');
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const match = cleaned.match(/.{1,4}/g);
    return match ? match.join(' ') : cleaned;
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const handleCardInfoChange = (field: keyof CardInfo, value: string) => {
    if (field === 'cardNumber') {
      setCardInfo({ ...cardInfo, cardNumber: formatCardNumber(value).slice(0, 19) });
    } else if (field === 'expiryDate') {
      setCardInfo({ ...cardInfo, expiryDate: formatExpiryDate(value).slice(0, 5) });
    } else if (field === 'cvv') {
      setCardInfo({ ...cardInfo, cvv: value.replace(/\D/g, '').slice(0, 4) });
    } else {
      setCardInfo({ ...cardInfo, [field]: value });
    }
  };

  const validateCardInfo = (): boolean => {
    if (paymentMethod === 'cash') return true;
    
    const cleanedCardNumber = cardInfo.cardNumber.replace(/\s/g, '');
    if (cleanedCardNumber.length < 13 || cleanedCardNumber.length > 19) {
      alert(t('payment.invalidCardNumber'));
      return false;
    }
    
    if (!cardInfo.expiryDate || cardInfo.expiryDate.length !== 5) {
      alert(t('payment.invalidExpiryDate'));
      return false;
    }
    
    if (!cardInfo.cvv || cardInfo.cvv.length < 3) {
      alert(t('payment.invalidCVV'));
      return false;
    }
    
    return true;
  };

  const handlePayment = async () => {
    if (!validateCardInfo()) return;
    
    if (!orderId) {
      alert(t('payment.orderIdNotFound'));
      return;
    }

    setProcessing(true);
    try {
      const response = await paymentApi.process({
        orderId,
        method: paymentMethod,
        cardInfo: paymentMethod !== 'cash' ? cardInfo : undefined,
      });

      if (response.data.success) {
        // 跳转到订单详情页（使用订单ID）
        navigate(`/order-status/${order.id}`);
      } else {
        alert(t('payment.paymentFailed') + ': ' + (response.data.message || t('payment.paymentFailedUnknown')));
      }
    } catch (error: any) {
      console.error('支付失败:', error);
      alert(t('payment.paymentFailed') + ': ' + (error.response?.data?.error || t('payment.paymentFailedNetwork')));
    } finally {
      setProcessing(false);
    }
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
          <p className="text-gray-500 mb-4">订单未找到</p>
          <button
            onClick={() => navigate('/menu')}
            className="text-sb-green hover:underline"
          >
            返回菜单
          </button>
        </div>
      </div>
    );
  }

  const paymentMethods = [
    { value: 'cash' as PaymentMethod, label: '现金支付', icon: '💵', description: '到店后现金支付' },
    { value: 'card' as PaymentMethod, label: '银行卡', icon: '💳', description: '使用银行卡支付' },
    { value: 'visa' as PaymentMethod, label: 'Visa', icon: '💳', description: '使用Visa卡支付' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="ml-4 text-lg font-semibold">选择支付方式</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">订单信息</h2>
            {order.tableNumber && (
              <div className="px-3 py-1 bg-sb-light-green rounded-lg">
                <span className="text-sm text-gray-600 mr-1">桌位</span>
                <span className="font-bold text-sb-green">{order.tableNumber}</span>
              </div>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">订单号</span>
              <span className="font-medium">{order.orderNumber}</span>
            </div>
            {order.pickupNumber && (
              <div className="flex justify-between">
                <span className="text-gray-600">取单号</span>
                <span className="font-semibold text-sb-green">{order.pickupNumber}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">订单金额</span>
              <span className="font-bold text-sb-green text-lg">¥{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">选择支付方式</h2>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <button
                key={method.value}
                onClick={() => setPaymentMethod(method.value)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                  paymentMethod === method.value
                    ? 'border-sb-green bg-sb-light-green'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{method.icon}</span>
                    <div>
                      <div className="font-semibold">{method.label}</div>
                      <div className="text-sm text-gray-500">{method.description}</div>
                    </div>
                  </div>
                  {paymentMethod === method.value && (
                    <div className="w-5 h-5 rounded-full bg-sb-green flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Card Info Form */}
        {(paymentMethod === 'card' || paymentMethod === 'visa') && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">银行卡信息</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  持卡人姓名（可选）
                </label>
                <input
                  type="text"
                  value={cardInfo.cardholderName}
                  onChange={(e) => handleCardInfoChange('cardholderName', e.target.value)}
                  placeholder="请输入持卡人姓名"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sb-green focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  卡号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={cardInfo.cardNumber}
                  onChange={(e) => handleCardInfoChange('cardNumber', e.target.value)}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sb-green focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    有效期 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={cardInfo.expiryDate}
                    onChange={(e) => handleCardInfoChange('expiryDate', e.target.value)}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sb-green focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CVV <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={cardInfo.cvv}
                    onChange={(e) => handleCardInfoChange('cvv', e.target.value)}
                    placeholder="123"
                    maxLength={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sb-green focus:border-transparent"
                  />
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                <p>🔒 您的支付信息已加密，安全可靠</p>
              </div>
            </div>
          </div>
        )}

        {/* Cash Payment Notice */}
        {paymentMethod === 'cash' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💵</span>
              <div>
                <h3 className="font-semibold text-yellow-900 mb-1">现金支付</h3>
                <p className="text-sm text-yellow-800 mb-2">
                  选择现金支付后，订单将提交给商家。商家备餐完成后会通知您，届时请前往前台支付现金。
                </p>
                <p className="text-sm font-semibold text-yellow-900">
                  订单金额：<strong>¥{order.totalAmount.toFixed(2)}</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Button */}
        <button
          onClick={handlePayment}
          disabled={processing}
          className={`w-full py-3 rounded-lg font-semibold transition-colors ${
            processing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-sb-green text-white hover:bg-opacity-90'
          }`}
        >
          {processing ? t('payment.processing') : t('common.confirm')}
        </button>
      </div>
    </div>
  );
}
