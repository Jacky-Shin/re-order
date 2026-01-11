import { ReactNode, useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * 保护商家后台路由的组件
 * 通过简单的密码验证来保护商家后台
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // 检查是否已经认证（存储在localStorage中，记住登录状态）
    const authStatus = localStorage.getItem('adminAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    setIsChecking(false);
  }, []);

  // 如果正在检查，显示加载中
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sb-green mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // 如果未认证，显示登录表单
  if (!isAuthenticated) {
    return <AdminLogin onSuccess={() => setIsAuthenticated(true)} />;
  }

  // 如果已认证，渲染受保护的内容
  return <>{children}</>;
}

/**
 * 商家后台登录组件
 */
function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useLanguage();
  const [username, setUsername] = useState(() => {
    // 从localStorage读取已保存的账号
    return localStorage.getItem('adminUsername') || '';
  });
  const [error, setError] = useState('');

  // 商家后台默认账号（可以是任何非空字符串）
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError(t('admin.login.usernameRequired') || 'Por favor ingrese el nombre de usuario');
      return;
    }

    // 任何非空账号都可以登录（简化登录流程）
    // 保存账号到localStorage
    localStorage.setItem('adminUsername', username.trim());
    // 保存认证状态到localStorage（记住登录）
    localStorage.setItem('adminAuthenticated', 'true');
    onSuccess();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sb-green to-sb-dark-green flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-sb-green rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-sb-dark-green mb-2">{t('admin.login.title') || 'Panel de Administración'}</h1>
          <p className="text-gray-600">{t('admin.login.subtitle') || 'Por favor ingrese el nombre de usuario para acceder'}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.login.username') || 'Nombre de Usuario'}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sb-green focus:border-transparent"
              placeholder={t('admin.login.usernamePlaceholder') || 'Por favor ingrese el nombre de usuario'}
              autoFocus
              required
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-sb-green text-white py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
          >
            {t('admin.login.submit') || 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
