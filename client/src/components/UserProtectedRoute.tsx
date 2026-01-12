import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

export default function UserProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/home');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sb-green"></div>
          <p className="mt-4 text-gray-500">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

