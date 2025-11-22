/**
 * Campaign Local Storage Adapter
 * 
 * Handles all localStorage operations for campaign data with atomic operations
 * and proper error handling. Uses evosaa.campaigns.* namespace exclusively.
 * 
 * TODO: implement server adapter (Postgres) and server runner
 */

const CAMPAIGN_NAMESPACE = 'evosaa.campaigns';
const INDEX_KEY = `${CAMPAIGN_NAMESPACE}.index`;
const DRAFT_PREFIX = `${CAMPAIGN_NAMESPACE}.draft`;
const CAMPAIGN_PREFIX = `${CAMPAIGN_NAMESPACE}.campaign`;

// Maximum retry attempts for atomic operations
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Atomic read-modify-write operation for campaign index
 * @param {Function} modifier - Function that takes current array and returns new array
 * @returns {boolean} - Success status
 */
function atomicIndexUpdate(modifier) {
  let attempts = 0;
  
  while (attempts < MAX_RETRY_ATTEMPTS) {
    try {
      const currentIndex = JSON.parse(localStorage.getItem(INDEX_KEY) || '[]');
      const newIndex = modifier(currentIndex);
      
      // Validate that modifier returned an array
      if (!Array.isArray(newIndex)) {
        console.error('Index modifier must return an array');
        return false;
      }
      
      localStorage.setItem(INDEX_KEY, JSON.stringify(newIndex));
      return true;
    } catch (error) {
      attempts++;
      console.warn(`Atomic index update attempt ${attempts} failed:`, error);
      
      if (attempts >= MAX_RETRY_ATTEMPTS) {
        console.error('Atomic index update failed after max retries:', error);
        return false;
      }
      
      // Small delay before retry
      setTimeout(() => {}, 10);
    }
  }
  
  return false;
}

/**
 * Safe JSON parse with error handling
 * @param {string} data - JSON string to parse
 * @param {*} defaultValue - Default value if parse fails
 * @returns {*} - Parsed data or default value
 */
function safeJsonParse(data, defaultValue = null) {
  try {
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error('JSON parse error:', error);
    return defaultValue;
  }
}

/**
 * Safe JSON stringify with error handling
 * @param {*} data - Data to stringify
 * @returns {string|null} - Stringified data or null on error
 */
function safeJsonStringify(data) {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('JSON stringify error:', error);
    return null;
  }
}

/**
 * Campaign Local Storage Adapter
 * All functions return null on error and log detailed error messages
 */
