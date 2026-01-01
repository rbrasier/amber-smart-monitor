import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { amberApi } from '../services/amberApi'
import { storage } from '../utils/storage'

function DailyReport() {
  const [searchParams] = useSearchParams()
  const selectedDate = searchParams.get('date')
  const navigate = useNavigate()

  const [data, setData] = useState([])
  const [dailyData, setDailyData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState(selectedDate ? 'detail' : 'overview')
  const [stats, setStats] = useState({
    totalUsage: 0,
    totalCost: 0,
    avgPrice: 0,
    renewables: 0
  })

  const fetchOverviewData = async () => {
    setLoading(true)
    setError('')

    try {
      const siteId = storage.getSiteId()
      if (!siteId) {
        throw new Error('No site ID found. Please login again.')
      }

      // Fetch last 30 days of usage data
      const dailyStats = []

      for (let i = 0; i < 30; i++) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd')

        try {
          const [usage, prices] = await Promise.all([
            amberApi.getUsage(siteId, date, date),
            amberApi.getPrices(siteId, date, date, 30)
          ])

          const generalUsage = usage.filter(u => u.channelType === 'general')
          const solarExports = usage.filter(u => u.channelType === 'feedIn')
          const generalPrices = prices.filter(p => p.channelType === 'general')

          const totalUsage = generalUsage.reduce((sum, u) => sum + u.kwh, 0)
          const solarGeneration = Math.abs(solarExports.reduce((sum, u) => sum + u.kwh, 0))
          const totalCost = generalUsage.reduce((sum, u) => sum + u.cost, 0)
          const avgRenewables = generalPrices.reduce((sum, p) => sum + p.renewables, 0) / (generalPrices.length || 1)

          dailyStats.push({
            date: date,
            displayDate: format(new Date(date), 'MMM dd'),
            usage: totalUsage,
            solarExports: solarGeneration,
            cost: totalCost,
            renewables: avgRenewables
          })
        } catch (err) {
          // Skip days with no data
          console.warn(`No data for ${date}`)
        }
      }

      // Reverse to show oldest first
      setDailyData(dailyStats.reverse())

      // Calculate overall stats
      if (dailyStats.length > 0) {
        const totalUsage = dailyStats.reduce((sum, d) => sum + d.usage, 0)
        const totalCost = dailyStats.reduce((sum, d) => sum + d.cost, 0)
        const avgRenewables = dailyStats.reduce((sum, d) => sum + d.renewables, 0) / dailyStats.length

        setStats({
          totalUsage: totalUsage.toFixed(2),
          totalCost: totalCost.toFixed(2),
          avgPrice: dailyStats.length > 0 ? (totalCost / totalUsage * 100).toFixed(2) : 0,
          renewables: avgRenewables.toFixed(1)
        })
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch overview data')
    } finally {
      setLoading(false)
    }
  }

  const fetchDetailData = async (date) => {
    setLoading(true)
    setError('')

    try {
      const siteId = storage.getSiteId()
      if (!siteId) {
        throw new Error('No site ID found. Please login again.')
      }

      const [usage, prices] = await Promise.all([
        amberApi.getUsage(siteId, date, date),
        amberApi.getPrices(siteId, date, date, 30)
      ])

      const generalUsage = usage.filter(u => u.channelType === 'general')
      const solarExports = usage.filter(u => u.channelType === 'feedIn')

      // Combine usage and price data
      const chartData = generalUsage.map(u => {
        const matchingPrice = prices.find(p => p.startTime === u.startTime && p.channelType === 'general')
        return {
          time: format(new Date(u.startTime), 'HH:mm'),
          usage: u.kwh,
          cost: u.cost,
          price: matchingPrice ? matchingPrice.perKwh : 0,
          renewables: matchingPrice ? matchingPrice.renewables : 0
        }
      })

      setData(chartData)

      // Calculate daily stats
      const totalUsage = generalUsage.reduce((sum, u) => sum + u.kwh, 0)
      const solarGeneration = Math.abs(solarExports.reduce((sum, u) => sum + u.kwh, 0))
      const totalCost = generalUsage.reduce((sum, u) => sum + u.cost, 0)
      const avgRenewables = prices
        .filter(p => p.channelType === 'general')
        .reduce((sum, p) => sum + p.renewables, 0) / (prices.filter(p => p.channelType === 'general').length || 1)

      setStats({
        totalUsage: totalUsage.toFixed(2),
        solarGeneration: solarGeneration.toFixed(2),
        totalCost: totalCost.toFixed(2),
        renewables: avgRenewables.toFixed(1)
      })
    } catch (err) {
      setError(err.message || 'Failed to fetch detail data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedDate) {
      setViewMode('detail')
      fetchDetailData(selectedDate)
    } else {
      setViewMode('overview')
      fetchOverviewData()
    }
  }, [selectedDate])

  const handleBarClick = (data) => {
    if (data && data.date) {
      navigate(`/daily?date=${data.date}`)
    }
  }

  const handleBackToOverview = () => {
    navigate('/daily')
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'var(--surface)',
          padding: '10px',
          border: '1px solid var(--primary-color)',
          borderRadius: '4px'
        }}>
          {viewMode === 'overview' ? (
            <>
              <p style={{ margin: '0 0 5px 0' }}>{`Date: ${payload[0].payload.displayDate}`}</p>
              <p style={{ margin: '0 0 5px 0', color: '#2196f3' }}>
                {`Usage: ${payload[0].value.toFixed(2)} kWh`}
              </p>
              {payload[0].payload.solarExports > 0 && (
                <p style={{ margin: '0 0 5px 0', color: '#ffa726' }}>
                  {`Solar: ${payload[0].payload.solarExports.toFixed(2)} kWh`}
                </p>
              )}
              <p style={{ margin: '0', color: '#4caf50' }}>
                {`Cost: $${payload[0].payload.cost.toFixed(2)}`}
              </p>
            </>
          ) : (
            <>
              <p style={{ margin: '0 0 5px 0' }}>{`Time: ${payload[0].payload.time}`}</p>
              <p style={{ margin: '0 0 5px 0', color: '#2196f3' }}>
                {`Usage: ${payload[0].value.toFixed(2)} kWh`}
              </p>
              <p style={{ margin: '0 0 5px 0', color: '#ff6b35' }}>
                {`Price: ${payload[0].payload.price.toFixed(2)} c/kWh`}
              </p>
              <p style={{ margin: '0', color: '#4caf50' }}>
                {`Cost: $${payload[0].payload.cost.toFixed(2)}`}
              </p>
            </>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>
          {viewMode === 'overview' ? 'Daily Usage Report (Last 30 Days)' : `Usage for ${format(new Date(selectedDate), 'MMMM dd, yyyy')}`}
        </h1>
        {viewMode === 'detail' && (
          <button onClick={handleBackToOverview} className="btn btn-secondary">
            Back to Overview
          </button>
        )}
      </div>

      {loading && <div className="loading">Loading...</div>}
      {error && <div className="error">{error}</div>}

      {!loading && !error && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Usage</div>
              <div className="stat-value">
                {stats.totalUsage}
                <span className="stat-unit">kWh</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Cost</div>
              <div className="stat-value">
                ${stats.totalCost}
              </div>
            </div>
            {viewMode === 'detail' && stats.solarGeneration && (
              <div className="stat-card">
                <div className="stat-label">Solar Exports</div>
                <div className="stat-value">
                  {stats.solarGeneration}
                  <span className="stat-unit">kWh</span>
                </div>
              </div>
            )}
            <div className="stat-card">
              <div className="stat-label">Avg Renewables</div>
              <div className="stat-value">
                {stats.renewables}
                <span className="stat-unit">%</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 style={{ marginBottom: '1rem' }}>
              {viewMode === 'overview' ? 'Daily Usage (Click a bar to see details)' : 'Hourly Usage'}
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              {viewMode === 'overview' ? (
                <BarChart data={dailyData} onClick={(e) => e && e.activePayload && handleBarClick(e.activePayload[0].payload)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey="displayDate"
                    stroke="#a0a0a0"
                    tick={{ fill: '#a0a0a0', fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    stroke="#a0a0a0"
                    tick={{ fill: '#a0a0a0' }}
                    label={{ value: 'Usage (kWh)', angle: -90, position: 'insideLeft', fill: '#a0a0a0' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ color: '#a0a0a0' }} />
                  <Bar dataKey="usage" fill="#2196f3" name="General Usage (kWh)" cursor="pointer" />
                  <Bar dataKey="solarExports" fill="#ffa726" name="Solar Exports (kWh)" cursor="pointer" />
                </BarChart>
              ) : (
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
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#ff6b35"
                    strokeWidth={2}
                    dot={{ fill: '#ff6b35' }}
                    name="Price (c/kWh)"
                    yAxisId="price"
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}

export default DailyReport
