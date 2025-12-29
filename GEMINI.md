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
*   **Fixed `SEARCH_BAR_HEIGHT_OFFSET` ReferenceError:** Resolved the crashing issue in `index.tsx` by ensuring the `SEARCH_BAR_HEIGHT_OFFSET` constant is properly defined.

## Gemini TODO List

1.  [completed] Coffee and Milk Feature Enhancements:
    1.  **IconSidebar:** Remove the yellow color (`text-yellow-500`) from the Coffee Counter icon, keeping the symbol.
    2.  **DailyCounterSidebarWidget:** Ensure all table entries (rows) are editable. Specifically, `val1` (Coffee) and `val2` (Milk) should be inline editable. Ensure that editing these values does *not* automatically change the entry's timestamp.
    3.  **DailyCounterFullView:** Make entries editable. Allow the user to manually change the Date and Time of an entry. Ensure that editing other fields (values) does *not* automatically reset or change the datetime.
2.  [pending] Advanced Calendar UI Overhaul (Minor Fixes/Completion): Apply futuristic styling aftertouches to matching `styles` convention.
3.  [pending] Fix Frontend Regressions (MemoInput & Stream): Width Problem Unresolved (Re-addressed): The `MemoStream` width layout still caused the custom scrollbar to disappear partly. `overflow-x: auto;` has-been added to `.dashboard-stream` in `styles/dashboard_stream.css`. Verification needed.
4.  [completed] Fix Frontend Regressions (DailyCounterSidebarWidget): The sidebar widget now displays scrollbars; these must be removed.
5.  [completed] Fix Frontend Regressions (MemoInput & Stream): Memo stream doesn't scroll down on page load or page or day change, should auto-scroll down.
6.  [pending] Feature: MemoInput time should be manually editable via a time-only inplace-popup `CalendarInput` widget.
7.  [completed] Fix Console Error: `Invalid DOM property stroke-width` in IconSidebar.tsx.
8.  [completed] Fix Console Error: `In HTML, whitespace text nodes cannot be a child of <tr>` in DailyCounterSidebarWidget.tsx.
9.  [completed] Fix Console Warning: `Invalid DOM property stroke-linejoin` in IconSidebar.tsx.
10. [completed] Fix Console Warning: `Invalid DOM property class` in IconSidebar.tsx.
11. [completed] Fix Eisenhower Matrix Regressions:
    1.  **Deletion Broken:** Removing entries does not work.
    2.  **Forward Update/Persistence Broken:** Tasks deleted on a specific day (e.g., 25th) are correctly missing on that day but reappear on subsequent days (e.g., 26th). Deleted tasks should remain deleted for all future dates.
12. [in_progress] General Code Cleanup: Remove excessive console log output from past development sessions. (Apply this continuously while working on files).
13. [pending] Feature: DailyCounterSidebarWidget new entry UX improvement.
    1.  The `timestamp` for a new entry should be set when the *first number is added* (on blur or a short delay after typing).
    2.  After saving a new entry, a *new blank line* should appear for subsequent entries.
    3.  The `datetime` and new blank line should appear on leaving focus from the input fields or with a few seconds delay after entry.
14. [in_progress] Refinement: DailyCounterFullView & DailyCounterSidebarWidget Header.
    1.  In the total display (e.g., "Coffee Left 89", "Milk Left 88"), remove the "Coffee Left" and "Milk Left" strings.
    2.  Replace them with small icons (e.g., coffee mug, milk carton/bottle) next to the numbers.
    3.  Goal: Reduce the height of these two big elements.
15. [pending] Feature: Move MainStreamToggle.
    Move the "Memo | AI Convo" toggles from the sidebar (`secondary-sidebar`) to the left/right of the `GlobalSearchBar`.
16. [completed] Refinement: DailyCounterSidebarWidget editable fields.
    1.  In `EditableDailyCounterRow`, `val1` (Coffee) and `val2` (Milk) columns should *always* be editable (remove `isEditing` state).
    2.  Hide the up/down arrows (spinners) for `input[type="number"]` fields using CSS.
17. [pending] BigCalendar Entry Styling & Colors:
    1.  Apply specific CSS properties to entries (bg-blue-500, text-slate-200, pre-wrap, padding, etc).
    2.  If no explicit color is assigned, default to one of 8 random rainbow colors.
18. [pending] BigCalendar Time/Duration Logic & Import Check:
    1.  If specific time/duration is missing, default to 1h duration (NOT all-day) on Weekly/Daily views.
    2.  Investigate external import metadata to improve time/duration parsing.
19. [pending] Feature: Memo Edit Menu - Add to Toolbox option. The Memo Edit Menu (`MemoItem`) currently misses the option to add a link to the "Toolbox". This option needs to be re-added.