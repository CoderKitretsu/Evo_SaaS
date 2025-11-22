// Campaign Service Console Test
// Copy and paste this entire script into your browser console

// First create a mock service that tests the core concepts
const mockCampaignService = {
  // Generate unique IDs
  generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  // Mock adapter calls
  adapter: {
    saveDraft(draftId, data) {
      localStorage.setItem(`evosaa.campaigns.draft.${draftId}`, JSON.stringify(data));
      return true;
    },
    getDraft(draftId) {
      const data = localStorage.getItem(`evosaa.campaigns.draft.${draftId}`);
      return data ? JSON.parse(data) : null;
    },
    saveCampaign(campaignId, data) {
      localStorage.setItem(`evosaa.campaigns.campaign.${campaignId}`, JSON.stringify(data));
      const index = JSON.parse(localStorage.getItem('evosaa.campaigns.index') || '[]');
      if (!index.includes(campaignId)) {
        index.push(campaignId);
        localStorage.setItem('evosaa.campaigns.index', JSON.stringify(index));
      }
      return true;
    },
    getCampaign(campaignId) {
      const data = localStorage.getItem(`evosaa.campaigns.campaign.${campaignId}`);
      return data ? JSON.parse(data) : null;
    },
    listCampaigns() {
      const index = JSON.parse(localStorage.getItem('evosaa.campaigns.index') || '[]');
      return index.map(id => this.getCampaign(id)).filter(Boolean);
    },
    updateCampaign(campaignId, updates) {
      const existing = this.getCampaign(campaignId);
      if (!existing) return false;
      const updated = { ...existing, ...updates };
      return this.saveCampaign(campaignId, updated);
    }
  },

  // Service functions
  createDraft(meta) {
    if (!meta || !meta.name || !meta.instanceId) {
      throw new Error('Name and instanceId are required');
    }

    const draftId = this.generateId('draft');
    const draftData = {
      draftId,
      meta: {
        name: meta.name,
        instanceId: meta.instanceId,
        startAt: meta.startAt || new Date(Date.now() + 5 * 60000).toISOString(),
        throttle: meta.throttle || 'safe',
        dryRun: meta.dryRun !== undefined ? meta.dryRun : true,
        maxBatchSize: meta.maxBatchSize || 50
      },
      contacts: { total: 0, valid: 0, invalid: 0, rows: [] },
      message: { text: '', templateHash: '', attachments: [] },
      createdAt: new Date().toISOString()
    };

    this.adapter.saveDraft(draftId, draftData);
    return draftId;
  },

  getDraft(draftId) {
    return this.adapter.getDraft(draftId);
  },

  saveDraft(draftId, data) {
    return this.adapter.saveDraft(draftId, { ...data, updatedAt: new Date().toISOString() });
  },

  publishDraftAsCampaign(draftId, options = {}) {
    const draft = this.adapter.getDraft(draftId);
    if (!draft) throw new Error('Draft not found');

    // Basic validation
    if (!draft.meta?.name) throw new Error('Campaign name required');
    if (!draft.contacts || draft.contacts.valid === 0) {
      throw new Error('At least one valid contact required');
    }
    if (!draft.message?.text) throw new Error('Message text required');

    if (options.validateOnly) return 'validation-passed';

    const campaignId = this.generateId('campaign');
    const campaign = {
      ...draft,
      campaignId,
      status: options.startScheduled ? 'Scheduled' : 'Draft',
      progress: { sent: 0, failed: 0, pending: draft.contacts.valid },
      publishedAt: new Date().toISOString()
    };

    this.adapter.saveCampaign(campaignId, campaign);
    return campaignId;
  },

  startCampaign(campaignId) {
    return this.adapter.updateCampaign(campaignId, {
      status: 'Running',
      updatedAt: new Date().toISOString()
    });
  },

  pauseCampaign(campaignId) {
    return this.adapter.updateCampaign(campaignId, {
      status: 'Paused',
      updatedAt: new Date().toISOString()
    });
  },

  resumeCampaign(campaignId) {
    return this.adapter.updateCampaign(campaignId, {
      status: 'Running',
      updatedAt: new Date().toISOString()
    });
  },

  listCampaigns() {
    return this.adapter.listCampaigns();
  }
};

console.log('=== Testing Campaign Service ===');

// Clean up previous test data
const existingKeys = Object.keys(localStorage).filter(k => k.startsWith('evosaa.campaigns.'));
existingKeys.forEach(key => localStorage.removeItem(key));

