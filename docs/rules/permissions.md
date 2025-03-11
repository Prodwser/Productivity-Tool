# Chrome Extension Permissions Documentation

## Extension Single Purpose
Our extension's single purpose is:
> To track your web usage and make you more productive over time.

## Permission Management Rules

1. Only request permissions that are actively used in the codebase
2. Each permission must have clear justification tied to core functionality
3. Remove permissions if related features are removed
4. Move optional features to optional_permissions
5. Document usage examples for each permission

## Current Permissions

### Manifest Permissions

#### `"storage"`
**Status**: ✅ Implemented
**Justification**: The storage permission is required to save and persist user's browsing activity data, website categories, and settings. This data is essential for tracking productivity patterns over time and displaying historical statistics in the dashboard.
**Usage Examples**:
- Storing daily activity summaries
- Saving user preferences
- Maintaining website categories
- Storing historical statistics

#### `"tabs"`
**Status**: ✅ Implemented
**Justification**: The tabs permission is necessary to monitor which websites the user is actively visiting, track time spent on different sites, and categorize them for productivity analysis.
**Usage Examples**:
- Tracking active tab changes
- Monitoring website visits
- Recording tab titles and URLs
- Detecting tab focus changes

#### `"activeTab"`
**Status**: ✅ Implemented
**Justification**: The activeTab permission is needed to accurately track the currently active tab's duration and website information, ensuring precise measurement of time spent on each website.
**Usage Examples**:
- Measuring active tab duration
- Detecting tab focus
- Recording current website data
- Tracking user interaction

#### `"alarms"`
**Status**: ✅ Implemented
**Justification**: The alarms permission is used to schedule regular data cleanup and aggregation tasks, as well as to periodically update the tracking statistics in the background.
**Usage Examples**:
- Scheduling data maintenance
- Periodic statistics updates
- Regular data aggregation
- Cleanup of old records

### Optional Permissions

#### `"webNavigation"`
**Status**: 🚫 Not Yet Implemented
**Justification**: The webNavigation permission is required to detect when users navigate between different pages within the same website, enabling accurate tracking of time spent on specific web properties and sub-pages.
**Usage Examples**:
- Page navigation tracking
- Sub-page time measurement
- Single-page app tracking
- Cross-page analytics

#### `"notifications"`
**Status**: 🚫 Removed (Not Implemented)
**Justification**: Originally planned for productivity alerts but removed as the feature was not implemented. Will be re-added when notification features are developed.
**Usage Examples**: (To be implemented)
- Productivity alerts
- Goal achievement notifications
- Daily summaries
- Focus reminders

### Future Permissions (Not Yet Requested)

#### `"idle"`
**Status**: 🔄 Planned
**Justification**: The idle permission is needed to pause time tracking when the user is inactive, ensuring accurate measurement of actual website engagement time.
**Usage Examples**:
- Detect user inactivity
- Pause time tracking
- Accurate engagement measurement
- Idle time filtering

#### `"scripting"`
**Status**: 🔄 Planned
**Justification**: The scripting permission is required to accurately track user activity and interaction with websites. It enables the extension to monitor active browsing time, detect when tabs are in focus, and collect necessary website metadata for categorization.
**Usage Examples**:
- Activity monitoring
- Focus detection
- Website metadata collection
- Interaction tracking

## Host Permissions

### `"<all_urls>"`
**Status**: ✅ Implemented
**Justification**: Host permissions are required to monitor browsing activity across all websites to provide comprehensive productivity tracking. This is essential for the core functionality of analyzing time spent on different websites and categorizing them appropriately.
**Usage Examples**:
- Website activity tracking
- Time measurement
- Site categorization
- Productivity analysis

## Remote Code Policy

**Status**: ✅ Compliant
> No remote code is used in this extension. All JavaScript and WebAssembly code is included in the extension package. No external scripts, modules, or eval() are used.

## Permission Review Process

When adding new features that require permissions:

1. Document the permission in this file
2. Provide clear justification
3. Add specific usage examples
4. Implement the related feature
5. Test permission functionality
6. Update manifest.json
7. Update Chrome Web Store listing

## Chrome Web Store Submission Notes

1. Each permission must be explicitly justified in the submission
2. Features must be implemented before requesting permissions
3. Optional permissions should be used for non-core features
4. Remove unused permissions before submission
5. Document all host permission requirements