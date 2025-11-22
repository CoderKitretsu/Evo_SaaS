// Simple console test for CampaignLocalStorageAdapter
// Copy and paste this entire script into your browser console

// First, let's manually create a simple version to test the concept
const testAdapter = {
  saveDraft(draftId, data) {
    try {
      const key = `evosaa.campaigns.draft.${draftId}`;
      const payload = JSON.stringify({
        ...data,
        draftId,
        updatedAt: new Date().toISOString()
      });
      localStorage.setItem(key, payload);
      return true;
    } catch (error) {
      console.error('Save draft error:', error);
      return false;
    }
  },

  getDraft(draftId) {
    try {
      const key = `evosaa.campaigns.draft.${draftId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Get draft error:', error);
      return null;
    }
  },

  saveCampaign(campaignId, data) {
    try {
      // Save campaign data
      const key = `evosaa.campaigns.campaign.${campaignId}`;
      const payload = JSON.stringify({
        ...data,
        campaignId,
        updatedAt: new Date().toISOString()
      });
      localStorage.setItem(key, payload);

      // Update index
      const indexKey = 'evosaa.campaigns.index';
      const currentIndex = JSON.parse(localStorage.getItem(indexKey) || '[]');
      if (!currentIndex.includes(campaignId)) {
        currentIndex.push(campaignId);
        localStorage.setItem(indexKey, JSON.stringify(currentIndex));
      }

      return true;
    } catch (error) {
      console.error('Save campaign error:', error);
      return false;
    }
  },

  listCampaigns() {
    try {
      const indexKey = 'evosaa.campaigns.index';
      const index = JSON.parse(localStorage.getItem(indexKey) || '[]');
      return index.map(id => {
        const key = `evosaa.campaigns.campaign.${id}`;
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      }).filter(Boolean);
    } catch (error) {
      console.error('List campaigns error:', error);
      return [];
    }
  }
};

console.log('=== Testing Campaign Adapter ===');

// Test 1: Save and retrieve draft
console.log('Test 1: Draft operations');
const draftData = {
  meta: { name: 'Test Campaign', instanceId: 'inst-1' },
  contacts: { total: 3, valid: 3, invalid: 0 },
  message: { text: 'Hello test!' }
};

const draftSaved = testAdapter.saveDraft('test-draft-123', draftData);
console.log('Draft saved:', draftSaved);

const draftRetrieved = testAdapter.getDraft('test-draft-123');
console.log('Draft retrieved:', draftRetrieved);

// Test 2: Save campaign and check index
console.log('\nTest 2: Campaign operations');
const campaignData = {
  ...draftData,
  status: 'Scheduled',
  progress: { sent: 0, failed: 0, pending: 3 }
};

const campaignSaved = testAdapter.saveCampaign('test-campaign-456', campaignData);
console.log('Campaign saved:', campaignSaved);

const campaigns = testAdapter.listCampaigns();
console.log('Campaigns list:', campaigns);

// Test 3: Check localStorage keys
console.log('\nTest 3: localStorage key isolation');
const allKeys = Object.keys(localStorage);
const campaignKeys = allKeys.filter(key => key.startsWith('evosaa.campaigns.'));
console.log('All localStorage keys:', allKeys.length);
console.log('Campaign keys only:', campaignKeys);

// Test 4: Check specific keys exist
console.log('\nTest 4: Specific key verification');
console.log('Index exists:', localStorage.getItem('evosaa.campaigns.index'));
console.log('Draft exists:', localStorage.getItem('evosaa.campaigns.draft.test-draft-123'));
console.log('Campaign exists:', localStorage.getItem('evosaa.campaigns.campaign.test-campaign-456'));

console.log('\n=== Test Complete ===');
console.log('If you see data above and no errors, the adapter concept is working!');

// Cleanup function (run this to clean up test data)
window.cleanupCampaignTest = function() {
  localStorage.removeItem('evosaa.campaigns.index');
  localStorage.removeItem('evosaa.campaigns.draft.test-draft-123');
  localStorage.removeItem('evosaa.campaigns.campaign.test-campaign-456');
  console.log('Test data cleaned up!');
};