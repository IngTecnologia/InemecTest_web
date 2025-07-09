/**
 * Componente para carga de procedimientos con validaciones
 */

import React, { useState, useCallback } from 'react'
import useAdminAuth from '../../hooks/useAdminAuth'

const ProcedureUpload = () => {
  const { getAuthHeaders } = useAdminAuth()
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState([])
  const [dragOver, setDragOver] = useState(false)

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    processFiles(droppedFiles)
  }, [])

  const handleFileInput = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files)
    processFiles(selectedFiles)
  }, [])

  const processFiles = (fileList) => {
    // Filtrar solo archivos .docx
    const docxFiles = fileList.filter(file => 
      file.name.toLowerCase().endsWith('.docx') && 
      !file.name.startsWith('~') // Excluir archivos temporales
    )
    
    if (docxFiles.length === 0) {
      alert('Por favor seleccione archivos .docx válidos')
      return
    }

    setFiles(docxFiles)
    setResults([]) // Limpiar resultados anteriores
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    setUploading(true)
    setResults([])

    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch('/api/v1/admin/procedures/upload', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setResults(result.data.results)
      } else {
        const error = await response.json()
        alert(`Error: ${error.detail || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('Error subiendo archivos:', error)
      alert('Error de conexión al subir archivos')
    } finally {
      setUploading(false)
    }
  }

  const clearFiles = () => {
    setFiles([])
    setResults([])
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'warning':
        return '⚠️'
      default:
        return '📄'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return '#28a745'
      case 'error':
        return '#dc3545'
      case 'warning':
        return '#ffc107'
      default:
        return '#6c757d'
    }
  }

  return (
    <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>📤 Subir Procedimientos</h2>
      
      {/* Área de carga */}
      <div
        style={{
          border: `2px dashed ${dragOver ? '#007bff' : '#dee2e6'}`,
          borderRadius: '8px',
          padding: '3rem',
          textAlign: 'center',
          backgroundColor: dragOver ? '#f8f9fa' : 'white',
          marginBottom: '1rem',
          transition: 'all 0.3s ease'
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</div>
        <p style={{ fontSize: '1.2rem', fontWeight: '500', marginBottom: '1rem' }}>
          Arrastra archivos .docx aquí o haz clic para seleccionar
        </p>
        <p style={{ color: '#666', marginBottom: '1rem' }}>
          Solo se aceptan archivos .docx de procedimientos
        </p>
        <input
          type="file"
          multiple
          accept=".docx"
          onChange={handleFileInput}
          style={{ display: 'none' }}
          id="fileInput"
        />
        <label
          htmlFor="fileInput"
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem',
            display: 'inline-block'
          }}
        >
          Seleccionar Archivos
        </label>
      </div>

      {/* Lista de archivos seleccionados */}
      {files.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <h3 style={{ marginBottom: '1rem' }}>Archivos Seleccionados ({files.length})</h3>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {files.map((file, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem',
                borderBottom: '1px solid #f0f0f0'
              }}>
                <span>📄 {file.name}</span>
                <span style={{ fontSize: '0.8rem', color: '#666' }}>
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              onClick={uploadFiles}
              disabled={uploading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: uploading ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontSize: '1rem'
              }}
            >
              {uploading ? 'Subiendo...' : 'Subir Archivos'}
            </button>
            <button
              onClick={clearFiles}
              disabled={uploading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontSize: '1rem'
              }}
            >
              Limpiar
            </button>
          </div>
        </div>
      )}

      {/* Resultados de carga */}
      {results.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          padding: '1rem'
        }}>
          <h3 style={{ marginBottom: '1rem' }}>Resultados de Carga</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Estado</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Archivo</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Código</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Versión</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Resultado</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ 
                      padding: '0.75rem', 
                      textAlign: 'center',
                      fontSize: '1.5rem'
                    }}>
                      {getStatusIcon(result.status)}
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: '500' }}>
                      {result.filename}
                    </td>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>
                      {result.codigo || 'N/A'}
                    </td>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>
                      {result.version || 'N/A'}
                    </td>
                    <td style={{ 
                      padding: '0.75rem',
                      color: getStatusColor(result.status)
                    }}>
                      <div style={{ fontWeight: '500' }}>
                        {result.message}
                      </div>
                      {result.details && (
                        <div style={{ 
                          fontSize: '0.8rem', 
                          marginTop: '0.25rem',
                          color: '#666'
                        }}>
                          {result.details}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Resumen de resultados */}
          <div style={{
            display: 'flex',
            gap: '2rem',
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#28a745' }}>
                {results.filter(r => r.status === 'success').length}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Exitosos</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc3545' }}>
                {results.filter(r => r.status === 'error').length}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Errores</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffc107' }}>
                {results.filter(r => r.status === 'warning').length}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Advertencias</div>
            </div>
          </div>
        </div>
      )}

      {/* Información de ayuda */}
      <div style={{
        backgroundColor: '#e3f2fd',
        border: '1px solid #bbdefb',
        borderRadius: '8px',
        padding: '1rem',
        marginTop: '1rem'
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#1976d2' }}>
          ℹ️ Criterios de Validación
        </h4>
        <ul style={{ margin: '0', paddingLeft: '1.5rem', color: '#333' }}>
          <li>El código extraído del nombre del archivo debe coincidir con el código interno del procedimiento</li>
          <li>La versión extraída del nombre del archivo debe coincidir con la versión interna del procedimiento</li>
          <li>Solo se aceptan procedimientos con códigos nuevos o versiones superiores a las existentes</li>
          <li>Los archivos aceptados se añaden automáticamente a la cola de generación de preguntas</li>
        </ul>
      </div>
    </div>
  )
}

export default ProcedureUpload