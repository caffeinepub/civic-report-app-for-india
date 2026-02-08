# Specification

## Summary
**Goal:** Ensure the homepage headline and all related user-facing text (including HTML metadata) are fully updated so no outdated “Get Leader-Giotag” wording appears anywhere.

**Planned changes:**
- Search the frontend codebase for any remaining user-facing occurrences/variants of “Get Leader-Giotag” and replace them with the intended updated wording where applicable (including React components and any translation strings).
- Update `frontend/src/components/RecentReports.tsx` so the homepage headline displays exactly: “Report by clicking Photo & GPS leader image, Certificate, Complaint & Legal Notice”, and ensure no alternate code path overrides it on `/`.
- Update `frontend/index.html` metadata to remove “Get Leader-Giotag” and use the updated wording consistently in `<title>`, `og:title`, and `twitter:title`.

**User-visible outcome:** On the homepage and in share/browser title metadata, users consistently see the updated headline wording and no longer encounter “Get Leader-Giotag” anywhere in the app.
