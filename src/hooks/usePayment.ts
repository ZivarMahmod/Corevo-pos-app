import { useState, useCallback } from 'react'
import { generateReceiptNumber, createOrder, updateOrderStatus, decrementStock } from '@/lib/orders'
import type { OrderItem, PaymentMethod } from '@/lib/orders'
import { startPayment } from '@/lib/sumup'
import { queueOrder } from '@/lib/sync'
import { isOnline } from '@/lib/sync'

export type PaymentState = 'idle' | 'swish-qr' | 'card-pending' | 'processing' | 'success' | 'error'

interface PaymentContext {
  orderId: string | null
  receiptNumber: string | null
}

export function usePayment(tenantId: string, kioskId: string) {
  const [state, setState] = useState<PaymentState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [context, setContext] = useState<PaymentContext>({ orderId: null, receiptNumber: null })

  const startSwishPayment = useCallback(async (
    items: OrderItem[],
    total: number,
    vat: number,
  ) => {
    try {
      setState('processing')
      const receiptNumber = await generateReceiptNumber(tenantId, kioskId)

      const orderPayload = {
        tenant_id: tenantId,
        kiosk_id: kioskId,
        receipt_number: receiptNumber,
        items,
        total,
        vat,
        payment_method: 'swish' as PaymentMethod,
        status: 'pending' as const,
      }

      const online = await isOnline()
      let orderId: string | null = null

      if (online) {
        const order = await createOrder(orderPayload)
        orderId = order.id
      } else {
        await queueOrder(orderPayload)
      }

      setContext({ orderId, receiptNumber })
      setState('swish-qr')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte starta betalning')
      setState('error')
    }
  }, [tenantId, kioskId])

  const confirmSwishPayment = useCallback(async (items: OrderItem[]) => {
    try {
      setState('processing')
      if (context.orderId) {
        await updateOrderStatus(context.orderId, 'completed')
        await decrementStock(items)
      }
      setState('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte bekräfta betalning')
      setState('error')
    }
  }, [context.orderId])

  const startCardPayment = useCallback(async (
    items: OrderItem[],
    total: number,
    vat: number,
    testMode: boolean,
  ) => {
    try {
      setState('processing')
      const receiptNumber = await generateReceiptNumber(tenantId, kioskId)

      const orderPayload = {
        tenant_id: tenantId,
        kiosk_id: kioskId,
        receipt_number: receiptNumber,
        items,
        total,
        vat,
        payment_method: 'card' as PaymentMethod,
        status: 'pending' as const,
      }

      const online = await isOnline()
      let orderId: string | null = null

      if (online) {
        const order = await createOrder(orderPayload)
        orderId = order.id
      } else {
        await queueOrder(orderPayload)
      }

      setContext({ orderId, receiptNumber })
      setState('card-pending')

      // Trigger SumUp payment (testMode === true for simulation)
      const result = await startPayment(total, 'SEK', receiptNumber, testMode === true)

      if (result.success) {
        if (orderId) {
          await updateOrderStatus(orderId, 'completed')
          await decrementStock(items)
        }
        setState('success')
      } else {
        setError(result.message)
        setState('error')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kortbetalning misslyckades')
      setState('error')
    }
  }, [tenantId, kioskId])

  const cancelPayment = useCallback(async () => {
    if (context.orderId) {
      try {
        await updateOrderStatus(context.orderId, 'cancelled')
      } catch {
        // Best effort
      }
    }
    setState('idle')
    setError(null)
    setContext({ orderId: null, receiptNumber: null })
  }, [context.orderId])

  const reset = useCallback(() => {
    setState('idle')
    setError(null)
    setContext({ orderId: null, receiptNumber: null })
  }, [])

  return {
    state,
    error,
    receiptNumber: context.receiptNumber,
    startSwishPayment,
    confirmSwishPayment,
    startCardPayment,
    cancelPayment,
    reset,
  }
}
