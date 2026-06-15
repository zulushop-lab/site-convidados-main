"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { useReducedMotionPreference } from "@/lib/hooks/useReducedMotionPreference"
import { cn } from "@/lib/utils"

export interface TiltCardProps {
  tiltLimit?: number
  scale?: number
  perspective?: number
  effect?: "gravitate" | "evade"
  spotlight?: boolean
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}

export function TiltCard({
  tiltLimit = 15,
  scale = 1.05,
  perspective = 1200,
  effect = "evade",
  spotlight = true,
  className,
  style,
  children,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotionPreference()
  const neutralTransform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`
  const [transform, setTransform] = useState(
    neutralTransform
  )
  const [spotlightPos, setSpotlightPos] = useState({ x: 50, y: 50 })
  const [isHovered, setIsHovered] = useState(false)

  const dir = effect === "evade" ? -1 : 1

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (reducedMotion) return
      const el = cardRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width
      const py = (e.clientY - rect.top) / rect.height
      const xRot = (py - 0.5) * (tiltLimit * 2) * dir
      const yRot = (px - 0.5) * -(tiltLimit * 2) * dir
      setTransform(
        `perspective(${perspective}px) rotateX(${xRot}deg) rotateY(${yRot}deg) scale3d(${scale}, ${scale}, ${scale})`
      )
      if (spotlight) {
        setSpotlightPos({ x: px * 100, y: py * 100 })
      }
    },
    [tiltLimit, scale, perspective, dir, spotlight, reducedMotion]
  )

  const handlePointerEnter = useCallback(() => {
    if (reducedMotion) return
    setIsHovered(true)
  }, [reducedMotion])

  const handlePointerLeave = useCallback(() => {
    setTransform(neutralTransform)
    setIsHovered(false)
  }, [neutralTransform])

  useEffect(() => {
    if (reducedMotion) {
      setTransform(neutralTransform)
      setIsHovered(false)
    }
  }, [neutralTransform, reducedMotion])

  return (
    <div
      ref={cardRef}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={cn("will-change-transform relative overflow-hidden", className)}
      style={{
        transform,
        transition: "transform 0.2s ease-out",
        transformStyle: "preserve-3d",
        ...style,
      }}
    >
      {children}
      {spotlight && isHovered && !reducedMotion && (
        <div
          className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
          style={{ transition: "opacity 0.3s" }}
        >
          <div
            className="absolute rounded-full opacity-60 dark:opacity-30 mix-blend-overlay"
            style={{
              width: "600px",
              height: "600px",
              left: `${spotlightPos.x}%`,
              top: `${spotlightPos.y}%`,
              transform: "translate(-50%, -50%)",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 60%)",
            }}
          />
        </div>
      )}
    </div>
  )
}
