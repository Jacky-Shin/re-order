import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useLanguage } from '../contexts/LanguageContext';
import { adminApi } from '../api/client';
import { ShopSettings } from '../types';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function HomePage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useUser();
  const { t } = useLanguage();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);

  useEffect(() => {
    loadShopSettings();
    // 如果已登录，自动跳转到菜单页
    if (isAuthenticated) {
      navigate('/menu');
    }
  }, [isAuthenticated, navigate]);

  const loadShopSettings = async () => {
    try {
      const response = await adminApi.getShopSettings();
      setShopSettings(response.data);
    } catch (error) {
      console.error('加载店铺设置失败:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(phone, name);
      // 登录成功后跳转到菜单页
      navigate('/menu');
    } catch (err: any) {
      setError(err.message || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 如果已登录，显示加载或直接跳转
  if (isAuthenticated) {
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
    <div className="min-h-screen bg-gradient-to-br from-sb-light-green/30 via-white to-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-sb-green via-sb-green to-sb-dark-green text-white sticky top-0 z-20 shadow-lg">
        <div className="backdrop-blur-sm bg-white/5">
          <div className="flex items-center justify-between max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-2xl">☕</span>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  {shopSettings?.name || t('menu.title')}
                </h1>
              </div>
            </div>
            <LanguageSwitcher variant="light" />
          </div>
        </div>
      </div>

      {/* 店铺图片 */}
      {shopSettings?.bannerImages?.[0] && (
        <div className="w-full h-48 md:h-64 lg:h-80 overflow-hidden relative">
          <img
            src={shopSettings.bannerImages[0]}
            alt={shopSettings.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/shop-banner.jpg';
            }}
          />
        </div>
      )}

      {/* 登录表单 */}
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Registrarse / Iniciar Sesión
            </h2>
            <p className="text-gray-600 text-sm">
              Por favor ingrese su información para continuar
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Teléfono <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ingrese su número de teléfono"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sb-green focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ingrese su nombre"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sb-green focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-sb-green text-white py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Procesando...' : 'Continuar'}
            </button>
          </form>

          <p className="mt-6 text-xs text-center text-gray-500">
            Al continuar, acepta nuestros términos de servicio
          </p>
        </div>
      </div>
    </div>
  );
}

