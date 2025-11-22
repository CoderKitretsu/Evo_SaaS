/**
 * Campaign Service Layer
 * 
 * High-level API for campaign management that provides business logic,
 * validation, and clean interface over the storage adapter.
 * 
 * TODO: implement server adapter (Postgres) and server runner
 * TODO: migrate runner to server for durability
 */

import { CampaignLocalStorageAdapter } from './CampaignLocalStorageAdapter.js';

/**
 * Generate a unique ID with timestamp and random component
 * @param {string} prefix - Prefix for the ID (e.g., 'draft', 'campaign')
 * @returns {string} - Unique identifier
 */
function generateId(prefix = 'id') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Validate campaign name uniqueness across all campaigns
 * @param {string} name - Campaign name to check
 * @param {string} excludeCampaignId - Campaign ID to exclude from check (for updates)
 * @returns {boolean} - True if name is unique
 */
function validateUniqueName(name, excludeCampaignId = null) {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return false;
  }

  const existingCampaigns = CampaignLocalStorageAdapter.listCampaigns();
  return !existingCampaigns.some(campaign => 
    campaign.meta?.name?.toLowerCase() === name.toLowerCase() && 
    campaign.campaignId !== excludeCampaignId
  );
}

/**
 * Validate that campaign has at least one valid contact
 * @param {Object} draftData - Draft data to validate
 * @returns {boolean} - True if has valid contacts
 */
function validateHasValidContacts(draftData) {
  if (!draftData?.contacts) {
    return false;
  }

  const validCount = draftData.contacts.valid || 0;
  return validCount > 0;
}

/**
 * Validate draft data structure for publishing
 * @param {Object} draftData - Draft data to validate
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
function validateDraftForPublishing(draftData) {
  const errors = [];

  // Check required meta fields
  if (!draftData?.meta) {
    errors.push('Campaign meta information is required');
  } else {
    if (!draftData.meta.name || draftData.meta.name.trim().length === 0) {
      errors.push('Campaign name is required');
    }
    if (!draftData.meta.instanceId) {
      errors.push('Instance ID is required');
    }
    if (!draftData.meta.startAt) {
      errors.push('Start time is required');
    }
  }

  // Check contacts
  if (!validateHasValidContacts(draftData)) {
    errors.push('At least one valid contact is required');
  }

  // Check message
  if (!draftData?.message?.text || draftData.message.text.trim().length === 0) {
    errors.push('Message text is required');
  }

  // Check name uniqueness
  if (draftData?.meta?.name && !validateUniqueName(draftData.meta.name)) {
    errors.push('Campaign name must be unique');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Campaign Service API
 */
