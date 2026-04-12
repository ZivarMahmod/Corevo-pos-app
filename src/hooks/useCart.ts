import { useState, useCallback } from 'react'
import { calculateVat, type OrderItem } from '@/lib/orders'
import type { Product } from './useProducts'

export interface CartItem {
  product: Product
  quantity: number
  activePrice: number
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = useCallback((product: Product, activePrice: number) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { product, quantity: 1, activePrice }]
    })
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId))
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId))
    } else {
      setItems((prev) =>
        prev.map((i) =>
          i.product.id === productId ? { ...i, quantity } : i
        )
      )
    }
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const total = items.reduce(
    (sum, item) => sum + item.activePrice * item.quantity,
    0
  )

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const toOrderItems = (): OrderItem[] =>
    items.map((item) => ({
      product_id: item.product.id,
      name: item.product.name,
      quantity: item.quantity,
      price: item.activePrice,
      vat_rate: item.product.vat_rate ?? 0.25,
    }))

  const vatTotal = calculateVat(toOrderItems())

  return {
    items,
    total,
    itemCount,
    vatTotal,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    toOrderItems,
  }
}
