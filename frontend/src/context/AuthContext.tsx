import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User } from '../types'
import { getToken, getUser, logout as clearAuth } from '../utils/auth'
import { getProfile } from '../api/auth'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (user: User, token: string) => void
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getToken()
      const storedUser = getUser()
      
      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(storedUser)
        try {
          const { data } = await getProfile()
          setUser(data)
        } catch {
          clearAuth()
          setToken(null)
          setUser(null)
        }
      }
      setLoading(false)
    }
    
    initAuth()
  }, [])

  const login = (userData: User, newToken: string) => {
    setUser(userData)
    setToken(newToken)
  }

  const logout = () => {
    clearAuth()
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isAdmin: user?.role === 'admin',
        login,
        logout,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
