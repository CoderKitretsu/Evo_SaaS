/**
 * Step 3: Review & Launch
 * 
 * Final review of campaign configuration with validation and publishing options.
 * Handles campaign creation, status setting, and integration with campaign runner.
 * 
 * TODO: Add confirmation modal for large campaigns (>1000 contacts)
 * TODO: Integrate with campaign runner for immediate execution
 * TODO: Add estimated completion time calculation
 * TODO: Add cost estimation if applicable
 */

import React, { useState, useEffect } from 'react';
import CampaignService from './campaignService.js';

const Step3_Review = ({ 
  draftId, 
  draftData, 
  onNext, 
  onBack, 
  onComplete,
  isFirstStep, 
  isLastStep 
}) => {
  const [reviewData, setReviewData] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [publishAction, setPublishAction] = useState(null);

  /**
   * Load and validate draft data on mount
   */
  useEffect(() => {
    const loadReviewData = async () => {
      try {
        let dataToReview = null;

        if (draftData) {
          dataToReview = draftData;
        } else if (draftId) {
          // Load fresh from service if no data passed
          dataToReview = CampaignService.getDraft(draftId);
        }

        if (dataToReview) {
          setReviewData(dataToReview);
          
          // Validate for publishing
          try {
            await CampaignService.publishDraftAsCampaign(draftId, { validateOnly: true });
            setValidationErrors([]);
          } catch (error) {
            setValidationErrors([error.message]);
          }
        } else {
          setValidationErrors(['No draft data found']);
        }
      } catch (error) {
        console.error('Error loading review data:', error);
        setValidationErrors([error.message]);
      }
    };

    loadReviewData();
  }, [draftId, draftData]);

  /**
   * Calculate estimated completion time
   */
  const calculateEstimatedTime = () => {
    if (!reviewData) return 'Unknown';
    
    const totalContacts = reviewData.contacts?.valid || 0;
    const throttle = reviewData.meta?.throttle || 'safe';
    
    // Messages per second based on throttle setting
    const rates = { safe: 1, moderate: 5, fast: 20 };
    const messagesPerSecond = rates[throttle] || 1;
    
    const totalSeconds = Math.ceil(totalContacts / messagesPerSecond);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes > 0) {
      return `~${minutes}m ${seconds}s`;
    }
    return `~${seconds}s`;
  };

  /**
   * Handle publish actions
   */
  const handlePublishAction = async (action) => {
    if (reviewData?.contacts?.valid > 1000) {
      // Show confirmation modal for large campaigns
      setPublishAction(action);
      setShowConfirmModal(true);
      return;
    }

    await executePublishAction(action);
  };

  /**
   * Execute the actual publish action
   */
  const executePublishAction = async (action) => {
    try {
      setLoading(true);
      let campaignId;

      switch (action) {
        case 'save_draft':
          // Just save current state, don't publish
          CampaignService.saveDraft(draftId, reviewData);
          alert('Draft saved successfully!');
          return;

        case 'create_campaign':
          // Create campaign but don't start
          campaignId = await CampaignService.publishDraftAsCampaign(draftId, { 
            startScheduled: false 
          });
          break;

        case 'create_and_schedule':
          // Create and set to scheduled (runner will pick up at startAt time)
          campaignId = await CampaignService.publishDraftAsCampaign(draftId, { 
            startScheduled: true 
          });
          break;

        case 'launch_now':
          // Update startAt to now, then create and schedule
          const updatedDraft = {
            ...reviewData,
            meta: {
              ...reviewData.meta,
              startAt: new Date().toISOString()
            }
          };
          CampaignService.saveDraft(draftId, updatedDraft);
          
          campaignId = await CampaignService.publishDraftAsCampaign(draftId, { 
            startScheduled: true 
          });
          
          // TODO: Trigger campaign runner immediately
          // await CampaignRunner.startCampaign(campaignId);
          break;

        default:
          throw new Error('Invalid publish action');
      }

      // Notify parent component of completion
      if (onComplete && campaignId) {
        onComplete(campaignId);
      }

      alert(`Campaign ${action.replace('_', ' ')} successful! Campaign ID: ${campaignId}`);

    } catch (error) {
      console.error('Error publishing campaign:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
      setPublishAction(null);
    }
  };

  /**
   * Render message preview with variable replacement
   */
  const renderMessagePreview = (contact) => {
    if (!reviewData?.message?.text) return '';
    
    return reviewData.message.text.replace(/\{\{(\w+)\}\}/g, (match, varName) => 
      contact.vars[varName] || match
    );
  };

  if (!reviewData) {
    return (
      <div className="step3-loading">
        <p>Loading campaign review...</p>
      </div>
    );
  }

  return (
    <div className="step3-review">
      <div className="step-header">
        <h3>Review & Launch</h3>
        <p>Review your campaign configuration and choose how to proceed.</p>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="validation-errors">
          <h4>⚠️ Issues Found</h4>
          <ul>
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
          <p>Please go back and fix these issues before publishing.</p>
        </div>
      )}

      <div className="review-content">
        {/* Campaign Overview */}
        <div className="review-section">
          <h4>Campaign Overview</h4>
          <div className="overview-grid">
            <div className="overview-item">
              <label>Name:</label>
              <span>{reviewData.meta?.name}</span>
            </div>
            <div className="overview-item">
              <label>Instance:</label>
              <span>{reviewData.meta?.instanceId}</span>
            </div>
            <div className="overview-item">
              <label>Start Time:</label>
              <span>{new Date(reviewData.meta?.startAt).toLocaleString()}</span>
            </div>
            <div className="overview-item">
              <label>End Time:</label>
              <span>{reviewData.meta?.endAt ? new Date(reviewData.meta.endAt).toLocaleString() : 'None'}</span>
            </div>
            <div className="overview-item">
              <label>Throttle:</label>
              <span className="throttle-badge">{reviewData.meta?.throttle}</span>
            </div>
            <div className="overview-item">
              <label>Dry Run:</label>
              <span className={`dry-run-badge ${reviewData.meta?.dryRun ? 'enabled' : 'disabled'}`}>
                {reviewData.meta?.dryRun ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>

        {/* Contact Summary */}
        <div className="review-section">
          <h4>Recipients Summary</h4>
          <div className="contact-stats">
            <div className="stat-card">
              <div className="stat-number">{reviewData.contacts?.valid || 0}</div>
              <div className="stat-label">Valid Contacts</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{reviewData.contacts?.invalid || 0}</div>
              <div className="stat-label">Invalid</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{reviewData.contacts?.duplicates || 0}</div>
              <div className="stat-label">Duplicates</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{calculateEstimatedTime()}</div>
              <div className="stat-label">Est. Duration</div>
            </div>
          </div>
        </div>

        {/* Message Preview */}
        <div className="review-section">
          <h4>Message Template</h4>
          <div className="message-template">
            <div className="template-text">
              {reviewData.message?.text}
            </div>
            <div className="template-meta">
              <span>Characters: {reviewData.message?.text?.length || 0}</span>
              <span>Attachments: {reviewData.message?.attachments?.length || 0}</span>
            </div>
          </div>

          {/* Sample Messages */}
          {reviewData.contacts?.rows?.length > 0 && (
            <div className="sample-messages">
              <h5>Sample Messages (First 3)</h5>
              {reviewData.contacts.rows.slice(0, 3).map(contact => (
                <div key={contact.id} className="sample-message">
                  <div className="sample-header">
                    <strong>To: {contact.phone}</strong>
                  </div>
                  <div className="sample-content">
                    {renderMessagePreview(contact)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Execution Settings */}
        <div className="review-section">
          <h4>Execution Settings</h4>
          <div className="execution-details">
            <div className="setting-item">
              <label>Batch Size:</label>
              <span>{reviewData.meta?.maxBatchSize} messages per batch</span>
            </div>
            <div className="setting-item">
              <label>Retry Policy:</label>
              <span>
                {reviewData.meta?.retryPolicy?.enabled ? 
                  `Up to ${reviewData.meta.retryPolicy.maxAttempts} attempts` : 
                  'Disabled'
                }
              </span>
            </div>
            <div className="setting-item">
              <label>Timezone:</label>
              <span>{reviewData.meta?.timezone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="review-actions">
        <button 
          type="button" 
          onClick={onBack}
          className="btn-secondary"
          disabled={loading}
        >
          Back: Recipients
        </button>
        
        <div className="publish-actions">
          <button 
            type="button" 
            onClick={() => handlePublishAction('save_draft')}
            disabled={loading}
            className="btn-outline"
          >
            Save Draft
          </button>
          
          <button 
            type="button" 
            onClick={() => handlePublishAction('create_campaign')}
            disabled={loading || validationErrors.length > 0}
            className="btn-secondary"
          >
            Create Campaign
          </button>
          
          <button 
            type="button" 
            onClick={() => handlePublishAction('create_and_schedule')}
            disabled={loading || validationErrors.length > 0}
            className="btn-primary"
          >
            Create & Schedule
          </button>
          
          <button 
            type="button" 
            onClick={() => handlePublishAction('launch_now')}
            disabled={loading || validationErrors.length > 0 || reviewData.meta?.dryRun === false}
            className="btn-danger"
          >
            Launch Now!
          </button>
        </div>
      </div>

      {/* Large Campaign Confirmation Modal */}
      {showConfirmModal && (
        <div className="confirmation-modal">
          <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}></div>
          <div className="modal-content">
            <h3>⚠️ Large Campaign Confirmation</h3>
            <p>
              You are about to create a campaign with <strong>{reviewData.contacts?.valid}</strong> contacts.
              This is a large campaign that may take significant time to complete.
            </p>
            <p>Estimated duration: <strong>{calculateEstimatedTime()}</strong></p>
            
            <div className="modal-actions">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={() => executePublishAction(publishAction)}
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Proceed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step3_Review;