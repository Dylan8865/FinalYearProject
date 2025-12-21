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

      <ul>
        {results.map((r) => (
          <li key={r.id}>
            <strong>{r.title}</strong>
            <p>{r.content}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
