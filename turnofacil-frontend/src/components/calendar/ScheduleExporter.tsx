/**
 * Componente de Exportación de Horarios
 * Permite exportar horarios a diferentes formatos y imprimir
 */

'use client'

import React, { useCallback, useState } from 'react'
import { Button } from '@/components/ui'

interface ScheduleExporterProps {
  data: {
    title: string
    employees: Array<{
      id: string
      name: string
      position?: string
    }>
    shifts: Array<{
      id: string
      employeeId: string
      employeeName: string
      date: string
      shiftCode: 'M' | 'T' | 'N' | 'D' | 'L' | 'V' | 'X'
      startTime?: string
      endTime?: string
    }>
    weekDates: Date[]
    statistics?: {
      totalShifts: number
      employeesWithShifts: number
      coverage: number
    }
  }
  className?: string
  compactMode?: boolean
}

type ExportFormat = 'csv' | 'excel' | 'pdf' | 'print'

interface ExportOption {
  format: ExportFormat
  label: string
  icon: string
  description: string
  action: () => void
}

/**
 * Convierte datos a formato CSV
 */
function generateCsvData(data: ScheduleExporterProps['data']): string {
  const headers = ['Empleado', 'Cargo', ...data.weekDates.map(d => 
    d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' })
  )]
  
  const rows = data.employees.map(emp => {
    const row = [emp.name, emp.position || '']
    data.weekDates.forEach(date => {
      const dateStr = date.toISOString().split('T')[0]
      const shift = data.shifts.find(s => 
        s.employeeId === emp.id && s.date === dateStr
      )
      row.push(shift?.shiftCode || 'D')
    })
    return row
  })
  
  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
}

/**
 * Genera contenido HTML para impresión
 */
