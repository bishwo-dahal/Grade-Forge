import { useState } from 'react'
import './App.css'
import api from './api/axios'

function App() {
  const [testResult, setTestResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchTestRoute = async () => {
    setLoading(true)
    setTestResult(null)
    try {
      const response = await api.get('/test')
      setTestResult(response.data)
    } catch (error) {
      if (error instanceof Error) {
        setTestResult(`Error: ${error.message}`)
      } else {
        setTestResult('Error: Failed to fetch test route')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
    <h1>Grade Forge Application</h1>
      <button className="test-button" onClick={fetchTestRoute} disabled={loading}>
        {loading ? 'Loading...' : 'Test Route'}
      </button>
      {testResult && (
        <div className="test-result">
          <h3>Test Route Output:</h3>
          <p>{testResult}</p>
        </div>
      )}
    </>
  )
}

export default App
