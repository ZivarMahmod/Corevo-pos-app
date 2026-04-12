import { Network } from '@capacitor/network'
import { getItem, setItem } from './storage'
import { createOrder } from './orders'
import type { CreateOrderPayload } from './orders'

const QUEUE_KEY = 'corevo:offline-queue'

export async function queueOrder(order: CreateOrderPayload): Promise<void> {
  const queue = (await getItem<CreateOrderPayload[]>(QUEUE_KEY)) ?? []
  queue.push(order)
  await setItem(QUEUE_KEY, queue)
}

export async function processQueue(): Promise<number> {
  const queue = (await getItem<CreateOrderPayload[]>(QUEUE_KEY)) ?? []
  if (queue.length === 0) return 0

  const remaining: CreateOrderPayload[] = []
  let synced = 0

  for (const order of queue) {
    try {
      await createOrder(order)
      synced++
    } catch {
      remaining.push(order)
    }
  }

  await setItem(QUEUE_KEY, remaining)
  return synced
}

export async function getQueueLength(): Promise<number> {
  const queue = (await getItem<CreateOrderPayload[]>(QUEUE_KEY)) ?? []
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