function generatePrintHtml(data: ScheduleExporterProps['data']): string {
  const dayHeaders = data.weekDates.map(d => 
    d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' })
  ).join('</th><th>')
  
  const employeeRows = data.employees.map(emp => {
    const cells = data.weekDates.map(date => {
      const dateStr = date.toISOString().split('T')[0]
      const shift = data.shifts.find(s => 
        s.employeeId === emp.id && s.date === dateStr
      )
      const shiftCode = shift?.shiftCode || 'D'
      const bgColor = shiftCode === 'D' ? 'background-color: #fed7aa;' : ''
      return `<td style="text-align: center; padding: 8px; border: 1px solid #ccc; font-weight: bold; ${bgColor}">${shiftCode}</td>`
    }).join('')
    
    return `
      <tr>
        <td style="padding: 8px; border: 1px solid #ccc; font-weight: bold;">${emp.name}</td>
        <td style="padding: 8px; border: 1px solid #ccc; font-size: 12px; color: #666;">${emp.position || ''}</td>
        ${cells}
      </tr>
    `
  }).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${data.title}</title>
      <style>
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
        body { 
          font-family: Arial, sans-serif; 
          margin: 20px;
          font-size: 14px;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
        }
        .title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .subtitle {
          color: #666;
          font-size: 12px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th {
          background-color: #f5f5f5;
          padding: 10px 8px;
          border: 1px solid #ccc;
          font-weight: bold;
          text-align: center;
        }
        .legend {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-top: 15px;
          font-size: 12px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .legend-box {
          width: 20px;
          height: 20px;
          border: 1px solid #ccc;
          text-align: center;
          font-weight: bold;
          line-height: 18px;
        }
        .stats {
          margin-top: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">${data.title}</div>
        <div class="subtitle">Generado el ${new Date().toLocaleDateString('es-CO')}</div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>EMPLEADO</th>
            <th>CARGO</th>
            <th>${dayHeaders}</th>
          </tr>
        </thead>
        <tbody>
          ${employeeRows}
        </tbody>
      </table>
      
      <div class="legend">
        <div class="legend-item">
          <div class="legend-box" style="background-color: white;">M</div>
          <span>Mañana (6-14h)</span>
        </div>
        <div class="legend-item">
          <div class="legend-box" style="background-color: white;">T</div>
          <span>Tarde (14-22h)</span>
        </div>
        <div class="legend-item">
          <div class="legend-box" style="background-color: #f3f4f6;">N</div>
          <span>Noche (22-6h)</span>
        </div>
        <div class="legend-item">
          <div class="legend-box" style="background-color: #fed7aa;">D</div>
          <span>Descanso</span>
        </div>
        <div class="legend-item">
          <div class="legend-box" style="background-color: #dcfce7;">V</div>
          <span>Vacaciones</span>
        </div>
        <div class="legend-item">
          <div class="legend-box" style="background-color: #e5e7eb;">L</div>
          <span>Licencia</span>
        </div>
      </div>
      
      ${data.statistics ? `
        <div class="stats">
          Total turnos: ${data.statistics.totalShifts} | 
          Empleados activos: ${data.statistics.employeesWithShifts} | 
          Cobertura: ${data.statistics.coverage.toFixed(1)}%
        </div>
      ` : ''}
    </body>
    </html>
  `
}

export function ScheduleExporter({ data, className = '', compactMode = false }: ScheduleExporterProps) {
  const [isExporting, setIsExporting] = useState(false)

  // Función para descargar CSV
  const exportToCsv = useCallback(() => {
    try {
      const csvContent = generateCsvData(data)
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `horario-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(link.href)
    } catch (error) {
      console.error('Error exporting to CSV:', error)
    }
  }, [data])

  // Función para imprimir
  const printSchedule = useCallback(() => {
    try {
      const printHtml = generatePrintHtml(data)
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(printHtml)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 250)
      }
    } catch (error) {
      console.error('Error printing schedule:', error)
    }
  }, [data])

  // Función para exportar a Excel (simulada - requeriría una librería como xlsx)
  const exportToExcel = useCallback(async () => {
    setIsExporting(true)
    try {
      // Por ahora, usamos CSV como fallback
      exportToCsv()
      // TODO: Implementar exportación real a Excel usando xlsx o similar
    } catch (error) {
      console.error('Error exporting to Excel:', error)
    } finally {
      setIsExporting(false)
    }
  }, [exportToCsv])

  // Función para exportar a PDF (simulada - requeriría una librería como jsPDF)
  const exportToPdf = useCallback(async () => {
    setIsExporting(true)
    try {
      // Por ahora, abrimos la vista de impresión
      printSchedule()
      // TODO: Implementar exportación real a PDF usando jsPDF o similar
    } catch (error) {
      console.error('Error exporting to PDF:', error)
    } finally {
      setIsExporting(false)
    }
  }, [printSchedule])

  const exportOptions: ExportOption[] = [
    {
      format: 'print',
      label: 'Imprimir',
      icon: '🖨️',
      description: 'Imprimir horario directamente',
      action: printSchedule
    },
    {
      format: 'csv',
      label: 'CSV',
      icon: '📊',
      description: 'Exportar a archivo CSV',
      action: exportToCsv
    },
    {
      format: 'excel',
      label: 'Excel',
      icon: '📈',
      description: 'Exportar a Excel',
      action: exportToExcel
    },
    {
      format: 'pdf',
      label: 'PDF',
      icon: '📄',
      description: 'Exportar a PDF',
      action: exportToPdf
    }
  ]

  if (compactMode) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Button
          size="sm"
          variant="secondary"
          onClick={printSchedule}
          disabled={isExporting}
          className="hover:bg-blue-100"
        >
          🖨️
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={exportToCsv}
          disabled={isExporting}
          className="hover:bg-green-100"
        >
          📊
        </Button>
      </div>
    )
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-sm font-medium text-gray-700 mr-2">
        Exportar:
      </span>
      
      {exportOptions.map((option) => (
        <Button
          key={option.format}
          size="sm"
          variant="secondary"
          onClick={option.action}
          disabled={isExporting}
          className="hover:bg-gray-100 transition-colors flex items-center gap-2"
          title={option.description}
        >
          <span>{option.icon}</span>
          <span className="text-xs">{option.label}</span>
        </Button>
      ))}
      
      {isExporting && (
        <div className="flex items-center gap-2 text-sm text-gray-600 ml-2">
          <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          <span>Exportando...</span>
        </div>
      )}
    </div>
  )
}

/**
 * Hook para manejo de exportación
 */
export function useScheduleExport() {
  const [isExporting, setIsExporting] = useState(false)
  
  const exportData = useCallback(async (
    format: ExportFormat, 
    data: ScheduleExporterProps['data']
  ): Promise<void> => {
    setIsExporting(true)
    try {
      switch (format) {
        case 'csv': {
          const csvContent = generateCsvData(data)
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
          const link = document.createElement('a')
          link.href = URL.createObjectURL(blob)
          link.download = `horario-${new Date().toISOString().split('T')[0]}.csv`
          link.click()
          URL.revokeObjectURL(link.href)
          break
        }
        case 'print': {
          const printHtml = generatePrintHtml(data)
          const printWindow = window.open('', '_blank')
          if (printWindow) {
            printWindow.document.write(printHtml)
            printWindow.document.close()
            printWindow.focus()
            setTimeout(() => {
              printWindow.print()
              printWindow.close()
            }, 250)
          }
          break
        }
        default:
          console.warn(`Export format "${format}" not implemented yet`)
      }
    } catch (error) {
      console.error(`Error exporting to ${format}:`, error)
      throw error
    } finally {
      setIsExporting(false)
    }
  }, [])
  
  return {
    exportData,
    isExporting
  }
}

export default ScheduleExporter