# Specification

## Summary
**Goal:** Improve Administrative Directory table performance by replacing inline Photo column images with clickable filename text that opens a modal preview, without any other UI/table changes.

**Planned changes:**
- Keep the Photo column header cell (th[4]) user-facing label exactly the same and avoid any structural/styling changes to that header.
- Update the Photo column body cell (td[4]) to render the photo filename as text only (derived from the stored photo path), styled as a clickable link/button, with no inline image rendering.
- On click of the filename, open a modal/overlay that loads and displays the full-size image from the existing photo path logic; allow closing via close control and/or backdrop without affecting table state.
- Ensure images are requested only when a filename is clicked (no image network requests on initial table render) and that opening/closing the modal does not trigger directory refetches or mutations.

**User-visible outcome:** In the Administrative Directory table, the Photo column shows clickable photo filenames; clicking a filename opens a modal with the full-size image, and images no longer load during initial table render.
