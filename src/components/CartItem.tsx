import type { CartItem as CartItemType } from '@/hooks/useCart'

interface CartItemProps {
  item: CartItemType
  onUpdateQty: (qty: number) => void
  onRemove: () => void
}

export default function CartItem({ item, onUpdateQty, onRemove }: CartItemProps) {
  const lineTotal = item.activePrice * item.quantity

  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3">
      {/* Product info */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium">{item.product.name}</p>
        <p className="text-xs text-muted">{item.activePrice} kr/st</p>
      </div>

      {/* Quantity controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onUpdateQty(item.quantity - 1)}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-lg font-bold transition active:bg-gray-200 active:scale-95"
        >
          −
        </button>
        <span className="w-8 text-center text-base font-semibold">
          {item.quantity}
        </span>
        <button
          onClick={() => onUpdateQty(item.quantity + 1)}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-lg font-bold transition active:bg-gray-200 active:scale-95"
        >
          +
        </button>
      </div>

      {/* Line total + remove */}
      <div className="flex flex-col items-end gap-1">
        <span className="text-sm font-bold">{lineTotal} kr</span>
        <button
          onClick={onRemove}
          className="text-xs text-danger hover:underline active:opacity-70"
        >
          Ta bort
        </button>
      </div>
    </div>
  )
}
