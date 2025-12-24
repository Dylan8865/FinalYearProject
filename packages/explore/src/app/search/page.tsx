'use client'

import { useState } from 'react'

export default function SearchPage() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const search = async () => {
    setLoading(true)
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
    const json = await res.json()
    setResults(json.data || [])
    setLoading(false)
  }

  return (
    <div style={{ padding: 32 }}>
      <h1>Search</h1>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Type something..."
        style={{ width: 300, marginRight: 8 }}
      />

      <button onClick={search}>Search</button>

      {loading && <p>Searching...</p>}

      <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, listStyle: 'none', padding: 0 }}>
        {results.map((r) => (
          <li key={r.id} style={{ border: '1px solid #333', borderRadius: 8, overflow: 'hidden' }}>
            <a href={`/island/${r.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
              <div style={{ padding: 16 }}>
                <strong style={{ display: 'block', marginBottom: 8, fontSize: '1.1rem' }}>{r.title}</strong>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#888' }}>{r.content}</p>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
