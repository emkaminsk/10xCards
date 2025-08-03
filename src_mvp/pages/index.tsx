import Link from 'next/link'
import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const container = document.getElementById('main-content')
    if (!container) return

    container.innerHTML = `
      <div class="container">
        <div class="card">
          <div class="loading"></div>
          <p>Cargando...</p>
        </div>
      </div>
    `

    try {
      const response = await fetch('/api/health', {
        credentials: 'include'
      })
      
      if (response.ok) {
        // Try to access a protected endpoint to check auth
        const authCheck = await fetch('/api/review/next', {
          credentials: 'include'
        })
        
        if (authCheck.status !== 401) {
          // Authenticated - show main dashboard
          container.innerHTML = `
            <nav class="nav">
              <div class="nav-container">
                <div class="nav-title">10xCards MVP</div>
                <div class="nav-links">
                  <a href="/import" class="nav-link">Importar</a>
                  <a href="/review" class="nav-link">Repasar</a>
                </div>
              </div>
            </nav>

            <div class="container">
              <div class="card">
                <h1 style="margin-bottom: 1rem;">Bienvenido a 10xCards</h1>
                <p style="margin-bottom: 1.5rem;">
                  Genera tarjetas de estudio automáticamente desde artículos en español.
                </p>
                
                <div class="stats">
                  <div class="stat-card">
                    <div class="stat-number">📚</div>
                    <div class="stat-label">Importar Artículo</div>
                    <p style="font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem;">
                      Pega una URL y extrae el contenido
                    </p>
                    <a href="/import">
                      <button class="button" style="margin-top: 1rem;">
                        Comenzar
                      </button>
                    </a>
                  </div>
                  
                  <div class="stat-card">
                    <div class="stat-number">🧠</div>
                    <div class="stat-label">Sesión de Repaso</div>
                    <p style="font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem;">
                      Practica con tus tarjetas guardadas
                    </p>
                    <a href="/review">
                      <button class="button" style="margin-top: 1rem;">
                        Repasar
                      </button>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          `
        } else {
          // Not authenticated - show login prompt
          container.innerHTML = `
            <div class="container">
              <div class="card">
                <h1 style="margin-bottom: 1rem;">10xCards PoC</h1>
                <p style="margin-bottom: 1.5rem;">
                  Generador de tarjetas de estudio para artículos en español
                </p>
                <a href="/login">
                  <button class="button">Iniciar Sesión</button>
                </a>
              </div>
            </div>
          `
        }
      } else {
        // Server error
        container.innerHTML = `
          <div class="container">
            <div class="card">
              <div class="error">Error de conexión con el servidor</div>
              <button class="button" onclick="checkAuth()">Reintentar</button>
            </div>
          </div>
        `
      }
    } catch (error) {
      // Network error
      container.innerHTML = `
        <div class="container">
          <div class="card">
            <div class="error">Error de conexión</div>
            <button class="button" onclick="checkAuth()">Reintentar</button>
          </div>
        </div>
      `
    }
  }

  useEffect(() => {
    ;(window as any).checkAuth = checkAuth
  }, [])

  return <div id="main-content"></div>
}