import { useState, useRef } from 'react'

export const useInstanceManager = (apiUrl, apiKey, buildHeaders) => {
  const [availableInstances, setAvailableInstances] = useState([])
  const [selectedInstance, setSelectedInstance] = useState('')
  const [connectionState, setConnectionState] = useState('UNKNOWN')
  const [knownConnectedInstances, setKnownConnectedInstances] = useState(new Set())
  const [instanceName, setInstanceName] = useState('')
  const [showInstanceDropdown, setShowInstanceDropdown] = useState(false)

  // Helper function to set connection badge
  const setConnBadge = (state) => {
    setConnectionState(state)
    
    // Track connected instances to avoid losing state
    if (state === 'CONNECTED' && (selectedInstance || instanceName)) {
      setKnownConnectedInstances(prev => new Set([...prev, selectedInstance || instanceName]))
    } else if (state === 'DISCONNECTED' && (selectedInstance || instanceName)) {
      // Keep known connected instances even if temporarily disconnected
      // This helps with auto-reconnection logic
    }
  }

  // Fetch all instances
  const fetchInstances = async () => {
    const baseUrl = apiUrl.trim().replace(/\/+$/, "")
    if (!baseUrl) return

    try {
      const resp = await fetch(`${baseUrl}/instance/fetchInstances?t=${Date.now()}`, { 
        headers: { ...buildHeaders(), 'Cache-Control': 'no-cache' }
      })
      if (resp.ok) {
        const data = await resp.json().catch(() => [])
        const instances = Array.isArray(data) ? data : (data.instances || [])
        setAvailableInstances(instances)
        
        // If we have a current instance, make sure it's selected
        if (instanceName && instances.some(inst => (inst.name || inst.instance?.instanceName || inst.instanceName) === instanceName)) {
          setSelectedInstance(instanceName)
        } else if (instances.length > 0 && !selectedInstance) {
          // Auto-select the first instance if none is selected
          const firstInstance = instances[0]?.name || instances[0]?.instance?.instanceName || instances[0]?.instanceName
          if (firstInstance) {
            setSelectedInstance(firstInstance)
            setInstanceName(firstInstance)
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch instances:', error)
    }
  }

  // Check connection status for selected instance
  const checkInstanceConnection = async (instanceToCheck) => {
    const baseUrl = apiUrl.trim().replace(/\/+$/, "")
    if (!baseUrl || !instanceToCheck) return

    try {
      // First try the connection state endpoint with cache busting
      const r = await fetch(`${baseUrl}/instance/connectionState/${encodeURIComponent(instanceToCheck)}?t=${Date.now()}`, { 
        headers: { ...buildHeaders(), 'Cache-Control': 'no-cache' }
      })
      
      if (r.ok) {
        const d = await r.json().catch(() => ({}))
        
        // Try multiple possible response fields
        const rawState = d.state || d.connection || d.status || d.connectionState || ""
        const s = String(rawState).toUpperCase()
        
        // Map various connection states to our standard states
        if (['CONNECTED', 'OPEN', 'READY'].includes(s)) {
          setConnBadge('CONNECTED')
          return
        } else if (['CONNECTING', 'OPENING'].includes(s)) {
          setConnBadge('OPENING')
          return  
        } else if (['DISCONNECTED', 'CLOSED'].includes(s)) {
          setConnBadge('DISCONNECTED')
          return
        }
      }
      
      // If the above didn't give a clear result, try to fetch instance info
      const infoResponse = await fetch(`${baseUrl}/instance/fetchInstances?t=${Date.now()}`, { 
        headers: { ...buildHeaders(), 'Cache-Control': 'no-cache' }
      })
      
      if (infoResponse.ok) {
        const instances = await infoResponse.json().catch(() => [])
        const instanceData = (Array.isArray(instances) ? instances : (instances.instances || [])).find(inst => 
          (inst.name || inst.instance?.instanceName || inst.instanceName) === instanceToCheck
        )
        
        if (instanceData) {
          const status = instanceData.instance?.connectionStatus || 
                        instanceData.connectionStatus || 
                        instanceData.instance?.state ||
                        instanceData.state ||
                        'UNKNOWN'
          
          const normalizedStatus = String(status).toUpperCase()
          
          if (['CONNECTED', 'OPEN', 'READY'].includes(normalizedStatus)) {
            setConnBadge('CONNECTED')
          } else if (['CONNECTING', 'OPENING'].includes(normalizedStatus)) {
            setConnBadge('OPENING')  
          } else if (['DISCONNECTED', 'CLOSED'].includes(normalizedStatus)) {
            setConnBadge('DISCONNECTED')
          } else {
            setConnBadge('UNKNOWN')
          }
          return
        }
      }
      
      // If all else fails, set as unknown
      setConnBadge('UNKNOWN')
      
    } catch {
      setConnBadge('UNKNOWN')
    }
  }

  // Instance selection
  const selectInstance = (instanceToSelect, smartReconnect, setProgressLog, setProgressStats, setBulkProgress) => {
    setSelectedInstance(instanceToSelect)
    setInstanceName(instanceToSelect)
    setShowInstanceDropdown(false)
    
    // Find the instance data to get its current connection status
    const instanceData = availableInstances.find(inst => 
      (inst.name || inst.instance?.instanceName || inst.instanceName) === instanceToSelect
    )
    
    // Check if we know this instance was previously connected
    const wasKnownConnected = knownConnectedInstances.has(instanceToSelect)
    
    // Set connection state immediately if we have the data
    if (instanceData) {
      const connectionStatus = instanceData.instance?.connectionStatus || 
                              instanceData.connectionStatus || 
                              instanceData.instance?.state ||
                              instanceData.state ||
                              'UNKNOWN'
      
      // Normalize the status - handle both string and nested object cases  
      const normalizedStatus = String(connectionStatus).toUpperCase()
      
      // Map various "connected" states to CONNECTED
      if (['CONNECTED', 'OPEN', 'READY'].includes(normalizedStatus)) {
        setConnBadge('CONNECTED')
      } else if (['CONNECTING', 'OPENING'].includes(normalizedStatus)) {
        setConnBadge('OPENING')  
      } else if (['DISCONNECTED', 'CLOSED'].includes(normalizedStatus)) {
        setConnBadge('DISCONNECTED')
      } else if (wasKnownConnected) {
        // If we previously knew this instance was connected but cached data is unclear,
        // assume it's still connected until we verify otherwise
        setConnBadge('CONNECTED')
      } else {
        setConnBadge('UNKNOWN')
      }
    } else if (wasKnownConnected) {
      // No cached data but we know it was connected - assume still connected
      setConnBadge('CONNECTED')
    }
    
    // Always do a fresh check when switching instances to ensure accuracy
    // This prevents stale cached data from causing connection issues
    setTimeout(async () => {
      checkInstanceConnection(instanceToSelect)
      
      // If this was a previously connected instance but shows disconnected,
      // try smart reconnect automatically
      if (wasKnownConnected && smartReconnect) {
        setTimeout(async () => {
          // Check current status after the connection check
          if (connectionState === 'DISCONNECTED' || connectionState === 'UNKNOWN') {
            console.log(`Attempting smart reconnect for previously connected instance: ${instanceToSelect}`)
            const reconnected = await smartReconnect(instanceToSelect)
            if (reconnected) {
              console.log(`Successfully auto-reconnected ${instanceToSelect}`)
            }
          }
        }, 1000) // Wait for connection check to complete first
      }
    }, 100) // Small delay to let the UI update first
    
    // Clear any existing progress logs when switching instances
    if (setProgressLog) setProgressLog('')
    if (setProgressStats) setProgressStats('0/0')
    if (setBulkProgress) setBulkProgress(0)
  }

  return {
    // State
    availableInstances,
    selectedInstance,
    connectionState,
    knownConnectedInstances,
    instanceName,
    showInstanceDropdown,
    
    // State setters
    setAvailableInstances,
    setSelectedInstance,
    setConnectionState,
    setKnownConnectedInstances,
    setInstanceName,
    setShowInstanceDropdown,
    
    // Functions
    fetchInstances,
    checkInstanceConnection,
    selectInstance,
    setConnBadge
  }
}