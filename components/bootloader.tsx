'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'

interface BootloaderProps {
  onComplete: () => void
}

export function Bootloader({ onComplete }: BootloaderProps) {
  const [isPlaying, setIsPlaying] = useState(true)
  const [isExiting, setIsExiting] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [canSkip, setCanSkip] = useState(false)
  const isMobile = useIsMobile()
  const [isMobileState, setIsMobileState] = useState(false)

  // Ensure mobile detection works immediately
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobileState(window.innerWidth < 768)
      const handleResize = () => {
        setIsMobileState(window.innerWidth < 768)
      }
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])
  
  // Use the more reliable mobile state
  const isMobileDevice = isMobileState || (typeof window !== 'undefined' && window.innerWidth < 768)

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
          {/* Animated background pattern for blank spaces (mobile) */}
          {isMobileDevice && (
            <div className="fixed inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
              {/* Animated grid pattern - MUCH MORE VISIBLE */}
              <motion.div
                className="absolute inset-0"
                style={{
                  backgroundImage: 'linear-gradient(rgba(193, 231, 52, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(193, 231, 52, 0.4) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                  opacity: 0.3,
                }}
                animate={{
                  backgroundPosition: ['0% 0%', '20px 20px'],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
              
              {/* Floating particles - MUCH MORE VISIBLE */}
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: '6px',
                    height: '6px',
                    background: 'rgba(193, 231, 52, 1)',
                    boxShadow: '0 0 12px rgba(193, 231, 52, 0.8), 0 0 20px rgba(193, 231, 52, 0.4)',
                    left: `${2 + (i * 5)}%`,
                    top: `${5 + (i % 18) * 5}%`,
                  }}
                  animate={{
                    opacity: [0.4, 1, 0.4],
                    scale: [1, 3, 1],
                  }}
                  transition={{
                    duration: 1.5 + i * 0.1,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.08,
                  }}
                />
              ))}
              
              {/* Pulsing circles in blank spaces - MUCH MORE VISIBLE */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`circle-${i}`}
                  className="absolute rounded-full border-2"
                  style={{
                    width: '100px',
                    height: '100px',
                    borderColor: 'rgba(193, 231, 52, 0.7)',
                    borderWidth: '2px',
                    boxShadow: '0 0 15px rgba(193, 231, 52, 0.5)',
                    left: `${10 + (i * 11)}%`,
                    top: i % 2 === 0 ? '2%' : '98%',
                    transform: 'translate(-50%, -50%)',
                  }}
                  animate={{
                    scale: [1, 2.5, 1],
                    opacity: [0.4, 0.9, 0.4],
                  }}
                  transition={{
                    duration: 2 + i * 0.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.25,
                  }}
                />
              ))}
            </div>
          )}

          {/* Video Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: isExiting ? 1.1 : 1, opacity: isExiting ? 0 : 1 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="absolute inset-0 w-screen h-screen flex items-center justify-center"
            style={{
              width: '100vw',
              height: '100vh',
              zIndex: 2,
            }}
          >
            {isMobileDevice ? (
              <video
                ref={videoRef}
                src="/bootloader.mp4"
                className="relative w-full h-auto max-h-full"
                style={{
                  objectFit: 'contain',
                  objectPosition: 'center',
                  display: 'block',
                }}
                onEnded={handleVideoEnd}
                onLoadedData={handleVideoLoaded}
                onCanPlay={handleVideoLoaded}
                playsInline
                muted={false}
                autoPlay
                preload="auto"
              />
            ) : (
              <video
                ref={videoRef}
                src="/bootloader.mp4"
                className="w-full h-full"
                style={{
                  objectFit: 'cover',
                  objectPosition: 'center',
                }}
                onEnded={handleVideoEnd}
                onLoadedData={handleVideoLoaded}
                onCanPlay={handleVideoLoaded}
                playsInline
                muted={false}
                autoPlay
                preload="auto"
              />
            )}
          </motion.div>

          {/* Gradient overlays for mobile - positioned at root level */}
          {isMobileDevice && (
            <>
              {/* Top gradient overlay - covers top blank space and blends into video */}
              <div
                className="fixed top-0 left-0 right-0 pointer-events-none"
                style={{
                  height: '40%',
                  background: 'linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.95) 25%, rgba(0, 0, 0, 0.75) 50%, rgba(0, 0, 0, 0.4) 75%, rgba(0, 0, 0, 0.1) 90%, rgba(0, 0, 0, 0) 100%)',
                  zIndex: 3,
                }}
              />
              
              {/* Bottom gradient overlay - covers bottom blank space and blends into video */}
              <div
                className="fixed bottom-0 left-0 right-0 pointer-events-none"
                style={{
                  height: '40%',
                  background: 'linear-gradient(to top, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.95) 25%, rgba(0, 0, 0, 0.75) 50%, rgba(0, 0, 0, 0.4) 75%, rgba(0, 0, 0, 0.1) 90%, rgba(0, 0, 0, 0) 100%)',
                  zIndex: 3,
                }}
              />
            </>
          )}

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
