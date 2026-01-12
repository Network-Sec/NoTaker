# NoTaker - PKM for Hackers (Beta)

NoTaker is an outstanding Personal Knowledge Management (PKM) tool designed for power users. Its core feature is a WhatsApp chat-like stream where you can paste content (text, markdown, code, images) which appears time-tagged and is saved to a SQLite database. Images are stored as files on the backend. The application features a 3-column layout: a left sidebar with a calendar and Eisenhower matrix, a central chat stream, and a right stream displaying browser history and bookmarks.

**Current Version: 1.0.2-beta** - *Mostly feature complete, currently undergoing minor bug fixes and polish.*

## 🚀 Getting Started

This guide provides basic instructions for setting up and running NoTaker.

### ⚙️ Configuration (`.env` files)

NoTaker uses `.env` files for configuration. You'll need to set up two: one for the root (frontend) and one for the `server/` directory.

#### 1. Root `.env` (Frontend)

Create a file named `.env` in the project root (`NoTaker/.env`) with the following content:

```
VITE_SERVER_URL=http://localhost:3001
```

#### 2. Server `.env` (Backend)

Create a file named `.env` in the `server/` directory (`NoTaker/server/.env`). This file manages critical backend settings:

```
# Server Port
PORT=3001

# Secret key for encrypting/decrypting sensitive data (e.g., backup files)
# IMPORTANT: Generate a strong, random key and keep it secure.
# Example: openssl rand -base64 32
SECRET_KEY="your_very_secret_and_long_random_key_here" 

# Chromium-based browser history import paths (absolute paths)
# Only Chrome is fully supported in this version.
# Example for Linux: /home/youruser/.config/google-chrome/Default/History
# Example for Windows: C:\Users\YourUser\AppData\Local\Google\Chrome\User Data\Default\History
# Ensure these paths are correct for your system and the user profile you want to import from.
CHROME_HISTORY_PATH="/path/to/your/chrome/History" 
BRAVE_HISTORY_PATH="/path/to/your/brave/History"
FIREFOX_PROFILE_PATH="/path/to/your/firefox/profile" # Not fully implemented yet
```
**Replace the placeholder paths and `SECRET_KEY` with your actual values.** The `SECRET_KEY` is crucial for backup encryption.

### 📦 Installation & Running

NoTaker runs as separate frontend and backend processes.

#### 1. Install Dependencies

In the project root, run:
```bash
npm install
```
Then, navigate to the `server` directory and install its dependencies:
```bash
cd server
npm install
cd .. # Go back to root
```

#### 2. Start Backend

From the project root, start the backend server:
```bash
npm run server
```
*(This command typically uses `nodemon` for auto-reloading on changes. Wait until you see messages indicating the server is running, usually on `http://localhost:3001`.)*

#### 3. Start Frontend

In a **new terminal window**, from the project root, start the frontend development server:
```bash
npm run dev
```
*(This command uses `vite` for fast development. It will open a new browser tab automatically or provide a local URL, typically `http://localhost:3000`.)*

## ✨ Features (Core)

*   **Chat-like Stream:** Time-tagged entries for memos, links, and code.
*   **Markdown & Code Support:** Rich text editing and syntax-highlighted code blocks.
*   **Image Handling:** Paste images directly into the stream, saved to the backend.
*   **Browser History Integration:** Timeline view of imported Chrome history.
*   **Eisenhower Matrix:** Task management with Urgency/Importance categorization.
*   **Calendar View:** Integrate memos and events into a daily/monthly calendar.
*   **Toolbox:** Quick access to frequently used items.
*   **Search:** Global search across all entries.

## 🚧 Development Roadmap (Post 1.0.2-beta)

NoTaker is currently stable and mostly feature complete. Future development will focus on:

*   **Image Handling Refinement:** Non-destructive cropping, undo functionality.
*   **Scrolling & Navigation:** Enhanced "jump-to" features, smoother timeline navigation.
*   **Notebooks V2:** Subpages, image inclusion, advanced export, internal linking.
*   **UI/UX Polish:** Consistent styling, improved responsiveness, accessibility.
*   **Performance & Scalability:** Optimizations for large datasets.
*   **AI Integration:** Small-scale AI for tagging, summarization (future).

## 🐛 Issues & Contributions

If you encounter any issues or have suggestions, please refer to the `GEMINI.md` document for the latest development log and planned tasks. Contributions are welcome!
