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
- [ ] **Settings Page:**
    -   **Page is unformatted ('mess'), switches are missing, order and format needs refinement.**
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

## Gemini TODO List

## High Priority

- [ ] **Browser History & Bookmark Integration:**
    - [x] **Access Browser SQLite DBs:** Implement safe, read-only access to Firefox (`places.sqlite`, `favicons.sqlite`) and Chrome (`History`, `Bookmarks`) SQLite databases.
        - [ ] Research necessary permissions and user consent considerations.
    - [x] **Implement Data Extraction Logic:** Write functions to parse SQLite schemas and extract relevant data (URL, title, **exact timestamp**).
    - [x] **Integrate with Application State:** Display extracted data in the Bookmark / History stream.
    - [x] **Scheduled Import:** Implement a frontend mechanism to import data every 30 minutes (configurable).
    - [ ] **User-Adjustable Config Value:** Introduce a config for import frequency, with a placeholder for a settings UI.

- [ ] **Fix: Broken Editing Content in regular Memo:** Editing content for existing memos is not working as expected. This is a regression that needs immediate attention.

- [x] **Time-Based Entry Insertion & Stream Navigation:**
    - [x] Add a time input field to the memo editor toolbar, defaulting to the current time and auto-updating.
    - [x] Clicking a bookmark timestamp should update the memo editor's time input.
    - [x] Add a "continue using this time" checkbox next to the time input.
    - [x] **Workflow:**
        - User clicks bookmark timestamp -> Input time changes, checkbox auto-activates.
        - User submits an entry -> Entry appears at the correct time position in the stream.
        - Stream window scrolls to the new entry's position.
        - Subsequent entries (including pasted images) are posted at the same time position.
        - User deactivates checkbox -> Input time reverts to `now()`, and new entries are posted at the end of the stream.
        - Stream window autoscrolls to the bottom for new entries.

- [x] **Image Handling & Cropping:**
    - [x] **Backend Update for Image Storage:** Modify the backend to store uploaded images as files in a date-based folder structure (`date/time_filename`).
    - [x] **Backend Image Link Return:** Ensure the backend returns a public link to the stored image file.
    - [x] **Frontend Integration:** Update the frontend to use file links instead of data URIs.
    - [x] **Cropping Modal:**
        - Ensure the "Save" button closes the modal.
        - Cropped images must be saved to the backend as new JPG/WEBP files. The filename should be based on the original image's timestamp to maintain timeline order.

- [x] **Eisenhower Matrix Persistence:**
    - [x] On app startup/reload, check if an Eisenhower matrix entry exists for the current day.
    - [x] If not, copy the matrix from the most recent day that has one.
    - [x] Changes made on a given day are saved only for that day.

## Medium Priority

- [x] **Bookmark Timeline Visuals:**
    - [x] Display the exact item timestamp (hh:mm:ss) in the top-right corner of each bookmark/history entry.
    - [x] **Dynamic Time-on-Dots:**
        - Make dots slightly larger with more space between them.
        - Ensure dots appear correctly even for items that are vertically close.
        - If feasible, insert extra timestamp markers in large empty spaces between bookmark items (dependent on memo content height).
- [x] **Left Sidebar Monthly Calendar:**
    - [x] Add a new, small, fully functional monthly calendar view below the main navigational calendar.
    - [x] Use a React calendar component.
    - [x] Clicking a day opens a modal to add a new event (title, description, time, optional duration, optional link).
    - [x] Events must be saved to and loaded from the backend database.
    - [x] The current day should have a distinct outline (e.g., blue).

- [ ] **Full Calendar Page Refinement:**
    - [ ] **Visuals:** Improve overall aesthetics (Google/Apple Calendar like).
    - [ ] **Font Sizes:** Increase font size of entries, weekdays, and day-numbers by at least 3px.
    - [ ] **Current Day Highlight:** Fix "TODAY's day is completely blue instead of like a blue border."
    - [ ] **Input Modal:** Improve Event Input Modal.
    - [ ] **Google Maps Locations for Events:** (if simple to integrate): Add a picker to record locations as links, not as embedded iframes.

- [x] **Link Previews/Thumbnails:**
    - [x] Implement a mechanism to fetch and display preview images/thumbnails for links (e.g., YouTube videos, social media links).
    - [x] Keep the implementation simple; full iframe embeds are not required, just a meta thumbnail or similar.

