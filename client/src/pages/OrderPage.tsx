import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { orderApi } from '../api/client';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function OrderPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { cart, getTotal, clearCart } = useCart();
  const { t } = useLanguage();
  const [tableNumber, setTableNumber] = useState(searchParams.get('table') || '');
  
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const table = searchParams.get('table');
    if (table) {
      setTableNumber(table);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cart.length === 0) {
      alert(t('order.empty'));
      return;
    }

    setSubmitting(true);
    try {
      const order = await orderApi.create({
        items: cart,
        tableNumber: tableNumber || undefined,
        customerName: customerName || undefined,
        phone: phone || undefined,
      });

      await clearCart();
      // 跳转到支付页面
      navigate(`/payment/${order.data.id}`);
    } catch (error) {
      console.error('提交订单失败:', error);
      alert(t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
          <h1 className="ml-4 text-lg font-semibold">{t('order.title')}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t('order.details')}</h2>
            {tableNumber && (
              <div className="px-4 py-2 bg-sb-light-green rounded-lg">
                <span className="text-sm text-gray-600 mr-2">{t('order.tableNumber')}</span>
                <span className="text-xl font-bold text-sb-green">{tableNumber}</span>
              </div>
            )}
          </div>
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-start">
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
            <span className="text-lg font-semibold">{t('order.total')}</span>
            <span className="text-2xl font-bold text-sb-green">¥{getTotal().toFixed(2)}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">{t('orderStatus.contactInfo')}</h2>
          
          {tableNumber && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('order.tableNumber')}
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-2 border-2 border-sb-green rounded-lg bg-sb-light-green">
                  <span className="text-sm text-gray-600">{t('qrcode.currentTable')}: </span>
                  <span className="text-lg font-bold text-sb-green">{tableNumber}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newTable = prompt(t('order.tableNumberPlaceholder') + ':', tableNumber);
                    if (newTable !== null) {
                      if (newTable.trim() === '') {
                        setTableNumber('');
                        setSearchParams({}, { replace: true });
                      } else {
                        setTableNumber(newTable.trim());
                        setSearchParams({ table: newTable.trim() }, { replace: true });
                      }
                    }
                  }}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t('common.edit')}
                </button>
              </div>
            </div>
          )}
          
          {!tableNumber && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('order.tableNumberPlaceholder')}
              </label>
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => {
                  const value = e.target.value;
                  setTableNumber(value);
                  if (value.trim()) {
                    setSearchParams({ table: value.trim() }, { replace: true });
                  } else {
                    setSearchParams({}, { replace: true });
                  }
                }}
                placeholder={t('order.tableNumberPlaceholder')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sb-green focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">{t('order.tableNumberHint')}</p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('order.customerName')}
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={t('order.customerNamePlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sb-green focus:border-transparent"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('order.phone')}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('order.phonePlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sb-green focus:border-transparent"
            />
          </div>
        </form>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={submitting || cart.length === 0}
          className={`w-full py-3 rounded-lg font-semibold transition-colors ${
            submitting || cart.length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-sb-green text-white hover:bg-opacity-90'
          }`}
        >
          {submitting ? t('order.submitting') : t('order.submit')}
        </button>
      </div>
    </div>
  );
}
