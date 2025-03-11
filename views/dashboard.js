// views/dashboard.js

// Storage keys enum
const StorageKeys = {
  DAILY_SUMMARY: 'daily_summary',
  SETTINGS: 'settings',
  BLOCK_RULES: 'block_rules',
  CATEGORIES: 'categories',
  LAST_SYNC: 'last_sync'
};

let currentDate = new Date();

/**
 * Format milliseconds into human readable time
 * @param {number} ms Milliseconds
 * @returns {string} Formatted time
 */
function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

/**
 * Format domain for display
 * @param {string} domain Domain name
 * @returns {string} Formatted domain
 */
function formatDomain(domain) {
  return domain.replace(/^www\./, '');
}

/**
 * Calculate productivity score
 * @param {Object} summary Today's summary data
 * @returns {number} Score between 0-100
 */
function calculateScore(summary) {
  if (!summary) return 0;
  
  // TODO: Implement sophisticated scoring algorithm
  // For now, return a placeholder score
  return 75;
}

/**
 * Update the dashboard UI with current data
 */
async function updateUI() {
  try {
    const dateStr = currentDate.toISOString().split('T')[0];
    document.getElementById('currentDate').textContent = new Date(dateStr).toLocaleDateString();

    // Get daily summary
    const summaries = await new Promise((resolve) => {
      chrome.storage.local.get(StorageKeys.DAILY_SUMMARY, (result) => {
        resolve(result[StorageKeys.DAILY_SUMMARY] || {});
      });
    });

    const todaySummary = summaries[dateStr] || {
      totalTime: 0,
      domains: {},
      categories: {}
    };

    // Update productivity score
    const score = calculateScore(todaySummary);
    document.getElementById('productivityScore').textContent = score;

    // Update time displays
    document.getElementById('totalTime').textContent = formatTime(todaySummary.totalTime);
    
    // Calculate and display active time (excluding idle periods)
    const activeTime = todaySummary.totalTime * 0.8; // Placeholder: assume 80% active
    document.getElementById('activeTime').textContent = formatTime(activeTime);

    // Update top sites list
    const topSites = Object.entries(todaySummary.domains)
      .sort(([, a], [, b]) => b.time - a.time)
      .slice(0, 5);

    const sitesList = document.getElementById('topSites');
    sitesList.innerHTML = topSites.length ? 
      topSites.map(([domain, data]) => `
        <div class="site-item">
          <span class="site-name">${formatDomain(domain)}</span>
          <span class="site-time">${formatTime(data.time)}</span>
        </div>
      `).join('') :
      '<div class="site-item"><span class="site-name">No activity recorded today</span></div>';

    // Update charts
    updateCharts(todaySummary);
  } catch (error) {
    console.error('Error updating dashboard UI:', error);
  }
}

/**
 * Update the dashboard charts
 * @param {Object} summary Daily summary data
 */
function updateCharts(summary) {
  // TODO: Implement chart updates using Chart.js or similar
  console.log('Charts would be updated with:', summary);
}

/**
 * Initialize dashboard functionality
 */
function initialize() {
  // Update UI immediately
  updateUI();

  // Set up date navigation
  document.getElementById('prevDay').addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() - 1);
    updateUI();
  });

  document.getElementById('nextDay').addEventListener('click', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (currentDate < tomorrow) {
      currentDate.setDate(currentDate.getDate() + 1);
      updateUI();
    }
  });

  // Listen for updates from background
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'statsUpdated') {
      updateUI();
    }
  });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initialize);