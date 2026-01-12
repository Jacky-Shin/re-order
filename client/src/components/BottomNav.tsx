import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useUser();

  const isActive = (path: string) => {
    if (path === '/home') {
      return location.pathname === '/' || location.pathname === '/home' || location.pathname === '/menu';
    }
    return location.pathname === path || location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-around h-16">
          {/* 首页 */}
          <button
            onClick={() => navigate('/home')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              isActive('/home')
                ? 'text-sb-green'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg
              className="w-6 h-6 mb-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="text-xs font-medium">Inicio</span>
          </button>

          {/* 我的订单 */}
          <button
            onClick={() => {
              if (isAuthenticated) {
                navigate('/my-orders');
              } else {
                navigate('/home');
              }
            }}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              isActive('/my-orders')
                ? 'text-sb-green'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg
              className="w-6 h-6 mb-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span className="text-xs font-medium">Mis Pedidos</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