- [x] **Main Stream Enhancements:**
    - [x] Implement "Edit After the Fact" for all entry types in the stream.
    - [x] Add a hamburger menu icon to each entry in the stream with options for editing, moving, etc.
    - [ ] Allow changing the type of an entry (e.g., from text to code).
    - [ ] Enable moving items within the stream (drag and drop).
    - [x] Add a manual "change time" option for stream entries.
    - [ ] Implement copy/move to another day via the calendar.
    - [x] **Adjust Time After Fact:** Add option to adjust time for existing memos.
    - [ ] **Time Grouping Toggle ("Precise Time" vs "Grouped Time"):**
        *   Add toggle in bottom right corner next to chat input.
        *   "Precise Time": Current behavior.
        *   "Grouped Time": Reduce time precision, add grace period for grouping closely timed entries (e.g., "9:10 Memo | 9:15-9:30 Browsing History | 9:40 Memo" appear side-by-side).
    - [x] **Display Memo Entry Time:** Add time in bottom right corner of memo entries.

- [x] **Data Persistence / Deletion:**
    - [x] Implement backend logic for persistent deletion of items.

- [x] **Note Editing:**
    - [x] Integrate the Milkdown editor for a full-featured Markdown editing experience.
    - [x] The editor should open inline within the stream, not in a modal.
    - [x] Implement versioned saving of notes to the database.
    - [x] **Fix Edit Entry CSS Formatting:** Style memo edit textarea, tag pills, and save/cancel buttons for readability (dark text on dark background, proper button colors/formatting).
    - [ ] **Add "Edit Time" options:** To memo entries (in dropdown menu).
    - [ ] **Use MilkDown for editing:** In the final version, editing should also show MilkDown with toolbar.

- [ ] **Global Undo:**
    - [ ] Implement a global undo/redo system that works across all actions.

## Gemini TODO List

## Highest Priority

- [ ] **Fix: BookmarkView not showing current day:**
    - [ ] Investigate why BookmarkView only shows past days' entries and fix it to include the current day.
- [ ] **Refactor: Settings page layout and functionality:**
    - [ ] Order and format the Settings page properly for better user experience.
    - [ ] Implement visually functional toggle switches.
- [ ] **Fix: Old saved notebooks not loading:**
    - [ ] Debug why old saved notebooks are not loading from the database despite persistence efforts.

## High Priority

- [ ] **Browser History & Bookmark Integration:**
    - [x] **Access Browser SQLite DBs:** Implement safe, read-only access to Firefox (`places.sqlite`, `favicons.sqlite`) and Chrome (`History`, `Bookmarks`) SQLite databases.
        - [ ] Research necessary permissions and user consent considerations.
    - [x] **Implement Data Extraction Logic:** Write functions to parse SQLite schemas and extract relevant data (URL, title, **exact timestamp**).
    - [x] **Integrate with Application State:** Display extracted data in the Bookmark / History stream.
    - [x] **Scheduled Import:** Implement a frontend mechanism to import data every 30 minutes (configurable).
    - [ ] **User-Adjustable Config Value:** Introduce a config for import frequency, with a placeholder for a settings UI.

- [ ] **Fix: Broken 'Editing Content' in regular Memo:** This functionality has been regressed during recent changes and needs to be fixed. Editing content for existing memos is not working as expected.

- [x] **Time-Based Entry Insertion & Stream Navigation:**
    - [x] Add a time input field to the memo editor toolbar, defaulting to the current time and auto-updating.
    - [x] Clicking a bookmark timestamp should update the memo editor's time input.
    - [x] Add a "continue using this time" checkbox next to the time input.
    - [x] **Workflow:**
        - User clicks bookmark timestamp -> Input time changes, checkbox auto-activates.
        - User submits an entry -> Entry appears at the correct time position in the stream.
        - Stream window scrolls to the new entry's position.
        - Subsequent entries (including pasted images) are posted at the same time position.
        - User deactivates checkbox -> Input time reverts to `now()`, and new entries are posted at the end of the stream.
        - Stream window autoscrolls to the bottom for new entries.

