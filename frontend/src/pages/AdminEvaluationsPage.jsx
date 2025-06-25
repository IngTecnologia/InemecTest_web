/**
 * Página de gestión de evaluaciones en el admin
 */

import React from 'react'
import EvaluationsManager from '../../components/admin/EvaluationsManager'

const AdminEvaluationsPage = () => {
  return (
    <div className="admin-page">
      <EvaluationsManager />
      
      <style jsx>{`
        .evaluations-manager {
          padding: 1rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .error-message {
          background: #fee;
          border: 1px solid #fcc;
          color: #c33;
          padding: 0.75rem;
          border-radius: 6px;
          margin-bottom: 1rem;
        }

        .tabs {
          display: flex;
          border-bottom: 2px solid #e1e5e9;
          margin-bottom: 2rem;
          gap: 0.5rem;
        }

        .tabs button {
          padding: 0.75rem 1.5rem;
          border: none;
          background: none;
          cursor: pointer;
          font-weight: 500;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
        }

        .tabs button:hover {
          background: #f8f9fa;
        }

        .tabs button.active {
          border-bottom-color: #667eea;
          color: #667eea;
          background: #f8f9fa;
        }

        /* Dashboard Styles */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border: 1px solid #e1e5e9;
        }

        .stat-card.full-width {
          grid-column: 1 / -1;
        }

        .stat-card h3 {
          margin: 0 0 0.5rem 0;
          color: #333;
          font-size: 0.9rem;
          text-transform: uppercase;
          font-weight: 600;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: bold;
          color: #667eea;
          margin-bottom: 0.25rem;
        }

        .stat-detail {
          font-size: 0.8rem;
          color: #666;
        }

        .campo-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 0.5rem;
        }

        .campo-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .campo-name {
          font-weight: 500;
        }

        .campo-count {
          font-weight: bold;
          color: #667eea;
        }

        .recent-evaluations {
          max-height: 200px;
          overflow-y: auto;
        }

        .recent-item {
          display: grid;
          grid-template-columns: 1fr 2fr 1fr auto;
          gap: 1rem;
          padding: 0.5rem;
          border-bottom: 1px solid #e1e5e9;
          align-items: center;
        }

        .recent-item:last-child {
          border-bottom: none;
        }

        .status.approved {
          color: #059669;
        }

        .status.failed {
          color: #dc2626;
        }

        /* Search Styles */
        .search-filters {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          align-items: end;
        }

        .filter-group label {
          display: block;
          margin-bottom: 0.25rem;
          font-weight: 500;
          color: #333;
        }

        .filter-group input,
        .filter-group select {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 0.9rem;
        }

        .filter-actions {
          display: flex;
          gap: 0.5rem;
        }

        .filter-actions button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }

        .filter-actions button:first-child {
          background: #667eea;
          color: white;
        }

        .filter-actions button:last-child {
          background: #6b7280;
          color: white;
        }

        .filter-actions button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Table Styles */
        .evaluations-table {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .table-header,
        .table-row {
          display: grid;
          grid-template-columns: 120px 200px 100px 120px 100px 120px 100px;
          gap: 1rem;
          padding: 1rem;
          align-items: center;
        }

        .table-header {
          background: #667eea;
          color: white;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .table-row {
          border-bottom: 1px solid #e1e5e9;
        }

        .table-row:last-child {
          border-bottom: none;
        }

        .table-row:hover {
          background: #f8f9fa;
        }

        .result.approved {
          color: #059669;
          font-weight: 600;
        }

        .result.failed {
          color: #dc2626;
          font-weight: 600;
        }

        .btn-small {
          padding: 0.25rem 0.5rem;
          font-size: 0.8rem;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .btn-small:hover {
          background: #5a6fd8;
        }

        /* Report Styles */
        .evaluation-report {
          max-width: 800px;
          margin: 0 auto;
        }

        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e1e5e9;
        }

        .btn-back {
          padding: 0.5rem 1rem;
          background: #6b7280;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .report-section {
          background: white;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .report-section h3 {
          margin: 0 0 1rem 0;
          color: #333;
          border-bottom: 1px solid #e1e5e9;
          padding-bottom: 0.5rem;
        }

        .data-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 0.5rem;
        }

        .results-summary {
          display: flex;
          justify-content: space-around;
          text-align: center;
        }

        .result-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .result-item span:first-child {
          font-weight: 500;
          color: #666;
        }

        .result-item span:last-child {
          font-size: 1.2rem;
          font-weight: bold;
        }

        .result-item .approved {
          color: #059669;
        }

        .result-item .failed {
          color: #dc2626;
        }

        .questions-report {
          space-y: 1rem;
        }

        .question-block {
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .question-block.correct {
          border-color: #059669;
          background: #f0fdf4;
        }

        .question-block.incorrect {
          border-color: #dc2626;
          background: #fef2f2;
        }

        .question-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .question-number {
          font-weight: bold;
          color: #333;
        }

        .result-indicator.correct {
          color: #059669;
          font-weight: 600;
        }

        .result-indicator.incorrect {
          color: #dc2626;
          font-weight: 600;
        }

        .question-text {
          font-weight: 500;
          margin-bottom: 1rem;
          line-height: 1.4;
        }

        .options-grid {
          display: grid;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .option {
          padding: 0.5rem;
          border: 1px solid #e1e5e9;
          border-radius: 4px;
          background: #f8f9fa;
        }

        .option.selected {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }

        .correct-answer {
          padding: 0.5rem;
          background: #f0fdf4;
          border: 1px solid #059669;
          border-radius: 4px;
          color: #059669;
          font-weight: 500;
        }

        .applied-knowledge,
        .feedback-section {
          space-y: 0.5rem;
        }

        .knowledge-item,
        .feedback-item {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem;
          border-bottom: 1px solid #e1e5e9;
        }

        .knowledge-item span:first-child,
        .feedback-item strong {
          font-weight: 500;
        }

        .knowledge-item .yes {
          color: #059669;
          font-weight: 600;
        }

        .knowledge-item .no {
          color: #dc2626;
          font-weight: 600;
        }

        .loading {
          text-align: center;
          padding: 2rem;
          color: #666;
        }
      `}</style>
    </div>
  )
}

export default AdminEvaluationsPage