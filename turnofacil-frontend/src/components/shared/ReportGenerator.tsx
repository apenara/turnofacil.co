'use client'

import React, { useState } from 'react'
import { Button, Card, Input, Modal } from '@/components/ui'

interface ReportData {
  title: string
  subtitle?: string
  company: string
  generatedBy: string
  generatedAt: Date
  data: any[]
  columns: ReportColumn[]
  summary?: ReportSummary[]
}

interface ReportColumn {
  key: string
  title: string
  type: 'text' | 'number' | 'currency' | 'date' | 'datetime'
  format?: string
}

interface ReportSummary {
  label: string
  value: string | number
  type: 'text' | 'number' | 'currency'
}

interface ReportGeneratorProps {
  isOpen: boolean
  onClose: () => void
  reportData: ReportData
  fileName?: string
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  isOpen,
  onClose,
  reportData,
  fileName = 'reporte'
}) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [format, setFormat] = useState<'excel' | 'pdf' | 'csv'>('excel')

  const formatValue = (value: any, column: ReportColumn): string => {
    if (value === null || value === undefined) return ''
    
    switch (column.type) {
      case 'currency':
        return new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0
        }).format(Number(value))
      
      case 'number':
        return new Intl.NumberFormat('es-CO').format(Number(value))
      
      case 'date':
        return new Date(value).toLocaleDateString('es-CO')
      
      case 'datetime':
        return new Date(value).toLocaleString('es-CO')
      
      default:
        return String(value)
    }
  }

  const generateCSV = (): string => {
    const headers = reportData.columns.map(col => col.title).join(',')
    const rows = reportData.data.map(row => 
      reportData.columns.map(col => {
        const value = formatValue(row[col.key], col)
        // Escapar comillas y envolver en comillas si contiene comas
        if (value.includes(',') || value.includes('"')) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
    
    return [headers, ...rows].join('\n')
  }

  const generateExcel = (): void => {
    // Para simplicidad, generamos un archivo CSV que se puede abrir en Excel
    const csvContent = generateCSV()
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${fileName}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const generatePDF = (): void => {
    // Crear contenido HTML para PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${reportData.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .company { color: #0D9488; font-size: 18px; font-weight: bold; }
          .title { font-size: 24px; font-weight: bold; margin: 10px 0; }
          .subtitle { color: #666; margin-bottom: 10px; }
          .meta { font-size: 12px; color: #888; }
          .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .table th { background-color: #f5f5f5; font-weight: bold; }
          .table tr:nth-child(even) { background-color: #f9f9f9; }
          .summary { margin-top: 30px; }
          .summary-item { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; }
          .summary-item:last-child { border-bottom: none; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company">${reportData.company}</div>
          <div class="title">${reportData.title}</div>
          ${reportData.subtitle ? `<div class="subtitle">${reportData.subtitle}</div>` : ''}
          <div class="meta">
            Generado por: ${reportData.generatedBy} | 
            Fecha: ${reportData.generatedAt.toLocaleString('es-CO')}
          </div>
        </div>
        
        <table class="table">
          <thead>
            <tr>
              ${reportData.columns.map(col => `<th>${col.title}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${reportData.data.map(row => `
              <tr>
                ${reportData.columns.map(col => `<td>${formatValue(row[col.key], col)}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        ${reportData.summary ? `
          <div class="summary">
            <h3>Resumen</h3>
            ${reportData.summary.map(item => `
              <div class="summary-item">
                <span>${item.label}:</span>
                <span>${item.type === 'currency' ? 
                  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(Number(item.value)) :
                  item.value
                }</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </body>
      </html>
    `
    
    // Abrir en nueva ventana para que el usuario pueda imprimir/guardar como PDF
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simular procesamiento
      
      switch (format) {
        case 'excel':
        case 'csv':
          generateExcel()
          break
        case 'pdf':
          generatePDF()
          break
      }
      
      onClose()
    } catch (error) {
      console.error('Error generando reporte:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generar Reporte"
      size="md"
    >
      <div className="space-y-6">
        {/* Vista previa del reporte */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-primary-600">{reportData.company}</h3>
            <h4 className="text-md font-medium">{reportData.title}</h4>
            {reportData.subtitle && (
              <p className="text-sm text-gray-600">{reportData.subtitle}</p>
            )}
          </div>
          
          <div className="text-xs text-gray-500 mb-4">
            <p>Registros: {reportData.data.length}</p>
            <p>Generado por: {reportData.generatedBy}</p>
            <p>Fecha: {reportData.generatedAt.toLocaleString('es-CO')}</p>
          </div>
          
          {/* Vista previa de la tabla (primeras 3 filas) */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-gray-100">
                  {reportData.columns.map(col => (
                    <th key={col.key} className="px-2 py-1 text-left font-medium text-gray-700">
                      {col.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.data.slice(0, 3).map((row, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    {reportData.columns.map(col => (
                      <td key={col.key} className="px-2 py-1 text-gray-600">
                        {formatValue(row[col.key], col)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {reportData.data.length > 3 && (
            <p className="text-xs text-gray-500 mt-2 text-center">
              ... y {reportData.data.length - 3} registros más
            </p>
          )}
          
          {/* Resumen */}
          {reportData.summary && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h5 className="text-sm font-medium mb-2">Resumen:</h5>
              <div className="space-y-1">
                {reportData.summary.map((item, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span>{item.label}:</span>
                    <span className="font-medium">
                      {item.type === 'currency' ? 
                        new Intl.NumberFormat('es-CO', { 
                          style: 'currency', 
                          currency: 'COP', 
                          minimumFractionDigits: 0 
                        }).format(Number(item.value)) :
                        item.value
                      }
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Opciones de formato */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Formato de exportación
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              className={`p-3 border rounded-lg text-center transition-colors ${
                format === 'excel' 
                  ? 'border-primary-500 bg-primary-50 text-primary-700' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setFormat('excel')}
            >
              <div className="text-sm font-medium">Excel/CSV</div>
              <div className="text-xs text-gray-500">Para análisis</div>
            </button>
            
            <button
              className={`p-3 border rounded-lg text-center transition-colors ${
                format === 'pdf' 
                  ? 'border-primary-500 bg-primary-50 text-primary-700' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setFormat('pdf')}
            >
              <div className="text-sm font-medium">PDF</div>
              <div className="text-xs text-gray-500">Para imprimir</div>
            </button>
            
            <button
              className={`p-3 border rounded-lg text-center transition-colors ${
                format === 'csv' 
                  ? 'border-primary-500 bg-primary-50 text-primary-700' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setFormat('csv')}
            >
              <div className="text-sm font-medium">CSV</div>
              <div className="text-xs text-gray-500">Datos puros</div>
            </button>
          </div>
        </div>
        
        {/* Nombre del archivo */}
        <Input
          label="Nombre del archivo"
          value={fileName}
          onChange={(e) => {}}
          placeholder="reporte"
          helperText="Se agregará automáticamente la extensión correspondiente"
        />
        
        {/* Botones de acción */}
        <div className="flex justify-end space-x-4 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generando...
              </>
            ) : (
              `Generar ${format.toUpperCase()}`
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// Hook para facilitar el uso del generador de reportes
export const useReportGenerator = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  
  const generateReport = (data: ReportData) => {
    setReportData(data)
    setIsOpen(true)
  }
  
  const closeGenerator = () => {
    setIsOpen(false)
    setReportData(null)
  }
  
  return {
    generateReport,
    ReportModal: () => (
      reportData ? (
        <ReportGenerator
          isOpen={isOpen}
          onClose={closeGenerator}
          reportData={reportData}
        />
      ) : null
    )
  }
}

// Tipos para exportar
export type { ReportData, ReportColumn, ReportSummary }