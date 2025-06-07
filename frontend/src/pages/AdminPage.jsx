import React from 'react'

function AdminPage() {
  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Panel Administrativo - InemecTest</h1>
        <p>Generación y Gestión de Preguntas Técnicas</p>
      </div>
      
      <div className="admin-content">
        <div className="coming-soon">
          <h2>🔧 Módulo en Desarrollo</h2>
          <p>El panel administrativo estará disponible próximamente.</p>
          <p>Funcionalidades planificadas:</p>
          <ul>
            <li>Escaneo de procedimientos</li>
            <li>Generación automática de preguntas</li>
            <li>Validación por bots expertos</li>
            <li>Corrección automática</li>
            <li>Sincronización con Excel Maestro</li>
          </ul>
          <a href="/" className="btn-back">← Volver al Portal de Evaluación</a>
        </div>
      </div>
      
      <style jsx>{`
        .admin-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem;
        }
        
        .admin-header {
          text-align: center;
          color: white;
          margin-bottom: 3rem;
        }
        
        .admin-header h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .admin-header p {
          font-size: 1.1rem;
          opacity: 0.9;
        }
        
        .admin-content {
          max-width: 800px;
          margin: 0 auto;
        }
        
        .coming-soon {
          background: white;
          border-radius: 12px;
          padding: 3rem;
          text-align: center;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        
        .coming-soon h2 {
          color: #667eea;
          margin-bottom: 1rem;
        }
        
        .coming-soon p {
          margin-bottom: 1rem;
          color: #666;
          line-height: 1.6;
        }
        
        .coming-soon ul {
          text-align: left;
          max-width: 400px;
          margin: 1.5rem auto;
          color: #555;
        }
        
        .coming-soon li {
          margin-bottom: 0.5rem;
        }
        
        .btn-back {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          text-decoration: none;
          margin-top: 2rem;
          transition: transform 0.2s ease;
        }
        
        .btn-back:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
      `}</style>
    </div>
  )
}

export default AdminPage