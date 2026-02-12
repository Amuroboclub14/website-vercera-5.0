'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function Hero() {
  return (
    <section id="home" className="min-h-screen pt-32 flex items-center justify-center relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 right-10 w-72 h-72 bg-accent/15 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/8 rounded-full blur-3xl opacity-40"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full">
            <span className="w-2 h-2 bg-accent rounded-full"></span>
            <span className="text-sm text-foreground/80">National Level Technical Fest 2026</span>
          </div>

          {/* Main Heading */}
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
            Where Innovation
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">
              Meets Excellence
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            Experience the pinnacle of technical excellence with hackathons, robotics competitions, gaming tournaments, and groundbreaking innovations from across the nation.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/events"
              className="px-8 py-4 bg-gradient-to-r from-accent to-primary text-accent-foreground rounded-lg font-medium hover:shadow-lg hover:shadow-accent/40 transition-all flex items-center justify-center gap-2 group"
            >
              Explore All Events
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/signup"
              className="px-8 py-4 border border-border text-foreground rounded-lg font-medium hover:bg-secondary/50 transition-all"
            >
              Register Now
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-16 sm:pt-20">
            <div className="space-y-2">
              <p className="text-3xl sm:text-4xl font-bold text-accent">50+</p>
              <p className="text-foreground/60 text-sm">Events</p>
            </div>
            <div className="space-y-2">
              <p className="text-3xl sm:text-4xl font-bold text-accent">5000+</p>
              <p className="text-foreground/60 text-sm">Participants</p>
            </div>
            <div className="space-y-2">
              <p className="text-3xl sm:text-4xl font-bold text-accent">50L+</p>
              <p className="text-foreground/60 text-sm">Prize Pool</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
