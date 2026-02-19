# Specification

## Summary
**Goal:** Apply lazy loading to leader images in the admin directory photo column to improve performance.

**Planned changes:**
- Replace standard image rendering with LazyImage component in the photo column
- Implement lazy loading for PM, state leaders, and constituency leaders' circular masked preview images
- Add placeholder/loading states for images before they load

**User-visible outcome:** Leader images in the admin directory table will load progressively as they come into view, improving initial page load performance while maintaining the existing circular masked preview appearance.
