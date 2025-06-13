import React, { useEffect, useState } from 'react'
import adminApi from '../../src/services/adminApi.js'

const ResultsViewer = () => {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminApi.getResults()
        setResults(res.results || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <p>Cargando resultados...</p>
  if (error) return <p>Error: {error}</p>
  if (results.length === 0) return <p>No hay resultados disponibles</p>

  return (
    <div className="results-viewer">
      <h2>Resultados Recientes</h2>
      <table>
        <thead>
          <tr>
            <th>Lote</th>
            <th>Procedimiento</th>
            <th>Estado</th>
            <th>Preguntas</th>
            <th>Score</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {results.map(r => (
            <tr key={r.batch_id + r.procedure_codigo}>
              <td>{r.batch_id}</td>
              <td>{r.procedure_codigo} - {r.procedure_name}</td>
              <td>{r.status}</td>
              <td>{r.total_questions}</td>
              <td>{r.validation_score}</td>
              <td>{r.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ResultsViewer