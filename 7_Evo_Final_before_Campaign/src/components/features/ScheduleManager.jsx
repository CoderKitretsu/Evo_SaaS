import { useRef, useEffect } from 'react'

const ScheduleManager = ({
  // States
  scheduledMessages,
  setScheduledMessages,
  userTimezone,
  scheduleTimer,
  
  // Form states
  setBulkMessage,
  setScheduleMode,
  setScheduledDate,
  setScheduledTime,
  setFileData,
  setLastProcessedFile,
  setDetectedColumns,
  setSelectedColumn,
  setAlertMessage,
  setProgressLog,
  
  // API
  apiUrl,
  apiKey,
  buildHeaders
}) => {
  // Message Scheduling Functions
  const generateScheduleId = () => Date.now() + Math.random().toString(36).substr(2, 9)

  const formatScheduleDateTime = (date, time) => {
    if (!date || !time) return null
    const dateTime = new Date(`${date}T${time}`)
    return dateTime.toLocaleString('en-US', { 
      timeZone: userTimezone,
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }

  const validateScheduleDateTime = (date, time) => {
    if (!date || !time) return { valid: false, error: 'Date and time are required' }
    
    const scheduleDateTime = new Date(`${date}T${time}`)
    const now = new Date()
    
    if (scheduleDateTime <= now) {
      return { valid: false, error: 'Schedule time must be in the future' }
    }
    
    return { valid: true }
  }

  const addScheduledMessage = (messageData) => {
    const scheduleId = generateScheduleId()
    const scheduledMessage = {
      id: scheduleId,
      ...messageData,
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    
    setScheduledMessages(prev => [...prev, scheduledMessage])
    
    // Store in localStorage for persistence
    const stored = JSON.parse(localStorage.getItem('scheduledMessages') || '[]')
    stored.push(scheduledMessage)
    localStorage.setItem('scheduledMessages', JSON.stringify(stored))
    
    return scheduleId
  }

  const cancelScheduledMessage = (scheduleId) => {
    setScheduledMessages(prev => prev.filter(msg => msg.id !== scheduleId))
    
    // Update localStorage
    const stored = JSON.parse(localStorage.getItem('scheduledMessages') || '[]')
    const filtered = stored.filter(msg => msg.id !== scheduleId)
    localStorage.setItem('scheduledMessages', JSON.stringify(filtered))
  }

  // Re-edit scheduled message
  const reEditScheduledMessage = (scheduledMsg) => {
    console.log('Re-editing scheduled message:', scheduledMsg)
    
    // First cancel the existing message
    cancelScheduledMessage(scheduledMsg.id)
    
    // Pre-fill the form with existing data
    setBulkMessage(scheduledMsg.message)
    setScheduleMode('scheduled')
    
    // Format the datetime for input fields using the correct field name
    const scheduledDateTime = new Date(scheduledMsg.scheduleDateTime)
    const localDateTime = new Date(scheduledDateTime.getTime() - scheduledDateTime.getTimezoneOffset() * 60000)
    
    setScheduledDate(localDateTime.toISOString().split('T')[0])
    setScheduledTime(localDateTime.toTimeString().slice(0, 5))
    
    // Pre-fill file data if exists - reload the contacts
    if (scheduledMsg.contacts && scheduledMsg.contacts.length > 0) {
      console.log('Setting up fileData with contacts:', scheduledMsg.contacts.length)
      
      // Create a mock file data structure
      const mockFileData = scheduledMsg.contacts.map((contact, index) => ({
        'Phone': contact,
        'Name': `Contact ${index + 1}` // Default name if not available
      }))
      
      console.log('Created mockFileData:', mockFileData.slice(0, 2)) // Log first 2 entries
      
      setFileData(mockFileData)
      setLastProcessedFile({name: `Re-editing: ${scheduledMsg.contacts.length} contacts loaded`})
      
      // Auto-detect columns
      if (mockFileData.length > 0) {
        const columns = Object.keys(mockFileData[0])
        setDetectedColumns(columns)
        setSelectedColumn(columns.find(col => col.toLowerCase().includes('phone')) || columns[0])
        console.log('Set columns:', columns, 'Selected:', columns.find(col => col.toLowerCase().includes('phone')) || columns[0])
      }
    } else {
      console.log('No contacts found in scheduled message:', scheduledMsg)
    }
    
    // Show success message
    setAlertMessage({ 
      type: 'success', 
      message: 'Message loaded for re-editing. Update the schedule and send again.' 
    })
    setTimeout(() => setAlertMessage(null), 3000)
  }

  // Execute scheduled message
  const executeScheduledMessage = async (scheduledMsg) => {
    const baseUrl = apiUrl.trim().replace(/\/+$/, "")
    
    try {
      // Update status to sending
      setScheduledMessages(prev => 
        prev.map(msg => 
          msg.id === scheduledMsg.id 
            ? { ...msg, status: 'sending' }
            : msg
        )
      )
      
      setProgressLog(`<div class="text-blue-600">🚀 Executing scheduled message ${scheduledMsg.id}...</div>`)
      
      // First, check if the instance is connected
      const instanceName = scheduledMsg.instanceName || scheduledMsg.instance
      console.log('SCHEDULED: Using instance name:', instanceName, 'from scheduled message:', {
        instanceName: scheduledMsg.instanceName, 
        instance: scheduledMsg.instance
      })
      
      try {
        const connectionResponse = await fetch(`${baseUrl}/instance/connectionState/${encodeURIComponent(instanceName)}`, {
          headers: {
            'apikey': apiKey
          }
        })
        
        if (!connectionResponse.ok) {
          throw new Error(`Failed to check connection: ${connectionResponse.status}`)
        }
        
        const connectionData = await connectionResponse.json()
        console.log('Connection status for scheduled message:', connectionData, 'Instance name used:', instanceName)
        
        if (connectionData.instance?.state !== 'open') {
          throw new Error(`Instance ${instanceName} is not connected (${connectionData.instance?.state || 'unknown'}). Please reconnect the instance first.`)
        }
        
      } catch (connectionError) {
        setProgressLog(`<div class="text-red-600">❌ Connection check failed: ${connectionError.message}</div>`)
        throw connectionError
      }
      
      const { contacts, message, instance, attachment, mediaType, fileNameOverride } = scheduledMsg
      
      // Send messages one by one
      let success = 0
      let failed = 0
      
      console.log('Processing contacts:', contacts.slice(0, 3)) // Log first 3 contacts
      
      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i]
        console.log(`Processing contact ${i+1}/${contacts.length}:`, contact)
        
        try {
          let response
          if (attachment && scheduledMsg.attachmentData) {
            // Handle attachment sending using stored attachment data
            const { base64, mimetype, mediatype, fileName } = scheduledMsg.attachmentData
            
            console.log('SCHEDULED: Sending media:', {
              url: `${baseUrl}/message/sendMedia/${encodeURIComponent(instanceName)}`,
              mediatype,
              mimetype,
              fileName,
              contact
            })
            
            response = await fetch(`${baseUrl}/message/sendMedia/${encodeURIComponent(instanceName)}`, {
              method: "POST",
              headers: buildHeaders(),
              body: JSON.stringify({
                number: contact,
                mediatype,
                mimetype,
                caption: message || "",
                media: base64,
                fileName
              })
            })
          } else if (attachment && !scheduledMsg.attachmentData) {
            // Attachment was scheduled but data is missing
            setProgressLog(`<div class="text-red-600">❌ [${i+1}] ${contact} - Attachment data missing</div>`)
            failed++
            continue
          } else {
            // Send text message
            let formattedNumber = String(contact).trim()
            formattedNumber = formattedNumber.replace(/[^\d+]/g, '')
            
            if (!formattedNumber.startsWith('+')) {
              if (formattedNumber.startsWith('91') && formattedNumber.length === 12) {
                formattedNumber = '+' + formattedNumber
              } 
              else if (formattedNumber.length === 10) {
                formattedNumber = '+91' + formattedNumber
              }
              else if (formattedNumber.length >= 11) {
                formattedNumber = '+' + formattedNumber
              }
            }
            
            const requestBody = {
              number: contact,
              text: message
            }
            
            const finalUrl = `${baseUrl}/message/sendText/${encodeURIComponent(instanceName)}`
            const scheduledHeaders = buildHeaders()
            const scheduledBody = JSON.stringify(requestBody)
            
            console.log('SCHEDULED: Sending message:', {
              url: finalUrl,
              instanceName,
              headers: scheduledHeaders,
              body: scheduledBody,
              requestBody,
              contact,
              message: message.substring(0, 50)
            })
            
            response = await fetch(finalUrl, {
              method: "POST",
              headers: scheduledHeaders,
              body: scheduledBody
            })
          }
          
          // Process response for both media and text messages
          console.log('SCHEDULED: Response:', {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
          })
          
          if (response.ok) {
            success++
            setProgressLog(`<div class="text-green-600">✅ [${i+1}] ${contact}</div>`)
          } else {
            const errorText = await response.text().catch(() => 'Unknown error')
            console.error('SCHEDULED: Message send failed:', {
              status: response.status,
              statusText: response.statusText,
              error: errorText,
              contact,
              responseHeaders: Object.fromEntries(response.headers.entries())
            })
            failed++
            
            if (response.status === 400) {
              setProgressLog(`<div class="text-red-600">❌ [${i+1}] ${contact} - Invalid request</div>`)
            } else if (response.status === 401 || response.status === 403) {
              setProgressLog(`<div class="text-red-600">❌ [${i+1}] ${contact} - Authentication failed</div>`)
            } else if (response.status === 404) {
              setProgressLog(`<div class="text-red-600">❌ [${i+1}] ${contact} - Instance not found</div>`)
            } else if (response.status === 500) {
              setProgressLog(`<div class="text-red-600">❌ [${i+1}] ${contact} - Server error</div>`)
            } else {
              setProgressLog(`<div class="text-red-600">❌ [${i+1}] ${contact} - Error ${response.status}</div>`)
            }
          }
          
          // Small delay between messages
          await new Promise(resolve => setTimeout(resolve, 1000))
          
        } catch (error) {
          failed++
          setProgressLog(`<div class="text-red-600">❌ Error sending to ${contact}: ${error.message}</div>`)
        }
      }
      
      // Update final status
      const finalStatus = failed === 0 ? 'sent' : (success === 0 ? 'failed' : 'partial')
      
      setScheduledMessages(prev => 
        prev.map(msg => 
          msg.id === scheduledMsg.id 
            ? { ...msg, status: finalStatus, executedAt: new Date().toISOString(), success, failed }
            : msg
        )
      )
      
      // Update localStorage
      const stored = JSON.parse(localStorage.getItem('scheduledMessages') || '[]')
      const updated = stored.map(msg => 
        msg.id === scheduledMsg.id 
          ? { ...msg, status: finalStatus, executedAt: new Date().toISOString(), success, failed }
          : msg
      )
      localStorage.setItem('scheduledMessages', JSON.stringify(updated))
      
      setProgressLog(`<div class="text-blue-600">📊 Scheduled message ${scheduledMsg.id} completed: ${success} sent, ${failed} failed</div>`)
      
    } catch (error) {
      // Mark as failed
      setScheduledMessages(prev => 
        prev.map(msg => 
          msg.id === scheduledMsg.id 
            ? { ...msg, status: 'failed', error: error.message }
            : msg
        )
      )
      
      setProgressLog(`<div class="text-red-600">❌ Scheduled message ${scheduledMsg.id} failed: ${error.message}</div>`)
    }
  }

  // Check for due scheduled messages
  const checkScheduledMessages = () => {
    const now = new Date()
    const dueMessages = scheduledMessages.filter(msg => {
      if (msg.status !== 'pending') return false
      const scheduleTime = new Date(msg.scheduleDateTime)
      return scheduleTime <= now
    })
    
    // Execute due messages
    dueMessages.forEach(msg => {
      executeScheduledMessage(msg)
    })
  }

  // Start schedule monitoring
  const startScheduleMonitoring = () => {
    if (scheduleTimer.current) {
      clearInterval(scheduleTimer.current)
    }
    
    // Check every 30 seconds for due messages
    scheduleTimer.current = setInterval(checkScheduledMessages, 30000)
  }

  // Stop schedule monitoring
  const stopScheduleMonitoring = () => {
    if (scheduleTimer.current) {
      clearInterval(scheduleTimer.current)
      scheduleTimer.current = null
    }
  }

  // Load scheduled messages from localStorage on component mount
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('scheduledMessages') || '[]')
    setScheduledMessages(stored)
  }, [setScheduledMessages])

  // Start/stop schedule monitoring based on scheduled messages
  useEffect(() => {
    const hasPendingMessages = scheduledMessages.some(msg => msg.status === 'pending')
    
    if (hasPendingMessages && apiUrl && apiKey) {
      startScheduleMonitoring()
      setProgressLog(`<div class="text-blue-600">⏰ Schedule monitoring active - checking for due messages every 30 seconds</div>`)
    } else {
      stopScheduleMonitoring()
    }
    
    // Cleanup on unmount
    return () => stopScheduleMonitoring()
  }, [scheduledMessages, apiUrl, apiKey])

  return {
    generateScheduleId,
    formatScheduleDateTime,
    validateScheduleDateTime,
    addScheduledMessage,
    cancelScheduledMessage,
    reEditScheduledMessage,
    executeScheduledMessage,
    checkScheduledMessages,
    startScheduleMonitoring,
    stopScheduleMonitoring
  }
}

export default ScheduleManager