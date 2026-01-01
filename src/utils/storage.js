const STORAGE_KEYS = {
  API_KEY: 'amber_api_key',
  SITE_ID: 'amber_site_id',
  AUTH_TOKEN: 'amber_auth_token'
}

export const storage = {
  getApiKey: () => {
    return localStorage.getItem(STORAGE_KEYS.API_KEY)
  },

  setApiKey: (apiKey) => {
    localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey)
  },

  getSiteId: () => {
    return localStorage.getItem(STORAGE_KEYS.SITE_ID)
  },

  setSiteId: (siteId) => {
    localStorage.setItem(STORAGE_KEYS.SITE_ID, siteId)
  },

  getAuthToken: () => {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  },

  setAuthToken: (token) => {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
  },

  clear: () => {
    localStorage.removeItem(STORAGE_KEYS.API_KEY)
    localStorage.removeItem(STORAGE_KEYS.SITE_ID)
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
  }
}
