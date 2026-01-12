import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import BottomNav from '../components/BottomNav';

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
      <div className="min-h-screen bg-gradient-to-br from-sb-light-green/30 via-white to-gray-50">
        <div className="bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm border-b border-gray-100">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="ml-4 text-xl font-bold text-gray-900">{t('cart.title')}</h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-32 px-4">
          <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-gray-600 text-xl font-semibold mb-2">{t('cart.empty')}</p>
          <p className="text-gray-400 text-sm mb-8">{t('cart.emptyDesc')}</p>
          <button
            onClick={() => navigate('/menu')}
            className="btn-primary"
          >
            {t('menu.scanToOrder')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sb-light-green/20 via-white to-gray-50 pb-32">
      {/* Header */}
        <div className="bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm border-b border-gray-100">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="ml-4 text-xl font-bold text-gray-900">{t('cart.title')}</h1>
              <span className="ml-3 px-3 py-1 bg-sb-green/10 text-sb-green rounded-full text-sm font-semibold">
                {cart.length} {t('cart.itemCount')}
              </span>
            </div>
            <LanguageSwitcher variant="light" />
          <button
            onClick={async () => {
              if (confirm(t('cart.clear') + '?')) {
                await clearCart();
              }
            }}
            className="text-sm text-red-500 hover:text-red-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            {t('cart.clear')}
          </button>
        </div>
      </div>

      {/* Cart Items */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {cart.map((item, index) => (
          <div 
            key={item.id} 
            className="card card-hover animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex gap-4 p-4">
              <div className="relative">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-24 h-24 rounded-2xl object-cover flex-shrink-0 shadow-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=星巴克';
                  }}
                />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-sb-green rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                  {item.quantity}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 mb-1 text-lg">{item.name}</h3>
                {item.size && (
                  <p className="text-sm text-gray-500 mb-1 font-medium">{item.size}</p>
                )}
                {item.customizations && item.customizations.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.customizations.map((c, idx) => (
                      <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                        {c.name}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between mt-3">
                  <div className="text-2xl font-bold bg-gradient-to-r from-sb-green to-sb-dark-green bg-clip-text text-transparent">
                    ¥{(item.price * item.quantity).toFixed(2)}
                  </div>
                  <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-9 h-9 rounded-lg bg-white flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="font-bold w-8 text-center text-gray-900">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-9 h-9 rounded-lg bg-white flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      <svg className="w-5 h-5 text-sb-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => removeFromCart(item.id)}
                className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-xl"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Bar - 高级设计 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-2xl">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-gray-600 text-sm font-medium">{t('cart.total')}</span>
              <p className="text-3xl font-bold bg-gradient-to-r from-sb-green to-sb-dark-green bg-clip-text text-transparent">
                ¥{getTotal().toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">{cart.length} {t('cart.itemCount')}</p>
            </div>
          </div>
          <button
            onClick={handleCheckout}
            className="btn-primary w-full text-lg py-4"
          >
            {t('cart.checkout')}
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
