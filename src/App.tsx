import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { KioskProvider, useKiosk } from '@/hooks/useKiosk'
import ActivationScreen from '@/screens/ActivationScreen'
import IdleScreen from '@/screens/IdleScreen'
import ProductScreen from '@/screens/ProductScreen'
import CheckoutScreen from '@/screens/CheckoutScreen'
import ThankYouScreen from '@/screens/ThankYouScreen'
import AdminLogin from '@/admin/AdminLogin'
import AdminDashboard from '@/admin/AdminDashboard'
import AdminProducts from '@/admin/AdminProducts'
import AdminSettings from '@/admin/AdminSettings'
import AdminReports from '@/admin/AdminReports'

function AppRoutes() {
  const { isActivated, isLoading } = useKiosk()

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-primary">
        <div className="text-3xl font-bold text-white">Corevo POS</div>
      </div>
    )
  }

  if (!isActivated) {
    return <ActivationScreen />
  }

  return (
    <Routes>
      <Route path="/" element={<IdleScreen />} />
      <Route path="/products" element={<ProductScreen />} />
      <Route path="/checkout" element={<CheckoutScreen />} />
      <Route path="/thankyou" element={<ThankYouScreen />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/products" element={<AdminProducts />} />
      <Route path="/admin/settings" element={<AdminSettings />} />
      <Route path="/admin/reports" element={<AdminReports />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <HashRouter>
      <KioskProvider>
        <AppRoutes />
      </KioskProvider>
    </HashRouter>
  )
}