- [x] **Image Handling & Cropping:**
    - [x] **Backend Update for Image Storage:** Modify the backend to store uploaded images as files in a date-based folder structure (`date/time_filename`).
    - [x] **Backend Image Link Return:** Ensure the backend returns a public link to the stored image file.
    - [x] **Frontend Integration:** Update the frontend to use file links instead of data URIs.
    - [x] **Cropping Modal:**
        - Ensure the "Save" button closes the modal.
        - Cropped images must be saved to the backend as new JPG/WEBP files. The filename should be based on the original image's timestamp to maintain timeline order.

- [x] **Eisenhower Matrix Persistence:**
    - [x] On app startup/reload, check if an Eisenhower matrix entry exists for the current day.
    - [x] If not, copy the matrix from the most recent day that has one.
    - [x] Changes made on a given day are saved only for that day.

## Medium Priority

- [x] **Bookmark Timeline Visuals:**
    - [x] Display the exact item timestamp (hh:mm:ss) in the top-right corner of each bookmark/history entry.
    - [x] **Dynamic Time-on-Dots:**
        - Make dots slightly larger with more space between them.
        - Ensure dots appear correctly even for items that are vertically close.
        - If feasible, insert extra timestamp markers in large empty spaces between bookmark items (dependent on memo content height).
- [x] **Left Sidebar Monthly Calendar:**
    - [x] Add a new, small, fully functional monthly calendar view below the main navigational calendar.
    - [x] Use a React calendar component.
    - [x] Clicking a day opens a modal to add a new event (title, description, time, optional duration, optional link).
    - [x] Events must be saved to and loaded from the backend database.
    - [x] The current day should have a distinct outline (e.g., blue).

- [ ] **Full Calendar Page Refinement:**
    - [ ] **Visuals:** Improve overall aesthetics (Google/Apple Calendar like).
    - [ ] **Font Sizes:** Increase font size of entries, weekdays, and day-numbers by at least 3px.
    - [ ] **Current Day Highlight:** Fix "TODAY's day is completely blue instead of like a blue border."
    - [ ] **Input Modal:** Improve Event Input Modal.
    - [ ] **Google Maps Locations for Events:** (if simple to integrate): Add a picker to record locations as links, not as embedded iframes.

- [x] **Link Previews/Thumbnails:**
    - [x] Implement a mechanism to fetch and display preview images/thumbnails for links (e.g., YouTube videos, social media links).
    - [x] Keep the implementation simple; full iframe embeds are not required, just a meta thumbnail or similar.

- [ ] **Main Stream Enhancements:**
    - [x] Implement "Edit After the Fact" for all entry types in the stream.
    - [x] Add a hamburger menu icon to each entry in the stream with options for editing, moving, etc.
    - [ ] Allow changing the type of an entry (e.g., from text to code).
    - [ ] Enable moving items within the stream (drag and drop).
    - [x] Add a manual "change time" option for stream entries.
    - [ ] Implement copy/move to another day via the calendar.
    - [x] **Adjust Time After Fact:** Add option to adjust time for existing memos.
    - [ ] **Time Grouping Toggle ("Precise Time" vs "Grouped Time"):**
        *   Add toggle in bottom right corner next to chat input.
        *   "Precise Time": Current behavior.
        *   "Grouped Time": Reduce time precision, add grace period for grouping closely timed entries (e.g., "9:10 Memo | 9:15-9:30 Browsing History | 9:40 Memo" appear side-by-side).
    - [x] **Display Memo Entry Time:** Add time in bottom right corner of memo entries.
    - [ ] **Fix: Scrolling & Navigation (Memo and AI Streams):**
        *   [ ] Debug and fix "Jump to entry", "PrevEntry/NextEntry" buttons, and "ScrollToBottom" on app/page/date change for both Memo and AI streams.
        *   [ ] Implement proper DATA attributes on UnifiedStream wrapper elements to distinguish memos from bookmarks for navigation.
        *   [ ] Ensure QuickScrollButtons navigate *only* to memo/AI entries and not bookmarks.
        *   [ ] Clarify Search results navigation (can jump to bookmarks).

- [x] **Data Persistence / Deletion:**
    - [x] Implement backend logic for persistent deletion of items.

