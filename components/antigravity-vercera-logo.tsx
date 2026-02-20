'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const PARTICLE_COUNT = 120
const RADIUS = 140
const REPEL_RADIUS = 180
const REPEL_STRENGTH = 80
const PARTICLE_SIZE = 4

interface ParticleState {
  baseX: number
  baseY: number
  x: number
  y: number
}

export function AntigravityVerceraLogo() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null)
  const [particles, setParticles] = useState<ParticleState[]>([])
  const mouseRef = useRef(mouse)
  mouseRef.current = mouse

  const initialParticles = useMemo(() => {
    const list: ParticleState[] = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2
      const baseX = RADIUS * Math.cos(angle)
      const baseY = RADIUS * Math.sin(angle)
      list.push({ baseX, baseY, x: baseX, y: baseY })
    }
    return list
  }, [])

  useEffect(() => {
    setParticles(initialParticles)
  }, [initialParticles])

  useEffect(() => {
    let rafId = 0
    const tick = () => {
      const mousePos = mouseRef.current
      setParticles((prev) => {
        if (prev.length === 0) return prev
        const el = containerRef.current
        if (!el) return prev
        const rect = el.getBoundingClientRect()
        const cx = rect.width / 2
        const cy = rect.height / 2
        if (!mousePos) {
          return prev.map((p) => ({ ...p, x: p.baseX, y: p.baseY }))
        }
        const mx = mousePos.x - rect.left - cx
        const my = mousePos.y - rect.top - cy

        return prev.map((p) => {
          const dx = p.baseX - mx
          const dy = p.baseY - my
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < REPEL_RADIUS && dist > 0) {
            const force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH
            const nx = dx / dist
            const ny = dy / dist
            return {
              ...p,
              x: p.baseX + nx * force,
              y: p.baseY + ny * force,
            }
          }
          return { ...p, x: p.baseX, y: p.baseY }
        })
      })
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setMouse({ x: e.clientX, y: e.clientY })
  }, [])
  const handleMouseLeave = useCallback(() => setMouse(null), [])

  const particlesToRender = particles.length > 0 ? particles : initialParticles

  return (
    <div
      ref={containerRef}
      className="relative w-[400px] h-[400px] flex items-center justify-center rounded-2xl bg-background border border-border/50 cursor-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {particlesToRender.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-accent"
            style={{
              width: PARTICLE_SIZE,
              height: PARTICLE_SIZE,
              left: '50%',
              top: '50%',
              boxShadow: '0 0 8px rgba(193, 231, 52, 0.6)',
            }}
            animate={{
              x: p.x - PARTICLE_SIZE / 2,
              y: p.y - PARTICLE_SIZE / 2,
            }}
            transition={{ type: 'spring', damping: 28, stiffness: 180 }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center pointer-events-none select-none">
        <span className="font-display text-2xl font-bold text-foreground">
          VERCERA
        </span>
        <span className="block font-display text-xl font-bold text-accent">
          5.0
        </span>
      </div>
    </div>
  )
}
