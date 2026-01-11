import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, menuApi, categoryApi } from '../api/client';
import { ShopSettings, MenuItem, Category } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { onDatabaseUpdate } from '../utils/storageSync';
import { firebaseService } from '../services/firebaseService';

export default function AdminShopPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

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
      setMenuItems(response.data);
    } catch (error) {
      console.error('加载商品失败:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoryApi.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    // 验证文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', file);

      const uploadResponse = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('上传失败');
      }

      const { url } = await uploadResponse.json();
      
      // 添加到banner图片列表
      const currentBanners = shopSettings?.bannerImages || [];
      const updatedBanners = [...currentBanners, url];
      
      await adminApi.updateShopSettings({
        bannerImages: updatedBanners,
      });
      
      await loadShopSettings();
    } catch (error) {
      console.error('上传图片失败:', error);
      alert('上传图片失败，请重试');
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

  // 按分类分组商品
  const getMenuItemsByCategory = () => {
    const sortedCategories = [...categories].sort((a, b) => (a.order || 0) - (b.order || 0));
    const itemsByCategory = new Map<string, MenuItem[]>();
    
    sortedCategories.forEach(cat => {
      itemsByCategory.set(cat.id, []);
    });
    
    menuItems.forEach(item => {
      const categoryItems = itemsByCategory.get(item.category) || [];
      categoryItems.push(item);
      itemsByCategory.set(item.category, categoryItems);
    });
    
    return sortedCategories.map(cat => ({
      category: cat,
      items: itemsByCategory.get(cat.id) || []
    })).filter(group => group.items.length > 0);
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

  const menuGroups = getMenuItemsByCategory();

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
            <h1 className="ml-4 text-lg font-semibold">店铺管理</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 店铺图片管理 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">店铺展示图片</h2>
          <p className="text-sm text-gray-500 mb-4">
            上传的图片将显示在用户端点餐页面的顶部，建议尺寸：1200x400px
          </p>
          
          {/* 当前图片列表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {shopSettings?.bannerImages.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <img
                  src={imageUrl}
                  alt={`店铺图片 ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=图片加载失败';
                  }}
                />
                <button
                  onClick={() => handleRemoveBanner(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* 上传按钮 */}
          <label className="cursor-pointer">
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
        </div>

        {/* 商品预览 - 按分类展示 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">商品预览</h2>
          <p className="text-sm text-gray-500 mb-6">
            这是用户端将看到的商品展示效果，按分类从左上到左下依次陈列
          </p>

          {menuGroups.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">暂无商品，请先添加商品</p>
              <button
                onClick={() => navigate('/admin/menu')}
                className="mt-4 px-4 py-2 bg-sb-green text-white rounded-lg hover:bg-opacity-90"
              >
                去添加商品
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {menuGroups.map((group, groupIndex) => (
                <div key={group.category.id} className="animate-fade-in" style={{ animationDelay: `${groupIndex * 100}ms` }}>
                  {/* 分类标题 */}
                  <div className="mb-4 flex items-center gap-3">
                    <h3 className="text-2xl font-bold text-gray-900">{group.category.name}</h3>
                    <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
                    <span className="text-sm text-gray-500 font-medium">{group.items.length} 项</span>
                  </div>
                  
                  {/* 商品网格 */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {group.items.map((item, itemIndex) => (
                      <div
                        key={item.id}
                        className="card card-hover overflow-hidden group animate-fade-in"
                        style={{ animationDelay: `${itemIndex * 50}ms` }}
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
                              <span className="text-white font-bold text-lg">已售罄</span>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h4 className="font-bold text-gray-900 mb-1 text-lg leading-tight">{item.name}</h4>
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

