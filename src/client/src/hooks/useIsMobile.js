import { useState, useEffect } from 'react'

const MOBILE_BREAKPOINT = 768

/**
 * @description React hook that returns true when viewport width is below the md breakpoint (768px).
 * Uses window.matchMedia for efficient, debounce-free listener registration.
 * @returns {boolean} Whether the current viewport is mobile-sized.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT
  )

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const handler = (e) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return isMobile
}
