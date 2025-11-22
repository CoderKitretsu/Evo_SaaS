import React from 'react'
import InstanceList from './InstanceList'

const Header = ({
  connectionState,
  badgeInfo,
  onOpenApiConfig,
  availableInstances,
  selectedInstance,
  showInstanceDropdown,
  setShowInstanceDropdown,
  onSelectInstance,
  onRefreshInstances,
  onOpenModal
}) => {
  return (
    <header className="glass-pro sticky top-0 z-30 border-b border-gray-100 shadow-lg">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Professional Logo */}
          <div className="relative w-12 h-12 transform hover:scale-105 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-center w-full h-full">
              <svg className="w-6 h-6 text-white drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.386"/>
              </svg>
            </div>
          </div>
          <div>
            <div className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              WhatsApp Business Hub
            </div>
            <div className="text-caption">Enterprise messaging platform</div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Connection Status Badge */}
          <div className={`badge-pro ${
            connectionState === 'CONNECTED' ? 'badge-success' : 
            connectionState === 'OPENING' ? 'badge-warning' : 'badge-error'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              connectionState === 'CONNECTED' ? 'bg-green-500' : 
              connectionState === 'OPENING' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            {badgeInfo.label}
          </div>
          
          {/* API Configuration Button */}
          <button
            onClick={onOpenApiConfig}
            className="btn-secondary-pro flex items-center gap-2"
            title="API Configuration"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
            </svg>
            <span>Settings</span>
          </button>
          
          {/* Instance List Component */}
          <InstanceList
            availableInstances={availableInstances}
            selectedInstance={selectedInstance}
            showInstanceDropdown={showInstanceDropdown}
            setShowInstanceDropdown={setShowInstanceDropdown}
            onSelectInstance={onSelectInstance}
            onRefreshInstances={onRefreshInstances}
          />
          
          {/* New Instance Button */}
          <button 
            id="openInstanceBtn" 
            className="btn-primary-pro flex items-center gap-2" 
            onClick={onOpenModal}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
            </svg>
            New Instance
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header