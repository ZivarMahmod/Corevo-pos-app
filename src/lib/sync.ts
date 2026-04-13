import { Network } from '@capacitor/network'
import { getItem, setItem } from './storage'
import { createOrder } from './orders'
import type { CreateOrderPayload } from './orders'

const QUEUE_KEY = 'corevo:offline-queue'
const MAX_RETRIES = 5
let syncInProgress = false

interface QueuedOrder extends CreateOrderPayload {
  _retries?: number
  _nextRetryAt?: number // epoch ms — don't attempt before this
}

export async function queueOrder(order: CreateOrderPayload): Promise<void> {
  const queue = (await getItem<QueuedOrder[]>(QUEUE_KEY)) ?? []
  queue.push({ ...order, _retries: 0, _nextRetryAt: 0 })
  await setItem(QUEUE_KEY, queue)
}

export async function processQueue(): Promise<number> {
  if (syncInProgress) return 0
  syncInProgress = true

  try {
    const queue = (await getItem<QueuedOrder[]>(QUEUE_KEY)) ?? []
    if (queue.length === 0) return 0

    const now = Date.now()
    const remaining: QueuedOrder[] = []
    let synced = 0

    for (const order of queue) {
      // Skip if we're still in the backoff window
      if (order._nextRetryAt && order._nextRetryAt > now) {
        remaining.push(order)
        continue
      }

      // Drop permanently if max retries exceeded
      if ((order._retries ?? 0) >= MAX_RETRIES) {
        console.error('[sync] Order dropped after max retries:', order.receipt_number)
        continue
      }

      try {
        const { _retries: _r, _nextRetryAt: _n, ...payload } = order
        await createOrder(payload)
        synced++
      } catch {
        const retries = (order._retries ?? 0) + 1
        // Exponential backoff: 30s, 60s, 120s, 240s, 480s
        const backoffMs = Math.min(30_000 * Math.pow(2, retries - 1), 480_000)
        remaining.push({ ...order, _retries: retries, _nextRetryAt: now + backoffMs })
      }
    }

    await setItem(QUEUE_KEY, remaining)
    return synced
  } finally {
    syncInProgress = false
  }
}

export async function getQueueLength(): Promise<number> {
  const queue = (await getItem<QueuedOrder[]>(QUEUE_KEY)) ?? []
  return queue.length
}

export async function isOnline(): Promise<boolean> {
  try {
    const status = await Network.getStatus()
    return status.connected
  } catch {
    return navigator.onLine
  }
}

// Listen for network changes and sync
let listenerRegistered = false
export function startSyncListener(onSync?: (count: number) => void): void {
  if (listenerRegistered) return
  listenerRegistered = true

  Network.addListener('networkStatusChange', async (status) => {
    if (status.connected) {
      const synced = await processQueue()
      if (synced > 0 && onSync) onSync(synced)
    }
  })
}
