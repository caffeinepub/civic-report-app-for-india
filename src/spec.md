# Specification

## Summary
**Goal:** Add lazy loading for all images displayed anywhere within the Admin Dashboard to avoid eagerly downloading every admin image at once.

**Planned changes:**
- Replace Admin Dashboard-related direct `<img>` usages with the existing `LazyImage` component across all admin tabs and flows (reports, directory representatives, and content/logo management).
- Ensure images only begin downloading when near/in the viewport, except for above-the-fold/critical images which will use `priority="high"` to load eagerly when needed (e.g., when an image modal opens).
- Use a non-jarring placeholder/skeleton via `LazyImage` while images load to minimize layout shift.

**User-visible outcome:** Admin pages with many images load faster and use less bandwidth up front; images load smoothly as admins scroll or open image modals/previews.
