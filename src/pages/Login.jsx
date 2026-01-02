import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockLogin } from '../services/auth'
import { amberApi } from '../services/amberApi'
import { storage } from '../utils/storage'

function Login({ onLogin }) {
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [retryCountdown, setRetryCountdown] = useState(0)
  const navigate = useNavigate()

  // Check if there's a saved API key
  useEffect(() => {
    const savedApiKey = storage.getApiKey()
    if (savedApiKey) {
      setApiKey(savedApiKey)
    }
  }, [])

  // Handle retry countdown (just display, no auto-retry on login)
  useEffect(() => {
    if (retryCountdown <= 0) return

    const timer = setInterval(() => {
      setRetryCountdown(prev => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [retryCountdown])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await mockLogin(apiKey)

      if (result.success) {
        // Fetch sites to get the site ID
        const sites = await amberApi.getSites()

        if (sites && sites.length > 0) {
          const activeSite = sites.find(site => site.status === 'active')
          if (activeSite) {
            storage.setSiteId(activeSite.id)
            onLogin()
            navigate('/live')
          } else {
            setError('No active sites found for this account')
          }
        } else {
          setError('No sites found for this account')
        }
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your API key.')

      // Handle rate limiting
      if (err.isRateLimit && err.retryAfter) {
        setRetryCountdown(err.retryAfter)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDevLogin = () => {
    setApiKey('psk_test_demo_key')
  }

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      <h1 className="page-title">Login to Amber Smart Monitor</h1>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="apiKey">Amber Electric API Key</label>
            <input
              id="apiKey"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              required
            />
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Get your API key from the Amber Electric dashboard
            </p>
          </div>

          {error && (
            <div className="error">
              {error}
              {retryCountdown > 0 && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  Please wait {retryCountdown} second{retryCountdown !== 1 ? 's' : ''} before trying again.
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginBottom: '1rem' }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <button
            type="button"
            onClick={handleDevLogin}
            className="btn btn-secondary"
            style={{ width: '100%' }}
          >
            Use Dev Test Key
          </button>
        </form>

        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--background)', borderRadius: '4px' }}>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Development Mode</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Click "Use Dev Test Key" for automatic authentication with a demo API key.
            In production, enter your actual Amber Electric API key.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
