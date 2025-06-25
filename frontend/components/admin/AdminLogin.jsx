/**
 * Componente de login para acceso al panel de administración
 */

import { useState, useEffect } from 'react'

const AdminLogin = ({ onLoginSuccess }) => {
  const [loginData, setLoginData] = useState({
    username: '',
    code: ''
  })
  const [availableUsers, setAvailableUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Cargar usuarios disponibles al montar el componente
  useEffect(() => {
    loadAvailableUsers()
  }, [])

  const loadAvailableUsers = async () => {
    try {
      const response = await fetch('/api/v1/admin/auth/users')
      if (response.ok) {
        const data = await response.json()
        setAvailableUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error)
    }
  }

  const handleInputChange = (field, value) => {
    setLoginData(prev => ({
      ...prev,
      [field]: value
    }))
    setError('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    
    if (!loginData.username || !loginData.code) {
      setError('Por favor complete todos los campos')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/v1/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Guardar token en localStorage
        localStorage.setItem('admin_token', result.session_token)
        localStorage.setItem('admin_user', JSON.stringify(result.user))
        
        // Notificar éxito al componente padre
        onLoginSuccess(result.user, result.session_token)
      } else {
        setError(result.message || 'Credenciales inválidas')
      }
    } catch (error) {
      setError('Error de conexión. Intente nuevamente.')
      console.error('Error en login:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px',
        margin: '1rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ 
            color: '#333', 
            marginBottom: '0.5rem',
            fontSize: '1.8rem',
            fontWeight: '600'
          }}>
            InemecTest: DICACOCU 360°
          </h1>
          <p style={{ 
            color: '#666', 
            fontSize: '1rem',
            margin: 0
          }}>
            Panel de Administración
          </p>
        </div>

        <form onSubmit={handleLogin}>
          {error && (
            <div style={{
              background: '#fee',
              border: '1px solid #fcc',
              color: '#c33',
              padding: '0.75rem',
              borderRadius: '6px',
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#333',
              fontWeight: '500'
            }}>
              Usuario:
            </label>
            <select
              value={loginData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e1e5e9',
                borderRadius: '6px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s',
                background: 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
              disabled={loading}
            >
              <option value="">Seleccione un usuario</option>
              {availableUsers.map(username => (
                <option key={username} value={username}>
                  {username}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#333',
              fontWeight: '500'
            }}>
              Código de Acceso:
            </label>
            <input
              type="password"
              value={loginData.code}
              onChange={(e) => handleInputChange('code', e.target.value)}
              placeholder="Ingrese su código de acceso"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e1e5e9',
                borderRadius: '6px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !loginData.username || !loginData.code}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: loading ? '#ccc' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              opacity: loading || (!loginData.username || !loginData.code) ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!loading && loginData.username && loginData.code) {
                e.target.style.background = '#5a6fd8'
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.background = '#667eea'
              }
            }}
          >
            {loading ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>

        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: '#f8f9fa',
          borderRadius: '6px',
          fontSize: '0.85rem',
          color: '#666'
        }}>
          <p style={{ margin: 0, fontWeight: '500', marginBottom: '0.5rem' }}>
            💡 Información de Acceso:
          </p>
          <p style={{ margin: 0 }}>
            Contacte al administrador del sistema para obtener sus credenciales de acceso.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin