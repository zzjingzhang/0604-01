import api from './index'
import { User, LoginResponse } from '../types'

export const login = (username: string, password: string) => {
  return api.post<LoginResponse>('/auth/login', { username, password })
}

export const register = (username: string, password: string, real_name?: string) => {
  return api.post<LoginResponse>('/auth/register', { username, password, real_name })
}

export const getProfile = () => {
  return api.get<User>('/auth/profile')
}
