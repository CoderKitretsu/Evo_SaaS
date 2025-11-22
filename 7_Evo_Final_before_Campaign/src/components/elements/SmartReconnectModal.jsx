import React from 'react'

const SmartReconnectModal = ({
  isOpen,
  onClose,
  reconnectInstance,
  onReconnect,
  qrImage,
  statusMsg,
  showProgress,
  progressPercent,
  progressText
}) => {
  if (!isOpen) return null

  return (
    <div id="reconnectModal" className="modal open items-center justify-center bg-black/40">
      <div className="glass w-[480px] rounded-2xl p-6 relative">
        <button 
          id="closeReconnectModal" 
          className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 text-xl" 
          onClick={onClose}
        >
          &times;
        </button>
        
        <h3 className="text-xl font-semibold text-gray-800 mb-1">Smart Reconnect</h3>
        <p className="text-sm text-gray-500 mb-4">
          Automatically reconnect existing instance: <strong>{reconnectInstance}</strong>
        </p>

        <div className="bg-green-50 border-l-4 border-green-400 p-3 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-green-700">
                <strong>🚀 Smart Reconnection:</strong> Will first try to restore your existing WhatsApp session automatically. 
                If session is expired, will generate QR code as fallback. No new instance will be created.
              </p>
            </div>
          </div>
        </div>

        <button 
          id="reconnectBtn" 
          className="btn-primary w-full py-2 rounded-lg font-semibold" 
          onClick={onReconnect}
        >
          🔄 Smart Reconnect
        </button>

        <div className="flex flex-col items-center mt-4">
          {qrImage && (
            <img 
              id="reconnectQrImage" 
              src={qrImage} 
              alt="QR Code" 
              style={{display: 'block'}} 
            />
          )}
          <p id="reconnectStatusMsg" className="text-center text-gray-600 text-sm mt-2">
            {statusMsg}
          </p>

          {/* Progress area under QR */}
          {showProgress && (
            <div id="reconnectProgressWrap" className="w-full mt-3">
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  id="reconnectProgressBar" 
                  className="bg-emerald-600 h-2 rounded-full" 
                  style={{width: `${progressPercent}%`}}
                ></div>
              </div>
              <div id="reconnectProgressText" className="text-xs text-gray-500 mt-1 text-center">
                {progressText}
              </div>
              <div className="mt-3 flex items-center justify-center gap-3">
                <button 
                  id="closeReconnectNowBtn" 
                  className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm" 
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SmartReconnectModal