- [x] **Note Editing:**
    - [x] Integrate the Milkdown editor for a full-featured Markdown editing experience.
    - [x] The editor should open inline within the stream, not in a modal.
    - [x] Implement versioned saving of notes to the database.
    - [x] **Fix Edit Entry CSS Formatting:** Style memo edit textarea, tag pills, and save/cancel buttons for readability (dark text on dark background, proper button colors/formatting).
    - [ ] **Add "Edit Time" options:** To memo entries (in dropdown menu).
    - [ ] **Use MilkDown for editing:** In the final version, editing should also show MilkDown with toolbar.

- [ ] **Global Undo:**
    - [ ] Implement a global undo/redo system that works across all actions.

- [ ] **Gallery Enhancements:**
    - [ ] Change default Gallery thumbnail click behavior to open a full-size modal.
    - [ ] Convert Gallery thumbnails into "jump to source" buttons within the modal, displaying relevant metadata.

## Gemini TODO List

## Highest Priority

- [ ] **Fix: BookmarkView not showing current day:**
    - [ ] Investigate why BookmarkView only shows past days' entries and fix it to include the current day.
- [ ] **Refactor: Settings page layout and functionality:**
    - [ ] Order and format the Settings page properly for better user experience.
    - [ ] Implement visually functional toggle switches.
- [ ] **Fix: Old saved notebooks not loading:**
    - [ ] Debug why old saved notebooks are not loading from the database despite persistence efforts.
- [ ] **Fix: Memo and AI Stream Scrolling/Navigation:**
    - [ ] Debug and fix "Jump to entry", "PrevEntry/NextEntry" buttons, and "ScrollToBottom" on app/page/date change for both Memo and AI streams.
    *   [ ] Implement proper DATA attributes on UnifiedStream wrapper elements to distinguish memos from bookmarks for navigation.
    *   [ ] Ensure QuickScrollButtons navigate *only* to memo/AI entries and not bookmarks.
    *   [ ] Clarify Search results navigation (can jump to bookmarks).
- [ ] **Enhancement: Gallery:**
    - [ ] Change default Gallery thumbnail click behavior to open a full-size modal.
    *   [ ] Convert Gallery thumbnails into "jump to source" buttons within the modal, displaying relevant metadata.
- [ ] **New View: Creds & Identity Window:**
    - [ ] Implement Creds & Identity Window with a 2-column layout.
    - [ ] Column 1: List with plus button to add entries (title, url, username, password, fields for API keys (or free text)).
    - [ ] Column 2: 2x2 grid for user cards (profile images, full name, address details, manage employee details).
- [ ] **New View: File Browser (Google Drive-like Virtual Filesystem):**
    - [ ] Design and implement a new "File Browser" view accessible from the left icon sidebar.
    - [ ] Integrate functionality to browse and display physically stored files (uploaded to date folders with time-based filenames).
    - [ ] Develop a virtual filesystem layer (folders, reordering, renaming, deleting) to be stored in the DB.
    - [ ] Ensure support for all file types (images, zip, docs, txt, etc.) in memo entries.
    - [ ] Implement asynchronous large file uploads/downloads with a small progress bar displayed at the bottom of the app.
    - [ ] Integrate management, viewing, downloading, and deletion capabilities for these files within the view.

## High Priority

- [ ] **Browser History & Bookmark Integration:**
    - [x] **Access Browser SQLite DBs:** Implement safe, read-only access to Firefox (`places.sqlite`, `favicons.sqlite`) and Chrome (`History`, `Bookmarks`) SQLite databases.
        - [ ] Research necessary permissions and user consent considerations.
    - [x] **Implement Data Extraction Logic:** Write functions to parse SQLite schemas and extract relevant data (URL, title, **exact timestamp**).
    - [x] **Integrate with Application State:** Display extracted data in the Bookmark / History stream.
    - [x] **Scheduled Import:** Implement a frontend mechanism to import data every 30 minutes (configurable).
    - [ ] **User-Adjustable Config Value:** Introduce a config for import frequency, with a placeholder for a settings UI.

- [ ] **Fix: Broken 'Editing Content' in regular Memo:** This functionality has been regressed during recent changes and needs to be fixed. Editing content for existing memos is not working as expected.

