import { storage } from '../utils/storage'

const API_BASE_URL = 'https://api.amber.com.au/v1'

class AmberApiService {
  async fetchWithAuth(endpoint, options = {}) {
    const apiKey = storage.getApiKey()

    if (!apiKey) {
      throw new Error('API key not found. Please login again.')
    }

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your credentials.')
      }
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async getSites() {
    return this.fetchWithAuth('/sites')
  }

  async getCurrentPrices(siteId, options = {}) {
    const params = new URLSearchParams()

    if (options.next) params.append('next', options.next)
    if (options.previous) params.append('previous', options.previous)
    if (options.resolution) params.append('resolution', options.resolution)

    const query = params.toString() ? `?${params.toString()}` : ''
    return this.fetchWithAuth(`/sites/${siteId}/prices/current${query}`)
  }

  async getPrices(siteId, startDate, endDate, resolution) {
    const params = new URLSearchParams()

    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    if (resolution) params.append('resolution', resolution)

    const query = params.toString() ? `?${params.toString()}` : ''
    return this.fetchWithAuth(`/sites/${siteId}/prices${query}`)
  }

  async getUsage(siteId, startDate, endDate) {
    const params = new URLSearchParams({
      startDate,
      endDate
    })

    return this.fetchWithAuth(`/sites/${siteId}/usage?${params.toString()}`)
  }
}

export const amberApi = new AmberApiService()
