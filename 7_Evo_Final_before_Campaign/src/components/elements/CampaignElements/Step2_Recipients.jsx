/**
 * Step 2: Recipients & Message
 * 
 * CRITICAL WRAPPER COMPONENT - wraps existing ContactList and MessageComposer
 * to intercept their outputs and redirect to campaign storage without modifying them.
 * 
 * TODO: Import and wrap ContactList.jsx with onContactsParsed callback
 * TODO: Import and wrap MessageComposer.jsx with onMessageChange callback
 * TODO: Implement contact normalization and deduplication
 * TODO: Add cleanup guard to clear legacy storage keys after capture
 * TODO: Add variable preview with first few merged messages
 */

import React, { useState, useEffect } from 'react';
import CampaignService from './campaignService.js';

const Step2_Recipients = ({ 
  draftId, 
  draftData, 
  onNext, 
  onBack, 
  isFirstStep, 
  isLastStep 
}) => {
  const [contacts, setContacts] = useState({
    total: 0,
    valid: 0,
    invalid: 0,
    duplicates: 0,
    rows: []
  });
  const [message, setMessage] = useState({
    text: '',
    templateHash: '',
    attachments: []
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  /**
   * Rehydrate contacts and message from draft data on mount
   */
  useEffect(() => {
    const rehydrateStep = async () => {
      try {
        let dataToLoad = null;

        if (draftData) {
          dataToLoad = draftData;
        } else if (draftId) {
          // Load fresh from service if no data passed
          dataToLoad = CampaignService.getDraft(draftId);
        }

        if (dataToLoad) {
          if (dataToLoad.contacts) {
            setContacts(dataToLoad.contacts);
          }
          if (dataToLoad.message) {
            setMessage(dataToLoad.message);
          }
        }
      } catch (error) {
        console.error('Error rehydrating Step 2:', error);
      }
    };

    rehydrateStep();
  }, [draftId, draftData]);

  /**
   * Handle contacts parsed from ContactList component
   * TODO: This will be called by the ContactList wrapper
   */
  const handleContactsParsed = (parsedContacts) => {
    try {
      // TODO: Implement normalization logic
      // - Normalize phone numbers to E.164 format
      // - Deduplicate by normalized phone
      // - Validate phone number format
      // - Extract variables from CSV columns
      
      const normalizedContacts = {
        total: parsedContacts.length,
        valid: parsedContacts.filter(c => c.phone && c.phone.length > 5).length,
        invalid: parsedContacts.filter(c => !c.phone || c.phone.length <= 5).length,
        duplicates: 0, // TODO: Calculate actual duplicates
        rows: parsedContacts.map((contact, index) => ({
          id: `row-${index + 1}`,
          phone: contact.phone, // TODO: Normalize to E.164
          vars: contact.vars || {},
          status: 'pending',
          attempts: 0
        }))
      };

      setContacts(normalizedContacts);

      // TODO: Implement cleanup guard
      // Check if ContactList wrote to legacy keys and clear them
      // Object.keys(localStorage).forEach(key => {
      //   if (key.includes('contact') && !key.startsWith('evosaa.campaigns.')) {
      //     console.warn('Cleaning up legacy contact key:', key);
      //     localStorage.removeItem(key);
      //   }
      // });

      // Immediately save to campaign draft
      if (draftId) {
        const currentDraft = CampaignService.getDraft(draftId) || {};
        CampaignService.saveDraft(draftId, {
          ...currentDraft,
          contacts: normalizedContacts
        });
      }
    } catch (error) {
      console.error('Error handling parsed contacts:', error);
      setErrors(prev => ({ ...prev, contacts: error.message }));
    }
  };

  /**
   * Handle message changes from MessageComposer component
   * TODO: This will be called by the MessageComposer wrapper
   */
  const handleMessageChange = (messageData) => {
    try {
      const normalizedMessage = {
        text: messageData.text || '',
        templateHash: messageData.templateHash || generateTemplateHash(messageData.text),
        attachments: messageData.attachments || []
      };

      setMessage(normalizedMessage);

      // TODO: Implement cleanup guard for message composer legacy keys
      
      // Immediately save to campaign draft
      if (draftId) {
        const currentDraft = CampaignService.getDraft(draftId) || {};
        CampaignService.saveDraft(draftId, {
          ...currentDraft,
          message: normalizedMessage
        });
      }
    } catch (error) {
      console.error('Error handling message change:', error);
      setErrors(prev => ({ ...prev, message: error.message }));
    }
  };

  /**
   * Generate template hash for message (simple implementation)
   */
  const generateTemplateHash = (text) => {
    // TODO: Implement proper hash generation
    return `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  /**
   * Handle manual contact entry (fallback UI)
   */
  const handleManualContactAdd = () => {
    // TODO: Implement manual contact entry modal
    console.log('Manual contact entry not yet implemented');
  };

  /**
   * Validate step data before proceeding
   */
  const validateStep = () => {
    const newErrors = {};

    if (contacts.valid === 0) {
      newErrors.contacts = 'At least one valid contact is required';
    }

    if (!message.text || message.text.trim().length === 0) {
      newErrors.message = 'Message text is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle next step
   */
  const handleNext = async () => {
    if (!validateStep()) {
      return;
    }

    try {
      setLoading(true);

      // Prepare data for next step
      const stepData = {
        ...(draftData || {}), // Preserve existing data
        contacts,
        message,
        updatedAt: new Date().toISOString()
      };

      await onNext(stepData);
    } catch (error) {
      console.error('Error proceeding to next step:', error);
      setErrors(prev => ({ ...prev, submit: error.message }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="step2-recipients">
      <div className="step-header">
        <h3>Recipients & Message</h3>
        <p>Upload contacts and compose your message template.</p>
      </div>

      <div className="recipients-content">
        {/* Left Panel: Contacts */}
        <div className="contacts-panel">
          <h4>Contact List</h4>
          
          {/* Contact Upload Section */}
          <div className="contact-upload-section">
            {/* TODO: Replace with ContactList wrapper */}
            <div className="placeholder-contact-upload">
              <div className="upload-area">
                <p><strong>TODO:</strong> ContactList wrapper will go here</p>
                <p>Will capture contact parsing outputs and redirect to campaign storage</p>
                
                <button 
                  onClick={handleManualContactAdd}
                  className="btn-secondary"
                >
                  Add Manual Contact (TODO)
                </button>
              </div>
            </div>

            {/* Contact Summary */}
            {contacts.total > 0 && (
              <div className="contact-summary">
                <div className="summary-stats">
                  <div className="stat">
                    <span className="stat-number">{contacts.total}</span>
                    <span className="stat-label">Total</span>
                  </div>
                  <div className="stat">
                    <span className="stat-number">{contacts.valid}</span>
                    <span className="stat-label">Valid</span>
                  </div>
                  <div className="stat">
                    <span className="stat-number">{contacts.invalid}</span>
                    <span className="stat-label">Invalid</span>
                  </div>
                  <div className="stat">
                    <span className="stat-number">{contacts.duplicates}</span>
                    <span className="stat-label">Duplicates</span>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Preview Table */}
            {contacts.rows.length > 0 && (
              <div className="contact-preview">
                <h5>Contact Preview (First 5)</h5>
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th>Phone</th>
                      <th>Variables</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.rows.slice(0, 5).map(contact => (
                      <tr key={contact.id}>
                        <td>{contact.phone}</td>
                        <td>{JSON.stringify(contact.vars)}</td>
                        <td><span className="status-badge">{contact.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {contacts.rows.length > 5 && (
                  <p className="preview-more">... and {contacts.rows.length - 5} more</p>
                )}
              </div>
            )}
          </div>

          {errors.contacts && (
            <div className="field-error">{errors.contacts}</div>
          )}
        </div>

        {/* Right Panel: Message */}
        <div className="message-panel">
          <h4>Message Template</h4>
          
          {/* Message Composer Section */}
          <div className="message-composer-section">
            {/* TODO: Replace with MessageComposer wrapper */}
            <div className="placeholder-message-composer">
              <p><strong>TODO:</strong> MessageComposer wrapper will go here</p>
              <p>Will capture message outputs and redirect to campaign storage</p>
              
              {/* Temporary message input */}
              <div className="temp-message-input">
                <label>Message Text (Temporary)</label>
                <textarea
                  value={message.text}
                  onChange={(e) => handleMessageChange({ text: e.target.value })}
                  placeholder="Enter your message template here...\n\nUse {{variableName}} for personalization"
                  rows={8}
                  className={errors.message ? 'error' : ''}
                />
              </div>
            </div>

            {/* Variable Help */}
            {contacts.rows.length > 0 && (
              <div className="variable-help">
                <h5>Available Variables</h5>
                <p>Use these variables in your message:</p>
                <div className="variable-tags">
                  {Object.keys(contacts.rows[0]?.vars || {}).map(varName => (
                    <span key={varName} className="variable-tag">
                      {`{{${varName}}}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Message Preview */}
            {message.text && contacts.rows.length > 0 && (
              <div className="message-preview">
                <h5>Message Preview (First 3 contacts)</h5>
                {contacts.rows.slice(0, 3).map(contact => (
                  <div key={contact.id} className="preview-message">
                    <div className="preview-header">
                      <strong>To: {contact.phone}</strong>
                    </div>
                    <div className="preview-content">
                      {/* TODO: Implement variable replacement */}
                      {message.text.replace(/\{\{(\w+)\}\}/g, (match, varName) => 
                        contact.vars[varName] || match
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {errors.message && (
            <div className="field-error">{errors.message}</div>
          )}
        </div>
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="form-error">
          {errors.submit}
        </div>
      )}

      {/* Actions */}
      <div className="form-actions">
        <button 
          type="button" 
          onClick={onBack}
          className="btn-secondary"
        >
          Back: Details
        </button>
        
        <button 
          type="button" 
          onClick={handleNext}
          disabled={loading || contacts.valid === 0 || !message.text}
          className="btn-primary"
        >
          {loading ? 'Saving...' : 'Next: Review'}
        </button>
      </div>
    </div>
  );
};

export default Step2_Recipients;