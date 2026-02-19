'use client'

import { useState, useEffect, useRef } from 'react'
import { CircularTextJSCSS } from '@/components/CircularText-JS-CSS'

export function CursorCircularText() {
  const [isVisible, setIsVisible] = useState(false)
  const [hasFinePointer, setHasFinePointer] = useState(false)
  const cursorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const media = window.matchMedia('(pointer: fine)')
    setHasFinePointer(media.matches)
    const listener = () => setHasFinePointer(media.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])

  useEffect(() => {
    if (!hasFinePointer || !cursorRef.current) return

    const element = cursorRef.current

    const handleMouseMove = (e: MouseEvent) => {
      // Immediate DOM update - no RAF delay
      element.style.left = `${e.clientX}px`
      element.style.top = `${e.clientY}px`
      
      if (!isVisible) {
        setIsVisible(true)
      }
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    // Add listeners to both window and document to catch all events
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [hasFinePointer, isVisible])

  if (!hasFinePointer) return null

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none fixed z-[100]"
      style={{
        left: 0,
        top: 0,
        transform: 'translate(-50%, -50%)',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.1s ease-out',
        willChange: 'transform',
        // Ensure it's not affected by any parent transforms
        isolation: 'isolate',
        contain: 'layout style paint',
      }}
    >
      <CircularTextJSCSS
        text="VERCERA 5.0 "
        onHover="speedUp"
        spinDuration={20}
        variant="cursor"
        className="text-accent"
      />
    </div>
  )
}
