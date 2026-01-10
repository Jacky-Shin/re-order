import { ReactNode, useState, useEffect } from 'react';

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
    // 检查是否已经认证（存储在sessionStorage中，关闭浏览器后失效）
    const authStatus = sessionStorage.getItem('adminAuthenticated');
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
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // 商家后台默认密码（在实际生产环境中应该更复杂，并存储在服务器端）
  const ADMIN_PASSWORD = 'admin123'; // 简单密码，仅用于演示

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('adminAuthenticated', 'true');
      onSuccess();
    } else {
      setError('Contraseña incorrecta, por favor intente de nuevo');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sb-green to-sb-dark-green flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-sb-green rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-sb-dark-green mb-2">Panel de Administración</h1>
          <p className="text-gray-600">Por favor ingrese la contraseña para acceder al panel de administración</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sb-green focus:border-transparent"
              placeholder="Por favor ingrese la contraseña"
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
            Iniciar Sesión
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => window.location.href = '/menu'}
            className="text-sm text-gray-600 hover:text-sb-green transition-colors"
          >
            ← Volver a la Página de Pedidos
          </button>
        </div>
      </div>
    </div>
  );
}
