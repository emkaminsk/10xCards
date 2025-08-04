import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function Proposals() {
  const router = useRouter()
  const { session_id } = router.query

  useEffect(() => {
    if (session_id) {
      // Load proposals with retry mechanism for AI generation
      const container = document.getElementById('proposals-container')
      if (container) {
        container.innerHTML = '<div class="loading"></div><p>Cargando propuestas...</p>'
        
        const loadProposals = async (retryCount = 0) => {
          try {
            const response = await fetch(`/api/cards/proposals?session_id=${session_id}`, {
              credentials: 'include'
            })
            const data = await response.json()
            
            // If no proposals and we haven't retried much, wait and try again
            if (data.proposals.length === 0 && retryCount < 3) {
              container.innerHTML = '<div class="loading"></div><p>Generando tarjetas con IA...</p>'
              setTimeout(() => loadProposals(retryCount + 1), 2000)
              return
            }
            
            renderProposals(data.proposals, container)
          } catch (error) {
            if (retryCount < 2) {
              setTimeout(() => loadProposals(retryCount + 1), 2000)
            } else {
              container.innerHTML = '<div class="error">Error al cargar propuestas</div>'
            }
          }
        }
        
        loadProposals()
      }
    }
  }, [session_id])

  const renderProposals = (proposals: any[], container: HTMLElement) => {
    if (proposals.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #6b7280;">
          <h3 style="color: #374151; margin-bottom: 1rem;">No se generaron tarjetas</h3>
          <p style="margin-bottom: 1.5rem;">No se pudieron generar tarjetas del contenido importado. Esto puede ocurrir si:</p>
          <ul style="text-align: left; max-width: 400px; margin: 0 auto 1.5rem;">
            <li>El texto no contiene vocabulario apropiado para el nivel A2-B2</li>
            <li>Hubo un error con el servicio de IA</li>
            <li>El contenido ya existe en tu colección</li>
          </ul>
          <a href="/import">
            <button class="button">
              Intentar con Otro Artículo
            </button>
          </a>
        </div>
      `
      return
    }

    const proposalsHtml = proposals.map(proposal => `
      <div class="proposal-item" data-id="${proposal.id}">
        <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
          <input
            type="checkbox"
            class="checkbox proposal-checkbox"
            data-id="${proposal.id}"
            checked
            onchange="updateSelection()"
          />
          <div style="flex: 1;">
            <div class="proposal-front">${proposal.front}</div>
            <div class="proposal-back">${proposal.back}</div>
            ${proposal.context ? `<div class="proposal-context">"${proposal.context}"</div>` : ''}
          </div>
        </div>
      </div>
    `).join('')

    container.innerHTML = `
      <div style="margin-bottom: 1rem; display: flex; gap: 1rem; align-items: center;">
        <span id="selection-count" style="color: #6b7280;">
          ${proposals.length} de ${proposals.length} seleccionadas
        </span>
        <button 
          class="button button-secondary" 
          onclick="selectAll()"
          style="padding: 0.5rem 1rem; font-size: 0.875rem;"
        >
          Todas
        </button>
        <button 
          class="button button-secondary" 
          onclick="selectNone()"
          style="padding: 0.5rem 1rem; font-size: 0.875rem;"
        >
          Ninguna
        </button>
      </div>

      <div style="margin-bottom: 1.5rem;">
        ${proposalsHtml}
      </div>

      <div style="display: flex; gap: 1rem;">
        <button 
          class="button button-success" 
          onclick="acceptSelected()"
          id="accept-button"
        >
          Aceptar ${proposals.length} Tarjetas
        </button>
        
        <a href="/import">
          <button class="button button-secondary">
            Importar Otro Artículo
          </button>
        </a>
      </div>
    `

    // Add global functions for interaction
    ;(window as any).updateSelection = () => {
      const checkboxes = container.querySelectorAll('.proposal-checkbox')
      const checked = container.querySelectorAll('.proposal-checkbox:checked')
      const countElement = container.querySelector('#selection-count')
      const acceptButton = container.querySelector('#accept-button')
      
      if (countElement) {
        countElement.textContent = `${checked.length} de ${checkboxes.length} seleccionadas`
      }
      if (acceptButton) {
        acceptButton.textContent = `Aceptar ${checked.length} Tarjetas`
      }
    }

    ;(window as any).selectAll = () => {
      const checkboxes = container.querySelectorAll('.proposal-checkbox') as NodeListOf<HTMLInputElement>
      checkboxes.forEach(cb => { cb.checked = true })
      ;(window as any).updateSelection()
    }

    ;(window as any).selectNone = () => {
      const checkboxes = container.querySelectorAll('.proposal-checkbox') as NodeListOf<HTMLInputElement>
      checkboxes.forEach(cb => { cb.checked = false })
      ;(window as any).updateSelection()
    }

    ;(window as any).acceptSelected = async () => {
      const checked = container.querySelectorAll('.proposal-checkbox:checked') as NodeListOf<HTMLInputElement>
      const proposalIds = Array.from(checked).map(cb => cb.dataset.id)
      
      if (proposalIds.length === 0) {
        alert('Selecciona al menos una tarjeta')
        return
      }

      const acceptButton = container.querySelector('#accept-button') as HTMLButtonElement
      acceptButton.disabled = true
      acceptButton.innerHTML = '<span class="loading"></span> Aceptando...'

      try {
        const response = await fetch('/api/cards/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ proposal_ids: proposalIds }),
        })

        if (response.ok) {
          const data = await response.json()
          container.innerHTML = `
            <div class="success">${data.accepted_count} tarjetas aceptadas correctamente</div>
            <div style="text-align: center; padding: 2rem;">
              <p style="margin-bottom: 1rem;">Redirigiendo a la sesión de repaso...</p>
            </div>
          `
          setTimeout(() => {
            window.location.href = '/review'
          }, 2000)
        } else {
          const data = await response.json()
          alert(data.detail || 'Error al aceptar tarjetas')
          acceptButton.disabled = false
          acceptButton.innerHTML = `Aceptar ${proposalIds.length} Tarjetas`
        }
      } catch (error) {
        alert('Error de conexión')
        acceptButton.disabled = false
        acceptButton.innerHTML = `Aceptar ${proposalIds.length} Tarjetas`
      }
    }
  }

  return (
    <div>
      <nav className="nav">
        <div className="nav-container">
          <Link href="/" className="nav-title">10xCards PoC</Link>
          <div className="nav-links">
            <Link href="/import" className="nav-link">Importar</Link>
            <Link href="/review" className="nav-link">Repasar</Link>
          </div>
        </div>
      </nav>

      <div className="container">
        <div className="card">
          <h1 style={{ marginBottom: '1rem' }}>Propuestas de Tarjetas</h1>
          <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
            Revisa y selecciona las tarjetas que quieres agregar a tu colección
          </p>

          <div id="error-message"></div>
          <div id="success-message"></div>
          
          <div id="proposals-container">
            <div className="loading"></div>
            <p>Cargando propuestas...</p>
          </div>
        </div>
      </div>
    </div>
  )
}