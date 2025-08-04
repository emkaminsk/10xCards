import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Import() {
  const router = useRouter()

  useEffect(() => {
    // Add HTMX event listener for successful import
    const handleImportSuccess = (event: any) => {
      const detail = event.detail
      if (detail.xhr && detail.xhr.status === 200) {
        try {
          const response = JSON.parse(detail.xhr.responseText)
          if (response.session_id) {
            // Show success message and redirect
            const resultDiv = document.getElementById('import-result')
            if (resultDiv) {
              resultDiv.innerHTML = `
                <div class="card" style="background-color: #f0f9ff; border-color: #0ea5e9;">
                  <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                    <div style="color: #0ea5e9; font-size: 1.25rem;">✓</div>
                    <div>
                      <h3 style="margin: 0; color: #0ea5e9;">Artículo importado correctamente</h3>
                      <p style="margin: 0; color: #0369a1;">Se procesaron ${response.word_count} palabras. Generando tarjetas con IA...</p>
                    </div>
                  </div>
                  <div style="text-align: center;">
                    <div class="loading" style="margin: 0 auto 1rem;"></div>
                    <p style="color: #6b7280;">Redirigiendo a las propuestas de tarjetas...</p>
                  </div>
                </div>
              `
            }
            
            // Redirect to proposals page after 3 seconds (allowing time for AI generation)
            setTimeout(() => {
              router.push(`/proposals?session_id=${response.session_id}`)
            }, 3000)
          }
        } catch (e) {
          console.error('Error parsing import response:', e)
        }
      }
    }

    // Add event listener for HTMX success
    document.addEventListener('htmx:afterRequest', handleImportSuccess)
    
    return () => {
      document.removeEventListener('htmx:afterRequest', handleImportSuccess)
    }
  }, [router])

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

          <div id="error-message"></div>

          <form 
            hx-post="/api/import/url"
            hx-target="#import-result"
            hx-swap="innerHTML"
            hx-indicator="#import-spinner"
          >
            <input
              type="url"
              name="url"
              placeholder="https://ejemplo.com/articulo"
              className="input"
              required
            />
            
            <button 
              type="submit" 
              className="button"
            >
              <span id="import-spinner" className="loading htmx-indicator" style={{ display: 'none' }}></span>
              <span className="button-text">Importar Contenido</span>
            </button>
          </form>
        </div>

        <div id="import-result"></div>
      </div>
    </div>
  )
}