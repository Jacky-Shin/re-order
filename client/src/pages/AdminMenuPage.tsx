import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../api/client';
import { MenuItem } from '../types';
import { onDatabaseUpdate } from '../utils/storageSync';

export default function AdminMenuPage() {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '',
    nameEn: '',
    category: '',
    price: 0,
    image: '',
    description: '',
    available: true,
    sizes: [],
    customizations: [],
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadMenuItems();
  }, []);

  // 监听数据库更新事件（当其他标签页修改数据时自动刷新）
  useEffect(() => {
    const unsubscribe = onDatabaseUpdate((key) => {
      if (key === 'db_menu_items') {
        // 菜单数据更新，重新加载
        loadMenuItems();
      }
    });
    return unsubscribe;
  }, []);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getMenuItems();
      setMenuItems(response.data);
    } catch (error) {
      console.error('加载商品失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 如果有新图片，先上传
      let imageUrl = formData.image;
      if (imageFile) {
        try {
          imageUrl = await uploadImage();
        } catch (uploadError: any) {
          console.error('图片上传失败:', uploadError);
          alert('图片上传失败: ' + (uploadError.message || '请检查网络连接或稍后重试'));
          return;
        }
      }

      // 如果没有图片URL也没有上传图片，提示用户
      if (!imageUrl && !imageFile) {
        if (!confirm('未选择图片，是否继续添加商品？')) {
          return;
        }
      }

      const dataToSubmit = {
        ...formData,
        image: imageUrl || '',
      };

      if (editingItem) {
        await adminApi.updateMenuItem(editingItem.id, dataToSubmit);
      } else {
        await adminApi.addMenuItem(dataToSubmit);
      }
      await loadMenuItems();
      resetForm();
    } catch (error: any) {
      console.error('保存商品失败:', error);
      const errorMessage = error.response?.data?.error || error.message || '保存失败，请检查网络连接';
      alert(errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个商品吗？')) return;
    try {
      await adminApi.deleteMenuItem(id);
      await loadMenuItems();
    } catch (error: any) {
      alert(error.response?.data?.error || '删除失败');
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      nameEn: item.nameEn,
      category: item.category,
      price: item.price,
      image: item.image,
      description: item.description,
      available: item.available,
      sizes: item.sizes || [],
      customizations: item.customizations || [],
    });
    setImagePreview(item.image);
    setImageFile(null);
    setShowAddForm(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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

      setImageFile(file);
      
      // 创建预览
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string> => {
    if (!imageFile) {
      return formData.image || '';
    }

    setUploading(true);
    try {
      // 检查是否在Web环境（没有后端服务器）
      // 在Vercel部署的PWA中，使用Base64存储
      const isWebEnvironment = !window.location.hostname.includes('localhost') || 
                                window.location.protocol === 'https:';

      if (isWebEnvironment) {
        // Web环境：转换为Base64并直接返回（存储到数据库时会自动保存）
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64Data = reader.result as string;
            // 直接返回Base64 Data URL，可以存储在数据库中
            resolve(base64Data);
          };
          reader.onerror = () => {
            reject(new Error('读取图片失败，请重试'));
          };
          reader.readAsDataURL(imageFile);
        });
      }

      // 本地开发环境：尝试上传到服务器
      const formDataToSend = new FormData();
      formDataToSend.append('image', imageFile);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '上传失败' }));
        throw new Error(errorData.error || `上传失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.url) {
        throw new Error('服务器返回的数据格式错误');
      }
      
      // 返回完整的图片URL
      const imageUrl = data.url.startsWith('http') 
        ? data.url 
        : `${window.location.origin}${data.url}`;
      
      return imageUrl;
    } catch (error: any) {
      console.error('上传图片失败:', error);
      // 提供更详细的错误信息
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        // 如果网络失败，回退到Base64
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve(reader.result as string);
          };
          reader.onerror = () => {
            reject(new Error('读取图片失败，请重试'));
          };
          reader.readAsDataURL(imageFile!);
        });
      }
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      nameEn: '',
      category: '',
      price: 0,
      image: '',
      description: '',
      available: true,
      sizes: [],
      customizations: [],
    });
    setImageFile(null);
    setImagePreview('');
    setShowAddForm(false);
    setEditingItem(null);
  };

  const categories = Array.from(new Set(menuItems.map(item => item.category)));

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
            <h1 className="ml-4 text-lg font-semibold">商品管理</h1>
          </div>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-sb-green text-white rounded-lg font-semibold hover:bg-opacity-90"
            >
              添加商品
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {showAddForm ? (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingItem ? '编辑商品' : '添加商品'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    商品名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sb-green focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    英文名称
                  </label>
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sb-green focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    分类 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    list="categories"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sb-green focus:border-transparent"
                  />
                  <datalist id="categories">
                    {categories.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    价格 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sb-green focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  商品图片
                </label>
                
                {/* 图片预览 */}
                {imagePreview && (
                  <div className="mb-3">
                    <img
                      src={imagePreview}
                      alt="预览"
                      className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                    />
                  </div>
                )}

                {/* 文件选择 */}
                <div className="flex gap-3">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <div className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-sb-green transition-colors">
                      <svg className="w-6 h-6 mx-auto mb-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-gray-600">
                        {imageFile ? imageFile.name : '从相册选择图片'}
                      </span>
                    </div>
                  </label>
                  
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                        setFormData({ ...formData, image: '' });
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      清除
                    </button>
                  )}
                </div>

                {/* URL输入（备用） */}
                <div className="mt-3">
                  <label className="block text-xs text-gray-500 mb-1">
                    或输入图片URL（可选）
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => {
                      setFormData({ ...formData, image: e.target.value });
                      if (e.target.value) {
                        setImagePreview(e.target.value);
                      }
                    }}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sb-green focus:border-transparent"
                  />
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  支持 JPG、PNG、GIF 格式，最大 5MB
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sb-green focus:border-transparent"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="available"
                  checked={formData.available}
                  onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                  className="w-4 h-4 text-sb-green border-gray-300 rounded focus:ring-sb-green"
                />
                <label htmlFor="available" className="ml-2 text-sm text-gray-700">
                  上架状态
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={uploading}
                  className={`flex-1 bg-sb-green text-white py-2 rounded-lg font-semibold hover:bg-opacity-90 ${
                    uploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {uploading ? '上传中...' : editingItem ? '更新' : '添加'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={uploading}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 disabled:opacity-50"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {/* Menu Items List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sb-green"></div>
            <p className="mt-4 text-gray-500">Cargando...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">商品</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">分类</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">价格</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {menuItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 rounded object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=星巴克';
                            }}
                          />
                          <div>
                            <div className="font-medium text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-500">{item.nameEn}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{item.category}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-sb-green">¥{item.price}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          item.available
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.available ? '上架' : '下架'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
