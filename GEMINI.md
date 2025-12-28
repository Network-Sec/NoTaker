# Gemini Project Overview

This document outlines the current state, goals, and prioritized tasks for the NoTaker application, an outstanding PKM (Personal Knowledge Management) tool. Its core feature is a WhatsApp chat-like stream where users can paste content (text, markdown, code, images) which appears time-tagged and is saved to a SQLite DB on the backend. Images are intended to be stored as files in date-labeled folders with time-based filenames. The application features a 3-column layout: a left sidebar with a calendar and Eisenhower matrix, a central chat stream, and a right stream displaying browser history and bookmarks.

The application is currently in version 0.5.0.alpha, serving as a demo but not fully usable. The goal is to bring it to a 1.0 release, focusing on detail work, adherence to conventions, and continuous iteration based on user feedback.

## Current State and Outstanding Issues (as of December 21, 2025):

- [x] **Image Handling:** Images are not saved as files but as `data:124biuawr...` strings.
    -   **Desired Process:** Submit file to backend, backend stores it in an organized `date/time_filename` folder, backend returns a link, frontend inserts image via this link. This will enable advanced features like non-destructive cropping and undo.
- [x] **Cropping Image Modal:** The save button in the cropping image modal does not close the dialog and needs to be integrated into the new image saving workflow. Crops are saved as data URIs instead of files.
- [x] **Frontend-Only Deletions:** Deleting items in the frontend is not persistent; items reappear after reload.
- [x] **Bookmark/Browser History Timeline:**
    -   Sometimes throws backend errors about "too large messages".
    -   Currently, only Chrome import is implemented and should remain so until other features are finished.
    -   The cronjob import generally works and should not be broken.
    -   **Does not show current day's entries, only past days.**
- [x] **Chat Input (Milkdown) & Stream:**
    -   The input and stream are generally messy; inserting code doesn't work correctly, and markdown is partially broken.
    -   The editor input behaves unexpectedly for a WYSIWYG editor.
- [x] **Stream Entry Actions:**
    -   Buttons on entries are either vanished or are unlabeled empty boxes.
    -   Editing mode is dysfunctional and lacks proper formatting.
- [x] **Chat Entry Hamburger Menu:**
    -   Each chat entry needs a burger icon with all editing options; current buttons are broken/unlabeled.
- [ ] **Broken 'Editing Content' in regular Memo:** This functionality has been regressed during recent changes and needs to be fixed. Editing content for existing memos is not working as expected.
- [ ] **Notebooks:**
    -   **Old saved notebooks do not load from DB.**
- [ ] **Memo and AI Stream Scrolling/Navigation:**
    -   **"Jump to entry", "PrevEntry/NextEntry" buttons, and "ScrollToBottom" functionality are not working properly. Requires proper DATA attributes on wrapper elements to distinguish memos from bookmarks.**
- [ ] **Gallery:**
    -   **On click, attempts to jump to Memo stream instead of showing a full-size modal. Thumbnails need to be 'jump to source' buttons with metadata displayed.**
-   **AI Features (Lowest Priority):**
    -   Small-scale AI for automatic tagging, keyword finding, and enriching chat entries in the DB.
    -   Advanced features: D3 information node graph, deep search, AI RAG.
    -   Requires an all-time CPU super-tiny model and a connection for a local Ollama GPT-OSS for RAG.
-   **Left Icon Sidebar Pages (Lowest Priority):**
    -   Existing pages (e.g., separate bookmark page) are mostly unformatted.
    -   Bookmarks are in large boxes with blue, oversized font, and missing metadata.

## Latest Updates and Architecture Changes (as of December 27, 2025):
*   **Database Schema Updates:**
    *   Added `toolbox_items` table: Stores details for Quick Dial entries (title, url, description, icon_url, image_url, timestamp).
    *   Modified `tasks` table: Added `deleted_on` column to support persistent task deletion/completion.
*   **Architectural Refinements:**
    *   **Notebooks:** Loading, saving, and state management for Notebooks have been fully encapsulated within `NotebookView.tsx`, decoupling it from the main application's initial data load.
    *   **Reusable Components:** Introduced a `CalendarInput.tsx` component for consistent, themed date/time input across the application.
    *   **Backend API Enhancements:** Updated `/api/tasks` endpoints to support the new `deleted_on` task persistence logic.
    *   **Frontend Data Flow:** Implemented `onAddToToolbox` handlers and state updates for adding items from various parts of the UI to the Toolbox, ensuring UI responsiveness.

