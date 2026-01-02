import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format, subHours, startOfDay } from 'date-fns'
import { amberApi } from '../services/amberApi'
import { storage } from '../utils/storage'

const TIME_RANGES = {
  '6h': { label: 'Last 6 Hours', hours: 6 },
  '12h': { label: 'Last 12 Hours', hours: 12 },
  '24h': { label: 'Last 24 Hours', hours: 24 },
  'today': { label: 'Today', hours: null }
}

function LiveUsage() {
  const [timeRange, setTimeRange] = useState('6h')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryCountdown, setRetryCountdown] = useState(0)
  const [stats, setStats] = useState({
    currentUsage: 0,
    avgUsage: 0,
    totalUsage: 0,
    estimatedCost: 0
  })

  const fetchData = async () => {
    setLoading(true)
    setError('')

    try {
      const siteId = storage.getSiteId()
      if (!siteId) {
        throw new Error('No site ID found. Please login again.')
      }

      const now = new Date()
      let startDate, endDate

      if (timeRange === 'today') {
        // Fetch current day data
        startDate = format(startOfDay(now), 'yyyy-MM-dd')
        endDate = format(now, 'yyyy-MM-dd')
      } else {
        // Fetch data for the specified time range
        const range = TIME_RANGES[timeRange]
        startDate = format(subHours(now, range.hours), 'yyyy-MM-dd')
        endDate = format(now, 'yyyy-MM-dd')
      }

      const usageData = await amberApi.getUsage(siteId, startDate, endDate)

      console.log('LiveUsage API Response:', {
        timeRange,
        startDate,
        endDate,
        totalRecords: usageData.length,
        sample: usageData.slice(0, 2)
      })

      // Filter for general usage channel and sort by time
      const generalUsage = usageData
        .filter(item => item.channelType === 'general')
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))

      // Transform data for chart
      const chartData = generalUsage.map(item => ({
        time: format(new Date(item.startTime), 'HH:mm'),
        usage: item.kwh || 0,
        cost: item.cost || 0,
        fullTime: item.startTime
      }))

      console.log('Filtered & Transformed:', {
        generalUsageCount: generalUsage.length,
        chartDataCount: chartData.length,
        chartDataSample: chartData.slice(0, 3)
      })

      setData(chartData)

      // Calculate stats
      if (generalUsage.length > 0) {
        const totalUsage = generalUsage.reduce((sum, i) => sum + (i.kwh || 0), 0)
        const totalCost = generalUsage.reduce((sum, i) => sum + (i.cost || 0), 0)
        const avgUsage = totalUsage / generalUsage.length
        const current = generalUsage[generalUsage.length - 1]

        setStats({
          currentUsage: (current.kwh || 0).toFixed(2),
          avgUsage: avgUsage.toFixed(2),
          totalUsage: totalUsage.toFixed(2),
          estimatedCost: (totalCost / 100).toFixed(2) // Convert cents to dollars
        })
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch data')

      // Handle rate limiting with automatic retry
      if (err.isRateLimit && err.retryAfter) {
        setRetryCountdown(err.retryAfter)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [timeRange])

  // Handle retry countdown
  useEffect(() => {
    if (retryCountdown <= 0) return

    const timer = setInterval(() => {
      setRetryCountdown(prev => {
        if (prev <= 1) {
          // Countdown finished, retry the request
          fetchData()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [retryCountdown])

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'var(--surface)',
          padding: '10px',
          border: '1px solid var(--primary-color)',
          borderRadius: '4px'
        }}>
          <p style={{ margin: '0 0 5px 0' }}>{`Time: ${payload[0].payload.time}`}</p>
          <p style={{ margin: '0', color: '#2196f3' }}>
            {`Usage: ${payload[0].value.toFixed(2)} kWh`}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Live Usage</h1>
        <div className="form-group" style={{ margin: 0, minWidth: '200px' }}>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            style={{ margin: 0 }}
          >
            {Object.entries(TIME_RANGES).map(([key, value]) => (
              <option key={key} value={key}>{value.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="loading">Loading...</div>}
      {error && (
        <div className="error">
          {error}
          {retryCountdown > 0 && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              Retrying automatically in {retryCountdown} second{retryCountdown !== 1 ? 's' : ''}...
            </div>
          )}
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Current Usage</div>
              <div className="stat-value">
                {stats.currentUsage}
                <span className="stat-unit">kWh</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Average Usage</div>
              <div className="stat-value">
                {stats.avgUsage}
                <span className="stat-unit">kWh</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Usage</div>
              <div className="stat-value">
                {stats.totalUsage}
                <span className="stat-unit">kWh</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Estimated Cost</div>
              <div className="stat-value">
                ${stats.estimatedCost}
              </div>
            </div>
          </div>

          <div className="card">
            <h2 style={{ marginBottom: '1rem' }}>Consumption History</h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="time"
                  stroke="#a0a0a0"
                  tick={{ fill: '#a0a0a0' }}
                />
                <YAxis
                  stroke="#a0a0a0"
                  tick={{ fill: '#a0a0a0' }}
                  label={{ value: 'Usage (kWh)', angle: -90, position: 'insideLeft', fill: '#a0a0a0' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: '#a0a0a0' }} />
                <Line
                  type="monotone"
                  dataKey="usage"
                  stroke="#2196f3"
                  strokeWidth={2}
                  dot={{ fill: '#2196f3' }}
                  name="Usage (kWh)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Last updated: {format(new Date(), 'HH:mm:ss')} • Auto-refreshes every 5 minutes
          </div>
        </>
      )}
    </div>
  )
}

export default LiveUsage
