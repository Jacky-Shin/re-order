import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, menuApi, categoryApi } from '../api/client';
import { ShopSettings, MenuItem, Category } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { onDatabaseUpdate } from '../utils/storageSync';
import { firebaseService } from '../services/firebaseService';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function AdminShopPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCategoryId && !searchQuery) {
      loadMenuByCategory(selectedCategoryId);
    } else if (!searchQuery && !selectedCategoryId && categories.length > 0) {
      setSelectedCategoryId(categories[0].id);
    } else if (!searchQuery && !selectedCategoryId && categories.length === 0) {
      loadAllMenu();
    }
  }, [selectedCategoryId, searchQuery]);

  // 搜索功能
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = allMenuItems.filter(item => 
        item.name.toLowerCase().includes(query) ||
        item.nameEn.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
      setMenuItems(filtered);
    } else {
      if (selectedCategoryId) {
        loadMenuByCategory(selectedCategoryId);
      } else {
        loadAllMenu();
      }
    }
  }, [searchQuery]);

  // 监听数据更新
  useEffect(() => {
    const unsubscribes: (() => void)[] = [];
    
    const localStorageUnsubscribe = onDatabaseUpdate((key: string) => {
      if (key === 'db_menu_items' || key === 'db_categories' || key === 'db_shop_settings') {
        loadData();
      }
    });
    unsubscribes.push(localStorageUnsubscribe);
    
    if (firebaseService.isAvailable()) {
      const firebaseUnsubscribe = firebaseService.onMenuItemsChange(() => {
        loadMenuItems();
      });
      unsubscribes.push(firebaseUnsubscribe);
    }
    
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadShopSettings(),
        loadMenuItems(),
        loadCategories(),
      ]);
    } finally {
      setLoading(false);
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

  const loadMenuItems = async () => {
    try {
      const response = await menuApi.getAll();
      setAllMenuItems(response.data);
      setMenuItems(response.data);
    } catch (error) {
      console.error('加载商品失败:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoryApi.getAll();
      const sortedCategories = response.data.sort((a, b) => (a.order || 0) - (b.order || 0));
      setCategories(sortedCategories);
      if (sortedCategories.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(sortedCategories[0].id);
      }
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  };

  const loadAllMenu = async () => {
    try {
      setLoading(true);
      const response = await menuApi.getAll();
      setAllMenuItems(response.data);
      setMenuItems(response.data);
    } catch (error) {
      console.error('加载菜单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMenuByCategory = async (categoryId: string) => {
    try {
      setLoading(true);
      const response = await menuApi.getByCategory(categoryId);
      setMenuItems(response.data);
      const allResponse = await menuApi.getAll();
      setAllMenuItems(allResponse.data);
    } catch (error) {
      console.error('加载菜单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取店铺图片路径（优先使用设置中的图片，否则使用默认本地图片）
  const getBannerImage = () => {
    if (shopSettings?.bannerImages && shopSettings.bannerImages.length > 0) {
      return shopSettings.bannerImages[0];
    }
    // 默认使用本地图片
    return '/shop-banner.jpg';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-sb-light-green/30 via-white to-gray-50 pb-24">
      {/* 店铺图片 - 顶部展示（从本地读取） */}
      <div className="w-full h-48 md:h-64 lg:h-80 overflow-hidden relative">
        <img
          src={getBannerImage()}
          alt={t('admin.menu.myShop')}
          className="w-full h-full object-cover"
          onError={(e) => {
            // 如果本地图片加载失败，使用占位图
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=400&fit=crop';
          }}
        />
        {/* 提示信息 */}
        <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-lg text-xs backdrop-blur-sm">
          {t('admin.menu.myShop')}: {t('admin.menu.imageFormatHint')}
        </div>
      </div>

      {/* Header - 与用户端一致 */}
      <div className="bg-gradient-to-r from-sb-green via-sb-green to-sb-dark-green text-white sticky top-0 z-20 shadow-lg">
        <div className="backdrop-blur-sm bg-white/5">
          <div className="flex items-center justify-between max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-2xl">☕</span>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">{shopSettings?.name || t('menu.title')}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher variant="light" />
              <button
                onClick={() => navigate('/admin')}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 backdrop-blur-sm border border-white/20 text-sm font-medium"
              >
                {t('common.back')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="relative">
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-12 rounded-xl border-2 border-gray-200 focus:border-sb-green focus:ring-2 focus:ring-sb-green/20 transition-all"
          />
          <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 主要内容区域 - 左侧分类，右侧商品 */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-4 md:gap-6">
        {/* Categories - 左侧分类列表 */}
        <div className="w-20 md:w-32 lg:w-40 flex-shrink-0">
          <div className="sticky top-[88px] h-fit max-h-[calc(100vh-120px)] overflow-y-auto">
            <div className="flex flex-col gap-1 md:gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategoryId(category.id);
                    setSearchQuery('');
                  }}
                  className={`px-2 md:px-4 py-2 md:py-3 text-left text-sm md:text-base lg:text-lg font-medium rounded-lg md:rounded-xl transition-all duration-300 whitespace-nowrap ${
                    selectedCategoryId === category.id
                      ? 'bg-gradient-to-r from-sb-green to-sb-dark-green text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-sb-green bg-white'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Menu Items - 右侧商品网格（只展示，不可点击购买） */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-sb-green border-t-transparent"></div>
              <p className="mt-6 text-gray-500 font-medium">{t('common.loading')}</p>
            </div>
          ) : menuItems.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🍽️</div>
              <p className="text-gray-500 text-lg">{t('menu.empty')}</p>
            </div>
          ) : searchQuery ? (
            // 搜索结果显示
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {menuItems.map((item, index) => (
                <div
                  key={item.id}
                  className="card overflow-hidden group animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=Starbucks';
                      }}
                    />
                    {!item.available && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{t('menu.soldOut')}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-1 text-base md:text-lg leading-tight">{item.name}</h3>
                    <p className="text-xs md:text-sm text-gray-500 mb-3 font-medium">{item.nameEn}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg md:text-xl font-bold bg-gradient-to-r from-sb-green to-sb-dark-green bg-clip-text text-transparent">
                        ${item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {menuItems.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500">{t('menu.empty')}</p>
                </div>
              )}
            </div>
          ) : (
            // 正常显示
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {menuItems.map((item, index) => (
                <div
                  key={item.id}
                  className="card overflow-hidden group animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=Starbucks';
                      }}
                    />
                    {!item.available && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{t('menu.soldOut')}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-1 text-base md:text-lg leading-tight">{item.name}</h3>
                    <p className="text-xs md:text-sm text-gray-500 mb-3 font-medium">{item.nameEn}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg md:text-xl font-bold bg-gradient-to-r from-sb-green to-sb-dark-green bg-clip-text text-transparent">
                        ${item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
