import { useCallback } from 'react'

const ConnectionManager = ({
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
}) => {
  // Progress UI management
  const startProgressUI = useCallback(() => {
    setShowProgress(true)
    setProgressPercent(0)
    setProgressText('Waiting for scan...')
    // Soft ramp for perceived progress
    rampTimer.current = setInterval(() => {
      setProgressPercent(prev => Math.min(95, prev + 2))
    }, 800)
  }, [setShowProgress, setProgressPercent, setProgressText, rampTimer])

  const stopProgressUI = useCallback((done = false) => {
    clearInterval(rampTimer.current)
    if (done) {
      setProgressPercent(100)
      setProgressText('Linked!')
    }
  }, [rampTimer, setProgressPercent, setProgressText])

  // Connection polling
  const pollConnection = useCallback(async () => {
    clearInterval(pollTimer.current)
    const baseUrl = apiUrl.trim().replace(/\/+$/, "")
    const instance = instanceName.trim()
    if (!baseUrl || !instance) return

    pollTimer.current = setInterval(async () => {
      try {
        const r = await fetch(`${baseUrl}/instance/connectionState/${encodeURIComponent(instance)}`, { headers: buildHeaders() })
        const d = await r.json().catch(()=>({}))
        const s = (d.state || d.connection || "").toUpperCase()
        if (s === "CONNECTED") {
          setConnBadge("CONNECTED")
          stopProgressUI(true)
          // Auto-select the newly connected instance
          setSelectedInstance(instance)
          // Fetch instances to update the dropdown
          fetchInstances()
          // Close modal with a slight delay to show success state
          setTimeout(() => {
            closeModal()
          }, 1500)
          clearInterval(pollTimer.current)
        } else if (s) {
          setConnBadge(s)
          setProgressText(s === "OPENING" ? "Connecting..." : s)
        }
      } catch {}
    }, 2000)
  }, [apiUrl, instanceName, pollTimer, buildHeaders, setConnBadge, stopProgressUI, fetchInstances, closeModal, setProgressText])

  // Generate QR and create/connect instance
  const generateQr = useCallback(async () => {
    const baseUrl = apiUrl.trim().replace(/\/+$/, "")
    // Always use the instanceName from the modal input field when creating new instances
    const instance = instanceName.trim()
    console.log('Creating instance with name:', instance)
    console.log('Selected instance was:', selectedInstance)
    console.log('Instance name from modal:', instanceName)
    
    if (!baseUrl || !instance) { 
      alert("Enter API URL and Instance Name.")
      return
    }

    setQrImage('')
    setStatusMsg('Checking API connectivity...')

    try {
      // First, test if API is reachable - use exact same format that worked in PowerShell
      const testHeaders = {
        "apikey": apiKey.trim(),
        "Content-Type": "application/json"
      }
      
      const testResp = await fetch(`${baseUrl}/instance/fetchInstances`, { 
        method: 'GET',
        headers: testHeaders 
      })
      
      if (testResp.status === 403) {
        throw new Error("Invalid API key. Please check your API key and try again.")
      } else if (!testResp.ok) {
        throw new Error(`API server error: ${testResp.status}. Check if your API server is running.`)
      }
      
      setStatusMsg('Checking instance...')
      // First check if instance already exists
      let instanceExists = false
      try {
        const checkResp = await fetch(`${baseUrl}/instance/fetchInstances`, { headers: buildHeaders() })
        if (checkResp.ok) {
          const allInstances = await checkResp.json()
          console.log('Existing instances:', allInstances)
          instanceExists = allInstances.some(inst => 
            (inst.name || inst.instance?.instanceName || inst.instanceName) === instance
          )
          console.log(`Instance '${instance}' exists:`, instanceExists)
        }
      } catch (err) {
        console.log('Could not check existing instances:', err)
      }

      if (instanceExists) {
        setStatusMsg('Connecting to existing instance...')
        // Instance exists, just connect to it
        setConnBadge("OPENING")
        setSelectedInstance(instance)
        console.log(`Connecting to existing instance: ${instance}`)
      } else {
        setStatusMsg('Creating new instance...')
        console.log(`Creating new instance: ${instance}`)
        
        // Instance doesn't exist, create it
        const createPayload = { 
          instanceName: instance, 
          integration: "WHATSAPP-BAILEYS", 
          qrcode: true 
        }
        console.log('Create payload:', createPayload)
        
        const resp = await fetch(`${baseUrl}/instance/create`, {
          method: "POST",
          headers: buildHeaders(),
          body: JSON.stringify(createPayload)
        })
        
        console.log('Create response status:', resp.status)
        
        if (resp.status === 403) throw new Error("403 Forbidden – invalid API key.")
        
        const d = await resp.json().catch((err) => {
          console.error('Failed to parse create response JSON:', err)
          return {}
        })
        console.log('Create response data:', d)
        
        if (!resp.ok) {
          throw new Error(d.message || d.error || `Instance creation failed with status ${resp.status}`)
        }

        // Immediately switch dashboard on create and select this instance
        setConnBadge("OPENING")
        setSelectedInstance(instance)
        console.log(`Instance '${instance}' created successfully`)
        
        // Refresh instances list
        fetchInstances()
      }

      setStatusMsg('Fetching QR code...')
      console.log(`Attempting to connect to instance: ${instance}`)
      
      // Wait a bit longer for instance to be ready
      await new Promise(r=>setTimeout(r, 2000))

      const connectUrl = `${baseUrl}/instance/connect/${encodeURIComponent(instance)}`
      console.log('Connect URL:', connectUrl)
      
      const r2 = await fetch(connectUrl, { headers: buildHeaders() })
      console.log('Connect response status:', r2.status)
      
      if (!r2.ok) {
        const errorText = await r2.text().catch(() => '')
        console.error('Connect failed:', r2.status, errorText)
        throw new Error(`Failed to connect instance: ${r2.status} - ${errorText || 'Unknown error'}`)
      }
      
      const q = await r2.json().catch((err) => {
        console.error('Failed to parse connect response JSON:', err)
        return {}
      })
      console.log('Connect response data:', q)
      
      // Try multiple possible QR code locations in response
      let qrBase64 = null
      
      // Check various possible QR code fields based on actual API response format
      if (q.base64) {
        // Direct response format from /instance/connect endpoint  
        qrBase64 = q.base64
        console.log('Found QR in base64 (connect endpoint format)')
      } else if (q.qrcode?.base64) {
        // Creation response format from /instance/create endpoint
        qrBase64 = q.qrcode.base64
        console.log('Found QR in qrcode.base64 (create endpoint format)')
      } else if (q.data?.qr) {
        qrBase64 = q.data.qr.startsWith('data:') ? q.data.qr : `data:image/png;base64,${q.data.qr}`
        console.log('Found QR in data.qr')
      } else if (q.qr) {
        qrBase64 = q.qr.startsWith('data:') ? q.qr : `data:image/png;base64,${q.qr}`
        console.log('Found QR in qr')
      } else if (q.code) {
        qrBase64 = q.code.startsWith('data:') ? q.code : `data:image/png;base64,${q.code}`
        console.log('Found QR in code')
      }
      
      if (qrBase64 && qrBase64.length > 50) {
        // Ensure data URI format for image display
        const qrImageSrc = qrBase64.startsWith('data:') ? qrBase64 : `data:image/png;base64,${qrBase64}`
        console.log('QR code found and set, length:', qrBase64.length)
        setQrImage(qrImageSrc)
        setStatusMsg('✅ Scan the QR with WhatsApp Web.')
      } else if (q.pairingCode) {
        console.log('Pairing code found:', q.pairingCode)
        setStatusMsg(`📱 Pairing code: ${q.pairingCode}`)
      } else {
        console.error('No QR or pairing code found in response:', q)
        throw new Error(`No QR code available. Response: ${JSON.stringify(q, null, 2)}`)
      }

      // Show and start progress while polling connection
      startProgressUI()
      pollConnection()
    } catch (err) {
      console.error('generateQr error:', err)
      setStatusMsg(`❌ ${err.message}`)
    }
  }, [apiUrl, apiKey, instanceName, selectedInstance, setQrImage, setStatusMsg, buildHeaders, setConnBadge, setSelectedInstance, fetchInstances, startProgressUI, pollConnection])

  // Smart reconnect - tries session restoration first, QR scan as fallback
  const reconnectToInstance = useCallback(async (reconnectInstance) => {
    const baseUrl = apiUrl.trim().replace(/\/+$/, "")
    const instance = reconnectInstance.trim()
    if (!baseUrl || !instance) { 
      alert("API URL or Instance Name missing.")
      return
    }

    setQrImage('')
    setStatusMsg('Attempting automatic reconnection...')

    try {
      // Immediately switch to this instance
      setConnBadge("OPENING")
      setSelectedInstance(instance)

      // Step 1: Try to restart/restore existing session without QR
      setStatusMsg('🔄 Trying to restore existing session...')
      
      try {
        // Try restart endpoint first (common in WhatsApp APIs)
        const restartResp = await fetch(`${baseUrl}/instance/restart/${encodeURIComponent(instance)}`, { 
          method: "POST",
          headers: buildHeaders() 
        })
        
        if (restartResp.ok) {
          setStatusMsg('✅ Session restored! Checking connection...')
          
          // Wait a moment for restart to complete
          await new Promise(r=>setTimeout(r, 2000))
          
          // Check if connection is now active
          const connCheck = await fetch(`${baseUrl}/instance/connectionState/${encodeURIComponent(instance)}`, { 
            headers: buildHeaders() 
          })
          
          if (connCheck.ok) {
            const state = await connCheck.json().catch(() => ({}))
            const status = String(state.state || state.status || '').toUpperCase()
            
            if (['CONNECTED', 'OPEN', 'READY'].includes(status)) {
              setStatusMsg('✅ Reconnected successfully using existing session!')
              setConnBadge('CONNECTED')
              setKnownConnectedInstances(prev => new Set([...prev, instance]))
              
              // Auto-close modal after success
              setTimeout(() => {
                closeReconnectModal()
              }, 2000)
              return
            }
          }
        }
      } catch (restartErr) {
        console.log('Session restart failed, will try QR method:', restartErr)
      }

      // Step 2: Session restoration failed, fall back to QR scanning
      setStatusMsg('⚠️ Session expired. Generating new QR code...')
      await new Promise(r=>setTimeout(r, 1000))

      const r2 = await fetch(`${baseUrl}/instance/connect/${encodeURIComponent(instance)}`, { headers: buildHeaders() })
      const q = await r2.json().catch(()=>({}))
      const qrBase64 = q.base64 || q.data?.qr || q.qr ||
                       (q.code && q.code.startsWith("data:image") ? q.code : (q.code ? `data:image/png;base64,${q.code}` : ""))
      if (qrBase64 && qrBase64.startsWith("data:image")) {
        setQrImage(qrBase64)
        setStatusMsg('📱 Session expired. Please scan the QR with WhatsApp to reconnect.')
      } else if (q.pairingCode) {
        setStatusMsg(`📱 Session expired. Pairing code: ${q.pairingCode}`)
      } else {
        throw new Error("Could not restore session or generate QR code.")
      }

      // Show and start progress while polling connection
      startProgressUI()
      pollConnection()
    } catch (err) {
      setStatusMsg(`❌ ${err.message}`)
    }
  }, [apiUrl, buildHeaders, setQrImage, setStatusMsg, setConnBadge, setSelectedInstance, setKnownConnectedInstances, closeReconnectModal, startProgressUI, pollConnection])

  // Generic smart reconnect that can be called anywhere
  const smartReconnect = useCallback(async (instanceToReconnect) => {
    const baseUrl = apiUrl.trim().replace(/\/+$/, "")
    if (!baseUrl || !instanceToReconnect) return false

    try {
      // Try session restoration first
      const restartResp = await fetch(`${baseUrl}/instance/restart/${encodeURIComponent(instanceToReconnect)}`, { 
        method: "POST",
        headers: buildHeaders() 
      })
      
      if (restartResp.ok) {
        // Wait for restart to complete
        await new Promise(r=>setTimeout(r, 2000))
        
        // Check connection status
        const connCheck = await fetch(`${baseUrl}/instance/connectionState/${encodeURIComponent(instanceToReconnect)}`, { 
          headers: buildHeaders() 
        })
        
        if (connCheck.ok) {
          const state = await connCheck.json().catch(() => ({}))
          const status = String(state.state || state.status || '').toUpperCase()
          
          if (['CONNECTED', 'OPEN', 'READY'].includes(status)) {
            setConnBadge('CONNECTED')
            setKnownConnectedInstances(prev => new Set([...prev, instanceToReconnect]))
            return true // Successfully reconnected
          }
        }
      }
    } catch (err) {
      console.log('Smart reconnect failed:', err)
    }
    
    return false // Could not auto-reconnect
  }, [apiUrl, buildHeaders, setConnBadge, setKnownConnectedInstances])

  return {
    generateQr,
    reconnectToInstance,
    smartReconnect,
    startProgressUI,
    stopProgressUI,
    pollConnection
  }
}

export default ConnectionManager