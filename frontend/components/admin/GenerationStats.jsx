import React from 'react'
import { useStats } from '../../hooks/useAdminStatus'

const GenerationStats = () => {
  const { stats, loading, error } = useStats(true, 10000)

  if (loading) return <p>Cargando estadísticas...</p>
  if (error) return <p>Error: {error}</p>
  if (!stats) return <p>Sin datos</p>

  const {
    total_procedures_scanned,
    procedures_in_queue,
    procedures_generating,
    procedures_validating,
    procedures_correcting,
    procedures_completed,
    procedures_failed,
    total_questions_generated,
    total_questions_validated,
    total_questions_corrected,
    avg_generation_time_minutes,
    avg_validation_score,
    success_rate_percentage,
    last_scan_date,
    last_generation_date
  } = stats

  return (
    <div className="generation-stats">
      <h2>Estadísticas de Generación</h2>
      <table>
        <tbody>
          <tr><th>Procedimientos escaneados</th><td>{total_procedures_scanned}</td></tr>
          <tr><th>En cola</th><td>{procedures_in_queue}</td></tr>
          <tr><th>Generando</th><td>{procedures_generating}</td></tr>
          <tr><th>Validando</th><td>{procedures_validating}</td></tr>
          <tr><th>Corrigiendo</th><td>{procedures_correcting}</td></tr>
          <tr><th>Completados</th><td>{procedures_completed}</td></tr>
          <tr><th>Fallidos</th><td>{procedures_failed}</td></tr>
          <tr><th>Preguntas generadas</th><td>{total_questions_generated}</td></tr>
          <tr><th>Preguntas validadas</th><td>{total_questions_validated}</td></tr>
          <tr><th>Preguntas corregidas</th><td>{total_questions_corrected}</td></tr>
          <tr><th>Tiempo medio (min)</th><td>{avg_generation_time_minutes}</td></tr>
          <tr><th>Puntuación media</th><td>{avg_validation_score}</td></tr>
          <tr><th>Tasa de éxito (%)</th><td>{success_rate_percentage}</td></tr>
          {last_scan_date && <tr><th>Último escaneo</th><td>{last_scan_date}</td></tr>}
          {last_generation_date && <tr><th>Última generación</th><td>{last_generation_date}</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

export default GenerationStats