import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function CartPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cart, updateQuantity, removeFromCart, getTotal, clearCart } = useCart();
  const { t } = useLanguage();
  const tableNumber = searchParams.get('table');

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const url = tableNumber ? `/order?table=${encodeURIComponent(tableNumber)}` : '/order';
    navigate(url);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
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
            <h1 className="ml-4 text-lg font-semibold">{t('cart.title')}</h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <svg className="w-24 h-24 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-500 text-lg mb-4">{t('cart.empty')}</p>
          <button
            onClick={() => navigate('/menu')}
            className="bg-sb-green text-white px-6 py-2 rounded-lg font-semibold hover:bg-opacity-90"
          >
            {t('menu.scanToOrder')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="ml-4 text-lg font-semibold">{t('cart.title')}</h1>
          </div>
          <button
            onClick={async () => {
              if (confirm(t('cart.clear') + '?')) {
                await clearCart();
              }
            }}
            className="text-sm text-red-500 hover:text-red-600"
          >
            {t('cart.clear')}
          </button>
        </div>
      </div>

      {/* Cart Items */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {cart.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex gap-4">
              <img
                src={item.image}
                alt={item.name}
                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=星巴克';
                }}
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                {item.size && (
                  <p className="text-sm text-gray-500 mb-1">{item.size}</p>
                )}
                {item.customizations && item.customizations.length > 0 && (
                  <div className="text-sm text-gray-500 mb-2">
                    {item.customizations.map((c, idx) => (
                      <span key={idx}>
                        {c.name}
                        {idx < item.customizations!.length - 1 && ', '}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between mt-2">
                  <div className="text-sb-green font-bold">¥{item.price.toFixed(2)}</div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-sb-green transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="font-semibold w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-sb-green transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => removeFromCart(item.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600">{t('cart.total')}</span>
            <span className="text-2xl font-bold text-sb-green">¥{getTotal().toFixed(2)}</span>
          </div>
          <button
            onClick={handleCheckout}
            className="w-full bg-sb-green text-white py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
          >
            {t('cart.checkout')}
          </button>
        </div>
      </div>
    </div>
  );
}
