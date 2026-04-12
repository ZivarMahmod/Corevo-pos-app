import { useEffect, useRef, useCallback, useState } from 'react'

export function useIdleTimer(timeoutMs: number, onIdle: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const callbackRef = useRef(onIdle)
  const mountedAt = useRef(Date.now())
  const [isIdle, setIsIdle] = useState(false)

  callbackRef.current = onIdle

  const resetTimer = useCallback(() => {
    setIsIdle(false)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (timeoutMs <= 0) return // No idle timer if disabled
    timerRef.current = setTimeout(() => {
      // Ignore if fired within 2s of mount (screen transition artifact)
      if (Date.now() - mountedAt.current < 2000) return
      setIsIdle(true)
      callbackRef.current()
    }, timeoutMs)
  }, [timeoutMs])

  useEffect(() => {
    const events = ['touchstart', 'mousedown', 'keydown', 'scroll']
    const handler = () => resetTimer()

    events.forEach((e) => document.addEventListener(e, handler, { passive: true }))
    resetTimer() // Start timer on mount

    return () => {
      events.forEach((e) => document.removeEventListener(e, handler))
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [resetTimer])

  return { resetTimer, isIdle }
}
