'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { FaultyTerminalJSCSS } from '@/components/FaultyTerminal-JS-CSS'
import { useBackgroundQuality } from '@/hooks/use-prefer-light-backgrounds'

export function Hero() {
  const { preferLightBackgrounds: preferLight, enablePostProcessing } = useBackgroundQuality()

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background: WebGL on desktop, lightweight gradient on mobile/slow devices */}
      <div className="absolute inset-0 z-0 bg-background">
        {preferLight ? (
          <div
            className="absolute inset-0 bg-gradient-to-br from-background via-background to-accent/10"
            style={{
              backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(193, 231, 52, 0.08) 0%, transparent 50%)',
            }}
            aria-hidden
          />
        ) : (
          <FaultyTerminalJSCSS
            scale={1.5}
            gridMul={[2, 1]}
            digitSize={1.2}
            timeScale={0.5}
            pause={false}
            scanlineIntensity={0.5}
            glitchAmount={1}
            flickerAmount={1}
            noiseAmp={1}
            chromaticAberration={0}
            dither={0}
            curvature={0.12}
            tint="#C1E734"
            mouseReact
            mouseStrength={0.5}
            pageLoadAnimation
            brightness={0.5}
            dpr={enablePostProcessing ? 2 : 1}
          />
        )}
      </div>

      {/* Overlay for better text readability */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-background/85 via-background/70 to-background/85 pointer-events-none" />

      {/* Content — pointer-events-none so background gets mouse; interactive elements get pointer-events-auto */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 sm:pt-24 sm:pb-12 md:py-12 w-full pointer-events-none">
        <div className="text-center space-y-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/80 backdrop-blur-md rounded-full border border-border/50"
          >
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 bg-accent rounded-full"
            />
            <span className="text-sm text-foreground/80">National Level Technical Fest 2026</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-tight"
          >
            Where Innovation
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="block text-accent"
            >
              Meets Excellence
            </motion.span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg sm:text-xl text-foreground/70 max-w-2xl mx-auto leading-relaxed"
          >
            Experience the pinnacle of technical excellence with hackathons, robotics competitions, gaming tournaments, and groundbreaking innovations from across the nation.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="pointer-events-auto">
              <Link
                href="/events"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent/90 transition-all group shadow-lg shadow-accent/20"
              >
                Explore All Events
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="pointer-events-auto">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 border border-border/50 bg-background/50 backdrop-blur-md text-foreground rounded-lg font-medium hover:bg-secondary/50 transition-all"
              >
                Register Now
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats — extra bottom padding on mobile so scroll indicator doesn't overlap */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="grid grid-cols-3 gap-4 sm:gap-6 md:gap-8 pt-12 sm:pt-16 md:pt-20 pb-16 md:pb-0"
          >
            {[
              { value: '50+', label: 'Events' },
              { value: '5000+', label: 'Participants' },
              { value: '50L+', label: 'Prize Pool' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
                whileHover={{ scale: 1.1 }}
                className="space-y-2 cursor-default"
              >
                <p className="text-3xl sm:text-4xl font-bold text-accent">{stat.value}</p>
                <p className="text-foreground/60 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator — hidden on mobile to avoid overlapping stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden md:block"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-accent/50 rounded-full flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-3 bg-accent rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </section>
  )
}
