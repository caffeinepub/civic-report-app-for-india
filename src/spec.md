# Specification

## Summary
**Goal:** Update the Admin Directory so representative photos are shown as clickable filename/text entries that open a full-size photo in a modal, without introducing lazy-loading.

**Planned changes:**
- Replace representative photo thumbnails in the Admin Directory list/table with readable filename/photoPath text for every entry.
- Make the displayed photo filename/text clickable to open an overlay modal showing the corresponding full-size image.
- Add modal close behaviors (close button, ESC key, and clicking the backdrop) while preserving the Admin Directory page scroll position/state after closing.
- Ensure photo URL resolution and image loading occur only when the modal is opened, and do not add any lazy-loading behavior.

**User-visible outcome:** Admins see photo references as text (not thumbnails) in the Admin Directory, and can click a filename to view the full-size photo in a modal overlay and close it to return to the same spot in the directory.
