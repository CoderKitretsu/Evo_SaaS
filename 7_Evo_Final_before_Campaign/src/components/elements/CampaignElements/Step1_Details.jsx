/**
 * Step 1: Campaign Details
 * 
 * Collects campaign metadata including name, instance, timing, and execution settings.
 * Rehydrates from existing draft and validates inputs before proceeding.
 * Validates campaign name uniqueness and provides comprehensive form validation.
 */

import React, { useState, useEffect, useRef } from 'react';
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
  const [validating, setValidating] = useState(false);
  const nameInputRef = useRef(null);

  // Available instances (TODO: Load from API)
  const availableInstances = [
    { id: 'inst-1', name: 'Instance 1', status: 'Active', phone: '+1234567890' },
    { id: 'inst-2', name: 'Instance 2', status: 'Active', phone: '+1234567891' },
    { id: 'inst-3', name: 'Instance 3', status: 'Inactive', phone: '+1234567892' }
  ];

  // Throttle options with descriptions
  const throttleOptions = [
    { 
      value: 'safe', 
      label: 'Safe (1 msg/sec)', 
      description: 'Recommended for most campaigns. Minimal risk of rate limits.',
      color: 'green'
    },
    { 
      value: 'moderate', 
      label: 'Moderate (5 msgs/sec)', 
      description: 'Faster sending with moderate risk. Monitor for limits.',
      color: 'orange'
    },
    { 
      value: 'fast', 
      label: 'Fast (20 msgs/sec)', 
      description: 'Maximum speed with high risk of rate limiting. Use carefully.',
      color: 'red'
    }
  ];

  /**
   * Auto-detect user's timezone
   */
  const detectTimezone = () => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
      return 'UTC';
    }
  };

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
          // Convert ISO timestamps back to datetime-local format
          const rehydratedData = {
            ...dataToLoad.meta
          };

          if (rehydratedData.startAt) {
            rehydratedData.startAt = new Date(rehydratedData.startAt).toISOString().slice(0, 16);
          }

          if (rehydratedData.endAt) {
            rehydratedData.endAt = new Date(rehydratedData.endAt).toISOString().slice(0, 16);
          }

          setFormData(prev => ({
            ...prev,
            ...rehydratedData
          }));
        } else {
          // Set defaults for new campaign
          const defaultStart = new Date(Date.now() + 5 * 60 * 1000);
          const detectedTimezone = detectTimezone();
          
          setFormData(prev => ({
            ...prev,
            startAt: defaultStart.toISOString().slice(0, 16),
            timezone: detectedTimezone
          }));
        }
      } catch (error) {
        console.error('Error rehydrating Step 1:', error);
        setErrors({ general: 'Failed to load campaign data' });
      }
    };

    rehydrateForm();
  }, [draftId, draftData]);

  /**
   * Focus on name field when component mounts
   */
  useEffect(() => {
    if (nameInputRef.current && !formData.name) {
      nameInputRef.current.focus();
    }
  }, []);

  /**
   * Handle input changes with validation
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

    // Special handling for nested objects
    if (field === 'retryEnabled') {
      setFormData(prev => ({
        ...prev,
        retryPolicy: { ...prev.retryPolicy, enabled: value }
      }));
    } else if (field === 'retryAttempts') {
      setFormData(prev => ({
        ...prev,
        retryPolicy: { ...prev.retryPolicy, maxAttempts: parseInt(value) || 2 }
      }));
    }
  };

  /**
   * Validate campaign name uniqueness
   */
  const validateNameUniqueness = async (name) => {
    if (!name || !name.trim()) return true;

    try {
      setValidating(true);
      const existingCampaigns = CampaignService.listCampaigns();
      
      // Check if name exists (case-insensitive), excluding current campaign if editing
      const isDuplicate = existingCampaigns.some(campaign => 
        campaign.meta?.name?.toLowerCase() === name.toLowerCase() &&
        campaign.campaignId !== draftId // Allow editing same campaign
      );

      return !isDuplicate;
    } catch (error) {
      console.error('Error validating name uniqueness:', error);
      return true; // Allow if validation fails
    } finally {
      setValidating(false);
    }
  };

  /**
   * Handle name blur for uniqueness validation
   */
  const handleNameBlur = async () => {
    if (formData.name.trim()) {
      const isUnique = await validateNameUniqueness(formData.name.trim());
      if (!isUnique) {
        setErrors(prev => ({
          ...prev,
          name: 'Campaign name must be unique'
        }));
      }
    }
  };

  /**
   * Validate form data comprehensively
   */
  const validateForm = async () => {
    const newErrors = {};

    // Required field validation
    if (!formData.name.trim()) {
      newErrors.name = 'Campaign name is required';
    } else {
      // Check name uniqueness
      const isUnique = await validateNameUniqueness(formData.name.trim());
      if (!isUnique) {
        newErrors.name = 'Campaign name must be unique';
      }
    }

    if (!formData.instanceId.trim()) {
      newErrors.instanceId = 'WhatsApp instance is required';
    }

    if (!formData.startAt) {
      newErrors.startAt = 'Start time is required';
    } else {
      // Validate start time is not in the past
      const startTime = new Date(formData.startAt);
      const now = new Date();
      if (startTime < now) {
        newErrors.startAt = 'Start time cannot be in the past';
      }
    }

    // End time validation
    if (formData.endAt) {
      const startTime = new Date(formData.startAt);
      const endTime = new Date(formData.endAt);
      if (endTime <= startTime) {
        newErrors.endAt = 'End time must be after start time';
      }
    }

    // Batch size validation
    if (formData.maxBatchSize < 1 || formData.maxBatchSize > 1000) {
      newErrors.maxBatchSize = 'Batch size must be between 1 and 1000';
    }

    // Retry attempts validation
    if (formData.retryPolicy.enabled && 
        (formData.retryPolicy.maxAttempts < 1 || formData.retryPolicy.maxAttempts > 10)) {
      newErrors.retryAttempts = 'Retry attempts must be between 1 and 10';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleNext = async () => {
    const isValid = await validateForm();
    if (!isValid) {
      // Focus on first error field
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField && document.querySelector(`[name="${firstErrorField}"]`)) {
        document.querySelector(`[name="${firstErrorField}"]`).focus();
      }
      return;
    }

    try {
      setLoading(true);

      // Prepare meta data with proper ISO timestamps
      const metaData = {
        name: formData.name.trim(),
        instanceId: formData.instanceId,
        startAt: new Date(formData.startAt).toISOString(),
        endAt: formData.endAt ? new Date(formData.endAt).toISOString() : null,
        timezone: formData.timezone,
        throttle: formData.throttle,
        maxBatchSize: parseInt(formData.maxBatchSize),
        retryPolicy: {
          enabled: formData.retryPolicy.enabled,
          maxAttempts: parseInt(formData.retryPolicy.maxAttempts)
        },
        dryRun: formData.dryRun,
        saveAsTemplate: formData.saveAsTemplate
      };

      // Prepare step data preserving existing draft data
      const stepData = {
        meta: metaData,
        // Preserve existing draft data (contacts, message, etc.)
        ...(draftData || {})
      };

      // Call onNext which will handle saving via CampaignBuilder
      await onNext(stepData);

    } catch (error) {
      console.error('Error proceeding to next step:', error);
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = (event) => {
    // Ctrl/Cmd + Enter to submit
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      handleNext();
    }
  };

  return (
    <div className="step1-details" onKeyDown={handleKeyDown}>
      <div className="step-header">
        <h3 id="step1-title">Campaign Details</h3>
        <p>Configure your campaign settings and execution parameters.</p>
      </div>

      {errors.general && (
        <div className="form-error" role="alert" aria-live="polite">
          <strong>Error:</strong> {errors.general}
        </div>
      )}

      <form className="details-form" onSubmit={(e) => e.preventDefault()} aria-labelledby="step1-title">
        {/* Basic Information */}
        <div className="form-section">
          <h4>Basic Information</h4>
          
          <div className="form-field">
            <label htmlFor="campaignName">Campaign Name *</label>
            <div className="input-with-validation">
              <input
                ref={nameInputRef}
                id="campaignName"
                name="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                onBlur={handleNameBlur}
                placeholder="Enter a unique campaign name"
                className={errors.name ? 'error' : ''}
                aria-describedby={errors.name ? 'name-error' : 'name-help'}
                aria-invalid={errors.name ? 'true' : 'false'}
                required
                autoComplete="off"
              />
              {validating && <span className="validation-spinner" aria-label="Validating name uniqueness">⏳</span>}
            </div>
            <div id="name-help" className="field-help">
              Choose a descriptive name that's easy to identify later
            </div>
            {errors.name && (
              <div id="name-error" className="field-error" role="alert" aria-live="polite">
                {errors.name}
              </div>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="instanceId">WhatsApp Instance *</label>
            <select
              id="instanceId"
              name="instanceId"
              value={formData.instanceId}
              onChange={(e) => handleInputChange('instanceId', e.target.value)}
              className={errors.instanceId ? 'error' : ''}
              aria-describedby={errors.instanceId ? 'instance-error' : 'instance-help'}
              aria-invalid={errors.instanceId ? 'true' : 'false'}
              required
            >
              <option value="">Select WhatsApp instance...</option>
              {availableInstances.map(instance => (
                <option 
                  key={instance.id} 
                  value={instance.id}
                  disabled={instance.status !== 'Active'}
                >
                  {instance.name} ({instance.status}) - {instance.phone}
                </option>
              ))}
            </select>
            <div id="instance-help" className="field-help">
              Choose the WhatsApp instance to send messages from
            </div>
            {errors.instanceId && (
              <div id="instance-error" className="field-error" role="alert">
                {errors.instanceId}
              </div>
            )}
          </div>
        </div>

        {/* Scheduling */}
        <div className="form-section">
          <h4>Scheduling</h4>
          
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="startAt">Start Time *</label>
              <input
                id="startAt"
                name="startAt"
                type="datetime-local"
                value={formData.startAt}
                onChange={(e) => handleInputChange('startAt', e.target.value)}
                className={errors.startAt ? 'error' : ''}
                aria-describedby={errors.startAt ? 'start-error' : 'start-help'}
                aria-invalid={errors.startAt ? 'true' : 'false'}
                required
              />
              <div id="start-help" className="field-help">
                Campaign will start automatically at this time
              </div>
              {errors.startAt && (
                <div id="start-error" className="field-error" role="alert">
                  {errors.startAt}
                </div>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="endAt">End Time (Optional)</label>
              <input
                id="endAt"
                name="endAt"
                type="datetime-local"
                value={formData.endAt}
                onChange={(e) => handleInputChange('endAt', e.target.value)}
                className={errors.endAt ? 'error' : ''}
                aria-describedby={errors.endAt ? 'end-error' : 'end-help'}
                aria-invalid={errors.endAt ? 'true' : 'false'}
              />
              <div id="end-help" className="field-help">
                Campaign will stop automatically at this time
              </div>
              {errors.endAt && (
                <div id="end-error" className="field-error" role="alert">
                  {errors.endAt}
                </div>
              )}
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="timezone">Timezone</label>
            <select
              id="timezone"
              name="timezone"
              value={formData.timezone}
              onChange={(e) => handleInputChange('timezone', e.target.value)}
              aria-describedby="timezone-help"
            >
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Paris (CET)</option>
              <option value="Asia/Kolkata">India Standard Time (IST)</option>
              <option value="Asia/Tokyo">Japan Standard Time (JST)</option>
              <option value="Australia/Sydney">Australian Eastern Time (AET)</option>
            </select>
            <div id="timezone-help" className="field-help">
              Times will be interpreted in this timezone (auto-detected: {detectTimezone()})
            </div>
          </div>
        </div>

        {/* Execution Settings */}
        <div className="form-section">
          <h4>Execution Settings</h4>
          
          <div className="form-field">
            <label htmlFor="throttle">Send Rate</label>
            <div className="throttle-options">
              {throttleOptions.map(option => (
                <label 
                  key={option.value} 
                  className={`throttle-option ${formData.throttle === option.value ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="throttle"
                    value={option.value}
                    checked={formData.throttle === option.value}
                    onChange={(e) => handleInputChange('throttle', e.target.value)}
                    aria-describedby={`throttle-${option.value}-desc`}
                  />
                  <div className="throttle-label">
                    <span className={`throttle-badge ${option.color}`}>{option.label}</span>
                  </div>
                  <div id={`throttle-${option.value}-desc`} className="throttle-description">
                    {option.description}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="maxBatchSize">Batch Size</label>
              <input
                id="maxBatchSize"
                name="maxBatchSize"
                type="number"
                min="1"
                max="1000"
                step="1"
                value={formData.maxBatchSize}
                onChange={(e) => handleInputChange('maxBatchSize', e.target.value)}
                className={errors.maxBatchSize ? 'error' : ''}
                aria-describedby={errors.maxBatchSize ? 'batch-error' : 'batch-help'}
                aria-invalid={errors.maxBatchSize ? 'true' : 'false'}
              />
              <div id="batch-help" className="field-help">
                Number of messages to process in each batch (1-1000)
              </div>
              {errors.maxBatchSize && (
                <div id="batch-error" className="field-error" role="alert">
                  {errors.maxBatchSize}
                </div>
              )}
            </div>

            <div className="form-field">
              <fieldset className="retry-fieldset">
                <legend>Retry Policy</legend>
                
                <div className="checkbox-field">
                  <input
                    id="retryEnabled"
                    name="retryEnabled"
                    type="checkbox"
                    checked={formData.retryPolicy.enabled}
                    onChange={(e) => handleInputChange('retryEnabled', e.target.checked)}
                    aria-describedby="retry-help"
                  />
                  <label htmlFor="retryEnabled">Enable automatic retries</label>
                </div>

                {formData.retryPolicy.enabled && (
                  <div className="retry-attempts">
                    <label htmlFor="retryAttempts">Max Attempts</label>
                    <input
                      id="retryAttempts"
                      name="retryAttempts"
                      type="number"
                      min="1"
                      max="10"
                      step="1"
                      value={formData.retryPolicy.maxAttempts}
                      onChange={(e) => handleInputChange('retryAttempts', e.target.value)}
                      className={errors.retryAttempts ? 'error' : ''}
                      aria-describedby={errors.retryAttempts ? 'retry-error' : 'retry-attempts-help'}
                      aria-invalid={errors.retryAttempts ? 'true' : 'false'}
                    />
                    <div id="retry-attempts-help" className="field-help">
                      Number of retry attempts for failed messages
                    </div>
                    {errors.retryAttempts && (
                      <div id="retry-error" className="field-error" role="alert">
                        {errors.retryAttempts}
                      </div>
                    )}
                  </div>
                )}

                <div id="retry-help" className="field-help">
                  Automatically retry failed messages with exponential backoff
                </div>
              </fieldset>
            </div>
          </div>

          <div className="form-options">
            <div className="checkbox-field">
              <input
                id="dryRun"
                name="dryRun"
                type="checkbox"
                checked={formData.dryRun}
                onChange={(e) => handleInputChange('dryRun', e.target.checked)}
                aria-describedby="dryrun-help"
              />
              <label htmlFor="dryRun">
                <strong>Dry Run Mode</strong> (Recommended for testing)
              </label>
              <div id="dryrun-help" className="field-help">
                Simulate the campaign without actually sending messages
              </div>
            </div>

            <div className="checkbox-field">
              <input
                id="saveAsTemplate"
                name="saveAsTemplate"
                type="checkbox"
                checked={formData.saveAsTemplate}
                onChange={(e) => handleInputChange('saveAsTemplate', e.target.checked)}
                aria-describedby="template-help"
              />
              <label htmlFor="saveAsTemplate">Save as template</label>
              <div id="template-help" className="field-help">
                Save these settings as a template for future campaigns
              </div>
            </div>
          </div>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="form-error" role="alert" aria-live="polite">
            <strong>Submission Error:</strong> {errors.submit}
          </div>
        )}

        {/* Keyboard Shortcuts Help */}
        <div className="keyboard-shortcuts" aria-label="Keyboard shortcuts">
          <small>💡 Tip: Press <kbd>Ctrl+Enter</kbd> (or <kbd>Cmd+Enter</kbd> on Mac) to proceed to next step</small>
        </div>

        {/* Actions */}
        <div className="form-actions">
          {!isFirstStep && (
            <button 
              type="button" 
              onClick={onBack}
              className="btn-secondary"
              disabled={loading}
              aria-label="Go back to previous step"
            >
              ← Back
            </button>
          )}
          
          <button 
            type="submit" 
            onClick={handleNext}
            disabled={loading || validating}
            className="btn-primary"
            aria-describedby="next-button-help"
          >
            {loading ? (
              <>
                <span aria-hidden="true">⏳</span> Saving...
              </>
            ) : validating ? (
              <>
                <span aria-hidden="true">🔍</span> Validating...
              </>
            ) : (
              <>
                Next: Recipients <span aria-hidden="true">→</span>
              </>
            )}
          </button>
          
          <div id="next-button-help" className="button-help">
            {Object.keys(errors).length > 0 
              ? 'Please fix validation errors before proceeding' 
              : 'Proceed to configure recipients and message'
            }
          </div>
        </div>

        {/* Form Progress Indicator */}
        <div className="form-progress" aria-label="Form completion progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${Math.round((
                  (formData.name ? 20 : 0) +
                  (formData.instanceId ? 20 : 0) +
                  (formData.startAt ? 20 : 0) +
                  (formData.throttle ? 20 : 0) +
                  (formData.maxBatchSize ? 20 : 0)
                ))}%` 
              }}
              aria-hidden="true"
            />
          </div>
          <div className="progress-text">
            Form completion: {Math.round((
              (formData.name ? 20 : 0) +
              (formData.instanceId ? 20 : 0) +
              (formData.startAt ? 20 : 0) +
              (formData.throttle ? 20 : 0) +
              (formData.maxBatchSize ? 20 : 0)
            ))}%
          </div>
        </div>
      </form>

      {/* Development Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="debug-info">
          <summary>🔧 Debug Info</summary>
          <pre>{JSON.stringify({ formData, errors, draftId }, null, 2)}</pre>
        </details>
      )}
    </div>
  );
};

export default Step1_Details;