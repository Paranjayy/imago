import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="max-w-2xl text-center">
        <div className="mb-4 inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-400">
          Open beta
        </div>
        <h1 className="mb-4 text-5xl font-bold tracking-tight text-white">
          One API.{' '}
          <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Every image.
          </span>
        </h1>
        <p className="mb-8 text-lg text-zinc-400">
          Imago aggregates Unsplash, Pexels, DALL-E, and more behind a single unified API.
          Search, generate, and route across all providers with one key.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/studio"
            className="rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition hover:bg-indigo-500"
          >
            Open Studio
          </Link>
          <Link
            href="/docs"
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-6 py-3 font-medium text-zinc-300 transition hover:bg-zinc-800"
          >
            View API Docs
          </Link>
        </div>
        <div className="mt-12 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-left font-mono text-sm">
          <p className="text-zinc-500"># Search across all providers</p>
          <p className="text-zinc-300">
            <span className="text-indigo-400">GET</span>{' '}
            <span className="text-green-400">/v1/search/all?q=mountains</span>
          </p>
          <p className="mt-2 text-zinc-500"># Generate with DALL-E</p>
          <p className="text-zinc-300">
            <span className="text-yellow-400">POST</span>{' '}
            <span className="text-green-400">/v1/generate</span>
          </p>
        </div>
      </div>
    </main>
  )
}
