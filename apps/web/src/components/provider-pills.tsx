'use client'

const PROVIDERS = [
  { id: 'unsplash', label: 'Unsplash', color: 'bg-black border-zinc-700' },
  { id: 'pexels', label: 'Pexels', color: 'bg-emerald-950 border-emerald-800' },
]

interface ProviderPillsProps {
  selected: string[]
  onChange: (selected: string[]) => void
}

export function ProviderPills({ selected, onChange }: ProviderPillsProps) {
  function toggle(id: string) {
    const next = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id]
    onChange(next.length === 0 ? PROVIDERS.map((p) => p.id) : next)
  }

  const allSelected = selected.length === PROVIDERS.length || selected.length === 0

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange([])}
        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
          allSelected
            ? 'border-indigo-500 bg-indigo-950 text-indigo-300'
            : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600'
        }`}
      >
        All providers
      </button>
      {PROVIDERS.map((provider) => (
        <button
          key={provider.id}
          onClick={() => toggle(provider.id)}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
            !allSelected && selected.includes(provider.id)
              ? 'border-indigo-500 bg-indigo-950 text-indigo-300'
              : `${provider.color} text-zinc-400 hover:text-zinc-200`
          }`}
        >
          {provider.label}
        </button>
      ))}
    </div>
  )
}