- [x] **Time-Based Entry Insertion & Stream Navigation:**
    - [x] Add a time input field to the memo editor toolbar, defaulting to the current time and auto-updating.
    - [x] Clicking a bookmark timestamp should update the memo editor's time input.
    - [x] Add a "continue using this time" checkbox next to the time input.
    - [x] **Workflow:**
        - User clicks bookmark timestamp -> Input time changes, checkbox auto-activates.
        - User submits an entry -> Entry appears at the correct time position in the stream.
        - Stream window scrolls to the new entry's position.
        - Subsequent entries (including pasted images) are posted at the same time position.
        - User deactivates checkbox -> Input time reverts to `now()`, and new entries are posted at the end of the stream.
        - Stream window autoscrolls to the bottom for new entries.

- [x] **Image Handling & Cropping:**
    - [x] **Backend Update for Image Storage:** Modify the backend to store uploaded images as files in a date-based folder structure (`date/time_filename`).
    - [x] **Backend Image Link Return:** Ensure the backend returns a public link to the stored image file.
    - [x] **Frontend Integration:** Update the frontend to use file links instead of data URIs.
    - [x] **Cropping Modal:**
        - Ensure the "Save" button closes the modal.
        - Cropped images must be saved to the backend as new JPG/WEBP files. The filename should be based on the original image's timestamp to maintain timeline order.

- [x] **Eisenhower Matrix Persistence:**
    - [x] On app startup/reload, check if an Eisenhower matrix entry exists for the current day.
    - [x] If not, copy the matrix from the most recent day that has one.
    - [x] Changes made on a given day are saved only for that day.

## Medium Priority

- [x] **Bookmark Timeline Visuals:**
    - [x] Display the exact item timestamp (hh:mm:ss) in the top-right corner of each bookmark/history entry.
    - [x] **Dynamic Time-on-Dots:**
        - Make dots slightly larger with more space between them.
        - Ensure dots appear correctly even for items that are vertically close.
        - If feasible, insert extra timestamp markers in large empty spaces between bookmark items (dependent on memo content height).
- [x] **Left Sidebar Monthly Calendar:**
    - [x] Add a new, small, fully functional monthly calendar view below the main navigational calendar.
    - [x] Use a React calendar component.
    - [x] Clicking a day opens a modal to add a new event (title, description, time, optional duration, optional link).
    - [x] Events must be saved to and loaded from the backend database.
    - [x] The current day should have a distinct outline (e.g., blue).

- [ ] **Full Calendar Page Refinement:**
    - [ ] **Visuals:** Improve overall aesthetics (Google/Apple Calendar like).
    - [ ] **Font Sizes:** Increase font size of entries, weekdays, and day-numbers by at least 3px.
    - [ ] **Current Day Highlight:** Fix "TODAY's day is completely blue instead of like a blue border."
    - [ ] **Input Modal:** Improve Event Input Modal.
    - [ ] **Google Maps Locations for Events:** (if simple to integrate): Add a picker to record locations as links, not as embedded iframes.

- [x] **Link Previews/Thumbnails:**
    - [x] Implement a mechanism to fetch and display preview images/thumbnails for links (e.g., YouTube videos, social media links).
    - [x] Keep the implementation simple; full iframe embeds are not required, just a meta thumbnail or similar.

- [x] **Main Stream Enhancements:**
    - [x] Implement "Edit After the Fact" for all entry types in the stream.
    - [x] Add a hamburger menu icon to each entry in the stream with options for editing, moving, etc.
    - [ ] Allow changing the type of an entry (e.g., from text to code).
    - [ ] Enable moving items within the stream (drag and drop).
    - [x] Add a manual "change time" option for stream entries.
    - [ ] Implement copy/move to another day via the calendar.
    - [x] **Adjust Time After Fact:** Add option to adjust time for existing memos.
    - [ ] **Time Grouping Toggle ("Precise Time" vs "Grouped Time"):**
        *   Add toggle in bottom right corner next to chat input.
        *   "Precise Time": Current behavior.
        *   "Grouped Time": Reduce time precision, add grace period for grouping closely timed entries (e.g., "9:10 Memo | 9:15-9:30 Browsing History | 9:40 Memo" appear side-by-side).
    - [x] **Display Memo Entry Time:** Add time in bottom right corner of memo entries.

