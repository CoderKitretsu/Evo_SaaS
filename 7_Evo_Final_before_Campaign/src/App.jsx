import { useState, useEffect, useRef } from 'react'
import './App.css'
import { useInstanceManager } from './hooks/useInstanceManager'
import ApiConfiguration from './components/elements/ApiConfiguration'
import CreateInstanceModal from './components/elements/CreateInstanceModal'
import SmartReconnectModal from './components/elements/SmartReconnectModal'
import Header from './components/elements/Header'
import EmptyState from './components/elements/EmptyState'
// Pages
import MessagingHub from './pages/MessagingHub'
import ModalManager from './components/features/ModalManager'
import ConnectionManager from './components/features/ConnectionManager'

function App() {
  // State management
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isReconnectModalOpen, setIsReconnectModalOpen] = useState(false)
  const [apiUrl, setApiUrl] = useState(localStorage.getItem('apiUrl') || 'http://localhost:8080')
  const [apiKey, setApiKey] = useState(localStorage.getItem('apiKey') || '')
  const [showApiConfig, setShowApiConfig] = useState(false)
  const [apiConfigured, setApiConfigured] = useState(false)
  const [qrImage, setQrImage] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const [reconnectInstance, setReconnectInstance] = useState('')
  const [showProgress, setShowProgress] = useState(false)
  const [progressPercent, setProgressPercent] = useState(0)
  const [progressText, setProgressText] = useState('Waiting for scan...')
  const [progressLog, setProgressLog] = useState('')
  const [alertMessage, setAlertMessage] = useState(null)

  // Refs for timers
  const pollTimer = useRef(null)
  const rampTimer = useRef(null)

  // Utility functions
  const qs = (id) => document.getElementById(id)

  const buildHeaders = () => {
    const key = apiKey.trim()
    // Use the exact same headers that worked in PowerShell test
    const h = { 
      "Content-Type": "application/json",
      "apikey": key
    }
    return h
  }

  // Use instance manager hook
  const {
    availableInstances,
    selectedInstance,
    connectionState,
    knownConnectedInstances,
    instanceName,
    showInstanceDropdown,
    setAvailableInstances,
    setSelectedInstance,
    setConnectionState,
    setKnownConnectedInstances,
    setInstanceName,
    setShowInstanceDropdown,
    fetchInstances,
    checkInstanceConnection,
    selectInstance: selectInstanceFromHook,
    setConnBadge
  } = useInstanceManager(apiUrl, apiKey, buildHeaders)

  // Clear alert after delay
  const showAlert = (type, message) => {
    setAlertMessage({ type, message })
    setTimeout(() => setAlertMessage(null), 5000)
  }

  // Save and test API configuration
  const saveApiConfiguration = async () => {
    const trimmedUrl = apiUrl.trim().replace(/\/+$/, "")
    const trimmedKey = apiKey.trim()
    
    if (!trimmedUrl || !trimmedKey) {
      showAlert('error', 'Please provide both API URL and API Key')
      return false
    }
    
    try {
      // Test connection
      const resp = await fetch(`${trimmedUrl}/instance/fetchInstances?t=${Date.now()}`, { 
        headers: { 
          "Content-Type": "application/json",
          "apikey": trimmedKey
        }
      })
      
      if (resp.ok) {
        // Save to localStorage
        localStorage.setItem('apiUrl', trimmedUrl)
        localStorage.setItem('apiKey', trimmedKey)
        
        setApiConfigured(true)
        setShowApiConfig(false)
        showAlert('success', 'API configuration saved successfully!')
        
        // Auto-fetch instances
        fetchInstances()
        return true
      } else {
        showAlert('error', `API test failed: ${resp.status} ${resp.statusText}`)
        return false
      }
    } catch (error) {
      showAlert('error', `Connection failed: ${error.message}`)
      return false
    }
  }

  // Wrapper function for selectInstance to maintain compatibility
  const selectInstance = (instanceToSelect) => {
    selectInstanceFromHook(instanceToSelect, null, setProgressLog, () => {}, () => {})
  }

  // Modal Manager Component
  const {
    openModal,
    closeModal,
    openReconnectModal,
    closeReconnectModal
  } = ModalManager({
    isModalOpen,
    setIsModalOpen,
    isReconnectModalOpen,
    setIsReconnectModalOpen,
    selectedInstance,
    instanceName,
    setInstanceName,
    showProgress,
    setShowProgress,
    qrImage,
    setQrImage,
    statusMsg,
    setStatusMsg,
    reconnectInstance,
    setReconnectInstance,
    pollTimer,
    rampTimer
  })



  // Connection Manager Component
  const {
    generateQr,
    reconnectToInstance,
    smartReconnect: smartReconnectFromManager,
    startProgressUI,
    stopProgressUI,
    pollConnection
  } = ConnectionManager({
    apiUrl,
    apiKey,
    instanceName,
    selectedInstance,
    setQrImage,
    setStatusMsg,
    setConnBadge,
    setSelectedInstance,
    setKnownConnectedInstances,
    pollTimer,
    rampTimer,
    setProgressPercent,
    setProgressText,
    setShowProgress,
    fetchInstances,
    closeModal,
    closeReconnectModal,
    buildHeaders
  })




  // Save API credentials to localStorage when they change
  useEffect(() => {
    localStorage.setItem('apiUrl', apiUrl)
  }, [apiUrl])

  useEffect(() => {
    localStorage.setItem('apiKey', apiKey)
  }, [apiKey])

  // Fetch instances when API credentials change
  useEffect(() => {
    if (apiUrl && apiKey) {
      fetchInstances()
    }
  }, [apiUrl, apiKey])

  // Periodic connection status check for selected instance
  useEffect(() => {
    if (!selectedInstance || !apiUrl || !apiKey) return

    const checkInterval = setInterval(() => {
      checkInstanceConnection(selectedInstance)
    }, 10000) // Check every 10 seconds

    // Initial check
    checkInstanceConnection(selectedInstance)

    return () => clearInterval(checkInterval)
  }, [selectedInstance, apiUrl, apiKey])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showInstanceDropdown && !event.target.closest('.relative')) {
        setShowInstanceDropdown(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showInstanceDropdown])

  // Check API configuration on mount
  useEffect(() => {
    const checkApiConfiguration = async () => {
      const storedUrl = localStorage.getItem('apiUrl')
      const storedKey = localStorage.getItem('apiKey')
      
      if (!storedUrl || !storedKey) {
        setShowApiConfig(true)
        setApiConfigured(false)
        return
      }
      
      // Test API connection
      try {
        const resp = await fetch(`${storedUrl.replace(/\/+$/, "")}/instance/fetchInstances?t=${Date.now()}`, { 
          headers: { 
            "Content-Type": "application/json",
            "apikey": storedKey.trim()
          }
        })
        
        if (resp.ok) {
          setApiConfigured(true)
          setShowApiConfig(false)
          // Auto-fetch instances since API is working
          fetchInstances()
        } else {
          setShowApiConfig(true)
          setApiConfigured(false)
        }
      } catch (error) {
        setShowApiConfig(true)
        setApiConfigured(false)
      }
    }
    
    checkApiConfiguration()
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(pollTimer.current)
      clearInterval(rampTimer.current)
    }
  }, [])

  // Connection badge helper
  const getConnectionBadge = () => {
    const map = {
      CONNECTED: ["bg-green-100 text-green-800", "Connected"],
      OPENING: ["bg-yellow-100 text-yellow-800", "Opening"],
      DISCONNECTED: ["bg-red-100 text-red-800", "Disconnected"],
      UNKNOWN: ["bg-gray-200 text-gray-700", "Unknown"]
    }
    const [cls, label] = map[connectionState] || map.UNKNOWN
    return { cls, label }
  }

  const badgeInfo = getConnectionBadge()
  const isConnected = connectionState === 'CONNECTED'
  const hasSelectedInstance = selectedInstance && availableInstances.length > 0



  // Handle clear config for development
  const handleClearConfig = () => {
    localStorage.removeItem('apiUrl')
    localStorage.removeItem('apiKey')
    setApiConfigured(false)
    setShowApiConfig(true)
    showAlert('info', 'Configuration cleared for testing')
  }

  // Show API configuration screen if not configured
  if (showApiConfig || !apiConfigured) {
    return (
      <ApiConfiguration
        apiUrl={apiUrl}
        setApiUrl={setApiUrl}
        apiKey={apiKey}
        setApiKey={setApiKey}
        onSave={saveApiConfiguration}
        onClearConfig={process.env.NODE_ENV === 'development' ? handleClearConfig : null}
      />
    )
  }

  return (
    <>
      {/* Alert Component */}
      {alertMessage && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transform transition-all duration-300 ${
          alertMessage.type === 'success' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 
          alertMessage.type === 'error' ? 'bg-red-100 text-red-700 border border-red-200' :
          'bg-blue-100 text-blue-700 border border-blue-200'
        }`}>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              {alertMessage.type === 'success' ? (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              ) : alertMessage.type === 'error' ? (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L10 10.414l2.707-2.707a1 1 0 111.414 1.414L11.414 12l2.707 2.707a1 1 0 01-1.414 1.414L10 13.414l-2.707 2.707a1 1 0 01-1.414-1.414L8.586 12 5.879 9.293a1 1 0 011.414-1.414L10 10.586l2.707-2.707z" clipRule="evenodd"/>
              ) : (
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              )}
            </svg>
            <span className="font-medium">{alertMessage.message}</span>
            <button 
              onClick={() => setAlertMessage(null)}
              className="ml-2 text-current opacity-70 hover:opacity-100"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Professional Header */}
      <Header
        connectionState={connectionState}
        badgeInfo={badgeInfo}
        onOpenApiConfig={() => setShowApiConfig(true)}
        availableInstances={availableInstances}
        selectedInstance={selectedInstance}
        showInstanceDropdown={showInstanceDropdown}
        setShowInstanceDropdown={setShowInstanceDropdown}
        onSelectInstance={selectInstance}
        onRefreshInstances={fetchInstances}
        onOpenModal={openModal}
      />

      {/* Empty State Component */}
      {!hasSelectedInstance && (
        <EmptyState onCreateInstance={openModal} />
      )}

      {/* MessagingHub Page */}
      {hasSelectedInstance && (
        <MessagingHub
          selectedInstance={selectedInstance}
          instanceName={instanceName}
          connectionState={connectionState}
          progressLog={progressLog}
          setProgressLog={setProgressLog}
          openReconnectModal={openReconnectModal}
          checkInstanceConnection={checkInstanceConnection}
          apiUrl={apiUrl}
          apiKey={apiKey}
          buildHeaders={buildHeaders}
        />
      )}

      {/* Create Instance Modal */}
      <CreateInstanceModal
        isOpen={isModalOpen}
        onClose={closeModal}
        apiUrl={apiUrl}
        setApiUrl={setApiUrl}
        apiKey={apiKey}
        setApiKey={setApiKey}
        instanceName={instanceName}
        setInstanceName={setInstanceName}
        onGenerate={generateQr}
        qrImage={qrImage}
        statusMsg={statusMsg}
        showProgress={showProgress}
        progressPercent={progressPercent}
        progressText={progressText}
        onFetchInstances={fetchInstances}
      />

      {/* Smart Reconnect Modal */}
      <SmartReconnectModal
        isOpen={isReconnectModalOpen}
        onClose={closeReconnectModal}
        reconnectInstance={reconnectInstance}
        onReconnect={() => reconnectToInstance(reconnectInstance)}
        qrImage={qrImage}
        statusMsg={statusMsg}
        showProgress={showProgress}
        progressPercent={progressPercent}
        progressText={progressText}
      />
    </>
  )
}

export default App
