import { supabase } from './supabase'
import { getItem, setItem } from './storage'

export type PaymentMethod = 'swish' | 'card' | 'cash' | 'manual'

export interface OrderItem {
  product_id: string
  name: string
  quantity: number
  price: number
  vat_rate: number
}

export interface CreateOrderPayload {
  tenant_id: string
  kiosk_id: string
  receipt_number: string
  items: OrderItem[]
  total: number
  vat: number
  payment_method: PaymentMethod
  status: 'pending' | 'completed' | 'cancelled'
}

export interface Order extends CreateOrderPayload {
  id: string
  created_at: string
}

/**
 * Generate a gapless receipt number: YYYYMMDD-NNNN
 * Tries server-side RPC first (atomic counter), falls back to local storage.
 */
export async function generateReceiptNumber(tenantId: string, kioskId: string): Promise<string> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')

  // Try server-side RPC if we have valid IDs
  if (kioskId && kioskId.length > 10 && tenantId && tenantId.length > 10) {
    console.log('[receipt] RPC next_receipt_number →', { p_tenant_id: tenantId, p_kiosk_id: kioskId })
    const { data, error } = await supabase.rpc('next_receipt_number', {
      p_tenant_id: tenantId,
      p_kiosk_id: kioskId,
    })
    if (!error && data) return data as string
  }

  // Fallback: local counter per kiosk per day
  const key = `corevo:receipt:${kioskId || 'unknown'}:${today}`
  const current = await getItem<number>(key)
  const next = (current ?? 0) + 1
  await setItem(key, next)
  return `${today}-${String(next).padStart(4, '0')}`
}

/**
 * Calculate VAT from items (Swedish VAT is inclusive in the price).
 * Formula: vatAmount = price * qty * (vatRate / (1 + vatRate))
 */
export function calculateVat(items: OrderItem[]): number {
  let totalVat = 0
  for (const item of items) {
    const rate = item.vat_rate || 0.25 // Default 25% Swedish VAT
    const lineTotal = item.price * item.quantity
    totalVat += lineTotal * (rate / (1 + rate))
  }
  return Math.round(totalVat * 100) / 100
}

export async function createOrder(order: CreateOrderPayload): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .insert({
      tenant_id: order.tenant_id,
      kiosk_id: order.kiosk_id,
      receipt_number: order.receipt_number,
      total: order.total,
      vat: order.vat,
      payment_method: order.payment_method,
      status: order.status,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Insert order items
  const itemRows = order.items.map((item) => ({
    order_id: data.id,
    product_id: item.product_id,
    name: item.name,
    qty: item.quantity,
    price: item.price,
  }))

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(itemRows)

  if (itemsError) {
    console.error('[orders] Failed to insert order items:', itemsError.message)
  }

  return { ...order, id: data.id, created_at: data.created_at }
}

export async function updateOrderStatus(
  orderId: string,
  status: 'pending' | 'completed' | 'cancelled'
): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)

  if (error) throw new Error(error.message)
}

export async function decrementStock(items: OrderItem[]): Promise<void> {
  for (const item of items) {
    // Read current quantity, then update
    const { data: product } = await supabase
      .from('products')
      .select('quantity')
      .eq('id', item.product_id)
      .single()

    if (product && product.quantity !== null) {
      const newQty = Math.max(0, product.quantity - item.quantity)
      await supabase
        .from('products')
        .update({ quantity: newQty })
        .eq('id', item.product_id)
    }
  }
}
