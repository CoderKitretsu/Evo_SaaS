import React from 'react'
import ScheduledMessageCard from './ScheduledMessageCard'

const ScheduledMessages = ({ 
  scheduledMessages,
  selectedInstance,
  onExecute,
  onCancel,
  onReEdit
}) => {
  // Filter messages for the selected instance
  const instanceMessages = scheduledMessages.filter(msg => msg.instanceName === selectedInstance)
  
  // Check if there are any pending messages
  const hasPendingMessages = instanceMessages.some(msg => msg.status === 'pending')

  // Don't render if no messages for this instance
  if (instanceMessages.length === 0) {
    return null
  }

  return (
    <section className="bg-white rounded-xl shadow-md p-6 border border-gray-200 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Scheduled Messages ({instanceMessages.length})
            </h2>
            <p className="text-sm text-gray-600">Manage queued messages for {selectedInstance}</p>
          </div>
        </div>
        
        {hasPendingMessages && (
          <div className="flex items-center space-x-2 text-sm bg-green-50 px-3 py-2 rounded-lg border border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-600 font-medium">Monitoring Active</span>
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        {instanceMessages.map((msg) => (
          <ScheduledMessageCard
            key={msg.id}
            message={msg}
            onExecute={onExecute}
            onCancel={onCancel}
            onReEdit={onReEdit}
          />
        ))}
      </div>
    </section>
  )
}

export default ScheduledMessages