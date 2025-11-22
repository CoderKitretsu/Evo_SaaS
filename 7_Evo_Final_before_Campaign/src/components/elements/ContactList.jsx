import { useState } from 'react'

const ContactList = ({
  contactsFile,
  setContactsFile,
  detectedColumns,
  setDetectedColumns,
  selectedColumn,
  setSelectedColumn,
  setShowColumnDropdown,
  onDetectColumns,
  onPreviewContacts,
  previewData
}) => {
  const [showPreview, setShowPreview] = useState(false)

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      // Use the setContactsFile which is now handleFileUpload from FileProcessor
      await setContactsFile(file)
    } else {
      setContactsFile(null)
      setDetectedColumns([])
      setSelectedColumn('')
      setShowColumnDropdown(false)
    }
  }

  const handlePreviewClick = async () => {
    await onPreviewContacts()
    setShowPreview(true)
  }

  return (
    <div className="space-y-4">
      {/* Contact List Section */}
      <div className="bg-gradient-to-br from-white via-gray-50 to-slate-50 border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
              </svg>
            </div>
            <label className="text-lg font-bold text-gray-800">Contact List</label>
          </div>
          {detectedColumns.length > 0 && (
            <button 
              onClick={handlePreviewClick}
              className="px-4 py-2 text-sm font-semibold text-blue-700 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md border border-blue-200"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
              </svg>
              Preview Contacts
            </button>
          )}
        </div>
        
        {detectedColumns.length > 0 ? (
          // File loaded state
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="p-4">
              {/* File info section */}
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate mb-1">
                      📁 {contactsFile?.name || 'contacts.csv'}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md font-medium">
                        {detectedColumns.length} columns detected
                      </span>
                      {selectedColumn && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md font-medium flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                          </svg>
                          Ready to send
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => document.getElementById('contactsFile').click()}
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium bg-gray-50 hover:bg-gray-100 border border-gray-200 px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-sm"
                >
                  Change File
                </button>
              </div>
              
              {/* Column selection section */}
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                    </svg>
                    <label className="text-sm font-semibold text-gray-700">Select Phone Column</label>
                  </div>
                  
                  <div className="relative">
                    <select
                      value={selectedColumn}
                      onChange={(e) => setSelectedColumn(e.target.value)}
                      className={`w-full text-sm border-2 rounded-xl px-4 py-3 font-medium transition-all duration-200 shadow-sm ${
                        selectedColumn 
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-emerald-100' 
                          : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                      } focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none appearance-none cursor-pointer`}
                    >
                      <option value="" className="text-gray-500">Choose the column with phone numbers...</option>
                      {detectedColumns.map((col, index) => (
                        <option key={index} value={col} className="text-gray-800">
                          📞 {col}
                        </option>
                      ))}
                    </select>
                    
                    {/* Custom dropdown arrow */}
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <svg className={`w-4 h-4 transition-colors ${selectedColumn ? 'text-emerald-600' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                    </div>
                  </div>
                  
                  {selectedColumn && (
                    <div className="flex items-center gap-2 text-xs text-emerald-700">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                      <span className="font-medium">Column "{selectedColumn}" selected</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Upload state
          <div 
            className="bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-emerald-400 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-emerald-100 transition-all duration-300 cursor-pointer group" 
            onClick={() => document.getElementById('contactsFile').click()}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-emerald-100 group-hover:to-emerald-200 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md">
                <svg className="w-8 h-8 text-gray-400 group-hover:text-emerald-600 transition-colors duration-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
                </svg>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors duration-300">Upload Contacts File</p>
                <p className="text-sm text-gray-500 group-hover:text-emerald-600 transition-colors duration-300">CSV and XLSX files supported</p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">CSV</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">XLSX</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <input 
          id="contactsFile" 
          type="file" 
          accept=".csv,.xlsx"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Preview Section */}
      {showPreview && previewData && (
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                </svg>
              </div>
              <label className="text-lg font-bold text-gray-800">Contact Preview</label>
            </div>
            <button 
              onClick={() => setShowPreview(false)}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-white rounded-lg transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </button>
          </div>
          
          <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold text-gray-800 mb-1">
                  Found <span className="text-blue-600">{previewData.count}</span> contacts
                </p>
                <p className="text-sm text-gray-600">
                  Using column: <span className="font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-lg">{previewData.columnUsed}</span>
                </p>
              </div>
            </div>
            
            {previewData.preview && (
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                  </svg>
                  <p className="text-sm font-semibold text-gray-700">Sample phone numbers:</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                  <p className="text-sm text-gray-800 font-mono leading-relaxed break-all">
                    {previewData.preview}
                    {previewData.count > 10 && <span className="text-gray-500 font-sans"> ...and {previewData.count - 10} more</span>}
                  </p>
                </div>
              </div>
            )}
            
            {previewData.error && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L10 10.414l2.707-2.707a1 1 0 111.414 1.414L11.414 12l2.707 2.707a1 1 0 01-1.414 1.414L10 13.414l-2.707 2.707a1 1 0 01-1.414-1.414L8.586 12 5.879 9.293a1 1 0 011.414-1.414L10 10.586l2.707-2.707z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <p className="text-lg font-bold text-red-700">Error Processing File</p>
                </div>
                <p className="text-sm text-red-600 ml-11">{previewData.error}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ContactList