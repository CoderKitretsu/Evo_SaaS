import React from 'react'

const ConnectionTester = ({
  selectedInstance,
  instanceName,
  apiUrl,
  apiKey,
  buildHeaders,
  setProgressLog,
  onCheckInstanceConnection
}) => {
  const testConnection = async (testInstance) => {
    if (!testInstance || !apiUrl || !apiKey) return
    
    setProgressLog('🧪 Testing connection...')
    try {
      const baseUrl = apiUrl.trim().replace(/\/+$/, "")
      const resp = await fetch(`${baseUrl}/instance/connectionState/${testInstance}?t=${Date.now()}`, {
        method: 'GET',
        headers: buildHeaders()
      })
      
      if (resp.ok) {
        const data = await resp.json()
        setProgressLog(prev => prev + `<br>✅ Connection test successful!<br>State: ${data.state || 'Unknown'}`)
        
        // Update connection state based on test result
        if (data.state && onCheckInstanceConnection) {
          onCheckInstanceConnection(testInstance)
        }
      } else {
        const errorText = await resp.text()
        setProgressLog(prev => prev + `<br>❌ Connection test failed: ${resp.status} ${resp.statusText}<br>Error: ${errorText}`)
      }
    } catch (error) {
      setProgressLog(prev => prev + `<br>❌ Connection test error: ${error.message}`)
    }
  }

  const handleTestConnection = () => {
    const testInstance = selectedInstance || instanceName
    testConnection(testInstance)
  }

  return (
    <button 
      onClick={handleTestConnection}
      className="text-xs text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200"
      title="Test connection to the selected instance"
    >
      🧪 Test Connection
    </button>
  )
}

export default ConnectionTester