- [x] **Data Persistence / Deletion:**
    - [x] Implement backend logic for persistent deletion of items.

- [x] **Note Editing:**
    - [x] Integrate the Milkdown editor for a full-featured Markdown editing experience.
    - [x] The editor should open inline within the stream, not in a modal.
    - [x] Implement versioned saving of notes to the database.
    - [x] **Fix Edit Entry CSS Formatting:** Style memo edit textarea, tag pills, and save/cancel buttons for readability (dark text on dark background, proper button colors/formatting).
    - [ ] **Add "Edit Time" options:** To memo entries (in dropdown menu).
    - [ ] **Use MilkDown for editing:** In the final version, editing should also show MilkDown with toolbar.

- [ ] **Global Undo:**
    - [ ] Implement a global undo/redo system that works across all actions.

## Gemini TODO List

## Highest Priority

- [ ] **Fix: BookmarkView not showing current day:**
    - [ ] Investigate why BookmarkView only shows past days' entries and fix it to include the current day.
- [ ] **Refactor: Settings page layout and functionality:**
    - [ ] Order and format the Settings page properly for better user experience.
    - [ ] Implement visually functional toggle switches.
- [ ] **Fix: Old saved notebooks not loading:**
    - [ ] Debug why old saved notebooks are not loading from the database despite persistence efforts.
- [ ] **Fix: Memo and AI Stream Scrolling/Navigation:**
    *   [ ] Debug and fix "Jump to entry", "PrevEntry/NextEntry" buttons, and "ScrollToBottom" on app/page/date change for both Memo and AI streams.
    *   [ ] Implement proper DATA attributes on UnifiedStream wrapper elements to distinguish memos from bookmarks for navigation.
    *   [ ] Ensure QuickScrollButtons navigate *only* to memo/AI entries and not bookmarks.
    *   [ ] Clarify Search results navigation (can jump to bookmarks).
- [ ] **Enhancement: Gallery:**
    *   [ ] Change default Gallery thumbnail click behavior to open a full-size modal.
    *   [ ] Convert Gallery thumbnails into "jump to source" buttons within the modal, displaying relevant metadata.
- [ ] **New View: Creds & Identity Window:**
    *   [ ] Implement Creds & Identity Window with a 2-column layout.
    *   [ ] Column 1: List with plus button to add entries (title, url, username, password, fields for API keys (or free text)).
    *   [ ] Column 2: 2x2 grid for user cards (profile images, full name, address details, manage employee details).
- [ ] **New View: File Browser (Google Drive-like Virtual Filesystem):**
    *   [ ] Design and implement a new "File Browser" view accessible from the left icon sidebar.
    *   [ ] Integrate functionality to browse and display physically stored files (uploaded to date folders with time-based filenames).
    *   [ ] Develop a virtual filesystem layer (folders, reordering, renaming, deleting) to be stored in the DB.
    *   [ ] Ensure support for all file types (images, zip, docs, txt, etc.) in memo entries.
    *   [ ] Implement asynchronous large file uploads/downloads with a small progress bar displayed at the bottom of the app.
    *   [ ] Integrate management, viewing, downloading, and deletion capabilities for these files within the view.

## High Priority

- [ ] **Browser History & Bookmark Integration:**
    - [x] **Access Browser SQLite DBs:** Implement safe, read-only access to Firefox (`places.sqlite`, `favicons.sqlite`) and Chrome (`History`, `Bookmarks`) SQLite databases.
        - [ ] Research necessary permissions and user consent considerations.
    - [x] **Implement Data Extraction Logic:** Write functions to parse SQLite schemas and extract relevant data (URL, title, **exact timestamp**).
    - [x] **Integrate with Application State:** Display extracted data in the Bookmark / History stream.
    - [x] **Scheduled Import:** Implement a frontend mechanism to import data every 30 minutes (configurable).
    - [ ] **User-Adjustable Config Value:** Introduce a config for import frequency, with a placeholder for a settings UI.

- [ ] **Fix: Broken 'Editing Content' in regular Memo:** This functionality has been regressed during recent changes and needs to be fixed. Editing content for existing memos is not working as expected.

