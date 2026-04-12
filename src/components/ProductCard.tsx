import type { Product } from '@/hooks/useProducts'

interface ProductCardProps {
  product: Product & { activePrice: number }
  onAdd: () => void
}

export default function ProductCard({ product, onAdd }: ProductCardProps) {
  const isOutOfStock = product.stock_status === 'slut' ||
    (product.quantity !== null && product.quantity <= 0)
  const hasCampaign = product.activePrice < product.price

  return (
    <div
      className={`
        relative flex flex-col overflow-hidden rounded-2xl bg-white
        border border-black/[0.06]
        shadow-[0_2px_8px_rgba(0,0,0,0.04)]
        transition-transform duration-150
        ${isOutOfStock ? 'opacity-50' : 'active:scale-[0.96]'}
      `}
      style={{ willChange: 'transform' }}
    >
      {/* Badge */}
      {product.badge_label && !isOutOfStock && (
        <span
          className="absolute top-2 right-2 z-10 rounded-full px-2.5 py-1 text-[10px] font-bold text-white"
          style={{ backgroundColor: product.badge_color || '#f5a623' }}
        >
          {product.badge_label}
        </span>
      )}

      {/* Campaign badge */}
      {hasCampaign && !isOutOfStock && (
        <span className="absolute top-2 left-2 z-10 rounded-full bg-danger px-2.5 py-1 text-[10px] font-bold text-white">
          REA
        </span>
      )}

      {/* Image area */}
      <div className="aspect-square w-full overflow-hidden bg-primary-light">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-5xl">{product.emoji || '📦'}</span>
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="flex flex-1 flex-col justify-between p-3">
        <p className="text-sm font-semibold leading-tight line-clamp-2">
          {product.name}
        </p>
        <div className="mt-2 flex items-center gap-2">
          {hasCampaign && (
            <span className="text-xs text-muted line-through">{product.price} kr</span>
          )}
          <span className={`text-base font-bold ${hasCampaign ? 'text-danger' : 'text-text'}`}>
            {product.activePrice} kr
          </span>
        </div>
      </div>

      {/* Add button */}
      {!isOutOfStock && (
        <button
          onClick={onAdd}
          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-md transition active:scale-90"
          style={{ willChange: 'transform' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}

      {/* Out of stock overlay */}
      {isOutOfStock && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70">
          <span className="rounded-xl bg-[#1a1a1a]/80 px-4 py-2 text-sm font-semibold text-white">
            Slutsåld
          </span>
        </div>
      )}
    </div>
  )
}
