import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import { UserProvider } from './contexts/UserContext';
import { useLanguage } from './contexts/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import UserProtectedRoute from './components/UserProtectedRoute';
import ScanPage from './pages/ScanPage';
import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import MyOrdersPage from './pages/MyOrdersPage';
import ItemDetailPage from './pages/ItemDetailPage';
import CartPage from './pages/CartPage';
import OrderPage from './pages/OrderPage';
import OrderStatusPage from './pages/OrderStatusPage';
import QRCodePage from './pages/QRCodePage';
import PaymentPage from './pages/PaymentPage';
import MerchantSettingsPage from './pages/MerchantSettingsPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminMenuPage from './pages/AdminMenuPage';
import AdminOrdersPage from './pages/AdminOrdersPage';
import AdminPaymentsPage from './pages/AdminPaymentsPage';
import AdminOrderStatsPage from './pages/AdminOrderStatsPage';
import AdminCategoriesPage from './pages/AdminCategoriesPage';
import AdminShopPage from './pages/AdminShopPage';
import VersionChecker from './components/VersionChecker';

// 内部组件：检测路由并设置isAdmin
function AppRoutes() {
  const location = useLocation();
  const { setIsAdmin } = useLanguage();
  
  // 检测是否是admin路由
  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/merchant');
  
  useEffect(() => {
    setIsAdmin(isAdminRoute);
  }, [isAdminRoute, setIsAdmin]);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/scan" element={<ScanPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/menu" element={<UserProtectedRoute><MenuPage /></UserProtectedRoute>} />
      <Route path="/item/:id" element={<UserProtectedRoute><ItemDetailPage /></UserProtectedRoute>} />
      <Route path="/cart" element={<UserProtectedRoute><CartPage /></UserProtectedRoute>} />
      <Route path="/order" element={<UserProtectedRoute><OrderPage /></UserProtectedRoute>} />
      <Route path="/order/:orderNumber" element={<UserProtectedRoute><OrderStatusPage /></UserProtectedRoute>} />
      <Route path="/order-status/:orderId" element={<UserProtectedRoute><OrderStatusPage /></UserProtectedRoute>} />
      <Route path="/my-orders" element={<UserProtectedRoute><MyOrdersPage /></UserProtectedRoute>} />
      <Route path="/payment/:orderId" element={<UserProtectedRoute><PaymentPage /></UserProtectedRoute>} />
      <Route path="/qrcode" element={<QRCodePage />} />
      <Route path="/merchant/settings" element={<ProtectedRoute><MerchantSettingsPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/menu" element={<ProtectedRoute><AdminMenuPage /></ProtectedRoute>} />
          <Route path="/admin/categories" element={<ProtectedRoute><AdminCategoriesPage /></ProtectedRoute>} />
          <Route path="/admin/shop" element={<ProtectedRoute><AdminShopPage /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute><AdminOrdersPage /></ProtectedRoute>} />
          <Route path="/admin/payments" element={<ProtectedRoute><AdminPaymentsPage /></ProtectedRoute>} />
          <Route path="/admin/stats" element={<ProtectedRoute><AdminOrderStatsPage /></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <UserProvider>
      <CartProvider>
        <BrowserRouter>
          <VersionChecker />
          <AppRoutes />
        </BrowserRouter>
      </CartProvider>
    </UserProvider>
  );
}

export default App;
