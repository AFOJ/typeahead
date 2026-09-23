"use client"

import { useEffect, useRef, useState } from "react"

export function useDebouncedValue<T>(
  value: T,
  delay: number,
): [T, (v: T) => void] {
  const [debounced, setDebounced] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setDebounced(value), delay)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [value, delay])

  const setImmediate = (v: T) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setDebounced(v)
  }

  return [debounced, setImmediate]
}
