import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { menuApi } from '../api/client';
import { MenuItem } from '../types';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { onDatabaseUpdate } from '../utils/storageSync';

export default function MenuPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getItemCount } = useCart();
  const { t } = useLanguage();
  const tableNumber = searchParams.get('table');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadMenuByCategory(selectedCategory);
    } else {
      loadAllMenu();
    }
  }, [selectedCategory]);

  // 监听数据库更新事件（当商家后台修改数据时自动刷新）
  useEffect(() => {
    const unsubscribe = onDatabaseUpdate((key: string) => {
      if (key === 'db_menu_items') {
        // 菜单数据更新，重新加载
        loadCategories();
        if (selectedCategory) {
          loadMenuByCategory(selectedCategory);
        } else {
          loadAllMenu();
        }
      }
    });
    return unsubscribe;
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      const response = await menuApi.getCategories();
      setCategories(response.data);
      if (response.data.length > 0) {
        setSelectedCategory(response.data[0]);
      }
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  };

  const loadAllMenu = async () => {
    try {
      setLoading(true);
      const response = await menuApi.getAll();
      setMenuItems(response.data);
    } catch (error) {
      console.error('加载菜单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMenuByCategory = async (category: string) => {
    try {
      setLoading(true);
      const response = await menuApi.getByCategory(category);
      setMenuItems(response.data);
    } catch (error) {
      console.error('加载菜单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-sb-green text-white p-4 sticky top-0 z-10 shadow-md">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div>
            <h1 className="text-xl font-bold">{t('menu.title')}</h1>
            {tableNumber && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs opacity-75">🪑 {t('order.tableNumber')}:</span>
                <span className="text-sm font-semibold opacity-90">{tableNumber}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/cart')}
              className="relative p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {getItemCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getItemCount()}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white border-b sticky top-[73px] z-10 overflow-x-auto">
        <div className="flex max-w-4xl mx-auto px-4">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-3 whitespace-nowrap font-medium transition-colors ${
                selectedCategory === category
                  ? 'text-sb-green border-b-2 border-sb-green'
                  : 'text-gray-600 hover:text-sb-green'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sb-green"></div>
            <p className="mt-4 text-gray-500">{t('common.loading')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/item/${item.id}`)}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
              >
                <div className="aspect-square bg-gray-200 relative overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=星巴克';
                    }}
                  />
                  {!item.available && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="text-white font-semibold">{t('menu.empty')}</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{item.nameEn}</p>
                  <p className="text-sb-green font-bold">¥{item.price}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
