'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface BootloaderProps {
  onComplete: () => void
}

export function Bootloader({ onComplete }: BootloaderProps) {
  const [isPlaying, setIsPlaying] = useState(true)
  const [isExiting, setIsExiting] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [canSkip, setCanSkip] = useState(false)

  useEffect(() => {
    // Allow skipping after 1 second
    const skipTimer = setTimeout(() => {
      setCanSkip(true)
    }, 1000)

    return () => clearTimeout(skipTimer)
  }, [])

  const handleVideoEnd = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsPlaying(false)
      onComplete()
    }, 800)
  }

  const handleSkip = () => {
    if (!canSkip) return
    if (videoRef.current) {
      videoRef.current.pause()
    }
    setIsExiting(true)
    setTimeout(() => {
      setIsPlaying(false)
      onComplete()
    }, 800)
  }

  useEffect(() => {
    const playVideo = () => {
      if (videoRef.current) {
        // Try to play with sound first
        videoRef.current.play().catch((err) => {
          console.log('Video play with sound failed, trying muted:', err)
          // If autoplay with sound fails, try muted
          if (videoRef.current) {
            videoRef.current.muted = true
            videoRef.current.play().catch((err2) => {
              console.error('Video play failed:', err2)
              // If autoplay fails completely, allow manual play or skip
              setCanSkip(true)
            })
          }
        })
      }
    }

    // Try to play video when component mounts or when video is ready
    if (videoRef.current && videoRef.current.readyState >= 2) {
      playVideo()
    }
  }, [])

  const handleVideoLoaded = () => {
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.log('Video play with sound failed, trying muted:', err)
        if (videoRef.current) {
          videoRef.current.muted = true
          videoRef.current.play().catch((err2) => {
            console.error('Video play failed:', err2)
            setCanSkip(true)
          })
        }
      })
    }
  }

  return (
    <AnimatePresence>
      {isPlaying && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: isExiting ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] bg-black overflow-hidden"
        >
          {/* Video Container - Full screen, no borders */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: isExiting ? 1.1 : 1, opacity: isExiting ? 0 : 1 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="absolute inset-0 w-screen h-screen"
            style={{
              width: '100vw',
              height: '100vh',
              minWidth: '100%',
              minHeight: '100%',
            }}
          >
            <video
              ref={videoRef}
              src="/bootloader.mp4"
              className="absolute inset-0 w-full h-full"
              style={{
                objectFit: 'cover',
                objectPosition: 'center',
                width: '100vw',
                height: '100vh',
                minWidth: '100%',
                minHeight: '100%',
              }}
              onEnded={handleVideoEnd}
              onLoadedData={handleVideoLoaded}
              onCanPlay={handleVideoLoaded}
              playsInline
              muted={false}
              autoPlay
              preload="auto"
            />
          </motion.div>

          {/* Skip Button */}
          {canSkip && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onClick={handleSkip}
              className="absolute top-6 right-6 z-10 px-4 py-2 bg-background/80 backdrop-blur-md border border-border/50 rounded-full text-foreground/70 hover:text-foreground hover:bg-background/90 transition-all flex items-center gap-2 text-sm font-medium"
            >
              <X size={16} />
              Skip
            </motion.button>
          )}

          {/* Loading indicator (if video is loading) */}
          {!videoRef.current?.readyState && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-12 h-12 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
