import { useState, useRef, useEffect } from 'react'

const MessageComposer = ({
  bulkMessage,
  setBulkMessage,
  attachment,
  setAttachment,
  fileNameOverride,
  setFileNameOverride,
  scheduleMode,
  setScheduleMode,
  scheduledDate,
  setScheduledDate,
  scheduledTime,
  setScheduledTime,
  userTimezone,
  onSend,
  showProgress,
  bulkProgress,
  progressStats,
  progressLog
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showScheduleDropdown, setShowScheduleDropdown] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  
  const fileInputRef = useRef(null)

  // Helper function for date/time formatting
  const formatScheduleDateTime = (date, time) => {
    if (!date || !time) return null
    const dateTime = new Date(`${date}T${time}`)
    return dateTime.toLocaleString('en-US', { 
      timeZone: userTimezone,
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false)
      }
      if (!event.target.closest('.schedule-dropdown-container')) {
        setShowScheduleDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAttachmentChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAttachment(file)
      setFileNameOverride('') // Reset any previous rename
    }
  }

  const handleRemoveAttachment = () => {
    setAttachment(null)
    setFileNameOverride('')
    setIsRenaming(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRename = () => {
    setIsRenaming(true)
    setNewFileName(fileNameOverride || attachment?.name || '')
  }

  const handleRenameKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (newFileName.trim()) {
        setFileNameOverride(newFileName.trim())
      }
      setIsRenaming(false)
    } else if (e.key === 'Escape') {
      setIsRenaming(false)
      setNewFileName('')
    }
  }

  const handleEmojiClick = (emoji) => {
    setBulkMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
  }

  const emojis = [
    '😀', '😂', '😍', '🥰', '😎', '🤔', '😊', '🙂', '😉', '😋', 
    '😘', '🤗', '😇', '🥺', '😭', '😢', '😡', '😤', '🤯', '🥳', 
    '🤩', '😴', '🤤', '🤭', '🤫', '🤪', '😜', '🤓', '👍', '👎', 
    '👏', '🙌', '👌', '✌️', '🤞', '🤝', '💪', '🙏', '❤️', '💕', 
    '💖', '💯', '🔥', '⭐', '✨', '🎉', '🎊', '🎈'
  ]

  return (
    <div className="space-y-4">
      {/* Message Composition Area */}
      <div className="card-pro bg-gradient-to-br from-white to-gray-50">
        <h3 className="text-subheading mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
          </svg>
          Message Content
        </h3>
        
        <div className="space-y-4">
          {/* Message Textarea */}
          <div className="relative">
            <label htmlFor="bulk-message" className="block text-sm font-medium text-gray-700 mb-2">
              Message Text
            </label>
            <div className="relative bg-white border border-gray-300 rounded-xl shadow-sm focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
              <textarea
                id="bulk-message"
                rows="6"
                value={bulkMessage}
                onChange={(e) => setBulkMessage(e.target.value)}
                placeholder="Type your message here... Use {name} for personalization"
                className="block w-full border-0 px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-0 resize-none rounded-xl"
              />
              
              {/* Bottom toolbar with attachment and send buttons */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Attachment button */}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Attach file"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd"/>
                    </svg>
                  </button>
                  
                  {/* Emoji picker button */}
                  <div className="relative emoji-picker-container">
                    <button 
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-2 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                      title="Add emoji"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z" clipRule="evenodd"/>
                      </svg>
                    </button>
                    
                    {/* Enhanced Emoji picker dropdown */}
                    {showEmojiPicker && (
                      <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 w-72 z-20 backdrop-blur-sm">
                        <div className="mb-2">
                          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Quick Emojis</h4>
                        </div>
                        <div className="grid grid-cols-8 gap-1.5 max-h-36 overflow-y-auto">
                          {emojis.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleEmojiClick(emoji)}
                              className="p-2 hover:bg-emerald-50 hover:scale-110 rounded-lg text-lg transition-all duration-200 transform"
                              title={`Add ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                    className="hidden"
                    onChange={handleAttachmentChange}
                  />
                </div>
                
                {/* Integrated Send Button with Dropdown */}
                <div className="relative schedule-dropdown-container">
                  <button 
                    onClick={() => {
                      if (scheduleMode === 'immediate') {
                        onSend();
                      } else {
                        onSend();
                      }
                    }}
                    className={`${
                      scheduleMode === 'scheduled' 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    } text-white rounded-lg font-medium flex items-center transition-all duration-200 group overflow-hidden shadow-lg hover:shadow-xl`}
                  >
                    <div className="px-4 py-2.5 flex items-center gap-2">
                      {/* Better send/schedule icons */}
                      {scheduleMode === 'scheduled' ? (
                        // Clock icon for schedule mode
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                        </svg>
                      ) : (
                        // Paper plane icon for immediate send
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                        </svg>
                      )}
                      <span>{scheduleMode === 'scheduled' ? 'Schedule' : 'Send'}</span>
                    </div>
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowScheduleDropdown(!showScheduleDropdown);
                      }}
                      className={`px-3 py-2.5 ${
                        scheduleMode === 'scheduled' 
                          ? 'border-l border-blue-500 hover:bg-blue-800' 
                          : 'border-l border-emerald-500 hover:bg-emerald-800'
                      } transition-colors cursor-pointer group relative`}
                      title="Click to choose send options"
                    >
                      {/* Larger, more prominent dropdown arrow */}
                      <svg className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                      {/* Visual indicator for dropdown */}
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full opacity-75 animate-pulse"></div>
                    </div>
                  </button>
                  
                  {/* Enhanced Dropdown Menu */}
                  {showScheduleDropdown && (
                    <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-xl p-1 min-w-52 z-20">
                      <div className="p-2 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Send Options</p>
                      </div>
                      <button
                        onClick={() => {
                          setScheduleMode('immediate');
                          setShowScheduleDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-3 rounded-lg text-sm transition-colors flex items-center gap-3 ${
                          scheduleMode === 'immediate' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium">Send Now</p>
                          <p className="text-xs text-gray-500">Send messages immediately</p>
                        </div>
                        {scheduleMode === 'immediate' && (
                          <svg className="w-4 h-4 text-emerald-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setScheduleMode('scheduled');
                          setShowScheduleDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-3 rounded-lg text-sm transition-colors flex items-center gap-3 ${
                          scheduleMode === 'scheduled' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium">Schedule Later</p>
                          <p className="text-xs text-gray-500">Choose date and time</p>
                        </div>
                        {scheduleMode === 'scheduled' && (
                          <svg className="w-4 h-4 text-blue-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-1">This message will be sent to all contacts in your list</p>
            
            {/* Enhanced Attachment info block - show when file is attached */}
            {attachment && (
              <div className="mt-3 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      {isRenaming ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={newFileName}
                            onChange={(e) => setNewFileName(e.target.value)}
                            onKeyDown={handleRenameKeyDown}
                            placeholder="Enter new filename"
                            className="text-sm font-medium text-emerald-700 bg-white border border-emerald-300 rounded-lg px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            autoFocus
                          />
                          <p className="text-xs text-gray-500">Press Enter to save, Escape to cancel</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-semibold text-emerald-700">
                            {fileNameOverride || attachment.name}
                          </p>
                          <p className="text-xs text-emerald-600 flex items-center gap-1">
                            <span>Ready to send</span>
                            {fileNameOverride && (
                              <span className="px-1.5 py-0.5 bg-emerald-200 text-emerald-800 rounded text-[10px] font-medium">
                                Renamed
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isRenaming && (
                      <button 
                        onClick={handleRename}
                        className="text-blue-600 hover:text-blue-700 text-xs font-medium bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors"
                        title="Rename file"
                      >
                        Rename
                      </button>
                    )}
                    <button 
                      onClick={handleRemoveAttachment}
                      className="text-red-600 hover:text-red-700 text-xs font-medium bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Message Scheduler - Show only when scheduled mode is selected */}
          {scheduleMode === 'scheduled' && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-3 mb-4">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                </svg>
                Schedule Message Delivery
              </h3>
              
              <div className="bg-white rounded-xl border border-blue-200 p-4 space-y-4 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                        </svg>
                        Select Date
                      </label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                        </svg>
                        Select Time
                      </label>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm font-medium"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd"/>
                    </svg>
                    Timezone: {userTimezone}
                  </div>
                  
                  {scheduledDate && scheduledTime && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                        </svg>
                        <div className="text-sm text-blue-800">
                          <strong>Scheduled for:</strong> {formatScheduleDateTime(scheduledDate, scheduledTime)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress Section - Only show when there's progress */}
      {(showProgress || bulkProgress > 0 || progressLog) && (
        <div className="card-pro bg-gradient-to-br from-gray-50 to-slate-50">
          <h3 className="text-subheading mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            Progress Report 
          </h3>
          
          <div className="space-y-4">
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-emerald-600 h-2 rounded-full transition-all duration-300" style={{width: `${bulkProgress}%`}}></div>
            </div>
            <div className="text-sm text-gray-600">{progressStats}</div>
            {progressLog && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-64 overflow-y-auto">
                <div dangerouslySetInnerHTML={{__html: progressLog}}></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MessageComposer