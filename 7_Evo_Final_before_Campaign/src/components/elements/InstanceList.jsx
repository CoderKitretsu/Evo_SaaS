import React from 'react'

const InstanceList = ({
  availableInstances,
  selectedInstance,
  showInstanceDropdown,
  setShowInstanceDropdown,
  onSelectInstance,
  onRefreshInstances
}) => {
  if (!availableInstances.length) return null

  return (
    <div className="relative">
      <button
        onClick={() => setShowInstanceDropdown(!showInstanceDropdown)}
        className="btn-secondary-pro flex items-center gap-3 min-w-[200px] justify-between"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
          </svg>
          <span className="font-medium">{selectedInstance || 'Select Instance'}</span>
        </div>
        <svg className={`w-4 h-4 transition-transform duration-200 ${showInstanceDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      
      {showInstanceDropdown && (
        <div className="absolute right-0 mt-3 w-80 glass-pro rounded-xl z-40 max-h-80 overflow-y-auto border border-gray-200">
          {availableInstances.map((instance, index) => {
            // Use the primary 'name' field from the API response, with fallbacks
            const instanceName = instance.name || instance.instance?.instanceName || instance.instanceName || `Instance ${index + 1}`
            const rawConnectionState = instance.instance?.connectionStatus || 
                                      instance.connectionStatus || 
                                      instance.instance?.state ||
                                      instance.state ||
                                      'Unknown'
            
            // Normalize connection state
            const connectionState = rawConnectionState.toUpperCase()
            const isInstanceConnected = ['CONNECTED', 'OPEN', 'READY'].includes(connectionState)
            const isInstanceConnecting = ['CONNECTING', 'OPENING'].includes(connectionState)
            
            return (
              <button
                key={instanceName}
                onClick={() => onSelectInstance(instanceName)}
                className={`w-full px-5 py-4 text-left hover:bg-gradient-to-r hover:from-emerald-50 hover:to-blue-50 transition-all duration-200 border-b border-gray-100 last:border-b-0 ${
                  selectedInstance === instanceName ? 'bg-gradient-to-r from-emerald-50 to-blue-50 ring-1 ring-emerald-200' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800 flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                      </svg>
                      {instanceName}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <div className={`badge-pro text-xs ${
                        isInstanceConnected ? 'badge-success' :
                        isInstanceConnecting ? 'badge-info' : 'badge-error'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          isInstanceConnected ? 'bg-green-500' :
                          isInstanceConnecting ? 'bg-blue-500' : 'bg-red-500'
                        }`}></div>
                        {isInstanceConnected ? 'Connected' : 
                         isInstanceConnecting ? 'Connecting' : 
                         rawConnectionState}
                      </div>
                      {isInstanceConnected && (
                        <span className="text-xs text-emerald-700 font-medium bg-emerald-100 px-2 py-1 rounded-full">
                          Ready to use
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedInstance === instanceName && (
                    <svg className="w-5 h-5 text-emerald-600 ml-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                  )}
                </div>
              </button>
            )
          })}
          <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => {
                setShowInstanceDropdown(false)
                onRefreshInstances()
              }}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              🔄 Refresh Instances
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default InstanceList