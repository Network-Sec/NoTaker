# NoTaker - Developer Guide
Note: We got the current "Final 0.9.9-beta" in long-running test currently, we need to make a few final adjustments, backups are too often and not cleared etc. - will upload before end of this week, it's a bit of a hassle to commit to public git since we got an internal git with more open gitignore. But it will come soon.

## Overview

NoTaker is a local-first, powerful note-taking application designed for developers, writers, and thinkers. It combines a free-form daily stream with structured notebooks, task management, and bookmarking to create a comprehensive personal knowledge base.

This guide provides instructions for developers to set up the project and outlines the path to building the full desktop application using Electron and SQLite.

## Feature Checklist & TODO
 
### Core Features
- [x] Daily Stream View
- [x] Rich-Text Block Editor (Headings, Lists, Bold, Italic, etc.)
- [x] Notebooks with Block Editor
- [x] Tagging System & Filtering
- [x] Calendar View & Navigation
- [x] Image Gallery
- [x] Bookmark Manager
- [x] AI Note Generation
- [x] Toolbox for External Links
- [x] **Full-featured Top Toolbar** for both editors.
- [x] **4-Part Task Board (Kanban)** with drag-and-drop.
- [x] **Database Abstraction Layer** (`services/db.ts`) to prepare for SQLite.
- [x] Correct LTR text input and cursor behavior.
- [x] Fixed timeline layout in the stream.
- [x] Fixed code block creation and editing.

### Next Steps (TODO)
- [ ] **Implement Electron Build:** Convert the project to an Electron application.
- [ ] **Integrate SQLite:** Replace the `localStorage` implementation in `services/db.ts` with `sqlite3`.
- [ ] **Implement File Storage:** For pasted images, save them to the user's local app data directory instead of using base64.
- [ ] **Implement Bookmark/History Importer:** Write the Node.js script to read browser history files (e.g., Chrome's SQLite history) and import them.
- [ ] **Refine UI/UX:** Continuous improvements to styling and user experience.
- [ ] **Settings Panel:** Add a settings panel for user preferences.

---

## Developer Installation (Web Version)

The current version runs as a pure client-side web application. No build step is required.

1.  **Ensure you have a modern web browser** (Chrome, Firefox, Edge).
2.  **Serve the project root directory** using a local web server. A simple way to do this is with Python:
    ```bash
    # Navigate to the project directory
    cd /path/to/your/project
    
    # If you have Python 3.x
    python3 -m http.server
    
    # If you have Python 2.x
    python -m SimpleHTTPServer
    ```
3.  Open your web browser and navigate to `http://localhost:8000`.

---

## Migration to Desktop App (Electron + SQLite)

This application is designed to be evolved into a full desktop application using **Electron**. This will allow for proper local file storage and a `sqlite3` database, creating a robust and private user experience.

### Step 1: Setting up Electron

1.  Initialize a `package.json` file in your project root: `npm init -y`
2.  Install Electron: `npm install --save-dev electron`
3.  Create a `main.js` file. This will be the main process for your Electron app. It will create the browser window and handle system events.
4.  Modify `package.json` to add a start script:
    ```json
    "scripts": {
      "start": "electron ."
    }
    ```
5.  In `main.js`, you will load `index.html` into the Electron `BrowserWindow`.

### Step 2: Integrating SQLite

The key to this migration is the **Database Abstraction Layer** found in `services/db.ts`. All application code uses this service to interact with data. You only need to change this one file to switch from `localStorage` to SQLite.

1.  Install the `sqlite3` package: `npm install sqlite3`
2.  **In your Electron `main.js` file**, you will set up IPC (Inter-Process Communication) handlers to listen for requests from the renderer process (your app) and interact with the SQLite database.
3.  **Modify `services/db.ts`** to use `ipcRenderer` to call the main process instead of `localStorage`.

**Example `services/db.ts` modification for Electron:**

```typescript
// This file runs in the renderer process.
// It sends messages to the main process to interact with the database.
// You would need to expose 'ipcRenderer' via a preload script in Electron.

// Example function for getting memos
async function getMemos(): Promise<Memo[]> {
  return window.electron.ipcRenderer.invoke('db:getMemos');
}

// Example function for saving memos
async function saveMemos(memos: Memo[]): Promise<void> {
  return window.electron.ipcRenderer.invoke('db:saveMemos', memos);
}

// You would create similar functions for notebooks, tasks, and bookmarks.
```

### Step 3: Handling Local File Storage (for Images)

In the Electron app, you should not store images as base64 strings in the database. Instead, save them to the user's file system and store the file path.

1.  In your `main.js`, determine a path for storing user data, e.g., using `app.getPath('userData')`.
2.  When an image is pasted/uploaded in `MemoInput.tsx`, send the base64 data to the main process via IPC.
3.  In the main process, decode the base64 string, save it as a `.png` file in the user data directory, and return the `file://` path to the renderer process.
4.  Store this `file://` path in the memo's content field. The Electron `BrowserWindow` will be able to render these images directly.
