import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useKiosk } from '@/hooks/useKiosk'
import { useProducts, type Product } from '@/hooks/useProducts'
import { useCart } from '@/hooks/useCart'
import { useIdleTimer } from '@/hooks/useIdleTimer'
import { usePayment } from '@/hooks/usePayment'
import StatusBar from '@/components/StatusBar'
import ProductCard from '@/components/ProductCard'
import CartItemComponent from '@/components/CartItem'

export default function ProductScreen() {
  const navigate = useNavigate()
  const { kiosk } = useKiosk()
  const { productsByCategory, uncategorized, categories, isLoading, getActivePrice } = useProducts(kiosk?.tenantId)
  const cart = useCart()
  const payment = usePayment(kiosk?.tenantId ?? '', kiosk?.kioskId ?? '')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const idleTimeout = (kiosk?.tenant.kiosk_idle_timeout || 120) * 1000
  useIdleTimer(idleTimeout, () => {
    cart.clearCart()
    navigate('/')
  })

  const handleAddToCart = useCallback((product: Product) => {
    const price = getActivePrice(product)
    cart.addItem(product, price)
  }, [cart, getActivePrice])

  const handleSwishCheckout = async () => {
    if (cart.items.length === 0) return
    await payment.startSwishPayment(cart.toOrderItems(), cart.total, cart.vatTotal)
    navigate('/checkout', { state: { method: 'swish', cart: cart.items, total: cart.total } })
  }

  const handleCardCheckout = async () => {
    if (cart.items.length === 0) return
    const testMode = kiosk?.tenant.sumup_test_mode === true
    await payment.startCardPayment(cart.toOrderItems(), cart.total, cart.vatTotal, testMode)
    navigate('/checkout', { state: { method: 'card' } })
  }

  // Determine which products to show
  const filteredProducts = activeCategory
    ? productsByCategory.find((g) => g.category.id === activeCategory)?.products ?? []
    : [...uncategorized, ...productsByCategory.flatMap((g) => g.products)]

  const tenantName = kiosk?.tenant.kiosk_club_name || kiosk?.tenant.name || 'Corevo POS'
  const columns = kiosk?.tenant.kiosk_columns ?? 4

  const showSwish = kiosk?.tenant.swish_enabled && kiosk.swishNumber
  const showCard = kiosk?.tenant.terminal_enabled && kiosk?.tenant.terminal_provider === 'sumup'

  return (
    <div className="flex h-full flex-col">
      <StatusBar tenantName={tenantName} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Products */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Category tabs */}
          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto border-b bg-white px-4 py-3">
              <button
                onClick={() => setActiveCategory(null)}
                className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition active:scale-95 ${
                  activeCategory === null
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-text hover:bg-gray-200'
                }`}
              >
                Alla
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition active:scale-95 ${
                    activeCategory === cat.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-text hover:bg-gray-200'
                  }`}
                >
                  {cat.emoji && <span className="mr-1">{cat.emoji}</span>}
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-muted">
                Laddar produkter...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted">
                Inga produkter att visa
              </div>
            ) : (
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
              >
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={() => handleAddToCart(product)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart sidebar */}
        <div className="flex w-[340px] flex-col border-l bg-white">
          {/* Cart header */}
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <span className="text-lg font-semibold">Varukorg</span>
            {cart.itemCount > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-white">
                {cart.itemCount}
              </span>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto p-3">
            {cart.items.length === 0 ? (
              <p className="py-12 text-center text-muted">Varukorgen är tom</p>
            ) : (
              <div className="flex flex-col gap-2">
                {cart.items.map((item) => (
                  <CartItemComponent
                    key={item.product.id}
                    item={item}
                    onUpdateQty={(qty) => cart.updateQuantity(item.product.id, qty)}
                    onRemove={() => cart.removeItem(item.product.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Cart footer */}
          {cart.items.length > 0 && (
            <div className="border-t p-4">
              <div className="mb-1 flex justify-between text-sm text-muted">
                <span>Varav moms</span>
                <span>{cart.vatTotal.toFixed(2)} kr</span>
              </div>
              <div className="mb-4 flex justify-between text-xl font-bold">
                <span>Totalt</span>
                <span>{cart.total} kr</span>
              </div>

              <div className="flex flex-col gap-2">
                {showCard && (
                  <button
                    onClick={handleCardCheckout}
                    className="flex h-14 items-center justify-center gap-2 rounded-xl bg-card text-lg font-semibold text-white transition active:scale-[0.98]"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                    Betala med kort
                  </button>
                )}
                {showSwish && (
                  <button
                    onClick={handleSwishCheckout}
                    className="flex h-14 items-center justify-center gap-2 rounded-xl bg-swish text-lg font-semibold text-white transition active:scale-[0.98]"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                      <line x1="12" y1="18" x2="12.01" y2="18" />
                    </svg>
                    Betala med Swish
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
