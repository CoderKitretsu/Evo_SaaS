import { useState, useEffect } from 'react'

const CreateInstanceModal = ({ 
  isOpen,
  onClose,
  apiUrl,
  setApiUrl,
  apiKey,
  setApiKey,
  instanceName,
  setInstanceName,
  onGenerate,
  qrImage,
  statusMsg,
  showProgress,
  progressPercent,
  progressText,
  onFetchInstances
}) => {
  const [isGenerating, setIsGenerating] = useState(false)

  // Handle API URL/Key blur to fetch instances
  const handleApiBlur = () => {
    if (apiUrl && apiKey && onFetchInstances) {
      onFetchInstances()
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      await onGenerate()
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      return () => document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="modal open items-center justify-center bg-black/40">
      <div className="glass w-[560px] rounded-2xl p-6 relative">
        <button 
          className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 text-xl" 
          onClick={onClose}
          disabled={isGenerating}
        >
          &times;
        </button>
        
        <h3 className="text-xl font-semibold text-gray-800 mb-1">Create / Link WhatsApp Instance</h3>
        <p className="text-sm text-gray-500 mb-4">Enter details to generate a QR and link WhatsApp.</p>

        <div className="space-y-3">
          <div>
            <label className="text-gray-700 font-semibold text-sm block mb-1">API Base URL</label>
            <input 
              type="text" 
              placeholder="http://localhost:8080"
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-600"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              onBlur={handleApiBlur}
              disabled={isGenerating}
            />
          </div>

          <div>
            <label className="text-gray-700 font-semibold text-sm block mb-1">API Key</label>
            <input 
              type="text" 
              placeholder="Enter API key"
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-600"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onBlur={handleApiBlur}
              disabled={isGenerating}
            />
          </div>

          <div>
            <label className="text-gray-700 font-semibold text-sm block mb-1">Instance Name</label>
            <input 
              type="text" 
              placeholder="Enter instance name"
              className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-emerald-600"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              disabled={isGenerating}
            />
          </div>

          <button 
            className={`btn-primary w-full py-2 rounded-lg font-semibold flex items-center justify-center gap-2 ${
              isGenerating ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              'Generate QR & Connect'
            )}
          </button>
        </div>

        <div className="flex flex-col items-center mt-4">
          {qrImage && (
            <img 
              src={qrImage} 
              alt="QR Code" 
              className="max-w-full h-auto"
              style={{display: 'block'}} 
            />
          )}
          
          {statusMsg && (
            <p className="text-center text-gray-600 text-sm mt-2">{statusMsg}</p>
          )}

          {/* Progress area under QR */}
          {showProgress && (
            <div className="w-full mt-3">
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-300" 
                  style={{width: `${progressPercent}%`}}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1 text-center">{progressText}</div>
              <div className="mt-3 flex items-center justify-center gap-3">
                <button 
                  className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm transition-colors" 
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

export default CreateInstanceModal