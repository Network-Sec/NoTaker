# CLAUDE.md

This file provides guidance to Claude Code (`claude.ai/code`) when working with code in this repository.

## Project Overview

**NoTaker (Memoria Stream)** is a local‑first Personal Knowledge Management (PKM) tool featuring a WhatsApp‑style chronological stream where users paste content (text, markdown, code, images, links) with automatic timestamping.  
Current version: **0.5.0.alpha**, targeting **1.0** release.

### Core Architecture

- **Frontend**: React 19 + TypeScript with Vite dev server (port 3000)  
- **Backend**: Express.js server on port 3001 with SQLite database  
- **Storage**: SQLite (`server/notetaker.db`) with WAL mode for concurrent access  
- **Images**: Stored as WebP files in `server/uploads/YYYY-MM-DD/` folders with timestamp‑based filenames  
- **Data Flow**: Frontend → REST API → SQLite; localStorage fallback for offline scenarios  

### Key Design Patterns

#### 3‑Column Layout
- **Left**: Icon sidebar (navigation) + secondary sidebar (calendar, tags, Eisenhower matrix, monthly calendar widget)  
- **Center**: Main content area (dashboard stream, notebooks, galleries, etc.)  
- **Right**: Browser history/bookmarks timeline with timestamp markers  

#### Type System (`types.ts`)
- `Memo`: Core content type (text/image/link) with tags and optional link previews  
- `StreamItem`: Union type for memos, bookmarks, and browser history  
- `Block`: Notebook content blocks with types (`h1`–`h3`, paragraph, code, checklist, `ul`, `ol`, blockquote)  
- `Event`: Calendar events with date, time, duration, link  
- `Task`: Eisenhower matrix quadrant‑based task management  

#### Database Abstraction (`services/db.ts`)
- All data operations go through this service layer  
- API‑first with localStorage fallback for offline resilience  
- Supports migration to SQLite for desktop Electron version  
- Link preview data cached in `memos.link_preview` column  

## Common Development Commands

### Development
```bash
# Install dependencies
npm install

# Start frontend dev server (port 3000)
npm run dev

# Start backend server (from server/ directory)
cd server && node index.js

# Build for production
npm run build

# Preview production build
npm run preview
```

### Server Management
The backend must be running for full functionality. Start it separately:
```bash
cd server
node index.js
# Server runs on port 3001
```

### Database
- **Location**: `server/notetaker.db` (SQLite with WAL mode)  
- **Schema**: Auto‑created on first run with migrations  
- **Tables**: `memos`, `bookmarks`, `browser_history`, `tasks`, `notebooks`, `events`  
- **Migrations**: Handled automatically in `server/index.js` on startup  

## Architecture Details

### Component Structure

#### Main Entry (`index.tsx`)
- Single `App` component manages all global state  
- View routing via `mainView` and `sidebarView` state  
- All data loaded on mount from `services/db.ts`  

#### Key Components
- `DashboardStream`: Main timeline view displaying filtered memos  
- `MemoInput`: Rich text input with Milkdown editor, timestamp control, link preview generation  
- `IconSidebar`: Left navigation between main views  
- `Calendar`: Day‑based navigation with memo count indicators  
- `EisenhowerMatrix`: Task management with 4 quadrants  
- `MonthlyCalendar`: Event calendar with modal‑based event creation  
- `BlockEditor`: Structured notebook editor with multiple block types  
- `UnifiedStreamItem`: Renders different memo types (text/image/link) with consistent styling  

### Data Flow Patterns

#### Memo Creation
1. User inputs content in `MemoInput`  
2. `addMemo()` creates optimistic UI update with temp ID  
3. `db.createMemo()` saves to backend API  
4. Backend returns real ID; frontend updates state  
5. For links: parallel `fetchLinkPreview()` call enriches memo with preview data  
6. Auto‑scroll to newly created memo using `data-memo-id` attribute  

#### Time‑Based Entry Insertion
- Time input field in memo editor (defaults to `now()`)  
- Clicking bookmark/history timestamps updates input time  
- “Continue using this time” checkbox maintains timestamp for subsequent entries  
- Stream auto‑scrolls to time‑positioned entries  

#### Image Handling
- Upload via `POST /api/upload/image` with FormData  
- Backend converts to WebP (quality 80) using Sharp  
- Stored as `server/uploads/YYYY-MM-DD/HHMMSSmmss_filename.webp`  
- Frontend receives public URL path: `/uploads/YYYY-MM-DD/filename.webp`  
- Image cropping creates new files with original timestamp prefix  

#### Task Persistence (Date‑Based)
- Tasks loaded per‑day via `getTasks(date)`  
- If no tasks for selected day, backend copies from most recent day with data  
- Changes saved only to current day (no global task list)  
- Primary key: `(id, date)` for daily task isolation  

### Backend API Endpoints

#### Memos
- `GET /api/memos` – Fetch all memos (includes parsed tags and link previews)  
- `POST /api/memos` – Create memo (`{timestamp, type, content, tags, linkPreview?}`)  
- `PUT /api/memos/:id` – Update memo content and tags  
- `PUT /api/memos/:id/link-preview` – Update link preview data  
- `DELETE /api/memos/:id` – Delete memo  

#### Images
- `POST /api/upload/image` – Upload image file (multipart/form‑data), returns `{url: "/uploads/..."}`  
- Images auto‑converted to WebP, organized by date  

