import { storage } from '../utils/storage'

// Mock dev login - automatically authenticates
export const mockLogin = async (apiKey) => {
  // In dev mode, we just store the API key and consider the user authenticated
  if (apiKey && apiKey.trim() !== '') {
    storage.setApiKey(apiKey)
    storage.setAuthToken('mock-dev-token')
    return { success: true }
  }
  return { success: false, error: 'API key is required' }
}

export const isAuthenticated = () => {
  return !!storage.getAuthToken()
}

export const logout = () => {
  storage.clear()
}
