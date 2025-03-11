// src/content/activity-monitor.js
// Monitors user activity on the page

/**
 * Activity monitor that tracks user interactions
 */
class ActivityMonitor {
  constructor() {
    this.lastActivity = Date.now();
    this.isIdle = false;
    this.idleThreshold = 60000; // 1 minute
    this.checkInterval = 5000; // 5 seconds
    this.events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'wheel'
    ];
  }

  /**
   * Initialize the activity monitor
   */
  initialize() {
    // Set up activity listeners
    this.events.forEach(event => {
      document.addEventListener(event, () => this.handleActivity(), {
        passive: true
      });
    });

    // Start idle checking
    setInterval(() => this.checkIdle(), this.checkInterval);

    // Initial state report
    this.reportState();
  }

  /**
   * Handle user activity
   */
  handleActivity() {
    const wasIdle = this.isIdle;
    this.lastActivity = Date.now();
    this.isIdle = false;

    // Report state change if coming from idle
    if (wasIdle) {
      this.reportState();
    }
  }

  /**
   * Check for idle state
   */
  checkIdle() {
    const now = Date.now();
    const timeSinceActivity = now - this.lastActivity;
    const newIdleState = timeSinceActivity >= this.idleThreshold;

    // Report state if changed
    if (newIdleState !== this.isIdle) {
      this.isIdle = newIdleState;
      this.reportState();
    }
  }

  /**
   * Report current state to background
   */
  reportState() {
    chrome.runtime.sendMessage({
      type: 'activityUpdate',
      data: {
        isIdle: this.isIdle,
        timestamp: Date.now(),
        url: window.location.href
      }
    }).catch(console.error);
  }
}

// Initialize monitor when page loads
const monitor = new ActivityMonitor();
monitor.initialize();