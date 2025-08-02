import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

interface Proposal {
  id: string
  front: string
  back: string
  context: string
}

export default function Proposals() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const { session_id } = router.query

  useEffect(() => {
    if (session_id) {
      loadProposals()
    }
  }, [session_id])

  const loadProposals = async () => {
    try {
      const response = await fetch(`/api/cards/proposals?session_id=${session_id}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setProposals(data.proposals)
        // Select all by default
        setSelectedIds(new Set(data.proposals.map((p: Proposal) => p.id)))
      } else {
        setError('Error al cargar propuestas')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const selectAll = () => {
    setSelectedIds(new Set(proposals.map(p => p.id)))
  }

  const selectNone = () => {
    setSelectedIds(new Set())
  }

  const acceptSelected = async () => {
    if (selectedIds.size === 0) {
      setError('Selecciona al menos una tarjeta')
      return
    }

    setAccepting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/cards/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          proposal_ids: Array.from(selectedIds)
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess(`${data.accepted_count} tarjetas aceptadas correctamente`)
        
        // Remove accepted proposals from list
        setProposals(proposals.filter(p => !selectedIds.has(p.id)))
        setSelectedIds(new Set())
        
        // Redirect after success
        setTimeout(() => {
          router.push('/review')
        }, 2000)
      } else {
        const data = await response.json()
        setError(data.detail || 'Error al aceptar tarjetas')
      }
    } catch (error) {
      setError('Error de conexión')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="loading"></div>
          <p>Cargando propuestas...</p>
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

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          {proposals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              No hay propuestas disponibles
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ color: '#6b7280' }}>
                  {selectedIds.size} de {proposals.length} seleccionadas
                </span>
                <button 
                  className="button button-secondary" 
                  onClick={selectAll}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                >
                  Todas
                </button>
                <button 
                  className="button button-secondary" 
                  onClick={selectNone}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                >
                  Ninguna
                </button>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                {proposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className={`proposal-item ${selectedIds.has(proposal.id) ? 'selected' : ''}`}
                    onClick={() => toggleSelection(proposal.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={selectedIds.has(proposal.id)}
                        onChange={() => toggleSelection(proposal.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div style={{ flex: 1 }}>
                        <div className="proposal-front">{proposal.front}</div>
                        <div className="proposal-back">{proposal.back}</div>
                        {proposal.context && (
                          <div className="proposal-context">"{proposal.context}"</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  className="button button-success" 
                  onClick={acceptSelected}
                  disabled={accepting || selectedIds.size === 0}
                >
                  {accepting ? <span className="loading"></span> : `Aceptar ${selectedIds.size} Tarjetas`}
                </button>
                
                <Link href="/import">
                  <button className="button button-secondary">
                    Importar Otro Artículo
                  </button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}