import { useState, useCallback } from 'react'

const FileProcessor = ({
  contactsFile,
  setContactsFile,
  detectedColumns,
  setDetectedColumns,
  selectedColumn,
  setSelectedColumn,
  setShowColumnDropdown,
  previewData,
  setPreviewData,
  setProgressLog,
  setFileData,
  setLastProcessedFile
}) => {
  // Utility function for sanitizing numbers
  const sanitizeNumber = (v) => String(v ?? "").replace(/[^\d]/g, "")

  // Detect columns in uploaded file
  const detectColumns = useCallback(async (file) => {
    if (!file) return []
    
    const ext = file.name.toLowerCase().split(".").pop()
    let columns = []
    
    try {
      if (ext === "csv") {
        const text = await file.text()
        const lines = text.split(/\r?\n/).filter(Boolean)
        if (lines.length > 0) {
          columns = lines[0].split(",").map(h => h.trim())
        }
      } else if (ext === "xlsx") {
        const buf = await file.arrayBuffer()
        const wb = window.XLSX.read(buf, { type:"array" })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = window.XLSX.utils.sheet_to_json(ws, { defval:"" })
        if (rows.length > 0) {
          columns = Object.keys(rows[0])
        }
      }
      
      setDetectedColumns(columns)
      
      // Auto-select phone number column if found
      const phoneColumns = ['number', 'phone', 'mobile', 'contact', 'whatsapp']
      const autoSelected = columns.find(col => 
        phoneColumns.includes(col.toLowerCase())
      )
      
      if (autoSelected) {
        setSelectedColumn(autoSelected)
        setShowColumnDropdown(false)
      } else {
        setSelectedColumn('')
        setShowColumnDropdown(columns.length > 0)
      }
      
      return columns
    } catch (error) {
      console.error('Error detecting columns:', error)
      setDetectedColumns([])
      setSelectedColumn('')
      return []
    }
  }, [setDetectedColumns, setSelectedColumn, setShowColumnDropdown])

  // CSV/XLSX parsing
  const parseContactsFile = useCallback(async (file, useSelectedColumn = false) => {
    if (!selectedColumn && useSelectedColumn) {
      throw new Error('Please select a column containing phone numbers.')
    }
    
    const ext = file.name.toLowerCase().split(".").pop()
    if (ext === "csv") {
      const text = await file.text()
      const lines = text.split(/\r?\n/).filter(Boolean)
      const headers = (lines[0]||"").split(",").map(h=>h.trim())
      
      let idx = -1
      if (useSelectedColumn && selectedColumn) {
        // Use manually selected column
        idx = headers.indexOf(selectedColumn)
        if (idx === -1) throw new Error(`Selected column "${selectedColumn}" not found in CSV.`)
      } else {
        // Auto-detect column
        const phoneColumns = ['number', 'phone', 'mobile', 'contact', 'whatsapp']
        idx = headers.findIndex(h => phoneColumns.includes(h.toLowerCase()))
        if (idx === -1) throw new Error('CSV must include a column named "number", "phone", "mobile", "contact", or "whatsapp".')
      }
      
      return lines.slice(1).map(l=>{
        const row = l.split(",")
        return sanitizeNumber((row[idx]||"").trim())
      }).filter(Boolean)
    } else if (ext === "xlsx") {
      const buf = await file.arrayBuffer()
      const wb = window.XLSX.read(buf, { type:"array" })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = window.XLSX.utils.sheet_to_json(ws, { defval:"" })
      const keys = Object.keys(rows[0]||{})
      
      let kNum = null
      if (useSelectedColumn && selectedColumn) {
        // Use manually selected column
        kNum = keys.find(k => k === selectedColumn)
        if (!kNum) throw new Error(`Selected column "${selectedColumn}" not found in XLSX.`)
      } else {
        // Auto-detect column
        const phoneColumns = ['number', 'phone', 'mobile', 'contact', 'whatsapp']
        kNum = keys.find(k => {
          const lowerKey = k.toLowerCase()
          return phoneColumns.includes(lowerKey)
        })
        if (!kNum) throw new Error('XLSX must include a column named "number", "phone", "mobile", "contact", or "whatsapp".')
      }
      
      return rows.map(r=>sanitizeNumber(r[kNum])).filter(Boolean)
    }
    throw new Error("Unsupported file type. Use .csv or .xlsx")
  }, [selectedColumn, sanitizeNumber])

  // Parse full file data for scheduling (preserves all columns)
  const parseFileData = useCallback(async (file) => {
    if (!file) return []
    
    const ext = file.name.toLowerCase().split(".").pop()
    
    try {
      if (ext === "csv") {
        const text = await file.text()
        const lines = text.split(/\r?\n/).filter(Boolean)
        if (lines.length === 0) return []
        
        const headers = lines[0].split(",").map(h => h.trim())
        return lines.slice(1).map(line => {
          const values = line.split(",")
          const row = {}
          headers.forEach((header, idx) => {
            row[header] = (values[idx] || "").trim()
          })
          return row
        })
      } else if (ext === "xlsx") {
        const buf = await file.arrayBuffer()
        const wb = window.XLSX.read(buf, { type:"array" })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = window.XLSX.utils.sheet_to_json(ws, { defval:"" })
        return rows
      }
      
      return []
    } catch (error) {
      console.error('Error parsing file data:', error)
      return []
    }
  }, [])

  // Preview contacts
  const previewContacts = useCallback(async () => {
    if (!contactsFile) { 
      alert("Upload a CSV/XLSX first.")
      return
    }
    try {
      const useManualSelection = selectedColumn && detectedColumns.length > 0
      const nums = await parseContactsFile(contactsFile, useManualSelection)
      const preview = nums.slice(0,10).join(", ")
      const columnUsed = useManualSelection ? selectedColumn : 'auto-detected column'
      
      setPreviewData({
        count: nums.length,
        preview: preview,
        columnUsed: columnUsed,
        error: null
      })
      
      setProgressLog(`<div>Found <strong>${nums.length}</strong> numbers using "${columnUsed}". Preview: ${preview}${nums.length>10?", ...":""}</div>`)
      
      // Also parse and store full file data for potential scheduling use
      const fullData = await parseFileData(contactsFile)
      setFileData(fullData)
      setLastProcessedFile(contactsFile)
    } catch (e) {
      setPreviewData({
        count: 0,
        preview: null,
        columnUsed: null,
        error: e.message
      })
      setProgressLog(`<div class="text-red-600">❌ ${e.message}</div>`)
    }
  }, [contactsFile, selectedColumn, detectedColumns, parseContactsFile, parseFileData, setPreviewData, setProgressLog, setFileData, setLastProcessedFile])

  // Handle file upload and auto-detect columns
  const handleFileUpload = useCallback(async (file) => {
    setContactsFile(file)
    
    // Auto-detect columns when file is uploaded
    if (file) {
      await detectColumns(file)
    }
  }, [setContactsFile, detectColumns])

  // Get contacts for processing (used by other components)
  const getProcessedContacts = useCallback(async (useSelectedColumn = false) => {
    if (!contactsFile) {
      throw new Error('No contacts file uploaded')
    }
    
    const nums = await parseContactsFile(contactsFile, useSelectedColumn)
    
    // Remove duplicates and return
    return [...new Set(nums)]
  }, [contactsFile, parseContactsFile])

  // Get full file data with all columns (used for scheduling)
  const getFileData = useCallback(async () => {
    if (!contactsFile) {
      throw new Error('No contacts file uploaded')
    }
    
    return await parseFileData(contactsFile)
  }, [contactsFile, parseFileData])

  return {
    // Methods
    detectColumns,
    parseContactsFile,
    parseFileData,
    previewContacts,
    handleFileUpload,
    getProcessedContacts,
    getFileData,
    
    // Utility
    sanitizeNumber
  }
}

export default FileProcessor