- [x] **Time-Based Entry Insertion & Stream Navigation:**
    - [x] Add a time input field to the memo editor toolbar, defaulting to the current time and auto-updating.
    - [x] Clicking a bookmark timestamp should update the memo editor's time input.
    - [x] Add a "continue using this time" checkbox next to the time input.
    - [x] **Workflow:**
        - User clicks bookmark timestamp -> Input time changes, checkbox auto-activates.
        - User submits an entry -> Entry appears at the correct time position in the stream.
        - Stream window scrolls to the new entry's position.
        - Subsequent entries (including pasted images) are posted at the same time position.
        - User deactivates checkbox -> Input time reverts to `now()`, and new entries are posted at the end of the stream.
        - Stream window autoscrolls to the bottom for new entries.

- [x] **Image Handling & Cropping:**
    - [x] **Backend Update for Image Storage:** Modify the backend to store uploaded images as files in a date-based folder structure (`date/time_filename`).
    - [x] **Backend Image Link Return:** Ensure the backend returns a public link to the stored image file.
    - [x] **Frontend Integration:** Update the frontend to use file links instead of data URIs.
    - [x] **Cropping Modal:**
        - Ensure the "Save" button closes the modal.
        - Cropped images must be saved to the backend as new JPG/WEBP files. The filename should be based on the original image's timestamp to maintain timeline order.

- [x] **Eisenhower Matrix Persistence:**
    - [x] On app startup/reload, check if an Eisenhower matrix entry exists for the current day.
    - [x] If not, copy the matrix from the most recent day that has one.
    - [x] Changes made on a given day are saved only for that day.

## Medium Priority

- [x] **Bookmark Timeline Visuals:**
    - [x] Display the exact item timestamp (hh:mm:ss) in the top-right corner of each bookmark/history entry.
    - [x] **Dynamic Time-on-Dots:**
        - Make dots slightly larger with more space between them.
        - Ensure dots appear correctly even for items that are vertically close.
        - If feasible, insert extra timestamp markers in large empty spaces between bookmark items (dependent on memo content height).
- [x] **Left Sidebar Monthly Calendar:**
    - [x] Add a new, small, fully functional monthly calendar view below the main navigational calendar.
    - [x] Use a React calendar component.
    - [x] Clicking a day opens a modal to add a new event (title, description, time, optional duration, optional link).
    - [x] Events must be saved to and loaded from the backend database.
    - [x] The current day should have a distinct outline (e.g., blue).

- [ ] **Full Calendar Page Refinement:**
    - [ ] **Visuals:** Improve overall aesthetics (Google/Apple Calendar like).
    - [ ] **Font Sizes:** Increase font size of entries, weekdays, and day-numbers by at least 3px.
    - [ ] **Current Day Highlight:** Fix "TODAY's day is completely blue instead of like a blue border."
    - [ ] **Input Modal:** Improve Event Input Modal.
    - [ ] **Google Maps Locations for Events:** (if simple to integrate): Add a picker to record locations as links, not as embedded iframes.

- [x] **Link Previews/Thumbnails:**
    - [x] Implement a mechanism to fetch and display preview images/thumbnails for links (e.g., YouTube videos, social media links).
    - [x] Keep the implementation simple; full iframe embeds are not required, just a meta thumbnail or similar.

- [x] **Main Stream Enhancements:**
    - [x] Implement "Edit After the Fact" for all entry types in the stream.
    - [x] Add a hamburger menu icon to each entry in the stream with options for editing, moving, etc.
    - [ ] Allow changing the type of an entry (e.g., from text to code).
    - [ ] Enable moving items within the stream (drag and drop).
    - [x] Add a manual "change time" option for stream entries.
    - [ ] Implement copy/move to another day via the calendar.
    - [x] **Adjust Time After Fact:** Add option to adjust time for existing memos.
    - [ ] **Time Grouping Toggle ("Precise Time" vs "Grouped Time"):**
        *   Add toggle in bottom right corner next to chat input.
        *   "Precise Time": Current behavior.
        *   "Grouped Time": Reduce time precision, add grace period for grouping closely timed entries (e.g., "9:10 Memo | 9:15-9:30 Browsing History | 9:40 Memo" appear side-by-side).
    - [x] **Display Memo Entry Time:** Add time in bottom right corner of memo entries.

- [x] **Data Persistence / Deletion:**
    - [x] Implement backend logic for persistent deletion of items.

