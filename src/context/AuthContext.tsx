import { createContext, useCallback, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react"
import { getMyDetails } from "../service/auth"
import { clearTokens, getAccessToken } from "../lib/storage"
import type { User } from "../types"

type AuthContextTypes = {
  user: User | null
  setUser: Dispatch<SetStateAction<User | null>>
  loading: boolean
  logout: () => void
}

export const AuthContext = createContext<AuthContextTypes | null>(null)

type AuthProviderTypes = {
  children: ReactNode
}

const AuthProvider = ({ children }: AuthProviderTypes) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(() => Boolean(getAccessToken()))

  useEffect(() => {
    if (!getAccessToken()) return

    getMyDetails()
      .then((res) => setUser(res.data ?? null))
      .catch((error) => {
        console.error(error)
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
  }, [])

  return <AuthContext.Provider value={{ user, setUser, loading, logout }}>{children}</AuthContext.Provider>
}

export default AuthProvider
