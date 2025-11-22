/**
 * Step 1: Campaign Details
 * 
 * Collects campaign metadata including name, instance, timing, and execution settings.
 * Rehydrates from existing draft and validates inputs before proceeding.
 * 
 * TODO: Add instance status indicator
 * TODO: Add timezone picker component
 * TODO: Add throttle preset explanations
 * TODO: Add template save functionality
 */

import React, { useState, useEffect } from 'react';
import CampaignService from './campaignService.js';

const Step1_Details = ({ 
  draftId, 
  draftData, 
  onNext, 
  onBack, 
  isFirstStep, 
  isLastStep 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    instanceId: '',
    startAt: '',
    endAt: '',
    timezone: 'UTC',
    throttle: 'safe',
    maxBatchSize: 50,
    retryPolicy: { enabled: true, maxAttempts: 2 },
    dryRun: true,
    saveAsTemplate: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  /**
   * Rehydrate form from draft data on mount
   */
  useEffect(() => {
    const rehydrateForm = async () => {
      try {
        let dataToLoad = null;

        if (draftData) {
          dataToLoad = draftData;
        } else if (draftId) {
          // Load fresh from service if no data passed
          dataToLoad = CampaignService.getDraft(draftId);
        }

        if (dataToLoad?.meta) {
          setFormData(prev => ({
            ...prev,
            ...dataToLoad.meta
          }));
        }

        // Set default start time if not set (5 minutes from now)
        if (!dataToLoad?.meta?.startAt) {
          const defaultStart = new Date(Date.now() + 5 * 60 * 1000);
          setFormData(prev => ({
            ...prev,
            startAt: defaultStart.toISOString().slice(0, 16) // Format for datetime-local input
          }));
        }
      } catch (error) {
        console.error('Error rehydrating Step 1:', error);
      }
    };

    rehydrateForm();
  }, [draftId, draftData]);

  /**
   * Handle input changes
   */
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear related errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  /**
   * Validate form data
   */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Campaign name is required';
    }

    if (!formData.instanceId.trim()) {
      newErrors.instanceId = 'WhatsApp instance is required';
    }

    if (!formData.startAt) {
      newErrors.startAt = 'Start time is required';
    }

    if (formData.endAt && new Date(formData.startAt) >= new Date(formData.endAt)) {
      newErrors.endAt = 'End time must be after start time';
    }

    if (formData.maxBatchSize < 1 || formData.maxBatchSize > 1000) {
      newErrors.maxBatchSize = 'Batch size must be between 1 and 1000';
    }

    // TODO: Add name uniqueness validation
    // const campaigns = CampaignService.listCampaigns();
    // if (campaigns.some(c => c.meta?.name === formData.name)) {
    //   newErrors.name = 'Campaign name must be unique';
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle next step
   */
  const handleNext = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Prepare data for next step
      const stepData = {
        meta: {
          ...formData,
          startAt: new Date(formData.startAt).toISOString(),
          endAt: formData.endAt ? new Date(formData.endAt).toISOString() : null
        },
        // Preserve existing draft data
        ...(draftData || {})
      };

      await onNext(stepData);
    } catch (error) {
      console.error('Error proceeding to next step:', error);
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="step1-details">
      <div className="step-header">
        <h3>Campaign Details</h3>
        <p>Configure your campaign settings and execution parameters.</p>
      </div>

      <form className="details-form" onSubmit={(e) => e.preventDefault()}>
        {/* Basic Information */}
        <div className="form-section">
          <h4>Basic Information</h4>
          
          <div className="form-field">
            <label htmlFor="name">Campaign Name *</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter campaign name"
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <div className="field-error">{errors.name}</div>}
          </div>

          <div className="form-field">
            <label htmlFor="instanceId">WhatsApp Instance *</label>
            <select
              id="instanceId"
              value={formData.instanceId}
              onChange={(e) => handleInputChange('instanceId', e.target.value)}
              className={errors.instanceId ? 'error' : ''}
            >
              <option value="">Select instance...</option>
              <option value="inst-1">Instance 1 (Active)</option>
              <option value="inst-2">Instance 2 (Active)</option>
              {/* TODO: Load actual instances from API */}
            </select>
            {errors.instanceId && <div className="field-error">{errors.instanceId}</div>}
          </div>
        </div>

        {/* Timing */}
        <div className="form-section">
          <h4>Scheduling</h4>
          
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="startAt">Start Time *</label>
              <input
                id="startAt"
                type="datetime-local"
                value={formData.startAt}
                onChange={(e) => handleInputChange('startAt', e.target.value)}
                className={errors.startAt ? 'error' : ''}
              />
              {errors.startAt && <div className="field-error">{errors.startAt}</div>}
            </div>

            <div className="form-field">
              <label htmlFor="endAt">End Time (Optional)</label>
              <input
                id="endAt"
                type="datetime-local"
                value={formData.endAt}
                onChange={(e) => handleInputChange('endAt', e.target.value)}
                className={errors.endAt ? 'error' : ''}
              />
              {errors.endAt && <div className="field-error">{errors.endAt}</div>}
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="timezone">Timezone</label>
            <select
              id="timezone"
              value={formData.timezone}
              onChange={(e) => handleInputChange('timezone', e.target.value)}
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Asia/Kolkata">India Standard Time</option>
              {/* TODO: Add comprehensive timezone list */}
            </select>
          </div>
        </div>

        {/* Execution Settings */}
        <div className="form-section">
          <h4>Execution Settings</h4>
          
          <div className="form-field">
            <label htmlFor="throttle">Send Rate</label>
            <select
              id="throttle"
              value={formData.throttle}
              onChange={(e) => handleInputChange('throttle', e.target.value)}
            >
              <option value="safe">Safe (1 msg/sec) - Recommended</option>
              <option value="moderate">Moderate (5 msgs/sec)</option>
              <option value="fast">Fast (20 msgs/sec) - Risk of limits</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="maxBatchSize">Batch Size</label>
            <input
              id="maxBatchSize"
              type="number"
              min="1"
              max="1000"
              value={formData.maxBatchSize}
              onChange={(e) => handleInputChange('maxBatchSize', parseInt(e.target.value))}
              className={errors.maxBatchSize ? 'error' : ''}
            />
            {errors.maxBatchSize && <div className="field-error">{errors.maxBatchSize}</div>}
          </div>

          <div className="form-field checkbox-field">
            <input
              id="dryRun"
              type="checkbox"
              checked={formData.dryRun}
              onChange={(e) => handleInputChange('dryRun', e.target.checked)}
            />
            <label htmlFor="dryRun">Dry Run Mode (Test without sending)</label>
          </div>

          <div className="form-field checkbox-field">
            <input
              id="saveAsTemplate"
              type="checkbox"
              checked={formData.saveAsTemplate}
              onChange={(e) => handleInputChange('saveAsTemplate', e.target.checked)}
            />
            <label htmlFor="saveAsTemplate">Save as template for future use</label>
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
          {!isFirstStep && (
            <button 
              type="button" 
              onClick={onBack}
              className="btn-secondary"
            >
              Back
            </button>
          )}
          
          <button 
            type="button" 
            onClick={handleNext}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Saving...' : 'Next: Recipients'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Step1_Details;