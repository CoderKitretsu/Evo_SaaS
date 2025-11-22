import { useCallback } from 'react'

const BulkMessagingManager = ({
  apiUrl,
  apiKey,
  selectedInstance,
  instanceName,
  contactsFile,
  bulkMessage,
  attachment,
  mediaType,
  fileNameOverride,
  scheduleMode,
  scheduledDate,
  scheduledTime,
  setProgressLog,
  setBulkProgress,
  setProgressStats,
  buildHeaders,
  validateScheduleDateTime,
  addScheduledMessage,
  formatScheduleDateTime,
  getProcessedContacts,
  fileData,
  selectedColumn,
  detectedColumns
}) => {
  // Utility functions
  const sleep = (ms) => new Promise(r => setTimeout(r, ms))
  const guessMediaType = (mime) => mime?.startsWith("image/") ? "image" :
                                  mime?.startsWith("video/") ? "video" :
                                  mime?.startsWith("audio/") ? "audio" : "document"
  const toBase64DataUrl = (f) => new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(f); })

  // Main bulk send function
  const sendBulk = useCallback(async () => {
    const baseUrl = apiUrl.trim().replace(/\/+$/, "")
    // Use selectedInstance (from dropdown) instead of instanceName (input field)
    const instance = (selectedInstance || instanceName).trim()
    const message = bulkMessage.trim()

    if (!baseUrl || !instance || !contactsFile) { 
      alert("API URL, instance, and contacts file are required.")
      return
    }
    if (!message && !attachment) { 
      alert("Provide a message or an attachment.")
      return
    }

    // Handle scheduled messages
    if (scheduleMode === 'scheduled') {
      const validation = validateScheduleDateTime(scheduledDate, scheduledTime)
      if (!validation.valid) {
        alert(validation.error)
        return
      }

      // Get contacts for scheduling
      let numbers
      try {
        console.log('Scheduling debug:', { 
          hasFileData: !!fileData, 
          fileDataType: Array.isArray(fileData), 
          hasContactsFile: !!contactsFile,
          selectedColumn,
          detectedColumns: detectedColumns.length 
        })
        
        // If we have fileData already (from re-edit), use it directly
        if (fileData && Array.isArray(fileData) && fileData.length > 0) {
          console.log('Using existing fileData for scheduling')
          const useManualSelection = selectedColumn && detectedColumns.length > 0
          if (useManualSelection && selectedColumn) {
            numbers = fileData
              .map(row => String(row[selectedColumn] || '').trim())
              .filter(phone => phone && phone !== '')
          } else {
            // Auto-detect phone column
            const phoneColumn = Object.keys(fileData[0] || {}).find(col => 
              col.toLowerCase().includes('phone') || 
              col.toLowerCase().includes('mobile') || 
              col.toLowerCase().includes('number')
            )
            if (phoneColumn) {
              numbers = fileData
                .map(row => String(row[phoneColumn] || '').trim())
                .filter(phone => phone && phone !== '')
            } else {
              throw new Error('No phone column found in data')
            }
          }
          
          // Remove duplicates
          numbers = [...new Set(numbers)]
          console.log('Processed numbers (after deduplication):', numbers.slice(0, 5), `Total: ${numbers.length}`)
        } else if (contactsFile) {
          // Parse from file as usual
          console.log('Parsing from contacts file')
          const useManualSelection = selectedColumn && detectedColumns.length > 0
          numbers = await getProcessedContacts(useManualSelection)
          
          console.log('Parsed numbers (already deduplicated):', numbers.slice(0, 5), `Total: ${numbers.length}`)
        } else {
          throw new Error('No contacts data available. Please upload a contacts file or re-edit a message with existing contacts.')
        }
      } catch (e) {
        alert(`Error parsing contacts: ${e.message}`)
        return
      }

      // Create scheduled message
      const scheduleDateTime = new Date(`${scheduledDate}T${scheduledTime}`)
      
      // Prepare attachment data for scheduled message if needed
      let attachmentData = null
      if (attachment) {
        try {
          const dataUrl = await toBase64DataUrl(attachment)
          const mimetype = attachment.type || "application/octet-stream"
          const mediatype = (mediaType === "auto") ? guessMediaType(mimetype) : mediaType
          const fileName = fileNameOverride || attachment.name || ("file." + (mimetype.split("/")[1] || "bin"))
          const base64 = dataUrl.split(",")[1] || dataUrl
          attachmentData = { base64, mimetype, mediatype, fileName }
        } catch (error) {
          alert(`Error processing attachment: ${error.message}`)
          return
        }
      }
      
      const scheduleId = addScheduledMessage({
        instance,
        instanceName: instance, // Store the instance name explicitly
        message,
        contacts: numbers,
        attachment: attachment ? attachment.name : null,
        attachmentData, // Store the processed attachment data
        mediaType,
        fileNameOverride,
        scheduleDateTime: scheduleDateTime.toISOString(),
        totalContacts: numbers.length
      })

      const formattedDateTime = formatScheduleDateTime(scheduledDate, scheduledTime)
      setProgressLog(`<div class="text-green-600">✅ Message scheduled successfully!</div>
        <div class="ml-4 text-sm text-gray-700">
          • Schedule ID: ${scheduleId}<br>
          • Send Time: ${formattedDateTime}<br>
          • Recipients: ${numbers.length} contacts<br>
          • Instance: ${instance}
        </div>`)
      
      // Reset form would be handled by parent component
      return { success: true, type: 'scheduled', scheduleId, recipients: numbers.length }
    }

    // Immediate sending logic
    return await sendImmediateMessages(baseUrl, instance, message)
  }, [
    apiUrl, apiKey, selectedInstance, instanceName, contactsFile, bulkMessage, attachment,
    mediaType, fileNameOverride, scheduleMode, scheduledDate, scheduledTime,
    setProgressLog, setBulkProgress, setProgressStats, buildHeaders,
    validateScheduleDateTime, addScheduledMessage, formatScheduleDateTime,
    getProcessedContacts, fileData, selectedColumn, detectedColumns
  ])

  // Immediate message sending
  const sendImmediateMessages = useCallback(async (baseUrl, instance, message) => {
    // First verify the instance exists and is accessible
    try {
      const verifyResp = await fetch(`${baseUrl}/instance/fetchInstances`, { headers: buildHeaders() })
      if (verifyResp.ok) {
        const allInstances = await verifyResp.json()
        const instanceExists = allInstances.find(inst => 
          (inst.name || inst.instance?.instanceName || inst.instanceName) === instance
        )
        
        if (!instanceExists) {
          setProgressLog(`<div class="text-red-600">❌ Instance "${instance}" not found in API. Available instances: ${allInstances.map(i => i.name || i.instanceName).join(', ')}</div>`)
          return { success: false, error: 'Instance not found' }
        }
        
        setProgressLog(`<div class="text-green-600">✅ Instance "${instance}" verified. Connection status: ${instanceExists.connectionStatus || instanceExists.instance?.connectionStatus || 'unknown'}</div>`)
      }
    } catch (err) {
      setProgressLog(`<div class="text-yellow-600">⚠️ Could not verify instance "${instance}". Proceeding anyway...</div>`)
    }

    setProgressLog('⏳ Reading contacts...')
    setBulkProgress(0)
    setProgressStats('0/0')

    let numbers
    try { 
      const useManualSelection = selectedColumn && detectedColumns.length > 0
      numbers = await getProcessedContacts(useManualSelection) 
    } catch (e) { 
      setProgressLog(`<span class="text-red-600">❌ ${e.message}</span>`)
      return { success: false, error: e.message }
    }
    if (!numbers.length) { 
      setProgressLog('❌ No valid numbers found.')
      return { success: false, error: 'No valid numbers found' }
    }

    // Prepare media payload if needed
    let mediaPayload = null
    if (attachment) {
      try {
        const dataUrl = await toBase64DataUrl(attachment)
        const mimetype = attachment.type || "application/octet-stream"
        const mediatype = (mediaType === "auto") ? guessMediaType(mimetype) : mediaType
        const fileName = fileNameOverride || attachment.name || ("file." + (mimetype.split("/")[1] || "bin"))
        const base64 = dataUrl.split(",")[1] || dataUrl
        mediaPayload = { base64, mimetype, mediatype, fileName }
      } catch (error) {
        setProgressLog(`<span class="text-red-600">❌ Error processing attachment: ${error.message}</span>`)
        return { success: false, error: `Attachment error: ${error.message}` }
      }
    }

    setProgressLog(`📤 Sending to <strong>${numbers.length}</strong> contacts...`)
    let ok = 0, fail = 0
    
    for (let i = 0; i < numbers.length; i++) {
      const num = numbers[i]
      try {
        let res
        if (mediaPayload) {
          res = await fetch(`${baseUrl}/message/sendMedia/${encodeURIComponent(instance)}`, {
            method: "POST",
            headers: buildHeaders(),
            body: JSON.stringify({
              number: num,
              mediatype: mediaPayload.mediatype,
              mimetype: mediaPayload.mimetype,
              caption: message || "",
              media: mediaPayload.base64,
              fileName: mediaPayload.fileName
            })
          })
        } else {
          const immediateHeaders = buildHeaders()
          const immediateBody = JSON.stringify({ number: num, text: message })
          console.log('IMMEDIATE: Sending to URL:', `${baseUrl}/message/sendText/${encodeURIComponent(instance)}`, {
            instance,
            headers: immediateHeaders,
            body: immediateBody,
            number: num,
            text: message
          })
          res = await fetch(`${baseUrl}/message/sendText/${encodeURIComponent(instance)}`, {
            method: "POST",
            headers: immediateHeaders,
            body: immediateBody
          })
        }
        
        console.log('IMMEDIATE: Response:', {
          ok: res.ok,
          status: res.status,
          statusText: res.statusText,
          headers: Object.fromEntries(res.headers.entries())
        })
        
        if (res.ok) { 
          ok++
          setProgressLog(prev => prev + `<div>✅ [${i+1}] ${num}</div>`)
        } else { 
          fail++
          if (res.status === 400) {
            setProgressLog(prev => prev + `<div>❌ [${i+1}] ${num} - Invalid request</div>`)
          } else if (res.status === 401 || res.status === 403) {
            setProgressLog(prev => prev + `<div>❌ [${i+1}] ${num} - Authentication failed</div>`)
          } else if (res.status === 404) {
            setProgressLog(prev => prev + `<div>❌ [${i+1}] ${num} - Instance not found</div>`)
          } else {
            setProgressLog(prev => prev + `<div>❌ [${i+1}] ${num} - Error ${res.status}</div>`)
          }
        }
      } catch (err) {
        fail++
        setProgressLog(prev => prev + `<div>⚠️ [${i+1}] ${num} - Connection error</div>`)
      }
      
      const pct = Math.round(((i+1)/numbers.length)*100)
      setBulkProgress(pct)
      setProgressStats(`${i+1}/${numbers.length} — ✓${ok} • ✗${fail}`)
      await sleep(700)
    }
    
    setProgressLog(prev => prev + `<hr><div><strong>Done.</strong> Sent: ${ok}, Failed: ${fail}</div>`)
    
    return { 
      success: true, 
      type: 'immediate', 
      sent: ok, 
      failed: fail, 
      total: numbers.length 
    }
  }, [
    buildHeaders, setProgressLog, setBulkProgress, setProgressStats,
    getProcessedContacts, selectedColumn, detectedColumns, attachment,
    mediaType, fileNameOverride, bulkMessage
  ])

  return {
    sendBulk,
    sendImmediateMessages
  }
}

export default BulkMessagingManager