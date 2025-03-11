# Data Flow Architecture

Use a multi-tier storage strategy that balances performance, capacity, and user experience. It maximizes Chrome Storage usage through efficient data encoding and structure, utilizing IndexedDB only when necessary.

1. Data Collection

User activity on websites is captured by Content Scripts running on each page
These scripts detect events like page loads, active time, and user interactions
This raw activity data is sent to the Background Service Worker

2. Data Processing

The Background Service Worker processes incoming activity data
It categorizes websites, calculates time metrics, and formats the data
It optimizes data storage format to minimize space requirements

3. Storage Strategy

Chrome Storage Primary (maximized usage):
- Stores all daily summaries in compressed format
- Keeps recent detailed records (up to storage limit)
- Manages user settings and preferences
- Uses efficient data structures (bit-packing where possible)
- Implements custom compression for time-series data

IndexedDB Secondary (fallback storage):
- Only used when Chrome Storage approaches capacity
- Stores historical detailed data beyond retention threshold
- Acts as overflow for power users with extensive history
- Handles bulk data operations for analytics

Server Storage (premium users only):
- Receives sync data from the extension
- Archives historical data beyond local retention period
- Enables cross-device synchronization

4. Data Optimization Techniques
- Use integer timestamps instead of date strings
- Store domain hashes instead of full URLs where possible
- Implement delta encoding for time sequences
- Batch similar data points together
- Use bitfields for boolean properties
- Remove redundant information
- Apply custom compression for repeated values

5. Data Access

Popup UI:
- Reads directly from Chrome Storage for instant loading
- Displays today's summary and quick trends

Dashboard UI:
- Primarily uses Chrome Storage for recent data
- Falls back to IndexedDB only for historical analysis

This architecture prioritizes Chrome Storage for nearly all operations, providing the fastest possible experience while still supporting unlimited history through graceful overflow to IndexedDB when necessary.