import React, { useMemo, useState } from 'react'

export default function Analytics() {
  const [reportFormat, setReportFormat] = useState('csv')

  // Mock data for charts
  const taskData = useMemo(() => [
    { month: 'Jan', completed: 45, pending: 12 },
    { month: 'Feb', completed: 52, pending: 15 },
    { month: 'Mar', completed: 48, pending: 18 },
    { month: 'Apr', completed: 61, pending: 10 },
    { month: 'May', completed: 75, pending: 8 },
    { month: 'Jun', completed: 89, pending: 5 },
  ], [])

  const staffData = useMemo(() => [
    { team: 'Sales', count: 234 },
    { team: 'IT', count: 222 },
  ], [])

  const taskStatusData = useMemo(() => [
    { status: 'Completed', value: 370 },
    { status: 'Pending', value: 68 },
    { status: 'Overdue', value: 12 },
  ], [])

  // Download report
  function handleDownloadReport() {
    let content = ''
    let filename = ''

    if (reportFormat === 'csv') {
      // CSV format
      content = 'Month,Completed Tasks,Pending Tasks\n'
      taskData.forEach((d) => {
        content += `${d.month},${d.completed},${d.pending}\n`
      })
      filename = 'analytics-report.csv'
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
    } else if (reportFormat === 'json') {
      // JSON format
      content = JSON.stringify(
        {
          report_date: new Date().toISOString(),
          task_metrics: taskData,
          staff_distribution: staffData,
          task_status: taskStatusData,
        },
        null,
        2
      )
      filename = 'analytics-report.json'
      const blob = new Blob([content], { type: 'application/json;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
    } else if (reportFormat === 'text') {
      // Plain text format
      content = `ANALYTICS REPORT\n${new Date().toLocaleDateString()}\n\n`
      content += 'TASK METRICS (Last 6 Months):\n'
      content += '------------------------------------\n'
      taskData.forEach((d) => {
        content += `${d.month}: ${d.completed} completed, ${d.pending} pending\n`
      })
      content += '\nSTAFF DISTRIBUTION:\n'
      content += '------------------------------------\n'
      staffData.forEach((d) => {
        content += `${d.team}: ${d.count} members\n`
      })
      content += '\nTASK STATUS SUMMARY:\n'
      content += '------------------------------------\n'
      taskStatusData.forEach((d) => {
        content += `${d.status}: ${d.value}\n`
      })
      filename = 'analytics-report.txt'
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
    }
  }

  return (
    <div className="space-y-6">
      {/* Export Report Section */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <h3 className="text-lg font-semibold mb-4">Export Report</h3>
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
          <div className="sm:w-64">
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Format</label>
            <select
              value={reportFormat}
              onChange={(e) => setReportFormat(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="text">Text</option>
            </select>
          </div>
          <button
            onClick={handleDownloadReport}
            className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Download Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border-l-4 border-green-600">
          <h4 className="text-gray-600 text-sm font-semibold mb-2">Total Completed</h4>
          <p className="text-3xl font-bold text-gray-900">370</p>
          <p className="text-xs text-green-600 mt-2">+15% from last month</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border-l-4 border-orange-600">
          <h4 className="text-gray-600 text-sm font-semibold mb-2">Pending Tasks</h4>
          <p className="text-3xl font-bold text-gray-900">68</p>
          <p className="text-xs text-orange-600 mt-2">-10% from last month</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border-l-4 border-red-600">
          <h4 className="text-gray-600 text-sm font-semibold mb-2">Overdue Tasks</h4>
          <p className="text-3xl font-bold text-gray-900">12</p>
          <p className="text-xs text-red-600 mt-2">Critical attention needed</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Task Metrics Chart */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Task Metrics (Last 6 Months)</h3>
          <div className="h-64 flex items-end justify-around gap-2 overflow-x-auto">
            {taskData.map((d) => (
              <div key={d.month} className="flex flex-col items-center gap-2 flex-shrink-0">
                <div className="flex gap-1">
                  <div
                    className="w-4 bg-green-600 rounded-t"
                    style={{ height: `${(d.completed / 100) * 150}px` }}
                    title={`Completed: ${d.completed}`}
                  />
                  <div
                    className="w-4 bg-orange-600 rounded-t"
                    style={{ height: `${(d.pending / 100) * 150}px` }}
                    title={`Pending: ${d.pending}`}
                  />
                </div>
                <p className="text-xs font-semibold text-gray-600">{d.month}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-6 justify-center text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-600 rounded-full" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-600 rounded-full" />
              <span>Pending</span>
            </div>
          </div>
        </div>

        {/* Staff Distribution Chart */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Staff Distribution</h3>
          <div className="space-y-4">
            {staffData.map((d) => (
              <div key={d.team}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{d.team}</span>
                  <span className="text-sm font-bold text-gray-900">{d.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className={`h-4 rounded-full ${d.team === 'Sales' ? 'bg-blue-600' : 'bg-purple-600'}`}
                    style={{ width: `${(d.count / 234) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Task Status Breakdown */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <h3 className="text-lg font-semibold mb-6 text-gray-900">Task Status Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {taskStatusData.map((d) => (
            <div key={d.status} className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke={
                      d.status === 'Completed'
                        ? '#16a34a'
                        : d.status === 'Pending'
                          ? '#f97316'
                          : '#dc2626'
                    }
                    strokeWidth="8"
                    strokeDasharray={`${(d.value / 450) * 251.2} 251.2`}
                    strokeLinecap="round"
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-2xl font-bold text-gray-900">{d.value}</p>
                  <p className="text-xs text-gray-500">tasks</p>
                </div>
              </div>
              <p className="font-semibold text-gray-900">{d.status}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-md p-4 sm:p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">Summary Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <p className="text-xs sm:text-sm opacity-90">Total Tasks</p>
            <p className="text-2xl sm:text-3xl font-bold">450</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm opacity-90">Completion Rate</p>
            <p className="text-2xl sm:text-3xl font-bold">82.2%</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm opacity-90">Team Members</p>
            <p className="text-2xl sm:text-3xl font-bold">456</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm opacity-90">Avg. Days</p>
            <p className="text-2xl sm:text-3xl font-bold">5.2</p>
          </div>
        </div>
      </div>
    </div>
  )
}
