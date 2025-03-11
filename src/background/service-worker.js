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

// Alarm names
const ALARMS = {
  MAINTENANCE: 'maintenance',
  STATS_UPDATE: 'statsUpdate',
  IDLE_CHECK: 'idleCheck'
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

      // Notify popup of state change
      chrome.runtime.sendMessage({
        type: 'stateUpdated',
        data: currentState
      }).catch(() => {}); // Ignore if popup is closed
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

    // Notify popup of updated stats
    chrome.runtime.sendMessage({
      type: 'statsUpdated'
    }).catch(() => {}); // Ignore if popup is closed
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
  const categories = await storage.getLocal(StorageKeys.CATEGORIES) || {};
  return categories[domain] || 'uncategorized';
}

/**
 * Handle alarm events
 * @param {chrome.alarms.Alarm} alarm 
 */
async function handleAlarm(alarm) {
  switch (alarm.name) {
    case ALARMS.MAINTENANCE:
      await storage.performMaintenance();
      break;
    
    case ALARMS.STATS_UPDATE:
      if (currentState.isActive) {
        const duration = Date.now() - currentState.startTime;
        await storage.updateDailySummary({
          time: duration,
          domain: currentState.domain,
          category: await detectCategory(currentState.domain)
        });
      }
      break;
    
    case ALARMS.IDLE_CHECK:
      // Check if current tab is still valid
      if (currentState.isActive && currentState.tabId) {
        try {
          const tab = await chrome.tabs.get(currentState.tabId);
          if (!tab || tab.url !== currentState.url) {
            await endTracking();
          }
        } catch {
          await endTracking();
        }
      }
      break;
  }
}

/**
 * Initialize the background service worker
 */
async function initialize() {
  // Initialize storage
  await storage.initialize();

  // Set up alarms
  chrome.alarms.create(ALARMS.MAINTENANCE, {
    periodInMinutes: 60 * 24 // Once per day
  });

  chrome.alarms.create(ALARMS.STATS_UPDATE, {
    periodInMinutes: 5 // Every 5 minutes
  });

  chrome.alarms.create(ALARMS.IDLE_CHECK, {
    periodInMinutes: 1 // Every minute
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

  // Listen for alarms
  chrome.alarms.onAlarm.addListener(handleAlarm);

  // Initial tab check
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (activeTab) {
    await handleTabActivated(activeTab.id, activeTab.windowId);
  }
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