import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Login() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        router.push('/')
      } else {
        const data = await response.json()
        setError(data.detail || 'Error de autenticación')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="card">
        <h1 style={{ marginBottom: '1rem' }}>Iniciar Sesión</h1>
        <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
          Ingresa la contraseña de desarrollo para acceder al PoC
        </p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Contraseña"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <button 
            type="submit" 
            className="button" 
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? <span className="loading"></span> : 'Entrar'}
          </button>
        </form>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <Link href="/" style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}