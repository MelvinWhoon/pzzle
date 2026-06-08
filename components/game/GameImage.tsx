'use client'
import { useRef, useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { Difference } from '@/lib/types'
import DifferenceMarker from './DifferenceMarker'

interface GameImageProps {
  src: string
  alt: string
  differences: Difference[]
  foundIds: string[]
  onClickRelative: (relX: number, relY: number) => void
  disabled?: boolean
  showMiss?: { x: number; y: number } | null
}

export default function GameImage({
  src,
  alt,
  differences,
  foundIds,
  onClickRelative,
  disabled,
  showMiss,
}: GameImageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 })

  const updateSize = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setImgSize({ w: rect.width, h: rect.height })
    }
  }, [])

  useEffect(() => {
    updateSize()
    const observer = new ResizeObserver(updateSize)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [updateSize])

  const handleInteraction = useCallback(
    (clientX: number, clientY: number) => {
      if (disabled || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const relX = (clientX - rect.left) / rect.width
      const relY = (clientY - rect.top) / rect.height
      if (relX >= 0 && relX <= 1 && relY >= 0 && relY <= 1) {
        onClickRelative(relX, relY)
      }
    },
    [disabled, onClickRelative]
  )

  const onMouseClick = (e: React.MouseEvent) => {
    handleInteraction(e.clientX, e.clientY)
  }

  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    handleInteraction(touch.clientX, touch.clientY)
  }

  const foundDifferences = differences.filter((d) => foundIds.includes(d.id))

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none overflow-hidden rounded-xl bg-gray-100"
      style={{ cursor: disabled ? 'not-allowed' : 'crosshair' }}
      onClick={onMouseClick}
      onTouchStart={onTouchStart}
    >
      <Image
        src={src}
        alt={alt}
        width={1200}
        height={800}
        className="w-full h-auto block pointer-events-none"
        onLoad={updateSize}
        priority
      />

      {/* SVG overlay voor markers */}
      {imgSize.w > 0 && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${imgSize.w} ${imgSize.h}`}
        >
          {foundDifferences.map((d) => (
            <DifferenceMarker
              key={d.id}
              difference={d}
              imageWidth={imgSize.w}
              imageHeight={imgSize.h}
            />
          ))}
          {/* Miss indicator */}
          {showMiss && (
            <circle
              cx={showMiss.x * imgSize.w}
              cy={showMiss.y * imgSize.h}
              r={20}
              fill="rgba(239, 68, 68, 0.3)"
              stroke="#ef4444"
              strokeWidth="2"
              className="pop-in"
            />
          )}
        </svg>
      )}
    </div>
  )
}
