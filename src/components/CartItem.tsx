import type { CartItem as CartItemType } from '@/hooks/useCart'

interface CartItemProps {
  item: CartItemType
  onUpdateQty: (qty: number) => void
  onRemove: () => void
}

export default function CartItem({ item, onUpdateQty, onRemove }: CartItemProps) {
  const lineTotal = item.activePrice * item.quantity

  return (
    <div className="animate-cart-enter flex items-center gap-3 rounded-xl bg-bg p-2.5">
      {/* Product icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light">
        {item.product.image ? (
          <img
            src={item.product.image}
            alt={item.product.name}
            className="h-full w-full rounded-lg object-cover"
          />
        ) : (
          <span className="text-lg">{item.product.emoji || '📦'}</span>
        )}
      </div>

      {/* Product info */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold">{item.product.name}</p>
        <p className="text-xs text-muted">{item.activePrice} kr/st</p>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onUpdateQty(item.quantity - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 bg-white text-base font-bold transition active:scale-95 active:bg-gray-100"
        >
          −
        </button>
        <span className="w-7 text-center text-sm font-bold">
          {item.quantity}
        </span>
        <button
          onClick={() => onUpdateQty(item.quantity + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 bg-white text-base font-bold transition active:scale-95 active:bg-gray-100"
        >
          +
        </button>
      </div>

      {/* Line total + remove */}
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-sm font-bold">{lineTotal} kr</span>
        <button
          onClick={onRemove}
          className="text-[11px] text-danger active:opacity-70"
        >
          Ta bort
        </button>
      </div>
    </div>
  )
}
