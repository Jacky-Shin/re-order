import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { menuApi, categoryApi } from '../api/client';
import { MenuItem, Category } from '../types';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { onDatabaseUpdate } from '../utils/storageSync';
import { firebaseService } from '../services/firebaseService';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
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
    if (selectedCategoryId) {
      loadMenuByCategory(selectedCategoryId);
    } else {
      loadAllMenu();
    }
  }, [selectedCategoryId]);

  // 监听数据库更新事件（当商家后台修改数据时自动刷新）
  useEffect(() => {
    const unsubscribes: (() => void)[] = [];
    
    // localStorage同步
    const localStorageUnsubscribe = onDatabaseUpdate((key: string) => {
      if (key === 'db_menu_items' || key === 'db_categories') {
        loadCategories();
        if (selectedCategoryId) {
          loadMenuByCategory(selectedCategoryId);
        } else {
          loadAllMenu();
        }
      }
    });
    unsubscribes.push(localStorageUnsubscribe);
    
    // Firebase实时同步
    if (firebaseService.isAvailable()) {
      const firebaseUnsubscribe = firebaseService.onMenuItemsChange(() => {
        loadCategories();
        if (selectedCategoryId) {
          loadMenuByCategory(selectedCategoryId);
        } else {
          loadAllMenu();
        }
      });
      unsubscribes.push(firebaseUnsubscribe);
    }
    
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [selectedCategoryId]);

  const loadCategories = async () => {
    try {
      const response = await categoryApi.getAll();
      setCategories(response.data);
      // 只在首次加载且没有选中分类时，才设置默认分类
      if (response.data.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(response.data[0].id);
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

  const loadMenuByCategory = async (categoryId: string) => {
    try {
      setLoading(true);
      const response = await menuApi.getByCategory(categoryId);
      setMenuItems(response.data);
    } catch (error) {
      console.error('加载菜单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sb-light-green/30 via-white to-gray-50 pb-24">
      {/* Header - 现代化设计 */}
      <div className="bg-gradient-to-r from-sb-green via-sb-green to-sb-dark-green text-white sticky top-0 z-20 shadow-lg">
        <div className="backdrop-blur-sm bg-white/5">
          <div className="flex items-center justify-between max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-2xl">☕</span>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">{t('menu.title')}</h1>
                {tableNumber && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs opacity-90 bg-white/20 px-2 py-0.5 rounded-full">
                      🪑 {t('order.tableNumber')}: {tableNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <button
                onClick={() => navigate('/cart')}
                className="relative p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 backdrop-blur-sm border border-white/20"
              >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {getItemCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-scale-in">
                  {getItemCount()}
                </span>
              )}
            </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Categories - 现代化侧边栏 */}
        <div className="card sticky top-[88px] h-fit max-h-[calc(100vh-120px)] overflow-y-auto w-40 flex-shrink-0 hidden md:block">
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2 mb-1">
              {t('menu.category')}
            </div>
            <div className="flex flex-col gap-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={`px-4 py-3 text-left font-medium rounded-xl transition-all duration-300 ${
                    selectedCategoryId === category.id
                      ? 'bg-gradient-to-r from-sb-green to-sb-dark-green text-white shadow-lg shadow-sb-green/30'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-sb-green'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Menu Items - 高级卡片网格 */}
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
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {menuItems.map((item, index) => (
              <div
                key={item.id}
                onClick={() => navigate(`/item/${item.id}`)}
                className="card card-hover cursor-pointer overflow-hidden group animate-fade-in"
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  {!item.available && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-white font-bold text-lg">{t('menu.empty')}</span>
                    </div>
                  )}
                  {item.available && (
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <svg className="w-4 h-4 text-sb-green" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
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
                    {item.available && (
                      <div className="w-8 h-8 bg-sb-green/10 rounded-full flex items-center justify-center group-hover:bg-sb-green group-hover:scale-110 transition-all duration-300">
                        <svg className="w-5 h-5 text-sb-green group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    )}
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
