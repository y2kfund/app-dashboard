export const isDevelopment = () => {
  return import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
}

export const getAppUrl = () => {
  return window.location.origin
}

export const getSupabaseConfig = () => {
  return {
    url: import.meta.env.VITE_SUPA_URL,
    anonKey: import.meta.env.VITE_SUPA_ANON
  }
}