const ACCESS = "ACCESS_TOKEN"
const REFRESH = "REFRESH_TOKEN"

export const getAccessToken = () => localStorage.getItem(ACCESS)
export const getRefreshToken = () => localStorage.getItem(REFRESH)
export const setAccessToken = (t: string) => localStorage.setItem(ACCESS, t)
export const setTokens = (access: string, refresh: string) => {
  localStorage.setItem(ACCESS, access)
  localStorage.setItem(REFRESH, refresh)
}
export const clearTokens = () => {
  localStorage.removeItem(ACCESS)
  localStorage.removeItem(REFRESH)
}
