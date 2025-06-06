import React from 'react'
import { Routes, Route } from 'react-router-dom'
import EvaluationForm from '../components/evaluation/EvaluationForm.jsx'
import AdminPage from './pages/AdminPage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={
        <div className="container">
          <div className="header">
            <h1>InemecTest</h1>
            <p>Evaluación de Conocimientos Técnicos: Programa de Disciplina Operativa</p>
          </div>
          <EvaluationForm />
        </div>
      } />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  )
}

export default App