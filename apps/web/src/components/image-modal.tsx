'use client'
import type { ImageResult } from '@imago/types'

interface ImageModalProps {
  image: ImageResult | null
  onClose: () => void
}

export function ImageModal({ image, onClose }: ImageModalProps) {
  if (!image) return null

  function copyUrl() {
    navigator.clipboard.writeText(image!.url)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] max-w-4xl flex-col overflow-hidden rounded-xl bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="relative overflow-hidden" style={{ maxHeight: '70vh' }}>
          <img
            src={image.thumb}
            alt={image.description ?? ''}
            className="w-full object-contain"
          />
        </div>
        <div className="flex items-center justify-between border-t border-zinc-800 p-4">
          <div>
            <p className="text-sm font-medium text-zinc-200">{image.author ?? 'Unknown'}</p>
            <p className="text-xs text-zinc-500">
              {image.width} × {image.height} · {image.source} · {image.license}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyUrl}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700"
            >
              Copy URL
            </button>
            <a
              href={image.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
            >
              Open full res
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
