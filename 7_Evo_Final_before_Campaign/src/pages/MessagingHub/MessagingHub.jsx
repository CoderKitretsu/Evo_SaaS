import { useState, useEffect, useRef } from 'react'
import MessageComposer from '../../components/elements/MessageComposer'
import ContactList from '../../components/elements/ContactList'
import ScheduledMessages from '../../components/elements/ScheduledMessages'
import InstanceConnectionStatus from '../../components/elements/InstanceConnectionStatus'

import ScheduleManager from '../../components/features/ScheduleManager'
import FileProcessor from '../../components/features/FileProcessor'
import BulkMessagingManager from '../../components/features/BulkMessagingManager'

function MessagingHub({
  // Instance & Connection props
  selectedInstance,
  instanceName,
  connectionState,
  
  // API props
  apiUrl,
  apiKey,
  buildHeaders,
  
  // Progress & Logging
  progressLog,
  setProgressLog,
  
  // Functions
  openReconnectModal,
  checkInstanceConnection
}) {
  // State management for messaging
  const [bulkMessage, setBulkMessage] = useState('')
  const [contactsFile, setContactsFile] = useState(null)
  const [attachment, setAttachment] = useState(null)
  const [mediaType, setMediaType] = useState('auto')
  const [fileNameOverride, setFileNameOverride] = useState('')
  const [bulkProgress, setBulkProgress] = useState(0)
  const [progressStats, setProgressStats] = useState('0/0')
  
  // Column detection state
  const [detectedColumns, setDetectedColumns] = useState([])
  const [selectedColumn, setSelectedColumn] = useState('')
  const [showColumnDropdown, setShowColumnDropdown] = useState(false)
  const [fileData, setFileData] = useState([])
  const [lastProcessedFile, setLastProcessedFile] = useState(null)
  const [previewData, setPreviewData] = useState(null)

  // Message Scheduler states
  const [scheduleMode, setScheduleMode] = useState('immediate')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [scheduledMessages, setScheduledMessages] = useState([])
  const [userTimezone, setUserTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [alertMessage, setAlertMessage] = useState(null)

  // Refs for timers
  const scheduleTimer = useRef(null)

  // Schedule Manager Component
  const {
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
  } = ScheduleManager({
    scheduledMessages,
    setScheduledMessages,
    userTimezone,
    scheduleTimer,
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
    apiUrl,
    apiKey,
    buildHeaders
  })

  // File Processor Component
  const {
    detectColumns,
    parseContactsFile,
    parseFileData,
    previewContacts,
    handleFileUpload,
    getProcessedContacts,
    getFileData
  } = FileProcessor({
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
  })

  // Bulk Messaging Manager Component
  const {
    sendBulk,
    sendImmediateMessages
  } = BulkMessagingManager({
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
  })

  // Helper functions
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
  const hasSelectedInstance = selectedInstance || instanceName

  return (
    <main className="container mx-auto px-6 py-8 space-y-8">
      {/* Professional Messaging Dashboard */}
      {hasSelectedInstance && (
        <section id="bulkCard" className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Bulk Messaging Hub</h2>
                <p className="text-sm text-gray-600">Send messages to multiple contacts</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
              <div className={`w-2 h-2 rounded-full ${
                connectionState === 'CONNECTED' ? 'bg-green-500' : 
                connectionState === 'OPENING' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm font-medium text-gray-700" id="currentInstance">
                {selectedInstance || instanceName || 'No Instance'}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                connectionState === 'CONNECTED' ? 'bg-green-100 text-green-700' : 
                connectionState === 'OPENING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
              }`}>
                {badgeInfo.label}
              </span>
            </div>
          </div>

          {/* Dynamic Connection Status Notice */}
          <InstanceConnectionStatus
            hasSelectedInstance={hasSelectedInstance}
            selectedInstance={selectedInstance}
            instanceName={instanceName}
            connectionState={connectionState}
            isConnected={isConnected}
            badgeInfo={badgeInfo}
            onOpenReconnectModal={openReconnectModal}
            onCheckInstanceConnection={checkInstanceConnection}
            progressLog={progressLog}
            setProgressLog={setProgressLog}
            apiUrl={apiUrl}
            apiKey={apiKey}
            buildHeaders={buildHeaders}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* File Upload Section */}
            <ContactList
              contactsFile={contactsFile}
              setContactsFile={handleFileUpload}
              detectedColumns={detectedColumns}
              setDetectedColumns={setDetectedColumns}
              selectedColumn={selectedColumn}
              setSelectedColumn={setSelectedColumn}
              setShowColumnDropdown={setShowColumnDropdown}
              onDetectColumns={detectColumns}
              onPreviewContacts={previewContacts}
              previewData={previewData}
            />

            {/* Right Column - Message Composition and Progress */}
            <MessageComposer
              bulkMessage={bulkMessage}
              setBulkMessage={setBulkMessage}
              attachment={attachment}
              setAttachment={setAttachment}
              fileNameOverride={fileNameOverride}
              setFileNameOverride={setFileNameOverride}
              scheduleMode={scheduleMode}
              setScheduleMode={setScheduleMode}
              scheduledDate={scheduledDate}
              setScheduledDate={setScheduledDate}
              scheduledTime={scheduledTime}
              setScheduledTime={setScheduledTime}
              userTimezone={userTimezone}
              onSend={async () => {
                const result = await sendBulk()
                if (result?.success && result?.type === 'scheduled') {
                  // Reset form after successful scheduling
                  setScheduleMode('immediate')
                  setScheduledDate('')
                  setScheduledTime('')
                }
              }}
              showProgress={bulkProgress > 0 || progressLog}
              bulkProgress={bulkProgress}
              progressStats={progressStats}
              progressLog={progressLog}
            />
          </div>
        </section>
      )}

      {/* Scheduled Messages Dashboard - Only show when instance is selected */}
      {selectedInstance && (
        <ScheduledMessages
          scheduledMessages={scheduledMessages}
          selectedInstance={selectedInstance}
          onExecute={executeScheduledMessage}
          onCancel={cancelScheduledMessage}
          onReEdit={reEditScheduledMessage}
        />
      )}
    </main>
  )
}

export default MessagingHub