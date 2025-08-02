import Link from 'next/link'

export default function Import() {
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