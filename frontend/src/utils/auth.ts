import { User } from '../types'

export const getToken = (): string | null => {
  return localStorage.getItem('token')
}

export const setToken = (token: string) => {
  localStorage.setItem('token', token)
}

export const removeToken = () => {
  localStorage.removeItem('token')
}

export const getUser = (): User | null => {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  }
  return null
}

export const setUser = (user: User) => {
  localStorage.setItem('user', JSON.stringify(user))
}

export const removeUser = () => {
  localStorage.removeItem('user')
}

export const logout = () => {
  removeToken()
  removeUser()
}

export const isAuthenticated = (): boolean => {
  return !!getToken()
}

export const isAdmin = (): boolean => {
  const user = getUser()
  return user?.role === 'admin'
}
