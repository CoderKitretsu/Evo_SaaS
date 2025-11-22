import React from 'react'

const EmptyState = ({ onCreateInstance }) => {
  return (
    <main className="container mx-auto px-6 py-8 space-y-8">
      <section id="emptyState" className="card-pro text-center py-16 hover:shadow-xl transition-all duration-300">
        <div className="max-w-md mx-auto">
          {/* Professional Illustration */}
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-full flex items-center justify-center shadow-lg transform hover:scale-105 transition-all duration-300">
            <svg className="w-12 h-12 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
            </svg>
          </div>
          <h3 className="text-heading text-2xl mb-3">Get Started with WhatsApp</h3>
          <p className="text-body mb-8">Create your first WhatsApp instance or select an existing one to begin sending professional messages to your contacts.</p>
          <button 
            id="openInstanceBtn2" 
            className="btn-primary-pro text-lg px-8 py-4 flex items-center gap-3 mx-auto"
            onClick={onCreateInstance}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
            </svg>
            Create Your First Instance
          </button>
        </div>
      </section>
    </main>
  )
}

export default EmptyState