import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

const isNative = Capacitor.isNativePlatform()

export async function setItem<T>(key: string, value: T): Promise<void> {
  const json = JSON.stringify(value)
  if (isNative) {
    await Preferences.set({ key, value: json })
  } else {
    localStorage.setItem(key, json)
  }
}

export async function getItem<T>(key: string): Promise<T | null> {
  let raw: string | null = null
  if (isNative) {
    const result = await Preferences.get({ key })
    raw = result.value
  } else {
    raw = localStorage.getItem(key)
  }
  if (raw === null) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function removeItem(key: string): Promise<void> {
  if (isNative) {
    await Preferences.remove({ key })
  } else {
    localStorage.removeItem(key)
  }
}