- [x] **Note Editing:**
    - [x] Integrate the Milkdown editor for a full-featured Markdown editing experience.
    - [x] The editor should open inline within the stream, not in a modal.
    - [x] Implement versioned saving of notes to the database.
    - [x] **Fix Edit Entry CSS Formatting:** Style memo edit textarea, tag pills, and save/cancel buttons for readability (dark text on dark background, proper button colors/formatting).
    - [ ] **Add "Edit Time" options:** To memo entries (in dropdown menu).
    - [ ] **Use MilkDown for editing:** In the final version, editing should also show MilkDown with toolbar.

- [ ] **Global Undo:**
    - [ ] Implement a global undo/redo system that works across all actions.

## Highest Priority

- [ ] **D3 Node Graph / Knowledge Graph:**
    - [x] Create a new component/view accessible from the left icon sidebar.
    - [x] Display a connection node graph (like in Obsidian) to visualize relationships between entries.
    - [x] Initial implementation can be based on tags or automatic keywords.
    - [ ] Later add options menu, search keywords for graph.

- [ ] **Global Search Bar:**
    - [x] **Layout:**
        *   Position search bar in the middle of all 3 columns.
        *   Create a fixed 30px height "Menu" bar at the top to contain the search bar.
    - [x] **Functionality:**
        *   Results window is not wide enough (but not 100%).
        *   Clicking search results should scroll/jump to the found entry.
    - [x] **Search criteria:** Memo entry, tags, bookmark/history page titles and URLs.
    - [x] **Method:** Simple regex search, `GLOB` or `LIKE` ("*graphics*" in title or url or memo entry or tags).

- [ ] **AI Toolbox:**
    - [ ] Refine the AI toolbox with more meaningful and categorized tools.
    - [ ] Focus on free and open-source alternatives where possible.
    - [ ] Categories to consider: Image Creation, Video Editing, etc.
    - [ ] **AI Tagging & Keyword Extraction:** Implement small-scale AI for automatic tagging and keyword extraction.
    - [ ] **Deep Search & AI RAG:** Develop deep search functionality and AI RAG capabilities.
    - [ ] **Local AI Model Integration:** Integrate an all-time CPU super-tiny model and local Ollama GPT-OSS for RAG.

- [ ] **Ollama Local Chatmodel Integration:**
    - [ ] Simple integration, utilizing existing prepared page.
    - [ ] "Ask Model" secondary submit button on main memo stream (contingent on separate chat stream window).

- [x] **Scrolling & Navigation Enhancements:**
    - [x] **Comprehensive Auto-Scrolling:** App scrolls to new entries; scrolls to bottom on app start, reload, or view change.
    - [x] **Quickscroll Buttons:** Implement buttons for quick navigation (e.g., arrows, allDown, allUp, prevEntry, nextEntry, oneHourBack, oneHourForw).
    - [ ] **Minimap Sidebar (Nice to have but maybe too complex):** Implement a minimap for the main stream, similar to the one in VSCode, for improved navigation. (This is a complex task due to rendering challenges and should be considered lower priority for now).

- [ ] **Creds & Identity Window:**
    - [ ] **Layout:** 2 columns.
    - [ ] **Column 1 (smaller):**
        *   List with a plus button.
        *   Add entries statically: title, url, username, password, fields for API keys (or free text).
    - [ ] **Column 2 (user cards):**
        *   2x2 grid.
        *   Profile images (multiple possible).
        *   Full Name and Full address details per user.
        *   Manage employee details.

- [ ] **Code Cleanliness & Refactoring:**
    - [ ] Continuously refactor the codebase into smaller, single-responsibility components.
    - [ ] Ensure the codebase remains manageable and easy to understand.

- [ ] **Left Icon Sidebar Pages Styling:**
    - [ ] **Bookmark Page Formatting:** Correctly format bookmark entries in the separate bookmark page, ensuring proper list styling and displaying all metadata.
    - [ ] **General UI/UX Refinement:** Address all visual and user experience details across the application to bring it to a 1.0 release quality.

- [ ] **Main Memo View Height:** Ensure the memo stream output window and bookmarks window are always full window height, or at least as high as the left widget sidebar (not affecting the editor area below).