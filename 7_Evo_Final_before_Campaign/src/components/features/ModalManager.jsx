import { useRef } from 'react'

const ModalManager = ({
  // Modal states
  isModalOpen,
  setIsModalOpen,
  isReconnectModalOpen,
  setIsReconnectModalOpen,
  
  // Instance data
  selectedInstance,
  instanceName,
  setInstanceName,
  
  // Modal related states
  showProgress,
  setShowProgress,
  qrImage,
  setQrImage,
  statusMsg,
  setStatusMsg,
  reconnectInstance,
  setReconnectInstance,
  
  // Timer refs
  pollTimer,
  rampTimer
}) => {
  // Modal controls
  const openModal = () => {
    // Pre-populate instance name with selected instance if available
    if (selectedInstance && !instanceName) {
      setInstanceName(selectedInstance)
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setShowProgress(false)
    setQrImage('')
    setStatusMsg('')
    clearInterval(pollTimer.current)
    clearInterval(rampTimer.current)
  }

  // Reconnect modal controls
  const openReconnectModal = (instanceToReconnect) => {
    setReconnectInstance(instanceToReconnect || selectedInstance || instanceName)
    setIsReconnectModalOpen(true)
    setQrImage('')
    setStatusMsg('')
  }

  const closeReconnectModal = () => {
    setIsReconnectModalOpen(false)
    setShowProgress(false)
    setQrImage('')
    setStatusMsg('')
    setReconnectInstance('')
    clearInterval(pollTimer.current)
    clearInterval(rampTimer.current)
  }

  // Return the modal control functions
  return {
    openModal,
    closeModal,
    openReconnectModal,
    closeReconnectModal
  }
}

export default ModalManager