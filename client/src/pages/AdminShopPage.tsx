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
  const [uploading, setUploading] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('图片大小不能超过2MB');
      return;
    }

    try {
      setUploading(true);
      
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          if (!result) {
            reject(new Error('图片读取失败'));
            return;
          }
          resolve(result);
        };
        reader.onerror = (error) => {
          reject(new Error('图片读取失败: ' + (error?.toString() || '未知错误')));
        };
        reader.readAsDataURL(file);
      });
      
      const currentBanners = shopSettings?.bannerImages || [];
      const updatedBanners = [...currentBanners, base64Image];
      
      await adminApi.updateShopSettings({
        bannerImages: updatedBanners,
      });
      
      await loadShopSettings();
      setShowImageUpload(false);
      alert('图片上传成功！');
    } catch (error: any) {
      console.error('上传图片失败:', error);
      const errorMessage = error?.response?.data?.error 
        || error?.message 
        || error?.toString() 
        || '未知错误';
      alert('上传图片失败: ' + errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveBanner = async (index: number) => {
    if (!shopSettings) return;
    
    const updatedBanners = shopSettings.bannerImages.filter((_, i) => i !== index);
    await adminApi.updateShopSettings({
      bannerImages: updatedBanners,
    });
    await loadShopSettings();
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
      {/* 店铺图片 - 顶部展示（可编辑） */}
      <div className="w-full h-48 md:h-64 lg:h-80 overflow-hidden relative group">
        {shopSettings?.bannerImages && shopSettings.bannerImages.length > 0 ? (
          <>
            <img
              src={shopSettings.bannerImages[0]}
              alt="店铺图片"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1200x400?text=店铺图片';
              }}
            />
            {/* 编辑按钮 - 悬停时显示 */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={() => setShowImageUpload(!showImageUpload)}
                className="px-4 py-2 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100"
              >
                {showImageUpload ? '取消编辑' : '编辑图片'}
              </button>
            </div>
            {/* 删除按钮 */}
            <button
              onClick={() => handleRemoveBanner(0)}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </>
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <button
              onClick={() => setShowImageUpload(!showImageUpload)}
              className="px-6 py-3 bg-sb-green text-white rounded-lg font-semibold hover:bg-opacity-90"
            >
              上传店铺图片
            </button>
          </div>
        )}

        {/* 图片上传面板 */}
        {showImageUpload && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-10">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">上传店铺图片</h3>
              <label className="cursor-pointer block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <div className={`w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-sb-green transition-colors ${
                  uploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}>
                  {uploading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-sb-green"></div>
                      <span className="text-gray-600">上传中...</span>
                    </div>
                  ) : (
                    <>
                      <svg className="w-6 h-6 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-gray-600">点击上传店铺图片</span>
                    </>
                  )}
                </div>
              </label>
              <p className="text-xs text-gray-500 mt-2 text-center">建议尺寸：1200x400px，最大2MB</p>
              <button
                onClick={() => setShowImageUpload(false)}
                className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                取消
              </button>
            </div>
          </div>
        )}
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
                返回管理
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
            placeholder="搜索商品..."
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
                  className={`px-2 md:px-4 py-2 md:py-3 text-left text-xs md:text-sm font-medium rounded-lg md:rounded-xl transition-all duration-300 whitespace-nowrap ${
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
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=星巴克';
                      }}
                    />
                    {!item.available && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{t('menu.soldOut')}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-1 text-lg leading-tight">{item.name}</h3>
                    <p className="text-xs text-gray-500 mb-3 font-medium">{item.nameEn}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold bg-gradient-to-r from-sb-green to-sb-dark-green bg-clip-text text-transparent">
                        ¥{item.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {menuItems.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500">未找到相关商品</p>
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
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=星巴克';
                      }}
                    />
                    {!item.available && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{t('menu.soldOut')}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-1 text-lg leading-tight">{item.name}</h3>
                    <p className="text-xs text-gray-500 mb-3 font-medium">{item.nameEn}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold bg-gradient-to-r from-sb-green to-sb-dark-green bg-clip-text text-transparent">
                        ¥{item.price.toFixed(2)}
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