#### Tasks
- `GET /api/tasks?date=YYYY-MM-DD` – Get tasks for date (falls back to most recent day)  
- `POST /api/tasks` – Save all tasks for date (`{date, tasks[]}`)  

#### Events
- `GET /api/events` – Fetch all events  
- `POST /api/events` – Create event (`{date, title, description, time, duration?, link?}`)  

#### Link Previews
- `GET /api/link-preview?url=...` – Fetch Open Graph/meta tags for URL  
- Uses `server/website_preload.js` with Cheerio for scraping  

#### Browser Import
- `GET /api/bookmarks` – Imported bookmarks from browsers  
- `GET /api/history` – Recent browser history (limit 2000)  
- Import runs via `server/browser_importer.js` on startup and scheduled intervals  

### State Management
No Redux/Context – props drilling from the main `App` component:
- **Global state**: `memos`, `notebooks`, `bookmarks`, `history`, `tasks`, `events`  
- **View state**: `mainView`, `sidebarView`, `selectedDate`, `activeTag`  
- Handlers (`addMemo`, `updateMemo`, `deleteMemo`, etc.) passed down as props  

### Optimistic Updates
- UI updates immediately with temp IDs  
- Background API calls sync to backend  
- Errors logged to console (no user‑facing error UI yet)  

### Styling

#### CSS Architecture
- Global styles: `style.css`, `styles/global.css`  
- Modular styles in `styles/` directory (named by feature)  
- No CSS‑in‑JS, no preprocessors  
- Uses CSS Grid and Flexbox extensively  
- Color scheme: Dark mode with `#1a1a1a` background, `#2a2a2a` cards  

#### Key Style Files
- `styles/dashboard_stream.css` – Main timeline styling  
- `styles/unified_stream.css` – Stream item components  
- `styles/eisenhower_matrix.css` – Task board  
- `styles/sidebar.css` – Left/right sidebar layouts  
- `styles/monthly_calendar.css` – Event calendar  

### Browser Integration

#### Import System (`server/browser_importer.js`)
- Reads Chrome History/Bookmarks SQLite databases  
- Scheduled import every 30 minutes (configurable)  
- Stores in `browser_history` table with source attribution  
- Requires user browser data paths (Chrome default paths used)  

## Important Conventions

### Component Organization
- One component per file in `components/` directory  
- Export named components (not default exports)  
- TypeScript strict mode enabled  
- Props interfaces defined inline or in `types.ts`  

### Database Migrations
- Handled in `server/index.js` on startup  
- Use `"ALTER TABLE IF NOT EXISTS"` pattern for additive changes  
- Complex migrations (PK changes) use backup‑drop‑recreate pattern  
- Never break existing data  

### Error Handling
- **Frontend**: `try/catch` with `console.error`, continue execution  
- **Backend**: Return HTTP error status with JSON `{error: "message"}`  
- No global error boundaries yet  

### Environment Variables
- `GEMINI_API_KEY` in `.env` (for AI features)  
- Vite injects via `vite.config.ts` as `process.env.GEMINI_API_KEY`  
- Server port defaults: 3001 (backend), 3000 (frontend dev)  

### Testing
- **No test suite currently implemented**  
- Manual testing required (Postman/curl for backend, browser dev tools for frontend)  

## Migration Roadmap (Per README.md)

### Planned Electron Desktop App
1. **Setup**: Install Electron, create `main.js` with `BrowserWindow`  
2. **SQLite**: Already implemented, ready for desktop use  
3. **File Storage**: Images already stored as files (not base64)  
4. **IPC**: Future work to migrate `services/db.ts` to use IPC for Electron context  

### Future Features (per GEMINI.md)
- Edit‑after‑the‑fact for all stream entries  
- Hamburger menu on each entry (edit, move, change time)  
- Global undo/redo system  
- D3.js knowledge graph visualization  
- AI tagging and keyword extraction  
- Local Ollama integration for RAG  
- Minimap for stream navigation (VSCode‑style)  

## Known Issues & Limitations
Refer to `GEMINI.md` for a detailed TODO list. Key items:
- Eisenhower matrix doesn’t persist daily state correctly (should copy from previous day)  
- No proper undo system  
- Stream entry editing is inline, not modal  
- No global search functionality yet  
- AI features are placeholder/low priority  
- Link previews work but could be more robust  

## Dependencies

### Frontend
- React 19.2.3 + React DOM  
- `@milkdown/*` – WYSIWYG markdown editor  
- `react-calendar` – Calendar widgets  
- `react-markdown` – Markdown rendering  
- `highlight.js` – Code syntax highlighting  
- `axios` – HTTP client  
- `moment` – Date manipulation  

### Backend
- `express` – Web server  
- `sqlite3` – Database  
- `multer` – File upload handling  
- `sharp` – Image processing (WebP conversion)  
- `cheerio` – HTML scraping for link previews  
- `cors` – Cross‑origin support  

## Path Aliases
Vite configured with `@` alias resolving to project root:
```ts
import { Something } from '@/types';
import { db } from '@/services/db';
```

## Git Workflow
- **Main branch**: `master` (no other branches visible)  
- Recent commits show incremental progress (“F”, “a”, “First”)  
- No CI/CD setup, no pre‑commit hooks  
