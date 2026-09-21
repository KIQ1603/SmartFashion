import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import LoginPage from '@/pages/Login/LoginPage';
import DashboardPage from '@/pages/Dashboard/DashboardPage';
import ProductsPage from '@/pages/Products/ProductsPage';
import CategoriesPage from '@/pages/Categories/CategoriesPage';
import OrdersPage from '@/pages/Orders/OrdersPage';
import UsersPage from '@/pages/Users/UsersPage';
import RecommendationMetricsPage from '@/pages/RecommendationMetrics/RecommendationMetricsPage';
import AttributesPage from '@/pages/Attributes/AttributesPage';
import SettingsPage from '@/pages/Settings/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/attributes" element={<AttributesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/recommendation-metrics" element={<RecommendationMetricsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
