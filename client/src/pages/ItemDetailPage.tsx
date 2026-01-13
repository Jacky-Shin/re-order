import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { menuApi } from '../api/client';
import { MenuItem, CartItem, SelectedCustomization } from '../types';
import { useCart } from '../contexts/CartContext';
import BottomNav from '../components/BottomNav';

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [item, setItem] = useState<MenuItem | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedCustomizations, setSelectedCustomizations] = useState<Map<string, string>>(new Map());
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadItem(id);
    }
  }, [id]);

  useEffect(() => {
    if (item?.sizes && item.sizes.length > 0 && !selectedSize) {
      setSelectedSize(item.sizes[0].name);
    }
  }, [item]);

  const loadItem = async (itemId: string) => {
    try {
      setLoading(true);
      const response = await menuApi.getById(itemId);
      setItem(response.data);
    } catch (error) {
      console.error('加载商品详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomizationChange = (customizationId: string, optionId: string) => {
    const newCustomizations = new Map(selectedCustomizations);
    newCustomizations.set(customizationId, optionId);
    setSelectedCustomizations(newCustomizations);
  };

  const calculatePrice = () => {
    if (!item) return 0;
    
    // 基础价格：如果有尺寸选择，使用尺寸价格（替换基础价格）；否则使用商品基础价格
    let basePrice = item.price;
    if (selectedSize && item.sizes) {
      const sizeOption = item.sizes.find(s => s.name === selectedSize);
      if (sizeOption) {
        // 尺寸价格：如果isBasePrice为true或未设置，则替换基础价格；否则累加
        if (sizeOption.isBasePrice !== false) {
          basePrice = sizeOption.price; // 替换基础价格
        } else {
          basePrice += sizeOption.price; // 累加价格
        }
      }
    }
    
    // 加料/自定义选项：累加到基础价格
    let totalPrice = basePrice;
    if (item.customizations) {
      item.customizations.forEach(customization => {
        const selectedOptionId = selectedCustomizations.get(customization.id);
        if (selectedOptionId) {
          const option = customization.options.find(opt => opt.id === selectedOptionId);
          if (option) {
            totalPrice += option.price; // 累加价格
          }
        }
      });
    }

    return totalPrice;
  };

  const handleAddToCart = async () => {
    if (!item) return;

    const customizations: SelectedCustomization[] = [];
    if (item.customizations) {
      item.customizations.forEach(customization => {
        const selectedOptionId = selectedCustomizations.get(customization.id);
        if (selectedOptionId) {
          const option = customization.options.find(opt => opt.id === selectedOptionId);
          if (option) {
            customizations.push({
              customizationId: customization.id,
              optionId: option.id,
              name: `${customization.name}: ${option.name}`,
              price: option.price,
            });
          }
        }
      });
    }

    const cartItem: CartItem = {
      id: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      menuItemId: item.id,
      name: item.name,
      size: selectedSize,
      price: calculatePrice(),
      quantity,
      customizations: customizations.length > 0 ? customizations : undefined,
      image: item.image,
    };

    try {
      await addToCart(cartItem);
      navigate('/cart');
    } catch (error) {
      console.error('添加到购物车失败:', error);
      alert('添加到购物车失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sb-green"></div>
          <p className="mt-4 text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">商品未找到</p>
          <button
            onClick={() => navigate('/menu')}
            className="mt-4 text-sb-green hover:underline"
          >
            返回菜单
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
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
          <h1 className="ml-4 text-lg font-semibold">商品详情</h1>
        </div>
      </div>

      {/* Image */}
      <div className="w-full aspect-square bg-gray-200">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=星巴克';
          }}
        />
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{item.name}</h2>
        <p className="text-gray-500 mb-4">{item.nameEn}</p>
        <p className="text-gray-700 mb-6">{item.description}</p>

        {/* Sizes */}
        {item.sizes && item.sizes.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">选择规格</h3>
            <div className="flex gap-3">
              {item.sizes.map((size) => {
                const isBasePrice = size.isBasePrice !== false; // 默认是替换基础价格
                const displayPrice = isBasePrice ? size.price : item.price + size.price;
                return (
                  <button
                    key={size.name}
                    onClick={() => setSelectedSize(size.name)}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                      selectedSize === size.name
                        ? 'border-sb-green bg-sb-light-green text-sb-green'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold">{size.name}</div>
                    <div className="text-sm text-gray-600">¥{displayPrice.toFixed(2)}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Customizations */}
        {item.customizations && item.customizations.length > 0 && (
          <div className="mb-6">
            {item.customizations.map((customization) => (
              <div key={customization.id} className="mb-6">
                <h3 className="text-lg font-semibold mb-3">
                  {customization.name}
                  {customization.required && <span className="text-red-500 ml-1">*</span>}
                </h3>
                <div className="space-y-2">
                  {customization.options.map((option) => {
                    const isSelected = selectedCustomizations.get(customization.id) === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleCustomizationChange(customization.id, option.id)}
                        className={`w-full text-left py-3 px-4 rounded-lg border-2 transition-colors ${
                          isSelected
                            ? 'border-sb-green bg-sb-light-green'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{option.name}</span>
                          {option.price > 0 && (
                            <span className="text-sb-green">+¥{option.price}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quantity */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">数量</h3>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-sb-green transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-sb-green transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Bar - 上移以避免被底部导航遮挡 */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">总计</div>
            <div className="text-2xl font-bold text-sb-green">¥{(calculatePrice() * quantity).toFixed(2)}</div>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!item.available}
            className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
              item.available
                ? 'bg-sb-green text-white hover:bg-opacity-90'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {item.available ? '加入购物车' : '已售罄'}
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
