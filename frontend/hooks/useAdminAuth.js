/**
 * Hook para manejar autenticación de administradores
 */

import { useState, useEffect } from 'react'

const useAdminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const storedToken = localStorage.getItem('admin_token')
      const storedUser = localStorage.getItem('admin_user')

      if (!storedToken || !storedUser) {
        setLoading(false)
        return
      }

      // Verificar token con el servidor
      const response = await fetch('/api/v1/admin/auth/verify', {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setIsAuthenticated(true)
          setUser(result.user)
          setToken(storedToken)
        } else {
          clearAuthData()
        }
      } else {
        clearAuthData()
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error)
      clearAuthData()
    } finally {
      setLoading(false)
    }
  }

  const login = (userData, sessionToken) => {
    setIsAuthenticated(true)
    setUser(userData)
    setToken(sessionToken)
    localStorage.setItem('admin_token', sessionToken)
    localStorage.setItem('admin_user', JSON.stringify(userData))
  }

  const logout = async () => {
    try {
      const storedToken = localStorage.getItem('admin_token')
      if (storedToken) {
        // Notificar logout al servidor
        await fetch('/api/v1/admin/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        })
      }
    } catch (error) {
      console.error('Error en logout:', error)
    } finally {
      clearAuthData()
    }
  }

  const clearAuthData = () => {
    setIsAuthenticated(false)
    setUser(null)
    setToken(null)
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
  }

  const hasPermission = (permission) => {
    if (!user || !user.permissions) return false
    return user.permissions.includes(permission) || user.permissions.includes('full_access')
  }

  const getAuthHeaders = () => {
    const storedToken = localStorage.getItem('admin_token')
    return storedToken ? { 'Authorization': `Bearer ${storedToken}` } : {}
  }

  return {
    isAuthenticated,
    user,
    loading,
    token,
    login,
    logout,
    hasPermission,
    getAuthHeaders,
    checkAuthStatus
  }
}

export default useAdminAuth