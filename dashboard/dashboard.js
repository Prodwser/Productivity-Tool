// dashboard.js

import { storage, StorageKeys } from '../core/storage.js';

// Chart instances
let timeDistributionChart = null;
let categoryBreakdownChart = null;
let activityTimelineChart = null;

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
 * Update the stats overview section
 * @param {Object} data Today's summary data
 */
function updateStatsOverview(data) {
  // Update productivity score
  const score = calculateProductivityScore(data);
  document.getElementById('productivityScore').textContent = score;

  // Update total time
  document.getElementById('totalTime').textContent = formatTime(data.totalTime || 0);

  // Update active time (excluding idle periods)
  const activeTime = data.totalTime * 0.8; // Placeholder: assume 80% active
  document.getElementById('activeTime').textContent = formatTime(activeTime);

  // Update sites count
  const sitesCount = Object.keys(data.domains || {}).length;
  document.getElementById('sitesCount').textContent = sitesCount;
}

/**
 * Calculate productivity score
 * @param {Object} data Summary data
 * @returns {number} Score between 0-100
 */
function calculateProductivityScore(data) {
  // TODO: Implement sophisticated scoring algorithm
  return 75; // Placeholder score
}

/**
 * Update the time distribution chart
 * @param {Object} data Summary data
 */
function updateTimeDistribution(data) {
  const ctx = document.getElementById('timeDistribution').getContext('2d');
  
  // Prepare data
  const domains = Object.entries(data.domains || {})
    .sort(([, a], [, b]) => b.time - a.time)
    .slice(0, 5);

  const chartData = {
    labels: domains.map(([domain]) => formatDomain(domain)),
    datasets: [{
      data: domains.map(([, data]) => data.time),
      backgroundColor: [
        '#4CAF50',
        '#2196F3',
        '#FFC107',
        '#9C27B0',
        '#FF5722'
      ]
    }]
  };

  if (timeDistributionChart) {
    timeDistributionChart.destroy();
  }

  timeDistributionChart = new Chart(ctx, {
    type: 'doughnut',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right'
        }
      }
    }
  });
}

/**
 * Update the category breakdown chart
 * @param {Object} data Summary data
 */
function updateCategoryBreakdown(data) {
  const ctx = document.getElementById('categoryBreakdown').getContext('2d');
  
  // Prepare data
  const categories = Object.entries(data.categories || {})
    .sort(([, a], [, b]) => b - a);

  const chartData = {
    labels: categories.map(([category]) => category),
    datasets: [{
      data: categories.map(([, time]) => time),
      backgroundColor: [
        '#4CAF50',
        '#2196F3',
        '#FFC107',
        '#9C27B0',
        '#FF5722'
      ]
    }]
  };

  if (categoryBreakdownChart) {
    categoryBreakdownChart.destroy();
  }

  categoryBreakdownChart = new Chart(ctx, {
    type: 'pie',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right'
        }
      }
    }
  });
}

/**
 * Update the activity timeline chart
 * @param {Object} data Summary data
 */
function updateActivityTimeline(data) {
  const ctx = document.getElementById('activityTimeline').getContext('2d');
  
  // Prepare hourly data (placeholder)
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const activity = Array.from({ length: 24 }, () => Math.random() * 60); // Placeholder data

  const chartData = {
    labels: hours.map(h => `${h}:00`),
    datasets: [{
      label: 'Activity (minutes)',
      data: activity,
      borderColor: '#4CAF50',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      fill: true
    }]
  };

  if (activityTimelineChart) {
    activityTimelineChart.destroy();
  }

  activityTimelineChart = new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

/**
 * Update the top sites list
 * @param {Object} data Summary data
 */
function updateTopSites(data) {
  const container = document.getElementById('topSites');
  const sites = Object.entries(data.domains || {})
    .sort(([, a], [, b]) => b.time - a.time)
    .slice(0, 10);

  container.innerHTML = sites.length ? 
    sites.map(([domain, data]) => `
      <div class="site-item">
        <div class="site-info">
          <span class="site-name">${formatDomain(domain)}</span>
          <span class="site-time">${formatTime(data.time)}</span>
        </div>
        <div class="site-visits">${data.visits} visits</div>
      </div>
    `).join('') :
    '<div class="empty-state">No activity recorded</div>';
}

/**
 * Update all dashboard components
 */
async function updateDashboard() {
  try {
    const summaries = await storage.getLocal(StorageKeys.DAILY_SUMMARY) || {};
    const today = new Date().toISOString().split('T')[0];
    const todaySummary = summaries[today] || {
      totalTime: 0,
      domains: {},
      categories: {}
    };

    updateStatsOverview(todaySummary);
    updateTimeDistribution(todaySummary);
    updateCategoryBreakdown(todaySummary);
    updateActivityTimeline(todaySummary);
    updateTopSites(todaySummary);
  } catch (error) {
    console.error('Error updating dashboard:', error);
  }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
  // Initialize date range buttons
  document.querySelectorAll('.date-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelector('.date-btn.active').classList.remove('active');
      e.target.classList.add('active');
      updateDashboard(); // TODO: Update for selected date range
    });
  });

  // Initialize settings button
  document.getElementById('openSettings').addEventListener('click', () => {
    // TODO: Implement settings page
    console.log('Settings clicked');
  });

  // Initialize export button
  document.getElementById('exportData').addEventListener('click', () => {
    // TODO: Implement data export
    console.log('Export clicked');
  });

  // Initial update
  updateDashboard();

  // Set up periodic updates
  setInterval(updateDashboard, 60000); // Update every minute
});

// Listen for updates from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'statsUpdated') {
    updateDashboard();
  }
});