const CampaignLocalStorageAdapter = {
  /**
   * Save a draft to localStorage
   * @param {string} draftId - Unique draft identifier
   * @param {Object} draftData - Draft object to save
   * @returns {boolean} - Success status
   */
  saveDraft(draftId, draftData) {
    try {
      if (!draftId || typeof draftId !== 'string') {
        console.error('Invalid draftId provided to saveDraft');
        return false;
      }
      
      const key = `${DRAFT_PREFIX}.${draftId}`;
      const serialized = safeJsonStringify({
        ...draftData,
        draftId,
        updatedAt: new Date().toISOString()
      });
      
      if (serialized === null) {
        return false;
      }
      
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error('Error saving draft:', error);
      return false;
    }
  },

  /**
   * Get a draft from localStorage
   * @param {string} draftId - Draft identifier
   * @returns {Object|null} - Draft data or null if not found/error
   */
  getDraft(draftId) {
    try {
      if (!draftId || typeof draftId !== 'string') {
        console.error('Invalid draftId provided to getDraft');
        return null;
      }
      
      const key = `${DRAFT_PREFIX}.${draftId}`;
      const data = localStorage.getItem(key);
      return safeJsonParse(data);
    } catch (error) {
      console.error('Error getting draft:', error);
      return null;
    }
  },

  /**
   * Delete a draft from localStorage
   * @param {string} draftId - Draft identifier
   * @returns {boolean} - Success status
   */
  deleteDraft(draftId) {
    try {
      if (!draftId || typeof draftId !== 'string') {
        console.error('Invalid draftId provided to deleteDraft');
        return false;
      }
      
      const key = `${DRAFT_PREFIX}.${draftId}`;
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error deleting draft:', error);
      return false;
    }
  },

  /**
   * Save a campaign to localStorage and maintain index
   * @param {string} campaignId - Unique campaign identifier
   * @param {Object} campaignData - Campaign object to save
   * @returns {boolean} - Success status
   */
  saveCampaign(campaignId, campaignData) {
    try {
      if (!campaignId || typeof campaignId !== 'string') {
        console.error('Invalid campaignId provided to saveCampaign');
        return false;
      }
      
      const key = `${CAMPAIGN_PREFIX}.${campaignId}`;
      const serialized = safeJsonStringify({
        ...campaignData,
        campaignId,
        updatedAt: new Date().toISOString()
      });
      
      if (serialized === null) {
        return false;
      }
      
      // Save campaign data first
      localStorage.setItem(key, serialized);
      
      // Update index atomically
      const indexUpdated = atomicIndexUpdate((currentIndex) => {
        if (!currentIndex.includes(campaignId)) {
          return [...currentIndex, campaignId];
        }
        return currentIndex;
      });
      
      if (!indexUpdated) {
        // Rollback campaign save if index update failed
        localStorage.removeItem(key);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error saving campaign:', error);
      return false;
    }
  },

  /**
   * Get a campaign from localStorage
   * @param {string} campaignId - Campaign identifier
   * @returns {Object|null} - Campaign data or null if not found/error
   */
  getCampaign(campaignId) {
    try {
      if (!campaignId || typeof campaignId !== 'string') {
        console.error('Invalid campaignId provided to getCampaign');
        return null;
      }
      
      const key = `${CAMPAIGN_PREFIX}.${campaignId}`;
      const data = localStorage.getItem(key);
      return safeJsonParse(data);
    } catch (error) {
      console.error('Error getting campaign:', error);
      return null;
    }
  },

  /**
   * List all campaigns with full metadata
   * @returns {Array} - Array of campaign objects
   */
  listCampaigns() {
    try {
      const index = safeJsonParse(localStorage.getItem(INDEX_KEY), []);
      const campaigns = [];
      
      for (const campaignId of index) {
        const campaign = this.getCampaign(campaignId);
        if (campaign) {
          campaigns.push(campaign);
        } else {
          console.warn(`Campaign ${campaignId} in index but not found in storage`);
        }
      }
      
      return campaigns;
    } catch (error) {
      console.error('Error listing campaigns:', error);
      return [];
    }
  },

  /**
   * Update a campaign with partial data
   * @param {string} campaignId - Campaign identifier
   * @param {Object} patchData - Partial data to merge
   * @returns {boolean} - Success status
   */
  updateCampaign(campaignId, patchData) {
    try {
      if (!campaignId || typeof campaignId !== 'string') {
        console.error('Invalid campaignId provided to updateCampaign');
        return false;
      }
      
      const existingCampaign = this.getCampaign(campaignId);
      if (!existingCampaign) {
        console.error(`Campaign ${campaignId} not found for update`);
        return false;
      }
      
      const updatedCampaign = {
        ...existingCampaign,
        ...patchData,
        campaignId, // Ensure campaignId cannot be overridden
        updatedAt: new Date().toISOString()
      };
      
      const key = `${CAMPAIGN_PREFIX}.${campaignId}`;
      const serialized = safeJsonStringify(updatedCampaign);
      
      if (serialized === null) {
        return false;
      }
      
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error('Error updating campaign:', error);
      return false;
    }
  },

  /**
   * Delete a campaign and remove from index
   * @param {string} campaignId - Campaign identifier
   * @returns {boolean} - Success status
   */
  deleteCampaign(campaignId) {
    try {
      if (!campaignId || typeof campaignId !== 'string') {
        console.error('Invalid campaignId provided to deleteCampaign');
        return false;
      }
      
      const key = `${CAMPAIGN_PREFIX}.${campaignId}`;
      
      // Remove from index atomically first
      const indexUpdated = atomicIndexUpdate((currentIndex) => {
        return currentIndex.filter(id => id !== campaignId);
      });
      
      if (!indexUpdated) {
        console.error('Failed to update index when deleting campaign');
        return false;
      }
      
      // Remove campaign data
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error deleting campaign:', error);
      return false;
    }
  },

  /**
   * List all draft IDs and basic metadata
   * @returns {Array} - Array of draft objects with basic info
   */
  listDrafts() {
    try {
      const drafts = [];
      
      // Iterate through all localStorage keys to find drafts
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${DRAFT_PREFIX}.`)) {
          const draftId = key.replace(`${DRAFT_PREFIX}.`, '');
          const draft = this.getDraft(draftId);
          if (draft) {
            drafts.push(draft);
          }
        }
      }
      
      return drafts;
    } catch (error) {
      console.error('Error listing drafts:', error);
      return [];
    }
  }
};

/**
 * Current active adapter (for future server migration)
 */
let currentAdapter = CampaignLocalStorageAdapter;

/**
 * Switch to a different adapter implementation
 * TODO: implement server adapter (Postgres) and server runner
 * @param {Object} newAdapter - New adapter implementation
 */
function switchAdapter(newAdapter) {
  if (!newAdapter) {
    console.error('Cannot switch to null/undefined adapter');
    return;
  }
  
  // Validate that new adapter has required methods
  const requiredMethods = [
    'saveDraft', 'getDraft', 'deleteDraft',
    'saveCampaign', 'getCampaign', 'listCampaigns', 
    'updateCampaign', 'deleteCampaign', 'listDrafts'
  ];
  
  for (const method of requiredMethods) {
    if (typeof newAdapter[method] !== 'function') {
      console.error(`New adapter missing required method: ${method}`);
      return;
    }
  }
  
  currentAdapter = newAdapter;
  console.log('Campaign adapter switched successfully');
}

/**
 * Get the current active adapter
 * @returns {Object} - Current adapter instance
 */
function getCurrentAdapter() {
  return currentAdapter;
}

export { CampaignLocalStorageAdapter, switchAdapter, getCurrentAdapter };
export default CampaignLocalStorageAdapter;