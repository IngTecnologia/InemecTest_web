import React from 'react'
import EvaluationForm from '../../components/evaluation/EvaluationForm'

function EvaluationPage() {
  return (
    <div className="container">
      <div className="header">
        <h1>InemecTest</h1>
        <p>Evaluación de Conocimientos Técnicos: Programa de Disciplina Operativa</p>
      </div>
      <EvaluationForm />
    </div>
  )
}

export default EvaluationPage