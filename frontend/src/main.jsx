import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8080'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    },
    ...options
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.content)) return value.content
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value?.services)) return value.services
  if (Array.isArray(value?.incidents)) return value.incidents
  return []
}

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return date.toLocaleString()
}

function StatusDot({ status }) {
  const normalized = String(status || '').toLowerCase()

  const healthy =
    normalized.includes('up') ||
    normalized.includes('healthy') ||
    normalized.includes('running') ||
    normalized.includes('resolved') ||
    normalized.includes('success')

  const warning =
    normalized.includes('warning') ||
    normalized.includes('degraded') ||
    normalized.includes('pending')

  return (
    <span
      className={`status-dot ${
        healthy ? 'healthy' : warning ? 'warning' : 'danger'
      }`}
    />
  )
}

function App() {
  const [services, setServices] = useState([])
  const [incidents, setIncidents] = useState([])
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [error, setError] = useState('')
  const [activeView, setActiveView] = useState('overview')

  async function loadDashboard() {
    setLoading(true)
    setError('')

    const results = await Promise.allSettled([
      request('/api/services'),
      request('/api/incidents'),
      request('/actuator/health')
    ])

    const serviceResult = results[0]
    const incidentResult = results[1]
    const healthResult = results[2]

    if (serviceResult.status === 'fulfilled') {
      setServices(normalizeArray(serviceResult.value))
    } else {
      setServices([])
    }

    if (incidentResult.status === 'fulfilled') {
      setIncidents(normalizeArray(incidentResult.value))
    } else {
      setIncidents([])
    }

    if (healthResult.status === 'fulfilled') {
      setHealth(healthResult.value)
    } else {
      setHealth(null)
    }

    const everythingFailed = results.every(
      (result) => result.status === 'rejected'
    )

    if (everythingFailed) {
      setError(
        `Backend unavailable at ${API_BASE_URL}. Start the Spring Boot backend or set VITE_API_BASE_URL.`
      )
    }

    setLastUpdated(new Date())
    setLoading(false)
  }

  useEffect(() => {
    loadDashboard()

    const interval = setInterval(loadDashboard, 15000)

    return () => clearInterval(interval)
  }, [])

  const healthyServices = useMemo(
    () =>
      services.filter((service) => {
        const status = String(
          service.status || service.state || service.health || ''
        ).toLowerCase()

        return (
          status.includes('up') ||
          status.includes('healthy') ||
          status.includes('running')
        )
      }).length,
    [services]
  )

  const activeIncidents = useMemo(
    () =>
      incidents.filter((incident) => {
        const status = String(
          incident.status || incident.state || ''
        ).toLowerCase()

        return !(
          status.includes('resolved') ||
          status.includes('closed') ||
          status.includes('completed')
        )
      }).length,
    [incidents]
  )

  const healthStatus =
    health?.status ||
    health?.state ||
    (health ? 'UP' : 'UNKNOWN')

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div>
            <strong>Self-Healing</strong>
            <span>Cloud Platform</span>
          </div>
        </div>

        <nav>
          <button
            className={activeView === 'overview' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveView('overview')}
          >
            <span>◈</span>
            Overview
          </button>

          <button
            className={activeView === 'services' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveView('services')}
          >
            <span>▦</span>
            Services
          </button>

          <button
            className={activeView === 'incidents' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveView('incidents')}
          >
            <span>△</span>
            Incidents
          </button>

          <button
            className={activeView === 'observability' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActiveView('observability')}
          >
            <span>⌁</span>
            Observability
          </button>
        </nav>

        <div className="sidebar-footer">
          <span className="small-label">API</span>
          <code>{API_BASE_URL}</code>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">OPERATIONS CENTER</p>
            <h1>Platform Overview</h1>
          </div>

          <div className="topbar-actions">
            <span className="connection">
              <StatusDot status={healthStatus} />
              {String(healthStatus).toUpperCase()}
            </span>

            <button
              className="refresh-button"
              onClick={loadDashboard}
              disabled={loading}
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </header>

        {error && (
          <div className="alert">
            <strong>Backend connection issue</strong>
            <span>{error}</span>
          </div>
        )}

        <section className="hero-card">
          <div>
            <p className="eyebrow">SELF-HEALING CONTROL PLANE</p>
            <h2>Detect. Diagnose. Recover.</h2>
            <p>
              Monitor service health and incidents from one operational
              dashboard.
            </p>
          </div>

          <div className="hero-status">
            <StatusDot status={healthStatus} />
            <div>
              <span>System status</span>
              <strong>{String(healthStatus).toUpperCase()}</strong>
            </div>
          </div>
        </section>

        <section className="stats-grid">
          <article className="stat-card">
            <span>Registered Services</span>
            <strong>{services.length}</strong>
            <small>Detected by the platform</small>
          </article>

          <article className="stat-card">
            <span>Healthy Services</span>
            <strong>{healthyServices}</strong>
            <small>Currently healthy or running</small>
          </article>

          <article className="stat-card">
            <span>Active Incidents</span>
            <strong>{activeIncidents}</strong>
            <small>Requires attention</small>
          </article>

          <article className="stat-card">
            <span>Last Updated</span>
            <strong className="time-value">
              {lastUpdated ? lastUpdated.toLocaleTimeString() : '—'}
            </strong>
            <small>Automatic refresh every 15 seconds</small>
          </article>
        </section>

        {activeView === 'overview' && (
          <div className="content-grid">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">SERVICE INVENTORY</p>
                  <h3>Services</h3>
                </div>
                <span className="count">{services.length}</span>
              </div>

              {services.length === 0 ? (
                <EmptyState
                  title="No service data"
                  message="The backend did not return service records."
                />
              ) : (
                <div className="table">
                  {services.slice(0, 8).map((service, index) => {
                    const name =
                      service.name ||
                      service.serviceName ||
                      service.application ||
                      `Service ${index + 1}`

                    const status =
                      service.status ||
                      service.state ||
                      service.health ||
                      'UNKNOWN'

                    return (
                      <div className="table-row" key={service.id || name}>
                        <div className="service-name">
                          <StatusDot status={status} />
                          <div>
                            <strong>{name}</strong>
                            <span>
                              {service.environment ||
                                service.namespace ||
                                service.version ||
                                'default'}
                            </span>
                          </div>
                        </div>

                        <span className="status-text">
                          {String(status).toUpperCase()}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">RECENT EVENTS</p>
                  <h3>Incidents</h3>
                </div>
                <span className="count">{incidents.length}</span>
              </div>

              {incidents.length === 0 ? (
                <EmptyState
                  title="No incidents"
                  message="No incident records were returned by the backend."
                />
              ) : (
                <div className="incident-list">
                  {incidents.slice(0, 8).map((incident, index) => {
                    const title =
                      incident.title ||
                      incident.name ||
                      incident.message ||
                      incident.description ||
                      `Incident ${index + 1}`

                    const status =
                      incident.status ||
                      incident.state ||
                      'UNKNOWN'

                    return (
                      <article
                        className="incident"
                        key={incident.id || `${title}-${index}`}
                      >
                        <StatusDot status={status} />
                        <div>
                          <strong>{title}</strong>
                          <span>
                            {incident.createdAt
                              ? formatDate(incident.createdAt)
                              : incident.timestamp
                                ? formatDate(incident.timestamp)
                                : String(status).toUpperCase()}
                          </span>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {activeView === 'services' && (
          <section className="panel full-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">SERVICE MANAGEMENT</p>
                <h3>All Services</h3>
              </div>
            </div>

            {services.length === 0 ? (
              <EmptyState
                title="No services available"
                message="The API returned no service records."
              />
            ) : (
              <div className="service-cards">
                {services.map((service, index) => {
                  const name =
                    service.name ||
                    service.serviceName ||
                    service.application ||
                    `Service ${index + 1}`

                  const status =
                    service.status ||
                    service.state ||
                    service.health ||
                    'UNKNOWN'

                  return (
                    <article className="service-card" key={service.id || name}>
                      <div className="service-card-header">
                        <StatusDot status={status} />
                        <strong>{name}</strong>
                      </div>

                      <dl>
                        <div>
                          <dt>Status</dt>
                          <dd>{String(status).toUpperCase()}</dd>
                        </div>
                        <div>
                          <dt>Environment</dt>
                          <dd>
                            {service.environment ||
                              service.namespace ||
                              'default'}
                          </dd>
                        </div>
                        <div>
                          <dt>Version</dt>
                          <dd>{service.version || '—'}</dd>
                        </div>
                      </dl>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {activeView === 'incidents' && (
          <section className="panel full-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">INCIDENT MANAGEMENT</p>
                <h3>Incident History</h3>
              </div>
            </div>

            {incidents.length === 0 ? (
              <EmptyState
                title="No incidents available"
                message="The API returned no incident records."
              />
            ) : (
              <div className="incident-table">
                {incidents.map((incident, index) => (
                  <article
                    className="incident-row"
                    key={incident.id || index}
                  >
                    <StatusDot status={incident.status || incident.state} />
                    <div>
                      <strong>
                        {incident.title ||
                          incident.name ||
                          incident.message ||
                          incident.description ||
                          `Incident ${index + 1}`}
                      </strong>
                      <span>
                        {incident.createdAt
                          ? formatDate(incident.createdAt)
                          : incident.timestamp
                            ? formatDate(incident.timestamp)
                            : 'No timestamp'}
                      </span>
                    </div>
                    <b>
                      {String(
                        incident.status || incident.state || 'UNKNOWN'
                      ).toUpperCase()}
                    </b>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeView === 'observability' && (
          <section className="panel full-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">OBSERVABILITY</p>
                <h3>Runtime Health</h3>
              </div>
            </div>

            <div className="health-grid">
              <article className="health-card">
                <span>Spring Boot Health</span>
                <strong>{String(healthStatus).toUpperCase()}</strong>
                <StatusDot status={healthStatus} />
              </article>

              <article className="health-card">
                <span>Backend Endpoint</span>
                <strong>{API_BASE_URL}</strong>
              </article>

              <article className="health-card">
                <span>Refresh Interval</span>
                <strong>15 seconds</strong>
              </article>
            </div>
          </section>
        )}

        <footer className="footer">
          <span>Self-Healing Cloud-Native Platform</span>
          <span>
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString()}`
              : 'Waiting for backend'}
          </span>
        </footer>
      </main>
    </div>
  )
}

function EmptyState({ title, message }) {
  return (
    <div className="empty">
      <div className="empty-icon">○</div>
      <strong>{title}</strong>
      <span>{message}</span>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
