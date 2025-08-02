import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ReviewCard {
  id: string
  front: string
  context: string
}

export default function Review() {
  const [currentCard, setCurrentCard] = useState<ReviewCard | null>(null)
  const [showBack, setShowBack] = useState(false)
  const [loading, setLoading] = useState(true)
  const [grading, setGrading] = useState(false)
  const [error, setError] = useState('')
  const [hasMore, setHasMore] = useState(false)
  const [sessionComplete, setSessionComplete] = useState(false)

  useEffect(() => {
    loadNextCard()
  }, [])

  const loadNextCard = async () => {
    setLoading(true)
    setShowBack(false)
    setError('')

    try {
      const response = await fetch('/api/review/next', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentCard(data.card)
        setHasMore(data.has_more)
        
        if (!data.card) {
          setSessionComplete(true)
        }
      } else if (response.status === 401) {
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.')
      } else {
        setError('Error al cargar la siguiente tarjeta')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const gradeCard = async (grade: 'easy' | 'hard') => {
    if (!currentCard) return

    setGrading(true)
    setError('')

    try {
      const response = await fetch('/api/review/grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          card_id: currentCard.id,
          grade: grade
        }),
      })

      if (response.ok) {
        // Load next card
        await loadNextCard()
      } else {
        const data = await response.json()
        setError(data.detail || 'Error al calificar tarjeta')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setGrading(false)
    }
  }

  const showAnswer = () => {
    setShowBack(true)
  }

  if (loading && !currentCard) {
    return (
      <div className="container">
        <div className="card">
          <div className="loading"></div>
          <p>Cargando sesión de repaso...</p>
        </div>
      </div>
    )
  }

  if (sessionComplete) {
    return (
      <div>
        <nav className="nav">
          <div className="nav-container">
            <Link href="/" className="nav-title">10xCards PoC</Link>
            <div className="nav-links">
              <Link href="/import" className="nav-link">Importar</Link>
              <Link href="/review" className="nav-link active">Repasar</Link>
            </div>
          </div>
        </nav>

        <div className="container">
          <div className="card" style={{ textAlign: 'center' }}>
            <h1 style={{ marginBottom: '1rem' }}>🎉 ¡Sesión Completada!</h1>
            <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
              Has terminado todas las tarjetas programadas para hoy.
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Link href="/import">
                <button className="button">
                  Importar Más Contenido
                </button>
              </Link>
              <button 
                className="button button-secondary" 
                onClick={loadNextCard}
              >
                Buscar Más Tarjetas
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <nav className="nav">
        <div className="nav-container">
          <Link href="/" className="nav-title">10xCards PoC</Link>
          <div className="nav-links">
            <Link href="/import" className="nav-link">Importar</Link>
            <Link href="/review" className="nav-link active">Repasar</Link>
          </div>
        </div>
      </nav>

      <div className="container">
        {error && <div className="error">{error}</div>}

        {currentCard ? (
          <div className="card review-card">
            <div className="review-front">
              {currentCard.front}
            </div>
            
            {currentCard.context && (
              <div className="review-context">
                "{currentCard.context}"
              </div>
            )}

            {!showBack ? (
              <button 
                className="button" 
                onClick={showAnswer}
                style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}
              >
                Mostrar Respuesta
              </button>
            ) : (
              <div>
                <div style={{ 
                  background: '#f0fdf4', 
                  border: '1px solid #bbf7d0',
                  padding: '1.5rem', 
                  borderRadius: '8px', 
                  marginBottom: '2rem',
                  fontSize: '1.1rem'
                }}>
                  {/* This would show the back of the card, but we need to fetch it */}
                  <p style={{ color: '#6b7280', fontStyle: 'italic' }}>
                    [La respuesta se mostraría aquí - necesitamos ajustar el API para incluir el 'back']
                  </p>
                </div>

                <div className="review-buttons">
                  <button 
                    className="button button-danger" 
                    onClick={() => gradeCard('hard')}
                    disabled={grading}
                    style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}
                  >
                    {grading ? <span className="loading"></span> : 'Difícil 😓'}
                  </button>
                  
                  <button 
                    className="button button-success" 
                    onClick={() => gradeCard('easy')}
                    disabled={grading}
                    style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}
                  >
                    {grading ? <span className="loading"></span> : 'Fácil 😊'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center' }}>
            <h2 style={{ marginBottom: '1rem' }}>No hay tarjetas para repasar</h2>
            <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
              Importa algunos artículos para generar tarjetas de estudio.
            </p>
            <Link href="/import">
              <button className="button">
                Importar Artículo
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}