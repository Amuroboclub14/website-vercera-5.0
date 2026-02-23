'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Bootloader } from './bootloader'

const BOOTLOADER_SEEN_KEY = 'vercera_bootloader_seen'

interface BootloaderWrapperProps {
  children: React.ReactNode
}

export function BootloaderWrapper({ children }: BootloaderWrapperProps) {
  const pathname = usePathname()
  const [showBootloader, setShowBootloader] = useState<boolean | null>(null)
  const [isContentReady, setIsContentReady] = useState(false)

  // Only show video on landing (/) and only the first time in this session
  useEffect(() => {
    if (typeof window === 'undefined') return
    const seen = sessionStorage.getItem(BOOTLOADER_SEEN_KEY)
    if (pathname !== '/') {
      sessionStorage.setItem(BOOTLOADER_SEEN_KEY, '1')
      setShowBootloader(false)
      setIsContentReady(true)
      return
    }
    if (seen) {
      setShowBootloader(false)
      setIsContentReady(true)
      return
    }
    setShowBootloader(true)
    setIsContentReady(false)
  }, [pathname])

  const handleBootloaderComplete = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(BOOTLOADER_SEEN_KEY, '1')
      window.scrollTo(0, 0)
      setTimeout(() => window.scrollTo(0, 0), 100)
    }
    setShowBootloader(false)
    setIsContentReady(true)
  }

  const showing = showBootloader === true

  return (
    <>
      {showing && <Bootloader onComplete={handleBootloaderComplete} />}

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{
          opacity: !showing ? 1 : 0,
          scale: !showing ? 1 : 0.98,
        }}
        transition={{
          duration: 1.2,
          ease: [0.16, 1, 0.3, 1],
          delay: showing ? 0 : 0.2,
        }}
        className={showing ? 'pointer-events-none overflow-hidden' : ''}
        style={{
          filter: showing ? 'blur(8px)' : 'blur(0px)',
          willChange: showing ? 'filter, opacity, transform' : 'auto',
        }}
      >
        {children}
      </motion.div>
    </>
  )
}
