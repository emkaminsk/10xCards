import Link from 'next/link'

export default function Login() {
  return (
    <div className="container">
      <div className="card">
        <h1 style={{ marginBottom: '1rem' }}>Iniciar Sesión</h1>
        <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
          Ingresa la contraseña de desarrollo para acceder al PoC
        </p>

        <div id="error-message"></div>

        <form 
          hx-post="/api/auth/login"
          hx-target="#error-message"
          hx-swap="innerHTML"
          hx-indicator="#login-spinner"
          hx-on--after-request="if(event.detail.successful) window.location.href = '/'"
        >
          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            className="input"
            required
          />
          
          <button 
            type="submit" 
            className="button" 
            style={{ width: '100%' }}
          >
            <span id="login-spinner" className="loading htmx-indicator" style={{ display: 'none' }}></span>
            <span className="button-text">Entrar</span>
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