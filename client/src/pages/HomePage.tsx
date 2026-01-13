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
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);

  useEffect(() => {
    loadShopSettings();
    // 加载记住的账号密码
    loadRememberedCredentials();
    // 如果已登录，自动跳转到菜单页
    if (isAuthenticated) {
      navigate('/menu');
    }
  }, [isAuthenticated, navigate]);

  const loadRememberedCredentials = () => {
    const rememberedPhone = localStorage.getItem('remembered_phone');
    const rememberedName = localStorage.getItem('remembered_name');
    const shouldRemember = localStorage.getItem('remember_me') === 'true';
    
    if (shouldRemember && rememberedPhone && rememberedName) {
      setPhone(rememberedPhone);
      setName(rememberedName);
      setRememberMe(true);
    }
  };

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
      
      // 处理记住账号密码
      if (rememberMe) {
        localStorage.setItem('remembered_phone', phone);
        localStorage.setItem('remembered_name', name);
        localStorage.setItem('remember_me', 'true');
      } else {
        localStorage.removeItem('remembered_phone');
        localStorage.removeItem('remembered_name');
        localStorage.removeItem('remember_me');
      }
      
      // 登录成功后跳转到菜单页
      navigate('/menu');
    } catch (err: any) {
      setError(err.message || t('home.loginFailed'));
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
      <div className="w-full h-48 md:h-64 lg:h-80 overflow-hidden relative bg-gradient-to-br from-sb-light-green/50 to-sb-green/30">
        {shopSettings?.bannerImages && shopSettings.bannerImages.length > 0 && shopSettings.bannerImages[0] ? (
          <img
            src={shopSettings.bannerImages[0]}
            alt={shopSettings.name || t('menu.title')}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('店铺图片加载失败:', shopSettings.bannerImages[0]);
              // 图片加载失败时隐藏图片，显示占位符
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
              // 显示占位符
              const placeholder = img.parentElement?.querySelector('.placeholder') as HTMLElement;
              if (placeholder) {
                placeholder.style.display = 'flex';
              }
            }}
          />
        ) : null}
        {/* 占位符 - 当没有图片或图片加载失败时显示 */}
        <div className={`absolute inset-0 flex items-center justify-center ${shopSettings?.bannerImages && shopSettings.bannerImages.length > 0 && shopSettings.bannerImages[0] ? 'hidden placeholder' : ''}`}>
          <div className="text-center">
            <div className="text-6xl mb-4">☕</div>
            <p className="text-gray-600 font-medium">{shopSettings?.name || t('menu.title')}</p>
          </div>
        </div>
      </div>

      {/* 登录表单 */}
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('home.title')}
            </h2>
            <p className="text-gray-600 text-sm">
              {t('home.subtitle')}
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
                {t('home.phone')} <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('home.phonePlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sb-green focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('home.name')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('home.namePlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sb-green focus:border-transparent"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-sb-green border-gray-300 rounded focus:ring-sb-green"
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700">
                {t('home.rememberMe')}
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-sb-green text-white py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? t('common.processing') : t('home.continue')}
            </button>
          </form>

          <p className="mt-6 text-xs text-center text-gray-500">
            {t('home.terms')}
          </p>
        </div>
      </div>
    </div>
  );
}

