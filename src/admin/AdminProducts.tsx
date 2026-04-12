import { useNavigate } from 'react-router-dom'
import { useKiosk } from '@/hooks/useKiosk'
import { useProducts } from '@/hooks/useProducts'
import { useIdleTimer } from '@/hooks/useIdleTimer'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

export default function AdminProducts() {
  const navigate = useNavigate()
  const { kiosk } = useKiosk()
  const { products, refresh, isLoading } = useProducts(kiosk?.tenantId)
  const [saving, setSaving] = useState<string | null>(null)

  useIdleTimer(300_000, () => navigate('/'))

  const toggleKiosk = async (productId: string, currentValue: boolean) => {
    setSaving(productId)
    await supabase
      .from('products')
      .update({ show_on_kiosk: !currentValue })
      .eq('id', productId)
    await refresh()
    setSaving(null)
  }

  const updateStock = async (productId: string, newQty: number) => {
    setSaving(productId)
    await supabase
      .from('products')
      .update({ quantity: Math.max(0, newQty) })
      .eq('id', productId)
    await refresh()
    setSaving(null)
  }

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <div className="flex items-center justify-between border-b bg-white px-6 py-4">
        <h1 className="text-xl font-bold">Produkter</h1>
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium transition active:scale-95"
        >
          Tillbaka
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <p className="text-center text-muted">Laddar...</p>
        ) : (
          <div className="flex flex-col gap-2">
            {products.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-4 rounded-xl border bg-white p-4"
              >
                <span className="text-2xl">{p.emoji || '📦'}</span>
                <div className="flex-1">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-muted">{p.price} kr</p>
                </div>

                {/* Stock */}
                {p.quantity !== null && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted">Lager:</span>
                    <button
                      onClick={() => updateStock(p.id, (p.quantity ?? 0) - 1)}
                      className="h-8 w-8 rounded-lg bg-gray-100 text-sm font-bold active:scale-95"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-mono text-sm">{p.quantity}</span>
                    <button
                      onClick={() => updateStock(p.id, (p.quantity ?? 0) + 1)}
                      className="h-8 w-8 rounded-lg bg-gray-100 text-sm font-bold active:scale-95"
                    >
                      +
                    </button>
                  </div>
                )}

                {/* Show on kiosk toggle */}
                <button
                  onClick={() => toggleKiosk(p.id, p.show_on_kiosk !== false)}
                  disabled={saving === p.id}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    p.show_on_kiosk !== false
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {p.show_on_kiosk !== false ? 'Synlig' : 'Dold'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
