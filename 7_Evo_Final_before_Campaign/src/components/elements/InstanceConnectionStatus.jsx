import React from 'react'
import ConnectionTester from './ConnectionTester'

const InstanceConnectionStatus = ({
  hasSelectedInstance,
  selectedInstance,
  instanceName,
  connectionState,
  isConnected,
  badgeInfo,
  onOpenReconnectModal,
  onCheckInstanceConnection,
  onTestConnection,
  progressLog,
  setProgressLog,
  apiUrl,
  apiKey,
  buildHeaders
}) => {
  if (!hasSelectedInstance) return null

  return (
    <div className={`mb-4 p-3 rounded-lg border ${
      isConnected 
        ? 'bg-green-50 border-green-200' 
        : connectionState === 'OPENING' 
          ? 'bg-blue-50 border-blue-200'
          : connectionState === 'DISCONNECTED'
            ? 'bg-red-50 border-red-200'
            : 'bg-yellow-50 border-yellow-200'
    }`}>
      <div className={`flex items-center gap-2 ${
        isConnected 
          ? 'text-green-800' 
          : connectionState === 'OPENING' 
            ? 'text-blue-800'
            : connectionState === 'DISCONNECTED'
              ? 'text-red-800'
              : 'text-yellow-800'
      }`}>
        <span>
          {isConnected 
            ? '✅' 
            : connectionState === 'OPENING' 
              ? '🔄'
              : connectionState === 'DISCONNECTED'
                ? '❌'
                : '⚠️'
          }
        </span>
        <span className="text-sm font-medium">
          Instance "{selectedInstance || instanceName}" is {' '}
          {isConnected 
            ? 'connected and ready for bulk messaging! No QR scan needed.' 
            : connectionState === 'OPENING' 
              ? 'connecting... Please wait, checking connection status.'
              : connectionState === 'DISCONNECTED'
                ? 'disconnected. Click "Connect Instance" below to reconnect.'
                : 'not connected. Click "Connect Instance" below to scan QR code.'
          }
        </span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        {!isConnected && (
          <button 
            onClick={() => onOpenReconnectModal(selectedInstance || instanceName)}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
          >
            🔗 Connect Instance
          </button>
        )}
        <button 
          onClick={() => onCheckInstanceConnection(selectedInstance || instanceName)}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          🔄 Refresh Status
        </button>
        <ConnectionTester
          selectedInstance={selectedInstance}
          instanceName={instanceName}
          apiUrl={apiUrl}
          apiKey={apiKey}
          buildHeaders={buildHeaders}
          setProgressLog={setProgressLog}
          onCheckInstanceConnection={onCheckInstanceConnection}
        />
        {isConnected && (
          <span className="text-xs text-green-600 font-medium">
            ✅ Ready for bulk messaging
          </span>
        )}
      </div>
    </div>
  )
}

export default InstanceConnectionStatus