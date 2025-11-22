const ScheduledMessageCard = ({ 
  message, 
  onExecute, 
  onCancel, 
  onReEdit 
}) => {
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'PENDING' },
      sending: { bg: 'bg-blue-100', text: 'text-blue-800', label: '🚀 SENDING' },
      sent: { bg: 'bg-green-100', text: 'text-green-800', label: 'SENT' },
      partial: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'PARTIAL' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'FAILED' }
    }
    
    const config = statusConfig[status] || statusConfig.failed
    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const formatTimeRemaining = (scheduleDateTime) => {
    const now = new Date()
    const scheduled = new Date(scheduleDateTime)
    const diffMinutes = Math.max(0, Math.ceil((scheduled - now) / 60000))
    
    if (diffMinutes === 0) return 'Due now'
    if (diffMinutes < 60) return `${diffMinutes} minutes`
    
    const hours = Math.floor(diffMinutes / 60)
    const minutes = diffMinutes % 60
    return `${hours}h ${minutes}m`
  }

  const handleExecuteNow = () => {
    if (onExecute) onExecute(message)
  }

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel this scheduled message?')) {
      if (onCancel) onCancel(message.id)
    }
  }

  const handleDelete = () => {
    const confirmMessage = message.status === 'failed' 
      ? 'Are you sure you want to delete this failed message?'
      : 'Are you sure you want to delete this completed message?'
      
    if (window.confirm(confirmMessage)) {
      if (onCancel) onCancel(message.id)
    }
  }

  const handleReEdit = () => {
    if (onReEdit) onReEdit(message)
  }

  const handleRetry = () => {
    if (onExecute) onExecute(message)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-3">
        {/* Header with status, ID and execution time */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            {getStatusBadge(message.status)}
            <span className="text-xs text-gray-500 font-medium">ID: {message.id.substring(0, 8)}...</span>
          </div>
          {(message.status === 'sent' || message.status === 'partial' || message.status === 'failed') && message.executedAt && (
            <div className="text-right">
              <div className="text-xs text-gray-500">Executed: {new Date(message.executedAt).toLocaleString()}</div>
            </div>
          )}
        </div>

        {/* Main content area - compact grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Left column - Schedule & Instance info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
              </svg>
              <div>
                <div className="text-xs font-medium text-gray-600">Scheduled:</div>
                <div className="text-xs text-gray-700">{new Date(message.scheduleDateTime).toLocaleString()}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
              </svg>
              <div>
                <div className="text-xs font-medium text-gray-600">Instance:</div>
                <div className="text-xs text-gray-700">{message.instance}</div>
              </div>
            </div>
          </div>

          {/* Middle column - Recipients & Status info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
              </svg>
              <div>
                <div className="text-xs font-medium text-gray-600">Recipients:</div>
                <div className="text-xs text-gray-700">{message.totalContacts} contacts</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd"/>
              </svg>
              <div>
                <div className="text-xs font-medium text-gray-600">Attachment:</div>
                <div className="text-xs text-gray-700">{message.attachment || 'None'}</div>
              </div>
            </div>

            {/* Success/Failed counts - compact */}
            {(message.success !== undefined || message.failed !== undefined) && (
              <div className="flex items-center gap-3 text-xs pt-1">
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-green-600 font-medium">{message.success || 0} sent</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-red-600 font-medium">{message.failed || 0} failed</span>
                </div>
              </div>
            )}
          </div>
          
          {/* Right column - Compact action buttons */}
          <div className="flex justify-end">
            <div className="space-y-1.5">
              {message.status === 'pending' && (
                <div className="space-y-1.5">
                  <button
                    onClick={handleExecuteNow}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors duration-200 border border-blue-200"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
                    </svg>
                    Execute Now
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded transition-colors duration-200 border border-red-200"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                    Cancel
                  </button>
                </div>
              )}
              
              {message.status === 'failed' && (
                <div className="space-y-1.5">
                  <button
                    onClick={handleReEdit}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded transition-colors duration-200 border border-orange-200"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                    </svg>
                    Re-edit
                  </button>
                  <button
                    onClick={handleRetry}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors duration-200 border border-blue-200"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                    </svg>
                    Retry Now
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded transition-colors duration-200 border border-gray-200"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd"/>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2v3a1 1 0 001 1h4a1 1 0 001-1v-3a1 1 0 000-2H7z" clipRule="evenodd"/>
                    </svg>
                    Delete
                  </button>
                </div>
              )}
              
              {(message.status === 'sent' || message.status === 'partial') && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded transition-colors duration-200 border border-gray-200"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd"/>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2v3a1 1 0 001 1h4a1 1 0 001-1v-3a1 1 0 000-2H7z" clipRule="evenodd"/>
                  </svg>
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Compact message preview at bottom */}
        <div className="mt-3 pt-2 border-t border-gray-100">
          <div className="text-xs font-medium text-gray-600 mb-1">Message:</div>
          <div className="text-xs text-gray-700 leading-relaxed">
            {message.message.length <= 80 ? message.message : `${message.message.substring(0, 80)}...`}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScheduledMessageCard