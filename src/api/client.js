import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  timeout: 15000
})

api.interceptors.request.use((config) => {
  const tg = window.Telegram?.WebApp
  const initData = tg?.initData || ''

  if (initData) {
    config.headers['X-Telegram-Init-Data'] = initData
  }

  const adminToken = sessionStorage.getItem('admin_token')
  if (adminToken) {
    config.headers['X-Admin-Token'] = adminToken
  }

  return config
})

export default api