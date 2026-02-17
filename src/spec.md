# Specification

## Summary
**Goal:** Prevent the Admin Directory table from loading all representative photos by default by showing only the photo filename/path in the Photo column, while still allowing on-demand preview in a modal.

**Planned changes:**
- Update only the Administrative Directory Table “Photo” column to render the stored `photoPath`/filename as plain text (no `<img>`/LazyImage rendered in table rows).
- Make the displayed filename/path clickable to open a modal/overlay that loads and shows the full-size image for that row using the existing file URL resolution approach already used in the app.
- Ensure the modal can be dismissed (e.g., close control/outside click/Escape) and returns the user to the same place in the table; keep all other table columns and behaviors unchanged.

**User-visible outcome:** In Admin Dashboard → Directory, the Photo column shows clickable photo filenames/paths instead of inline thumbnails; clicking one opens a dismissible modal preview that loads the image only when opened.
