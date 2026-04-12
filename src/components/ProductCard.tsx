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
    <button
      onClick={onAdd}
      disabled={isOutOfStock}
      className={`
        relative flex flex-col items-center rounded-2xl border-2 bg-white p-4 shadow-sm
        transition-all duration-150 touch-active
        ${isOutOfStock
          ? 'border-gray-200 opacity-50 cursor-not-allowed'
          : 'border-transparent hover:border-primary/20 hover:shadow-md active:scale-95'
        }
      `}
    >
      {/* Badge */}
      {product.badge_label && !isOutOfStock && (
        <span
          className="absolute -top-2 -right-2 rounded-full px-2 py-0.5 text-xs font-bold text-white"
          style={{ backgroundColor: product.badge_color || '#f5a623' }}
        >
          {product.badge_label}
        </span>
      )}

      {/* Campaign badge */}
      {hasCampaign && !isOutOfStock && (
        <span className="absolute -top-2 left-2 rounded-full bg-danger px-2 py-0.5 text-xs font-bold text-white">
          REA
        </span>
      )}

      {/* Image or Emoji */}
      <div className="mb-3 flex h-20 w-20 items-center justify-center">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full rounded-lg object-cover"
          />
        ) : (
          <span className="text-4xl">{product.emoji || '📦'}</span>
        )}
      </div>

      {/* Name */}
      <span className="text-center text-sm font-medium leading-tight">
        {product.name}
      </span>

      {/* Price */}
      <div className="mt-1.5 flex items-center gap-2">
        {hasCampaign && (
          <span className="text-sm text-muted line-through">{product.price} kr</span>
        )}
        <span className={`text-base font-bold ${hasCampaign ? 'text-danger' : 'text-text'}`}>
          {product.activePrice} kr
        </span>
      </div>

      {/* Out of stock overlay */}
      {isOutOfStock && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/60">
          <span className="rounded-lg bg-gray-800/80 px-3 py-1 text-sm font-semibold text-white">
            Slutsåld
          </span>
        </div>
      )}
    </button>
  )
}
