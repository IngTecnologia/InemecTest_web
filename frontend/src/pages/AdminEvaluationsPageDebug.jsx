/**
 * Página de prueba para evaluar problemas de renderizado
 */

import React from 'react'

const AdminEvaluationsPageDebug = () => {
  return (
    <div style={{ padding: '2rem', background: 'white' }}>
      <h1>🔧 Página de Evaluaciones - Debug</h1>
      <p>Si puedes ver esto, la ruta funciona correctamente.</p>
      <div style={{ 
        background: '#f0f9ff', 
        padding: '1rem', 
        borderRadius: '8px',
        margin: '1rem 0'
      }}>
        <h3>Estado de Debug:</h3>
        <ul>
          <li>✅ Componente cargado correctamente</li>
          <li>✅ React renderizando</li>
          <li>✅ Ruta /admin/evaluations funcional</li>
        </ul>
      </div>
      <button 
        onClick={() => console.log('Debug: botón funcionando')}
        style={{
          padding: '0.5rem 1rem',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Test de JavaScript
      </button>
    </div>
  )
}

export default AdminEvaluationsPageDebug