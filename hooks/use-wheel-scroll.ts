'use client'

import { useEffect, type RefObject } from 'react'

/**
 * Ensures wheel/trackpad events scroll the given element instead of the page.
 * Must use passive: false so preventDefault() works. Call with a ref on the scroll container.
 * Pass enabled=true when the scroll element is actually in the DOM (e.g. after data has loaded).
 */
export function useWheelScroll(ref: RefObject<HTMLDivElement | null>, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    const el = ref.current
    if (!el) return

    const handleWheel = (e: WheelEvent) => {
      const { scrollTop, scrollHeight, clientHeight } = el
      const scrollingDown = e.deltaY > 0
      const canScrollDown = scrollTop + clientHeight < scrollHeight - 1
      const canScrollUp = scrollTop > 1
      if ((scrollingDown && canScrollDown) || (!scrollingDown && canScrollUp)) {
        e.preventDefault()
        el.scrollTop += e.deltaY
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [ref, enabled])
}
