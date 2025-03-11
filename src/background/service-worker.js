// src/background/service-worker.js
// Central orchestrator for the extension

import { storage, StorageKeys } from '../core/storage.js';

// Track active tab state
let currentState = {
  tabId: null,
  windowId: null,
  startTime: null,
  url: null,
  domain: null,
  isActive: false
};

/**
 * Extract domain from URL
 * @param {string} url 
 * @returns {string}
 */
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    console.error('Invalid URL:', url);
    return null;
  }
}

/**
 * Handle tab activation
 * @param {number} tabId 
 * @param {number} windowId 
 */
async function handleTabActivated(tabId, windowId) {
  // End previous session if exists
  if (currentState.isActive) {
    await endTracking();
  }

  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab && tab.url && tab.url.startsWith('http')) {
      currentState = {
        tabId,
        windowId,
        startTime: Date.now(),
        url: tab.url,
        domain: extractDomain(tab.url),
        isActive: true
      };
    }
  } catch (e) {
    console.error('Error handling tab activation:', e);
  }
}

/**
 * End current tracking session
 */
async function endTracking() {
  if (!currentState.isActive || !currentState.startTime) return;

  const duration = Date.now() - currentState.startTime;
  if (duration < 1000) return; // Ignore very short sessions

  try {
    // Update daily summary
    await storage.updateDailySummary({
      time: duration,
      domain: currentState.domain,
      category: await detectCategory(currentState.domain)
    });

    // Store detailed history if significant duration
    if (duration > 5000) {
      await storage.storeHistory({
        url: currentState.url,
        domain: currentState.domain,
        startTime: currentState.startTime,
        duration,
        title: (await chrome.tabs.get(currentState.tabId)).title
      });
    }
  } catch (e) {
    console.error('Error ending tracking session:', e);
  }

  currentState.isActive = false;
}

/**
 * Detect category for a domain
 * @param {string} domain 
 * @returns {Promise<string>}
 */
async function detectCategory(domain) {
  // TODO: Implement sophisticated category detection
  // For now, return a placeholder category
  return 'uncategorized';
}

/**
 * Initialize the background service worker
 */
async function initialize() {
  // Initialize storage
  await storage.initialize();

  // Set up maintenance alarm
  chrome.alarms.create('maintenance', {
    periodInMinutes: 60 * 24 // Once per day
  });

  // Listen for tab activation
  chrome.tabs.onActivated.addListener(
    (activeInfo) => handleTabActivated(activeInfo.tabId, activeInfo.windowId)
  );

  // Listen for tab updates
  chrome.tabs.onUpdated.addListener(
    async (tabId, changeInfo, tab) => {
      if (
        changeInfo.status === 'complete' &&
        tab.active &&
        currentState.tabId === tabId
      ) {
        await handleTabActivated(tabId, tab.windowId);
      }
    }
  );

  // Listen for window focus changes
  chrome.windows.onFocusChanged.addListener(
    async (windowId) => {
      if (windowId === chrome.windows.WINDOW_ID_NONE) {
        await endTracking();
      } else {
        const tabs = await chrome.tabs.query({ active: true, windowId });
        if (tabs[0]) {
          await handleTabActivated(tabs[0].id, windowId);
        }
      }
    }
  );

  // Listen for maintenance alarm
  chrome.alarms.onAlarm.addListener(
    async (alarm) => {
      if (alarm.name === 'maintenance') {
        await storage.performMaintenance();
      }
    }
  );
}

// Initialize when service worker starts
initialize().catch(console.error);

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'getState':
      sendResponse(currentState);
      break;
    case 'getDailySummary':
      storage.getLocal(StorageKeys.DAILY_SUMMARY)
        .then(sendResponse)
        .catch(console.error);
      return true; // Will respond asynchronously
    default:
      console.warn('Unknown message type:', message.type);
  }
});