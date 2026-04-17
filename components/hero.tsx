'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
export function Hero() {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Content — interactive elements get pointer-events-auto */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12 sm:pt-32 sm:pb-12 md:pt-36 md:pb-14 w-full pointer-events-none">
        <div className="text-center space-y-[2.25rem]">
          {/* Fest dates */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 rounded-2xl border-2 border-accent/60 bg-accent/15 text-2xl sm:text-4xl font-black text-accent tracking-wider shadow-lg shadow-accent/25"
          >
            17-21 April
          </motion.p>

          {/* Organized By */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col items-center justify-center gap-2 text-sm text-foreground/60 pointer-events-auto"
          >
            <span className="font-mono">Organized by</span>
            <motion.a
              href="https://amuroboclub.com"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 cursor-pointer transition-opacity hover:opacity-100 opacity-90 relative z-10"
            >
              <Image
                src="/amuroboclub.png"
                alt="AMURoboclub"
                width={200}
                height={60}
                quality={100}
                priority
                className="h-8 w-auto object-contain"
              />
            </motion.a>
          </motion.div>

          <div className="flex justify-center w-full">
            <motion.img
              className="w-[70%] h-full object-contain"
              src="/vercera_full_logo.png"
              alt="Vercera"
              width={500}
              height={500}
            />
          </div>
          {/* Sponsors strip — co-powered + technical partner, horizontal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="pointer-events-auto flex flex-wrap justify-center items-stretch gap-3 max-w-3xl mx-auto"
          >
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl border border-cyan-300/45 bg-cyan-300/12 shadow-lg shadow-cyan-300/10">
              <span className="text-sm font-semibold text-cyan-200">Co-powered by</span>
              <img
                src="/harrison_logo.jpg.jpeg"
                alt="Harrison Group"
                className="w-9 h-9 rounded-full object-cover border border-cyan-200/50"
              />
              <span className="text-base font-bold text-foreground">Harrison Group</span>
            </div>
            <a
              href="https://stickapp.club"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-2 rounded-2xl border border-accent/45 bg-accent/12 shadow-lg shadow-accent/10 hover:border-accent/70 hover:bg-accent/18 transition-colors"
            >
              <span className="text-sm font-semibold text-accent">Technical partner</span>
              <img
                src="/stick_logomark_coloured.svg"
                alt="Stick"
                className="w-9 h-9 object-contain"
              />
              <span className="text-base font-bold text-foreground">
                Stick<sup className="text-xs align-super">®</sup>
              </span>
            </a>
          </motion.div>

          {/* Main Heading */}



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
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-accent text-accent-foreground rounded-full font-medium hover:bg-accent/90 transition-all group shadow-lg shadow-accent/20"
              >
                Explore All Events
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="pointer-events-auto">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-4 border border-border/50 bg-background/50 backdrop-blur-md text-foreground rounded-full font-medium hover:bg-secondary/50 transition-all"
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
              { value: '20+', label: 'Events' },
              { value: '500+', label: 'Participants' },
              { value: '2L+', label: 'Prize Pool' },
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

      {/* Scroll indicator removed to avoid overlap with hero stats */}
    </section >
  )
}
