/**
 * Campaign Builder - Main orchestrator component
 * 
 * Manages the multi-step campaign creation flow with persistent draft state.
 * Each navigation action saves current step data before proceeding.
 * 
 * TODO: Add visual progress indicator
 * TODO: Add validation before step transitions
 * TODO: Integrate with campaign runner for immediate execution
 */

import React, { useState, useEffect } from 'react';
import CampaignService from './campaignService.js';
import Step1_Details from './Step1_Details.jsx';
import Step2_Recipients from './Step2_Recipients.jsx';
import Step3_Review from './Step3_Review.jsx';

const CampaignBuilder = ({ initialDraftId = null, onComplete = null, onCancel = null }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [draftId, setDraftId] = useState(initialDraftId);
  const [draftData, setDraftData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Step configuration
  const steps = [
    { number: 1, title: 'Campaign Details', component: Step1_Details },
    { number: 2, title: 'Recipients & Message', component: Step2_Recipients },
    { number: 3, title: 'Review & Launch', component: Step3_Review }
  ];

  /**
   * Initialize or load existing draft
   */
  useEffect(() => {
    const initializeDraft = async () => {
      try {
        setLoading(true);
        setError(null);

        if (draftId) {
          // Load existing draft
          const draft = CampaignService.getDraft(draftId);
          if (draft) {
            setDraftData(draft);
          } else {
            setError('Draft not found');
          }
        }
        // If no draftId, we'll create one in Step1 when user provides initial data
      } catch (err) {
        console.error('Error initializing draft:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeDraft();
  }, [draftId]);

  /**
   * Navigate to next step with data persistence
   */
  const handleNext = async (stepData) => {
    try {
      setLoading(true);
      setError(null);

      // If no draftId yet (Step 1), create new draft
      if (!draftId && stepData.meta) {
        const newDraftId = CampaignService.createDraft(stepData.meta);
        setDraftId(newDraftId);
        
        // Save any additional data from Step 1
        if (Object.keys(stepData).length > 1) {
          CampaignService.saveDraft(newDraftId, stepData);
        }
        
        setDraftData(stepData);
      } else if (draftId) {
        // Update existing draft
        const success = CampaignService.saveDraft(draftId, stepData);
        if (!success) {
          throw new Error('Failed to save draft');
        }
        setDraftData(stepData);
      }

      // Navigate to next step
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
    } catch (err) {
      console.error('Error saving step data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Navigate to previous step
   */
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  /**
   * Handle campaign completion (from Step 3)
   */
  const handleComplete = (campaignId) => {
    if (onComplete) {
      onComplete(campaignId, draftId);
    }
  };

  /**
   * Handle builder cancellation
   */
  const handleCancel = () => {
    if (onCancel) {
      onCancel(draftId);
    }
  };

  // Render current step component
  const renderCurrentStep = () => {
    const StepComponent = steps[currentStep - 1].component;
    
    return (
      <StepComponent
        draftId={draftId}
        draftData={draftData}
        onNext={handleNext}
        onBack={handleBack}
        onComplete={handleComplete}
        isFirstStep={currentStep === 1}
        isLastStep={currentStep === steps.length}
      />
    );
  };

  if (loading) {
    return (
      <div className="campaign-builder-loading">
        <div className="text-center">
          <div className="loading-spinner"></div>
          <p>Loading campaign builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="campaign-builder">
      {/* Header with progress */}
      <div className="campaign-builder-header">
        <h2>Create Campaign</h2>
        <div className="step-progress">
          {steps.map((step, index) => (
            <div 
              key={step.number}
              className={`step-indicator ${
                step.number === currentStep ? 'active' : 
                step.number < currentStep ? 'completed' : 'pending'
              }`}
            >
              <div className="step-number">{step.number}</div>
              <div className="step-title">{step.title}</div>
              {index < steps.length - 1 && <div className="step-connector"></div>}
            </div>
          ))}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="campaign-builder-error">
          <div className="error-message">
            <strong>Error:</strong> {error}
            <button 
              onClick={() => setError(null)}
              className="error-dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Current step content */}
      <div className="campaign-builder-content">
        {renderCurrentStep()}
      </div>

      {/* Footer actions */}
      <div className="campaign-builder-footer">
        <div className="footer-actions">
          <button 
            onClick={handleCancel}
            className="btn-cancel"
          >
            Cancel
          </button>
          
          {draftId && (
            <div className="draft-info">
              <small>Draft ID: {draftId}</small>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignBuilder;