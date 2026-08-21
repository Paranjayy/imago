'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { ImageResult } from '@imago/types'
import { useSearch } from '@/hooks/use-search'
import { SearchBar } from '@/components/search-bar'
import { ProviderPills } from '@/components/provider-pills'
import { ImageGrid } from '@/components/image-grid'
import { ImageModal } from '@/components/image-modal'

export default function StudioPage() {
  const { results, loading, error, providers, took_ms, search } = useSearch()
  const [selectedProviders, setSelectedProviders] = useState<string[]>([])
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null)

  function handleSearch(query: string) {
    const provs = selectedProviders.length > 0 ? selectedProviders : undefined
    search(query, provs)
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="font-mono text-lg font-bold text-white">
            imago<span className="text-indigo-400">.</span>
          </Link>
          <nav className="flex gap-6 text-sm text-zinc-400">
            <Link href="/providers" className="hover:text-white">Providers</Link>
            <Link href="/docs" className="hover:text-white">API</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 space-y-3">
          <SearchBar onSearch={handleSearch} loading={loading} />
          <ProviderPills selected={selectedProviders} onChange={setSelectedProviders} />
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {took_ms !== null && results.length > 0 && (
          <p className="mb-4 text-xs text-zinc-500">
            {results.length} results from{' '}
            <span className="text-zinc-400">{providers.join(', ')}</span>{' '}
            in {took_ms}ms
          </p>
        )}

        <ImageGrid images={results} onImageClick={setSelectedImage} loading={loading} />

        {results.length === 0 && !loading && took_ms === null && (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
            <p className="text-4xl">&#128444;</p>
            <p className="mt-3 text-sm">Search for images across all providers</p>
          </div>
        )}
      </div>

      <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)} />
    </div>
  )
}
