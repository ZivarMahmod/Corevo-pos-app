import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useKiosk } from '@/hooks/useKiosk'
import { useProducts, type Product } from '@/hooks/useProducts'
import { useCart } from '@/hooks/useCart'
import { useIdleTimer } from '@/hooks/useIdleTimer'
import { usePayment } from '@/hooks/usePayment'
import { generateReceiptNumber, createOrder, updateOrderStatus, decrementStock } from '@/lib/orders'
import StatusBar from '@/components/StatusBar'
import ProductCard from '@/components/ProductCard'
import CartItemComponent from '@/components/CartItem'
import SwishQR from '@/components/SwishQR'

const SWISH_TIMEOUT = 45

const CATEGORY_IMAGES: Record<string, string> = {
  'Dryck': '/images/products/cola-zero.png',
  'Snacks': '/images/products/pringles.png',
  'Mellanmål': '/images/products/risifrutti.png',
  'Mat': '/images/products/billys-pan-pizza.png',
}

export default function ProductScreen() {
  const navigate = useNavigate()
  const { kiosk } = useKiosk()
  const { productsByCategory, uncategorized, categories, isLoading, getActivePrice } = useProducts(kiosk?.tenantId)
  const cart = useCart()
  const payment = usePayment(kiosk?.tenantId ?? '', kiosk?.kioskId ?? '')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [toast, setToast] = useState<{ name: string; visible: boolean } | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [fabBounce, setFabBounce] = useState(false)
  const [showSwishOverlay, setShowSwishOverlay] = useState(false)
  const [swishTotal, setSwishTotal] = useState(0)
  const [swishOrderId, setSwishOrderId] = useState<string | null>(null)
  const [swishReceipt, setSwishReceipt] = useState<string | null>(null)
  const [swishBusy, setSwishBusy] = useState(false)
  const [countdown, setCountdown] = useState(SWISH_TIMEOUT)
  const [showReminder, setShowReminder] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reminderRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const orderItemsRef = useRef(cart.toOrderItems())

  useEffect(() => {
    if (!showSwishOverlay) return
    setCountdown(SWISH_TIMEOUT)
    setShowReminder(false)
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { setShowSwishOverlay(false); return 0 }
        return prev - 1
      })
    }, 1000)
    reminderRef.current = setTimeout(() => setShowReminder(true), 5000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (reminderRef.current) clearTimeout(reminderRef.current)
    }
  }, [showSwishOverlay])

  const idleTimeout = (kiosk?.tenant.kiosk_idle_timeout || 120) * 1000
  useIdleTimer(idleTimeout, () => { cart.clearCart(); navigate('/') })

  const showToast = useCallback((name: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ name, visible: true })
    setFabBounce(true)
    setTimeout(() => setFabBounce(false), 300)
    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => prev ? { ...prev, visible: false } : null)
      setTimeout(() => setToast(null), 250)
    }, 1500)
  }, [])

  const handleAddToCart = useCallback((product: Product) => {
    const price = getActivePrice(product)
    cart.addItem(product, price)
    showToast(product.name)
  }, [cart, getActivePrice, showToast])

  const handleSwishCheckout = async () => {
    if (cart.items.length === 0) return
    const tenantId = kiosk?.tenantId ?? ''
    const kioskId = kiosk?.kioskId ?? ''
    const items = cart.toOrderItems()
    const total = cart.total
    const vat = cart.vatTotal
    orderItemsRef.current = items
    try {
      setSwishBusy(true)
      const receiptNumber = await generateReceiptNumber(tenantId, kioskId)
      const order = await createOrder({ tenant_id: tenantId, kiosk_id: kioskId, receipt_number: receiptNumber, items, total, vat, payment_method: 'swish', status: 'pending' })
      setSwishOrderId(order.id)
      setSwishReceipt(receiptNumber)
      setSwishTotal(total)
      setCartOpen(false)
      setShowSwishOverlay(true)
    } catch (err) { console.error('[swish] Failed to create order:', err) }
    finally { setSwishBusy(false) }
  }

  const handleSwishConfirm = async () => {
    if (!swishOrderId) return
    try {
      setSwishBusy(true)
      await updateOrderStatus(swishOrderId, 'completed')
      await decrementStock(orderItemsRef.current)
      cart.clearCart()
      setShowSwishOverlay(false)
      navigate('/thankyou', { state: { receiptNumber: swishReceipt } })
    } catch (err) { console.error('[swish] Failed to confirm:', err) }
    finally { setSwishBusy(false) }
  }

  const handleSwishCancel = () => { setShowSwishOverlay(false) }

  const handleCardCheckout = async () => {
    if (cart.items.length === 0) return
    const testMode = kiosk?.tenant.sumup_test_mode === true
    await payment.startCardPayment(cart.toOrderItems(), cart.total, cart.vatTotal, testMode)
    setCartOpen(false)
    navigate('/checkout', { state: { method: 'card' } })
  }

  const filteredProducts = activeCategory
    ? productsByCategory.find((g) => g.category.id === activeCategory)?.products ?? []
    : [...uncategorized, ...productsByCategory.flatMap((g) => g.products)]

  const tenantName = kiosk?.tenant.kiosk_club_name || kiosk?.tenant.name || 'Corevo POS'
  const showSwish = !!kiosk?.swishNumber
  const showCard = kiosk?.tenant.terminal_enabled && kiosk?.tenant.terminal_provider === 'sumup'
  const swishNumber = kiosk?.swishNumber || kiosk?.tenant.swish_number || ''

  const getCategoryImage = (catName: string) => {
    if (CATEGORY_IMAGES[catName]) return CATEGORY_IMAGES[catName]
    const group = productsByCategory.find((g) => g.category.name === catName)
    return group?.products.find((p) => p.image)?.image || null
  }

  return (
    <div className="flex h-full flex-col bg-bg">
      <StatusBar tenantName={tenantName} />

      <div className="flex-1 overflow-y-auto">
        {activeCategory === null ? (
          /* ── LANDING VIEW: Categories + Erbjudanden ── */
          <div className="px-5 pt-6 pb-24">
            <h2 className="mb-5 text-2xl font-extrabold text-text">Vad tar du idag?</h2>
            <div className="grid grid-cols-2 gap-4">
              {categories.map((cat) => {
                const catImage = getCategoryImage(cat.name)
                const count = productsByCategory.find((g) => g.category.id === cat.id)?.products.length ?? 0
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className="relative h-40 overflow-hidden rounded-2xl transition-transform duration-150 active:scale-[0.97]"
                    style={{ willChange: 'transform' }}
                  >
                    {catImage ? <img src={catImage} alt={cat.name} className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 bg-primary-light" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    <div className="absolute inset-0 flex flex-col items-start justify-end p-5">
                      <span className="text-2xl font-extrabold text-white drop-shadow">{cat.name}</span>
                      <span className="text-sm text-white/70">{count} produkter</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          /* ── PRODUCT VIEW: Grid for selected category ── */
          <>
            {/* Back button + category name */}
            <div className="flex items-center gap-3 px-5 pt-4 pb-2">
              <button
                onClick={() => setActiveCategory(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-black/[0.06] text-text transition active:scale-90"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <h2 className="text-xl font-bold text-text">
                {categories.find((c) => c.id === activeCategory)?.name || 'Produkter'}
              </h2>
            </div>

            {/* Category tabs for switching */}
            <div className="flex gap-2 overflow-x-auto px-5 pb-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`shrink-0 rounded-full px-5 py-3 text-base font-medium transition active:scale-95 ${
                    activeCategory === cat.id
                      ? 'bg-primary text-white'
                      : 'bg-white border border-black/[0.06] text-text'
                  }`}
                >
                  {cat.emoji && <span className="mr-1.5">{cat.emoji}</span>}
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Product grid */}
            <div className="px-5 pt-1 pb-24">
              {isLoading ? (
                <div className="flex h-64 items-center justify-center text-muted">Laddar produkter...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-muted">Inga produkter att visa</div>
              ) : (
                <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))' }}>
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} onAdd={() => handleAddToCart(product)} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-24 left-1/2 z-40 -translate-x-1/2 ${toast.visible ? 'animate-toast-in' : 'animate-toast-out'}`}>
          <div className="flex items-center gap-2 rounded-full bg-[#1a1a1a] px-5 py-3 shadow-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
            <span className="text-sm font-semibold text-white">{toast.name} tillagd</span>
          </div>
        </div>
      )}

      {/* FAB */}
      {!cartOpen && !showSwishOverlay && (
        <button
          onClick={() => setCartOpen(true)}
          className={`fixed bottom-6 right-6 z-30 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-[0_4px_20px_rgba(45,107,90,0.4)] transition active:scale-90 ${fabBounce ? 'animate-fab-bounce' : ''}`}
          style={{ willChange: 'transform' }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          {cart.itemCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-white shadow">{cart.itemCount}</span>
          )}
        </button>
      )}

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setCartOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="animate-drawer-up absolute bottom-0 left-0 right-0 flex max-h-[70vh] flex-col rounded-t-3xl bg-white shadow-[0_-8px_40px_rgba(0,0,0,0.15)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1"><div className="h-1 w-10 rounded-full bg-gray-300" /></div>
            <div className="flex items-center justify-between px-6 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-xl font-bold">Din beställning</span>
                {cart.itemCount > 0 && <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{cart.itemCount}</span>}
              </div>
              <div className="flex items-center gap-3">
                {cart.items.length > 0 && <button onClick={() => cart.clearCart()} className="text-sm text-muted active:opacity-70">Rensa</button>}
                <button onClick={() => setCartOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-muted active:bg-gray-200">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto border-t border-black/[0.06] px-4 py-3">
              {cart.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12"><span className="text-5xl">🛒</span><p className="text-muted">Varukorgen är tom</p></div>
              ) : (
                <div className="flex flex-col gap-2">
                  {cart.items.map((item) => <CartItemComponent key={item.product.id} item={item} onUpdateQty={(qty) => cart.updateQuantity(item.product.id, qty)} onRemove={() => cart.removeItem(item.product.id)} />)}
                </div>
              )}
            </div>
            {cart.items.length > 0 && (
              <div className="border-t border-black/[0.06] px-6 py-5">
                <div className="mb-1 flex justify-between text-sm text-muted"><span>Delsumma</span><span>{cart.total} kr</span></div>
                <div className="mb-3 flex justify-between text-sm text-muted"><span>Varav moms</span><span>{cart.vatTotal.toFixed(2)} kr</span></div>
                <div className="mb-5 flex justify-between text-[22px] font-extrabold"><span>Totalt</span><span>{cart.total} kr</span></div>
                <div className="flex flex-col gap-2">
                  {showSwish && (
                    <button onClick={handleSwishCheckout} disabled={swishBusy} className="flex h-14 items-center justify-center gap-2.5 rounded-full bg-swish text-lg font-bold text-white shadow-[0_4px_16px_rgba(76,175,80,0.3)] transition active:scale-[0.97] disabled:opacity-50" style={{ willChange: 'transform' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg>
                      {swishBusy ? 'Skapar order...' : 'Betala med Swish'}
                    </button>
                  )}
                  {showCard && (
                    <button onClick={handleCardCheckout} className="flex h-14 items-center justify-center gap-2.5 rounded-full bg-card text-lg font-bold text-white shadow-[0_4px_16px_rgba(0,180,216,0.3)] transition active:scale-[0.97]" style={{ willChange: 'transform' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                      Betala med kort
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Swish overlay */}
      {showSwishOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="animate-slide-up flex w-full max-w-[480px] flex-col items-center rounded-3xl bg-white p-8 shadow-[0_24px_48px_rgba(0,0,0,0.2)]">
            <h2 className="mb-2 text-3xl font-extrabold">Skanna med Swish</h2>
            <p className="mb-4 text-base text-muted">Öppna Swish-appen och skanna QR-koden</p>
            <div className={`animate-countdown mb-5 text-4xl font-extrabold ${countdown <= 10 ? 'text-danger' : 'text-text'}`}>{countdown}<span className="ml-1 text-lg font-medium text-muted">sek</span></div>
            <SwishQR swishNumber={swishNumber} amount={swishTotal} message="Corevo POS" />
            <p className="mt-5 text-3xl font-extrabold text-swish">{swishTotal} kr</p>
            <p className="mt-1 text-sm text-muted">Swish: {swishNumber}</p>
            {showReminder && <div className="animate-fade-in mt-4 rounded-full bg-accent/10 px-5 py-2 text-sm font-medium text-accent">Glöm inte registrera ditt köp! 😊</div>}
            <div className="mt-6 flex w-full gap-3">
              <button onClick={handleSwishConfirm} disabled={swishBusy} className="flex h-[50px] flex-1 items-center justify-center rounded-full bg-primary text-base font-bold text-white transition active:scale-[0.97] disabled:opacity-50">{swishBusy ? 'Bekräftar...' : 'Registrera köp'}</button>
              <button onClick={handleSwishCancel} className="flex h-[50px] items-center justify-center rounded-full border-2 border-gray-300 px-6 text-base font-semibold text-muted transition active:scale-[0.97]">Avbryt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
