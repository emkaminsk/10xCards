import Link from 'next/link'
import { useEffect } from 'react'

export default function Review() {
  useEffect(() => {
    loadNextCard()
  }, [])

  const loadNextCard = async () => {
    const container = document.getElementById('review-container')
    if (!container) return

    container.innerHTML = `
      <div class="card">
        <div class="loading"></div>
        <p>Cargando sesión de repaso...</p>
      </div>
    `

    try {
      const response = await fetch('/api/review/next', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        
        if (!data.card) {
          // Session complete
          container.innerHTML = `
            <div class="card" style="text-align: center;">
              <h1 style="margin-bottom: 1rem;">🎉 ¡Sesión Completada!</h1>
              <p style="margin-bottom: 1.5rem; color: #6b7280;">
                Has terminado todas las tarjetas programadas para hoy.
              </p>
              
              <div style="display: flex; gap: 1rem; justify-content: center;">
                <a href="/import">
                  <button class="button">
                    Importar Más Contenido
                  </button>
                </a>
                <button 
                  class="button button-secondary" 
                  onclick="loadNextCard()"
                >
                  Buscar Más Tarjetas
                </button>
              </div>
            </div>
          `
        } else {
          // Show review card
          renderReviewCard(data.card, container)
        }
      } else if (response.status === 401) {
        container.innerHTML = `
          <div class="card">
            <div class="error">Sesión expirada. Por favor, inicia sesión nuevamente.</div>
            <a href="/login">
              <button class="button">Iniciar Sesión</button>
            </a>
          </div>
        `
      } else {
        container.innerHTML = `
          <div class="card">
            <div class="error">Error al cargar la siguiente tarjeta</div>
            <button class="button" onclick="loadNextCard()">Reintentar</button>
          </div>
        `
      }
    } catch (error) {
      container.innerHTML = `
        <div class="card">
          <div class="error">Error de conexión</div>
          <button class="button" onclick="loadNextCard()">Reintentar</button>
        </div>
      `
    }
  }

  const renderReviewCard = (card: any, container: HTMLElement) => {
    container.innerHTML = `
      <div class="card review-card">
        <div class="review-front">
          ${card.front}
        </div>
        
        ${card.context ? `
          <div class="review-context">
            "${card.context}"
          </div>
        ` : ''}

        <div id="review-actions">
          <button 
            class="button" 
            onclick="showAnswer('${card.id}', '${card.back.replace(/'/g, '&#39;').replace(/"/g, '&quot;')}')"
            style="font-size: 1.1rem; padding: 1rem 2rem;"
          >
            Mostrar Respuesta
          </button>
        </div>
      </div>
    `
  }

  // Add global functions
  useEffect(() => {
    ;(window as any).loadNextCard = loadNextCard

    ;(window as any).showAnswer = async (cardId: string, cardBack: string) => {
      const actionsDiv = document.getElementById('review-actions')
      if (!actionsDiv) return

      // Decode HTML entities back to readable text
      const decodedBack = cardBack.replace(/&#39;/g, "'").replace(/&quot;/g, '"')

      actionsDiv.innerHTML = `
        <div style="
          background: #f0fdf4; 
          border: 1px solid #bbf7d0;
          padding: 1.5rem; 
          border-radius: 8px; 
          margin-bottom: 2rem;
          font-size: 1.1rem;
        ">
          <div style="color: #065f46; font-weight: 500;">
            ${decodedBack}
          </div>
        </div>

        <div class="review-buttons">
          <button 
            class="button button-danger" 
            onclick="gradeCard('${cardId}', 'hard')"
            style="font-size: 1.1rem; padding: 1rem 2rem;"
          >
            Difícil 😓
          </button>
          
          <button 
            class="button button-success" 
            onclick="gradeCard('${cardId}', 'easy')"
            style="font-size: 1.1rem; padding: 1rem 2rem;"
          >
            Fácil 😊
          </button>
        </div>
      `
    }

    ;(window as any).gradeCard = async (cardId: string, grade: string) => {
      const actionsDiv = document.getElementById('review-actions')
      if (!actionsDiv) return

      actionsDiv.innerHTML = `
        <div class="loading"></div>
        <p>Calificando tarjeta...</p>
      `

      try {
        const response = await fetch('/api/review/grade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ card_id: cardId, grade: grade }),
        })

        if (response.ok) {
          // Load next card
          loadNextCard()
        } else {
          const data = await response.json()
          actionsDiv.innerHTML = `
            <div class="error">${data.detail || 'Error al calificar tarjeta'}</div>
            <button class="button" onclick="loadNextCard()">Continuar</button>
          `
        }
      } catch (error) {
        actionsDiv.innerHTML = `
          <div class="error">Error de conexión</div>
          <button class="button" onclick="loadNextCard()">Continuar</button>
        `
      }
    }
  }, [])

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
        <div id="error-message"></div>
        
        <div id="review-container">
          <div className="card">
            <div className="loading"></div>
            <p>Cargando sesión de repaso...</p>
          </div>
        </div>
      </div>
    </div>
  )
}