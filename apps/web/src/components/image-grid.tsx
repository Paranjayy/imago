'use client'
import type { ImageResult } from '@imago/types'
import { ImageCard } from './image-card'

interface ImageGridProps {
  images: ImageResult[]
  onImageClick: (image: ImageResult) => void
  loading?: boolean
}

export function ImageGrid({ images, onImageClick, loading }: ImageGridProps) {
  if (loading) {
    return (
      <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="mb-4 animate-pulse rounded-lg bg-zinc-800" style={{ height: `${160 + (i % 3) * 60}px` }} />
        ))}
      </div>
    )
  }

  if (images.length === 0) return null

  return (
    <div className="columns-2 gap-4 sm:columns-3 lg:columns-4">
      {images.map((image) => (
        <div key={image.id} className="mb-4 break-inside-avoid">
          <ImageCard image={image} onClick={onImageClick} />
        </div>
      ))}
    </div>
  )
}