const CampaignService = {
  /**
   * Create a new draft with initial metadata
   * @param {Object} initialMeta - Initial campaign metadata
   * @param {string} initialMeta.name - Campaign name
   * @param {string} initialMeta.instanceId - WhatsApp instance ID
   * @param {string} [initialMeta.startAt] - ISO string for start time
   * @param {string} [initialMeta.endAt] - ISO string for end time
   * @param {string} [initialMeta.timezone='UTC'] - IANA timezone
   * @param {string} [initialMeta.throttle='safe'] - Throttle setting
   * @param {number} [initialMeta.maxBatchSize=50] - Max batch size
   * @param {boolean} [initialMeta.dryRun=true] - Dry run mode
   * @returns {string} - Draft ID
   * @throws {Error} - If validation fails or storage error
   */
  createDraft(initialMeta) {
    try {
      if (!initialMeta || typeof initialMeta !== 'object') {
        throw new Error('Initial meta data is required');
      }

      if (!initialMeta.name || typeof initialMeta.name !== 'string') {
        throw new Error('Campaign name is required');
      }

      if (!initialMeta.instanceId || typeof initialMeta.instanceId !== 'string') {
        throw new Error('Instance ID is required');
      }

      // Check name uniqueness
      if (!validateUniqueName(initialMeta.name)) {
        throw new Error('Campaign name must be unique');
      }

      const draftId = generateId('draft');
      const now = new Date().toISOString();

      // Set defaults for optional fields
      const draftData = {
        draftId,
        meta: {
          name: initialMeta.name.trim(),
          instanceId: initialMeta.instanceId,
          startAt: initialMeta.startAt || new Date(Date.now() + 5 * 60 * 1000).toISOString(), // +5 minutes default
          endAt: initialMeta.endAt || null,
          timezone: initialMeta.timezone || 'UTC',
          throttle: initialMeta.throttle || 'safe',
          maxBatchSize: initialMeta.maxBatchSize || 50,
          retryPolicy: initialMeta.retryPolicy || { enabled: true, maxAttempts: 2 },
          dryRun: initialMeta.dryRun !== undefined ? initialMeta.dryRun : true
        },
        contacts: {
          total: 0,
          valid: 0,
          invalid: 0,
          duplicates: 0,
          rows: []
        },
        message: {
          text: '',
          templateHash: '',
          attachments: []
        },
        createdAt: now,
        updatedAt: now
      };

      const success = CampaignLocalStorageAdapter.saveDraft(draftId, draftData);
      if (!success) {
        throw new Error('Failed to save draft to storage');
      }

      return draftId;
    } catch (error) {
      console.error('Error creating draft:', error);
      throw error;
    }
  },

  /**
   * Save draft data to storage
   * @param {string} draftId - Draft identifier
   * @param {Object} draftData - Draft data to save
   * @returns {boolean} - Success status
   * @throws {Error} - If validation fails or storage error
   */
  saveDraft(draftId, draftData) {
    try {
      if (!draftId || typeof draftId !== 'string') {
        throw new Error('Valid draft ID is required');
      }

      if (!draftData || typeof draftData !== 'object') {
        throw new Error('Draft data is required');
      }

      // Ensure draftId is set correctly
      const dataToSave = {
        ...draftData,
        draftId,
        updatedAt: new Date().toISOString()
      };

      const success = CampaignLocalStorageAdapter.saveDraft(draftId, dataToSave);
      if (!success) {
        throw new Error('Failed to save draft to storage');
      }

      return true;
    } catch (error) {
      console.error('Error saving draft:', error);
      throw error;
    }
  },

  /**
   * Get draft data from storage
   * @param {string} draftId - Draft identifier
   * @returns {Object|null} - Draft data or null if not found
   * @throws {Error} - If draftId is invalid
   */
  getDraft(draftId) {
    try {
      if (!draftId || typeof draftId !== 'string') {
        throw new Error('Valid draft ID is required');
      }

      return CampaignLocalStorageAdapter.getDraft(draftId);
    } catch (error) {
      console.error('Error getting draft:', error);
      throw error;
    }
  },

  /**
   * Publish a draft as a campaign with validation and status assignment
   * @param {string} draftId - Draft identifier to publish
   * @param {Object} [options={}] - Publishing options
   * @param {boolean} [options.startScheduled=false] - Whether to set status as 'Scheduled'
   * @param {boolean} [options.validateOnly=false] - Only validate, don't actually publish
   * @returns {string} - Campaign ID
   * @throws {Error} - If validation fails or publishing error
   */
  publishDraftAsCampaign(draftId, options = {}) {
    try {
      if (!draftId || typeof draftId !== 'string') {
        throw new Error('Valid draft ID is required');
      }

      // Get draft data
      const draftData = CampaignLocalStorageAdapter.getDraft(draftId);
      if (!draftData) {
        throw new Error('Draft not found');
      }

      // Validate draft for publishing
      const validation = validateDraftForPublishing(draftData);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // If validation only, return success
      if (options.validateOnly) {
        return 'validation-passed';
      }

      // Generate stable campaign ID
      const campaignId = generateId('campaign');
      const now = new Date().toISOString();

      // Determine status
      const startAt = new Date(draftData.meta.startAt);
      const currentTime = new Date();
      let status = 'Draft';

      if (options.startScheduled) {
        if (startAt <= currentTime) {
          status = 'Scheduled'; // Runner will pick this up immediately
        } else {
          status = 'Scheduled';
        }
      }

      // Create campaign record
      const campaignData = {
        // Copy all draft data
        ...draftData,
        // Campaign-specific fields
        campaignId,
        status,
        progress: {
          sent: 0,
          failed: 0,
          pending: draftData.contacts?.valid || 0
        },
        perContact: {}, // Will be populated during execution
        lastError: null,
        // Remove draft-specific fields
        draftId: undefined,
        // Update timestamps
        publishedAt: now,
        updatedAt: now
      };

      // Save to campaign storage
      const success = CampaignLocalStorageAdapter.saveCampaign(campaignId, campaignData);
      if (!success) {
        throw new Error('Failed to save campaign to storage');
      }

      // Optionally clean up draft (keep for now, let user decide)
      // CampaignLocalStorageAdapter.deleteDraft(draftId);

      return campaignId;
    } catch (error) {
      console.error('Error publishing draft as campaign:', error);
      throw error;
    }
  },

  /**
   * Start a campaign (set status to Running if conditions are met)
   * @param {string} campaignId - Campaign identifier
   * @returns {boolean} - Success status
   * @throws {Error} - If campaign not found or invalid state
   */
  startCampaign(campaignId) {
    try {
      if (!campaignId || typeof campaignId !== 'string') {
        throw new Error('Valid campaign ID is required');
      }

      const campaign = CampaignLocalStorageAdapter.getCampaign(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Check if campaign can be started
      const validStartStates = ['Draft', 'Scheduled', 'Paused'];
      if (!validStartStates.includes(campaign.status)) {
        throw new Error(`Cannot start campaign with status: ${campaign.status}`);
      }

      // Update status and start time if needed
      const updates = {
        status: 'Running',
        updatedAt: new Date().toISOString()
      };

      // If starting immediately, update startAt
      if (campaign.status === 'Draft') {
        updates.meta = {
          ...campaign.meta,
          startAt: new Date().toISOString()
        };
      }

      const success = CampaignLocalStorageAdapter.updateCampaign(campaignId, updates);
      if (!success) {
        throw new Error('Failed to update campaign status');
      }

      return true;
    } catch (error) {
      console.error('Error starting campaign:', error);
      throw error;
    }
  },

  /**
   * Pause a running campaign
   * @param {string} campaignId - Campaign identifier
   * @returns {boolean} - Success status
   * @throws {Error} - If campaign not found or invalid state
   */
  pauseCampaign(campaignId) {
    try {
      if (!campaignId || typeof campaignId !== 'string') {
        throw new Error('Valid campaign ID is required');
      }

      const campaign = CampaignLocalStorageAdapter.getCampaign(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      if (campaign.status !== 'Running') {
        throw new Error(`Cannot pause campaign with status: ${campaign.status}`);
      }

      const success = CampaignLocalStorageAdapter.updateCampaign(campaignId, {
        status: 'Paused',
        updatedAt: new Date().toISOString()
      });

      if (!success) {
        throw new Error('Failed to update campaign status');
      }

      return true;
    } catch (error) {
      console.error('Error pausing campaign:', error);
      throw error;
    }
  },

  /**
   * Resume a paused campaign
   * @param {string} campaignId - Campaign identifier
   * @returns {boolean} - Success status
   * @throws {Error} - If campaign not found or invalid state
   */
  resumeCampaign(campaignId) {
    try {
      if (!campaignId || typeof campaignId !== 'string') {
        throw new Error('Valid campaign ID is required');
      }

      const campaign = CampaignLocalStorageAdapter.getCampaign(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      if (campaign.status !== 'Paused') {
        throw new Error(`Cannot resume campaign with status: ${campaign.status}`);
      }

      const success = CampaignLocalStorageAdapter.updateCampaign(campaignId, {
        status: 'Running',
        updatedAt: new Date().toISOString()
      });

      if (!success) {
        throw new Error('Failed to update campaign status');
      }

      return true;
    } catch (error) {
      console.error('Error resuming campaign:', error);
      throw error;
    }
  },

  /**
   * Cancel a campaign (set status to Cancelled)
   * @param {string} campaignId - Campaign identifier
   * @returns {boolean} - Success status
   * @throws {Error} - If campaign not found or already completed
   */
  cancelCampaign(campaignId) {
    try {
      if (!campaignId || typeof campaignId !== 'string') {
        throw new Error('Valid campaign ID is required');
      }

      const campaign = CampaignLocalStorageAdapter.getCampaign(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Check if campaign can be cancelled
      const validCancelStates = ['Draft', 'Scheduled', 'Running', 'Paused', 'Error'];
      if (!validCancelStates.includes(campaign.status)) {
        throw new Error(`Cannot cancel campaign with status: ${campaign.status}`);
      }

      const success = CampaignLocalStorageAdapter.updateCampaign(campaignId, {
        status: 'Cancelled',
        updatedAt: new Date().toISOString()
      });

      if (!success) {
        throw new Error('Failed to update campaign status');
      }

      return true;
    } catch (error) {
      console.error('Error cancelling campaign:', error);
      throw error;
    }
  },

  /**
   * List all campaigns with optional filtering
   * @param {Object} [filters={}] - Optional filters
   * @param {string} [filters.status] - Filter by status
   * @param {string} [filters.instanceId] - Filter by instance ID
   * @returns {Array} - Array of campaign objects
   */
  listCampaigns(filters = {}) {
    try {
      let campaigns = CampaignLocalStorageAdapter.listCampaigns();

      // Apply filters
      if (filters.status) {
        campaigns = campaigns.filter(c => c.status === filters.status);
      }

      if (filters.instanceId) {
        campaigns = campaigns.filter(c => c.meta?.instanceId === filters.instanceId);
      }

      // Sort by creation date (newest first)
      campaigns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return campaigns;
    } catch (error) {
      console.error('Error listing campaigns:', error);
      return [];
    }
  },

  /**
   * List all drafts
   * @returns {Array} - Array of draft objects
   */
  listDrafts() {
    try {
      const drafts = CampaignLocalStorageAdapter.listDrafts();
      
      // Sort by creation date (newest first)
      drafts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return drafts;
    } catch (error) {
      console.error('Error listing drafts:', error);
      return [];
    }
  },

  /**
   * Update campaign data (partial update)
   * @param {string} campaignId - Campaign identifier
   * @param {Object} updates - Partial data to update
   * @returns {boolean} - Success status
   * @throws {Error} - If campaign not found or update fails
   */
  updateCampaign(campaignId, updates) {
    try {
      if (!campaignId || typeof campaignId !== 'string') {
        throw new Error('Valid campaign ID is required');
      }

      if (!updates || typeof updates !== 'object') {
        throw new Error('Updates object is required');
      }

      // Ensure campaignId cannot be overridden
      const safeUpdates = {
        ...updates,
        campaignId, // Ensure ID is preserved
        updatedAt: new Date().toISOString()
      };

      const success = CampaignLocalStorageAdapter.updateCampaign(campaignId, safeUpdates);
      if (!success) {
        throw new Error('Failed to update campaign');
      }

      return true;
    } catch (error) {
      console.error('Error updating campaign:', error);
      throw error;
    }
  },

  /**
   * Delete a campaign (wrapper around adapter)
   * @param {string} campaignId - Campaign identifier
   * @returns {boolean} - Success status
   * @throws {Error} - If campaign not found or delete fails
   */
  deleteCampaign(campaignId) {
    try {
      if (!campaignId || typeof campaignId !== 'string') {
        throw new Error('Valid campaign ID is required');
      }

      const success = CampaignLocalStorageAdapter.deleteCampaign(campaignId);
      if (!success) {
        throw new Error('Failed to delete campaign');
      }

      return true;
    } catch (error) {
      console.error('Error deleting campaign:', error);
      throw error;
    }
  },

  /**
   * Delete a draft (wrapper around adapter)
   * @param {string} draftId - Draft identifier
   * @returns {boolean} - Success status
   * @throws {Error} - If draft not found or delete fails
   */
  deleteDraft(draftId) {
    try {
      if (!draftId || typeof draftId !== 'string') {
        throw new Error('Valid draft ID is required');
      }

      const success = CampaignLocalStorageAdapter.deleteDraft(draftId);
      if (!success) {
        throw new Error('Failed to delete draft');
      }

      return true;
    } catch (error) {
      console.error('Error deleting draft:', error);
      throw error;
    }
  }
};

export default CampaignService;
export { CampaignService, validateUniqueName, validateHasValidContacts };