'use client'
import type { ImageResult } from '@imago/types'
import Image from 'next/image'

const SOURCE_COLORS: Record<string, string> = {
  unsplash: 'bg-zinc-800 text-zinc-300',
  pexels: 'bg-emerald-900 text-emerald-300',
  dalle: 'bg-purple-900 text-purple-300',
}

interface ImageCardProps {
  image: ImageResult
  onClick: (image: ImageResult) => void
}

export function ImageCard({ image, onClick }: ImageCardProps) {
  const badgeClass = SOURCE_COLORS[image.source] ?? 'bg-zinc-800 text-zinc-300'

  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-lg bg-zinc-900"
      onClick={() => onClick(image)}
    >
      <div className="relative w-full" style={{ paddingBottom: `${(image.height / image.width) * 100}%` }}>
        <Image
          src={image.thumb}
          alt={image.description ?? image.source}
          fill
          className="object-cover transition-transform duration-200 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
      <div className="absolute bottom-0 left-0 right-0 translate-y-full bg-gradient-to-t from-black/80 to-transparent p-3 transition-transform duration-200 group-hover:translate-y-0">
        <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${badgeClass}`}>
          {image.source}
        </span>
        {image.author && (
          <p className="mt-1 text-xs text-zinc-300 truncate">{image.author}</p>
        )}
      </div>
    </div>
  )
}
