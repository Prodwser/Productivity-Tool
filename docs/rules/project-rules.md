# Project-Specific Rules

## Permissions Strategy

1. **Minimal Permission Approach**: Request only permissions that are absolutely necessary for current functionality.
2. **Permission Justification**: Document why each permission is needed.
3. **Progressive Permission Requests**: Implement optional features with sensitive permissions independently.
4. **Runtime Permission Management**: Use runtime.requestPermissions() when needed.
5. **Background Context Permission**: Use event-based service worker activation.

[... rest of the project rules content ...]