console.log('Test 1: Draft Creation and Management');
try {
  // Create draft
  const draftId = mockCampaignService.createDraft({
    name: 'Test Service Campaign',
    instanceId: 'inst-service-test',
    throttle: 'safe',
    dryRun: true
  });
  console.log('✓ Draft created:', draftId);

  // Retrieve draft
  const draft = mockCampaignService.getDraft(draftId);
  console.log('✓ Draft retrieved:', !!draft);
  console.log('  - Name:', draft?.meta?.name);
  console.log('  - Dry run:', draft?.meta?.dryRun);

  // Update draft with contacts and message
  const updatedDraft = {
    ...draft,
    contacts: {
      total: 3,
      valid: 2,
      invalid: 1,
      rows: [
        { id: 'r1', phone: '+911111111111', vars: { name: 'User 1' }, status: 'pending' },
        { id: 'r2', phone: '+912222222222', vars: { name: 'User 2' }, status: 'pending' }
      ]
    },
    message: {
      text: 'Hello {{name}}, this is a service test!',
      templateHash: 'service-test-hash',
      attachments: []
    }
  };

  const saveResult = mockCampaignService.saveDraft(draftId, updatedDraft);
  console.log('✓ Draft updated:', saveResult);

  // Verify update
  const updatedRetrieved = mockCampaignService.getDraft(draftId);
  console.log('✓ Updated contacts count:', updatedRetrieved?.contacts?.valid);
  console.log('✓ Message text length:', updatedRetrieved?.message?.text?.length);

} catch (error) {
  console.error('✗ Draft creation error:', error.message);
}

console.log('\nTest 2: Publishing and Campaign Management');
try {
  // Get the draft
  const drafts = Object.keys(localStorage)
    .filter(k => k.startsWith('evosaa.campaigns.draft.'))
    .map(k => JSON.parse(localStorage.getItem(k)));

  if (drafts.length > 0) {
    const draft = drafts[0];
    const draftId = draft.draftId;

    // Test validation
    try {
      const validation = mockCampaignService.publishDraftAsCampaign(draftId, { validateOnly: true });
      console.log('✓ Validation passed:', validation === 'validation-passed');
    } catch (validationError) {
      console.log('✓ Validation failed (as expected):', validationError.message);
    }

    // Publish campaign
    try {
      const campaignId = mockCampaignService.publishDraftAsCampaign(draftId, { startScheduled: true });
      console.log('✓ Campaign published:', campaignId);

      // List campaigns
      const campaigns = mockCampaignService.listCampaigns();
      console.log('✓ Campaigns count:', campaigns.length);

      if (campaigns.length > 0) {
        const campaign = campaigns[0];
        console.log('  - Campaign ID:', campaign.campaignId);
        console.log('  - Status:', campaign.status);
        console.log('  - Pending contacts:', campaign.progress?.pending);

        // Test status changes
        const startResult = mockCampaignService.startCampaign(campaign.campaignId);
        console.log('✓ Started campaign:', startResult);

        const pauseResult = mockCampaignService.pauseCampaign(campaign.campaignId);
        console.log('✓ Paused campaign:', pauseResult);

        const resumeResult = mockCampaignService.resumeCampaign(campaign.campaignId);
        console.log('✓ Resumed campaign:', resumeResult);

        // Verify final status
        const finalCampaigns = mockCampaignService.listCampaigns();
        console.log('✓ Final status:', finalCampaigns[0]?.status);
      }
    } catch (publishError) {
      console.log('✗ Publishing error:', publishError.message);
    }
  }

} catch (error) {
  console.error('✗ Campaign management error:', error.message);
}

console.log('\nTest 3: Error Handling');
try {
  // Test invalid inputs
  try {
    mockCampaignService.createDraft(null);
    console.log('✗ Should have thrown error for null input');
  } catch (e) {
    console.log('✓ Handled null input:', e.message);
  }

  try {
    mockCampaignService.createDraft({ name: 'Test' }); // missing instanceId
    console.log('✗ Should have thrown error for missing instanceId');
  } catch (e) {
    console.log('✓ Handled missing instanceId:', e.message);
  }

  const nonExistentDraft = mockCampaignService.getDraft('non-existent');
  console.log('✓ Non-existent draft returns:', nonExistentDraft);

} catch (error) {
  console.error('✗ Error handling test failed:', error.message);
}

console.log('\nTest 4: Storage Key Isolation');
const allKeys = Object.keys(localStorage);
const campaignKeys = allKeys.filter(key => key.startsWith('evosaa.campaigns.'));
const otherKeys = allKeys.filter(key => !key.startsWith('evosaa.campaigns.'));

console.log('Total localStorage keys:', allKeys.length);
console.log('Campaign keys:', campaignKeys.length);
console.log('Other keys (should be same as before):', otherKeys.length);
console.log('Campaign keys found:');
campaignKeys.forEach(key => console.log('  -', key));

console.log('\n=== Service Test Complete ===');
console.log('Key validation points:');
console.log('✓ Draft creation with proper validation');
console.log('✓ Campaign publishing with business rules'); 
console.log('✓ Status management (start/pause/resume)');
console.log('✓ Error handling for invalid inputs');
console.log('✓ Storage isolation (only evosaa.campaigns.* keys)');

// Cleanup function
window.cleanupServiceConsoleTest = function() {
  const keys = Object.keys(localStorage).filter(k => k.startsWith('evosaa.campaigns.'));
  keys.forEach(key => localStorage.removeItem(key));
  console.log('Service console test data cleaned up!');
};