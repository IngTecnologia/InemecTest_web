import React from 'react'
import { Routes, Route } from 'react-router-dom'
import EvaluationForm from '../components/evaluation/EvaluationForm.jsx'
import AdminPage from './pages/AdminPage.jsx'
import AdminOverviewPage from './pages/AdminOverviewPage.jsx'
import AdminQueuePage from './pages/AdminQueuePage.jsx'
import AdminMonitorPage from './pages/AdminMonitorPage.jsx'
import AdminConfigPage from './pages/AdminConfigPage.jsx'

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
      
      {/* Rutas del módulo administrativo */}
      <Route path="/admin" element={<AdminPage />}>
        <Route index element={<AdminOverviewPage />} />
        <Route path="queue" element={<AdminQueuePage />} />
        <Route path="monitor" element={<AdminMonitorPage />} />
        <Route path="config" element={<AdminConfigPage />} />
      </Route>
    </Routes>
  )
}

export default App