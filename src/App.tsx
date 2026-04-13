import { KioskProvider, useKiosk } from '@/hooks/useKiosk'
import ActivationScreen from '@/screens/ActivationScreen'
import WebViewScreen from '@/screens/WebViewScreen'

function AppContent() {
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

  return <WebViewScreen />
}

export default function App() {
  return (
    <KioskProvider>
      <AppContent />
    </KioskProvider>
  )
}
