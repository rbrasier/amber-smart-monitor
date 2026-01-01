import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format, subHours, subDays } from 'date-fns'
import { amberApi } from '../services/amberApi'
import { storage } from '../utils/storage'

const TIME_RANGES = {
  '6h': { label: 'Last 6 Hours', hours: 6 },
  '12h': { label: 'Last 12 Hours', hours: 12 },
  '24h': { label: 'Last 24 Hours', hours: 24 },
  'today': { label: 'Current Day', hours: null }
}

function LiveUsage() {
  const [timeRange, setTimeRange] = useState('6h')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    currentPrice: 0,
    avgPrice: 0,
    renewables: 0,
    totalCost: 0
  })

  const fetchData = async () => {
    setLoading(true)
    setError('')

    try {
      const siteId = storage.getSiteId()
      if (!siteId) {
        throw new Error('No site ID found. Please login again.')
      }

      let intervals = []
      const now = new Date()

      if (timeRange === 'today') {
        // Fetch current day data
        const startDate = format(now, 'yyyy-MM-dd')
        const endDate = format(now, 'yyyy-MM-dd')
        intervals = await amberApi.getPrices(siteId, startDate, endDate, 30)
      } else {
        // Fetch live data with previous intervals
        const range = TIME_RANGES[timeRange]
        const numIntervals = Math.ceil((range.hours * 60) / 30) // 30-minute intervals
        intervals = await amberApi.getCurrentPrices(siteId, {
          previous: numIntervals,
          next: 12,
          resolution: 30
        })
      }

      // Filter for general usage channel
      const generalIntervals = intervals.filter(interval => interval.channelType === 'general')

      // Transform data for chart
      const chartData = generalIntervals.map(interval => ({
        time: format(new Date(interval.startTime), 'HH:mm'),
        price: interval.perKwh,
        spotPrice: interval.spotPerKwh,
        renewables: interval.renewables,
        fullTime: interval.startTime,
        descriptor: interval.descriptor
      }))

      setData(chartData)

      // Calculate stats
      if (generalIntervals.length > 0) {
        const current = generalIntervals[generalIntervals.length - 1]
        const avgPrice = generalIntervals.reduce((sum, i) => sum + i.perKwh, 0) / generalIntervals.length

        setStats({
          currentPrice: current.perKwh.toFixed(2),
          avgPrice: avgPrice.toFixed(2),
          renewables: current.renewables.toFixed(1),
          descriptor: current.descriptor
        })
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch data')
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
          <p style={{ margin: '0 0 5px 0', color: '#ff6b35' }}>
            {`Price: ${payload[0].value.toFixed(2)} c/kWh`}
          </p>
          <p style={{ margin: '0 0 5px 0', color: '#4caf50' }}>
            {`Renewables: ${payload[0].payload.renewables.toFixed(1)}%`}
          </p>
          <p style={{ margin: '0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {`Status: ${payload[0].payload.descriptor}`}
          </p>
        </div>
      )
    }
    return null
  }

  const getPriceColor = (descriptor) => {
    switch (descriptor) {
      case 'spike': return '#f44336'
      case 'high': return '#ff9800'
      case 'neutral': return '#2196f3'
      case 'low': return '#4caf50'
      case 'veryLow': return '#00e676'
      case 'extremelyLow': return '#00c853'
      default: return '#2196f3'
    }
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
      {error && <div className="error">{error}</div>}

      {!loading && !error && (
        <>
          <div className="stats-grid">
            <div className="stat-card" style={{ borderLeftColor: getPriceColor(stats.descriptor) }}>
              <div className="stat-label">Current Price</div>
              <div className="stat-value">
                {stats.currentPrice}
                <span className="stat-unit">c/kWh</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Average Price</div>
              <div className="stat-value">
                {stats.avgPrice}
                <span className="stat-unit">c/kWh</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Renewables</div>
              <div className="stat-value">
                {stats.renewables}
                <span className="stat-unit">%</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 style={{ marginBottom: '1rem' }}>Price History</h2>
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
                  label={{ value: 'Price (c/kWh)', angle: -90, position: 'insideLeft', fill: '#a0a0a0' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: '#a0a0a0' }} />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#ff6b35"
                  strokeWidth={2}
                  dot={{ fill: '#ff6b35' }}
                  name="Price (c/kWh)"
                />
                <Line
                  type="monotone"
                  dataKey="renewables"
                  stroke="#4caf50"
                  strokeWidth={2}
                  dot={{ fill: '#4caf50' }}
                  name="Renewables (%)"
                  yAxisId="renewables"
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
