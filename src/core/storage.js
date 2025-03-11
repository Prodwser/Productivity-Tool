// src/core/storage.js
// Core storage system implementation with multi-tier strategy

/**
 * Storage keys used throughout the extension
 * @enum {string}
 */
export const StorageKeys = {
  DAILY_SUMMARY: 'daily_summary',
  SETTINGS: 'settings',
  BLOCK_RULES: 'block_rules',
  CATEGORIES: 'categories',
  LAST_SYNC: 'last_sync'
};

/**
 * Implements the multi-tier storage strategy
 */
class StorageManager {
  constructor() {
    this.db = null;
    this.initializePromise = null;
  }

  /**
   * Initialize storage system
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initializePromise) return this.initializePromise;

    this.initializePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open('ProTrackrDB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('history')) {
          db.createObjectStore('history', { keyPath: 'timestamp' });
        }
        if (!db.objectStoreNames.contains('analytics')) {
          db.createObjectStore('analytics', { keyPath: 'id', autoIncrement: true });
        }
      };
    });

    return this.initializePromise;
  }

  /**
   * Store data in Chrome Storage
   * @param {string} key Storage key
   * @param {*} value Data to store
   * @returns {Promise<void>}
   */
  async setLocal(key, value) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  }

  /**
   * Retrieve data from Chrome Storage
   * @param {string} key Storage key
   * @returns {Promise<*>}
   */
  async getLocal(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (result) => resolve(result[key]));
    });
  }

  /**
   * Store historical data in IndexedDB
   * @param {Object} data Data to store
   * @returns {Promise<void>}
   */
  async storeHistory(data) {
    await this.initialize();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['history'], 'readwrite');
      const store = transaction.objectStore('history');
      const request = store.add({
        ...data,
        timestamp: Date.now()
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Retrieve historical data from IndexedDB
   * @param {number} startTime Start timestamp
   * @param {number} endTime End timestamp
   * @returns {Promise<Array>}
   */
  async getHistory(startTime, endTime) {
    await this.initialize();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['history'], 'readonly');
      const store = transaction.objectStore('history');
      const request = store.getAll(IDBKeyRange.bound(startTime, endTime));

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update daily summary with efficient delta encoding
   * @param {Object} newData New data to merge
   * @returns {Promise<void>}
   */
  async updateDailySummary(newData) {
    const summary = await this.getLocal(StorageKeys.DAILY_SUMMARY) || {};
    const today = new Date().toISOString().split('T')[0];
    
    // Initialize today's data if needed
    if (!summary[today]) {
      summary[today] = {
        totalTime: 0,
        domains: {},
        categories: {}
      };
    }

    // Update with delta encoding
    if (newData.time) {
      summary[today].totalTime += newData.time;
      
      // Update domain stats
      if (newData.domain) {
        if (!summary[today].domains[newData.domain]) {
          summary[today].domains[newData.domain] = { time: 0, visits: 0 };
        }
        summary[today].domains[newData.domain].time += newData.time;
        summary[today].domains[newData.domain].visits++;
      }

      // Update category stats
      if (newData.category) {
        if (!summary[today].categories[newData.category]) {
          summary[today].categories[newData.category] = 0;
        }
        summary[today].categories[newData.category] += newData.time;
      }
    }

    await this.setLocal(StorageKeys.DAILY_SUMMARY, summary);
  }

  /**
   * Clean up old data to prevent storage quota issues
   * @returns {Promise<void>}
   */
  async performMaintenance() {
    // Keep 30 days of daily summaries
    const summary = await this.getLocal(StorageKeys.DAILY_SUMMARY) || {};
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    Object.keys(summary).forEach(date => {
      if (new Date(date) < thirtyDaysAgo) {
        delete summary[date];
      }
    });
    
    await this.setLocal(StorageKeys.DAILY_SUMMARY, summary);

    // Clean up old IndexedDB records
    await this.initialize();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['history'], 'readwrite');
      const store = transaction.objectStore('history');
      const request = store.delete(IDBKeyRange.upperBound(thirtyDaysAgo.getTime()));

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
export const storage = new StorageManager();