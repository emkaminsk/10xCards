import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/health', {
        credentials: 'include'
      })
      
      if (response.ok) {
        // Try to access a protected endpoint to check auth
        const authCheck = await fetch('/api/review/next', {
          credentials: 'include'
        })
        setIsAuthenticated(authCheck.status !== 401)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="loading"></div>
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container">
        <div className="card">
          <h1 style={{ marginBottom: '1rem' }}>10xCards PoC</h1>
          <p style={{ marginBottom: '1.5rem' }}>
            Generador de tarjetas de estudio para artículos en español
          </p>
          <Link href="/login">
            <button className="button">Iniciar Sesión</button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <nav className="nav">
        <div className="nav-container">
          <div className="nav-title">10xCards PoC</div>
          <div className="nav-links">
            <Link href="/import" className="nav-link">Importar</Link>
            <Link href="/review" className="nav-link">Repasar</Link>
          </div>
        </div>
      </nav>

      <div className="container">
        <div className="card">
          <h1 style={{ marginBottom: '1rem' }}>Bienvenido a 10xCards</h1>
          <p style={{ marginBottom: '1.5rem' }}>
            Genera tarjetas de estudio automáticamente desde artículos en español.
          </p>
          
          <div className="stats">
            <div className="stat-card">
              <div className="stat-number">📚</div>
              <div className="stat-label">Importar Artículo</div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                Pega una URL y extrae el contenido
              </p>
              <Link href="/import">
                <button className="button" style={{ marginTop: '1rem' }}>
                  Comenzar
                </button>
              </Link>
            </div>
            
            <div className="stat-card">
              <div className="stat-number">🧠</div>
              <div className="stat-label">Sesión de Repaso</div>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                Practica con tus tarjetas guardadas
              </p>
              <Link href="/review">
                <button className="button" style={{ marginTop: '1rem' }}>
                  Repasar
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}