## Summary of Recently Completed Tasks:

*   **Eisenhower Matrix Logic:** Implemented persistence for task deletion/completion across future dates using a `deleted_on` field.
*   **Full Calendar Event Formatting:** Reverted `tech-` themed event styling and restyled to a more traditional Google Calendar/Office 365 Outlook appearance within the Identity theme.
*   **Reusable Calendar Input Component:** Created a new, darkmode-themed `CalendarInput.tsx` component (supporting date+time, date-only, time-only modes) and integrated it into `BookmarkView`, `EventModal`, `MemoInput`, and `MemoItem`.
*   **Verify & Fix: "Add to Toolbox" button reappearing in DashboardStream:** Confirmed removal from DashboardStream (code-wise), asking user to hard refresh if still present.
*   **Fix: "Add to Toolbox" menu link in `MemoItem` not working / item not added:** Implemented error propagation and console logging for diagnostic purposes; code review indicates correct URL/title extraction for `memo.type === 'link'`.
*   **Fix: No reload needed for Toolbox item to appear after adding:** Implemented `key` prop on `ToolboxView` to force re-render on state changes.
*   **Fix: "Add to Toolbox" menu link text in `MemoItem` causes linebreak:** Shortened text and increased `dropdown-menu` width to prevent line breaks.
*   **Restyle `NotebookView`:** Thoroughly restyled to perfectly match Identity components.
*   **Restyle `BookmarkView`:** Refined "Add to Toolbox" button styling and overall item layout for consistency.
*   **Restyle `ToolboxView`:** Refined styling to perfectly match Identity components, improving readability and layout.
*   **Restyle `SettingsPage`:** Applied modern, clean, futuristic styling, including `tech-panel` sections, `tech-input` fields, and new `ToggleSwitch` components for boolean settings.
*   **Comprehensive Operation Logging:** Committed to logging all future operations to `OPERATIONLOG.md`.
*   **New Daily Counter Component:** Implemented a new, tiny sidebar component with backend persistence for managing a daily counter with start date, initial values, and incremental entries with calculated totals.

## Gemini TODO List

- [ ] **Advanced Calendar UI Overhaul (Minor Fixes/Completion):**
    -   *Status:* Mostly done, requires minor fixes to follow up.
    -   **Interaction Fix:** Replace the current `alert()` popup on entry click with the full `EventModal` for editing/displaying details.
    -   **External Events:** Enable editing for external entries (from iCal/Google). Even if sync-back isn't possible, allow local modifications (likely treating them as cloned local events upon save).
    -   Apply futuristic styling aftertouches to matching `styles` convention.

- [ ] **Calendar Backend Sync Fix:**
    -   Ensure `server/calendar_api.js` strictly syncs `calendar_sources` with the `GOOGLE_CALENDAR_URLS` environment variable.
    -   It must delete DB entries not present in the `.env` variable (fixing the issue where old/wrong entries persist).
    -   It must not save URLs to the DB against the user's request (only sync from env).

- [ ] **Fix Frontend Regressions (MemoInput & Stream):**
    -   *Context:* These issues resulted from unwanted code changes while working on other components.
    -   *CRITICAL:* The Memo component is the core of the app. All changes must be **surgical and with extreme care**.
    -   **Clock Symbol Still Present (Re-addressed):** The clock symbol in `MemoInput`'s `CalendarInput` was still appearing. A forceful CSS rule has been added to `styles/editor_toolbar.css` to hide it. Verification needed.
    -   **Click Functionality Still Broken (Tracing Logs Added):** Clicking timestamps in `DashboardStream` does not update the time in `MemoInput`. Console logs have been added throughout the component chain. User verification with console output is required to diagnose further.
    -   **Width Problem Unresolved (Re-addressed):** The `MemoStream` width layout still caused the custom scrollbar to disappear partly. `overflow-x: auto;` has been added to `.dashboard-stream` in `styles/dashboard_stream.css`. Verification needed.
