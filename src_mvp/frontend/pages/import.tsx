import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

interface ImportSession {
  session_id: string
  content: string
  word_count: number
}

export default function Import() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [session, setSession] = useState<ImportSession | null>(null)
  const [level, setLevel] = useState<'A2' | 'B1' | 'B2'>('B1')
  const [generating, setGenerating] = useState(false)
  const router = useRouter()

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSession(null)

    try {
      const response = await fetch('/api/import/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ url }),
      })

      if (response.ok) {
        const data = await response.json()
        setSession(data)
      } else {
        const data = await response.json()
        setError(data.detail || 'Error al importar URL')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!session) return

    setGenerating(true)
    setError('')

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          session_id: session.session_id,
          content: session.content,
          level: level
        }),
      })

      if (response.ok) {
        router.push(`/proposals?session_id=${session.session_id}`)
      } else {
        const data = await response.json()
        setError(data.detail || 'Error al generar tarjetas')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div>
      <nav className="nav">
        <div className="nav-container">
          <Link href="/" className="nav-title">10xCards PoC</Link>
          <div className="nav-links">
            <Link href="/import" className="nav-link active">Importar</Link>
            <Link href="/review" className="nav-link">Repasar</Link>
          </div>
        </div>
      </nav>

      <div className="container">
        <div className="card">
          <h1 style={{ marginBottom: '1rem' }}>Importar Artículo</h1>
          <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
            Pega la URL de un artículo en español para generar tarjetas de estudio
          </p>

          {error && <div className="error">{error}</div>}

          <form onSubmit={handleImport}>
            <input
              type="url"
              placeholder="https://ejemplo.com/articulo"
              className="input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            
            <button 
              type="submit" 
              className="button" 
              disabled={loading}
            >
              {loading ? <span className="loading"></span> : 'Importar Contenido'}
            </button>
          </form>
        </div>

        {session && (
          <div className="card">
            <h2 style={{ marginBottom: '1rem' }}>Contenido Extraído</h2>
            <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
              <strong>Palabras:</strong> {session.word_count}
            </p>
            
            <div style={{ 
              background: '#f8fafc', 
              padding: '1rem', 
              borderRadius: '6px', 
              marginBottom: '1.5rem',
              maxHeight: '200px',
              overflow: 'auto',
              fontSize: '0.875rem',
              lineHeight: '1.5'
            }}>
              {session.content}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Nivel de dificultad:
              </label>
              <select 
                className="select" 
                value={level} 
                onChange={(e) => setLevel(e.target.value as 'A2' | 'B1' | 'B2')}
              >
                <option value="A2">A2 - Básico</option>
                <option value="B1">B1 - Intermedio</option>
                <option value="B2">B2 - Intermedio Alto</option>
              </select>
            </div>

            <button 
              className="button button-success" 
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? <span className="loading"></span> : 'Generar Tarjetas con IA'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}