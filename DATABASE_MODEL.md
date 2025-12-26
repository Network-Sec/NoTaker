# NoTaker Database Documentation

This document serves as the single source of truth for the NoTaker application's database schema, including internal tables and external browser database integrations.

## 1. Internal Database (`server/notetaker.db`)

**Technology:** SQLite3
**Mode:** WAL (Write-Ahead Logging) enabled.

### 1.1 Core Tables

#### `memos`
Stores user-created memos, notes, and chat entries.
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `INTEGER PRIMARY KEY AUTOINCREMENT` | Unique ID |
| `timestamp` | `TEXT` | ISO 8601 Timestamp of creation |
| `type` | `TEXT` | Type of entry (e.g., 'text', 'code', 'markdown') |
| `content` | `TEXT` | The actual content of the memo |
| `tags` | `TEXT` | JSON stringified array of tags |
| `link_preview` | `TEXT` | JSON stringified link preview data (optional) |

#### `bookmarks`
Stores imported bookmarks from browsers.
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `TEXT PRIMARY KEY` | Unique ID (generated from source + internal ID) |
| `url` | `TEXT` | The URL of the bookmark |
| `title` | `TEXT` | Title of the page |
| `description` | `TEXT` | *Currently unused* |
| `timestamp` | `TEXT` | ISO 8601 Timestamp of creation (`date_added`) |
| `source` | `TEXT` | Origin identifier (e.g., 'Chrome-Default', 'Firefox-Main') |

#### `browser_history`
Stores imported history from browsers.
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `INTEGER PRIMARY KEY AUTOINCREMENT` | **Note:** Currently using auto-increment, but importer generates string IDs. This needs unification. |
| `url` | `TEXT` | Visited URL |
| `title` | `TEXT` | Page Title |
| `visit_time` | `TEXT` | ISO 8601 Timestamp of visit |
| `source` | `TEXT` | Origin identifier (e.g., 'Chrome-Default') |

#### `tasks`
Stores Eisenhower Matrix tasks.
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `TEXT PRIMARY KEY` | UUID or client-generated ID |
| `content` | `TEXT` | Task description |
| `quadrant` | `TEXT` | 'do', 'decide', 'delegate', 'delete' |
| `date` | `TEXT` | YYYY-MM-DD date string |
| `completed` | `INTEGER` | 0 = Pending, 1 = Completed |

#### `events`
Stores calendar events.
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `INTEGER PRIMARY KEY AUTOINCREMENT` | Unique ID |
| `date` | `TEXT` | YYYY-MM-DD |
| `title` | `TEXT` | Event title |
| `description` | `TEXT` | Event description |
| `time` | `TEXT` | HH:MM time string |
| `duration` | `TEXT` | Duration string (e.g., "1h") |
| `link` | `TEXT` | Optional URL |

#### `notebooks`
Stores multi-block notebook pages.
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `INTEGER PRIMARY KEY AUTOINCREMENT` | Unique ID |
| `title` | `TEXT` | Notebook Title |
| `timestamp` | `TEXT` | Creation timestamp |
| `blocks` | `TEXT` | JSON stringified array of block objects |

#### `ai_conversations`
Stores chat logs with local AI.
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `INTEGER PRIMARY KEY AUTOINCREMENT` | Unique ID |
| `timestamp` | `TEXT` | Creation timestamp |
| `type` | `TEXT` | 'user' or 'assistant' |
| `content` | `TEXT` | Message content |
| `model` | `TEXT` | Model name used (e.g., 'llama3') |

### 1.2 Identity & Credentials

#### `identities`
Stores user profiles/personas.
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `TEXT PRIMARY KEY` | Unique ID |
| `firstName` | `TEXT` | |
| `lastName` | `TEXT` | |
| `username` | `TEXT` | |
| `headline` | `TEXT` | Short bio/job title |
| `email` | `TEXT` | |
| `phone` | `TEXT` | |
| `location` | `TEXT` | |
| `about` | `TEXT` | Markdown bio |
| `avatarUrl` | `TEXT` | |
| `bannerUrl` | `TEXT` | |
| `experience` | `TEXT` | JSON Array |
| `education` | `TEXT` | JSON Array |
| `skills` | `TEXT` | JSON Array |
| `personalCredentials` | `TEXT` | JSON Array (Encrypted fields conceptually) |
| `linkedVaultIds` | `TEXT` | JSON Array of linked credential group IDs |
| `connections` | `INTEGER` | Mock 'LinkedIn' style connection count |

#### `credential_groups`
Stores shared vaults of credentials.
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `TEXT PRIMARY KEY` | Unique ID |
| `name` | `TEXT` | Vault Name |
| `description` | `TEXT` | |
| `pairs` | `TEXT` | JSON Array of Key-Value pairs |
| `updatedAt` | `TEXT` | ISO Timestamp |

---

## 2. External Browser Databases

The application reads from these databases **read-only**.

### 2.1 Google Chrome / Chromium / Brave
**Format:** SQLite3 (`History`), JSON (`Bookmarks`)

#### `History` (SQLite)
*   **Path:** `User Data/Default/History`
*   **Tables Used:**
    *   `urls`: `id`, `url`, `title`, `visit_count`
    *   `visits`: `id`, `url` (fk), `visit_time` (Webkit Microseconds), `from_visit`, `transition`
*   **Time Conversion:** `(visit_time / 1000) - 11644473600000` (Webkit Epoch to Unix Epoch)

#### `Bookmarks` (JSON)
*   **Path:** `User Data/Default/Bookmarks`
*   **Structure:** Tree structure.
*   **Fields:** `name` (Title), `url`, `date_added` (Webkit Microseconds), `type` ('url' or 'folder')

### 2.2 Mozilla Firefox (Planned)
**Format:** SQLite3 (`places.sqlite`)

#### `places.sqlite`
*   **Path:** `Profiles/<random>.default-release/places.sqlite`
*   **Tables Used:**
    *   `moz_places`: `id`, `url`, `title`, `rev_host`, `visit_count`, `last_visit_date`
    *   `moz_bookmarks`: `id`, `type`, `fk` (points to moz_places), `parent`, `position`, `title`, `dateAdded`, `lastModified`
    *   `moz_historyvisits`: `id`, `from_visit`, `place_id`, `visit_date`, `visit_type`
*   **Time Conversion:** Firefox uses PRTime (microseconds since 1970-01-01). `visit_date / 1000` = Unix Milliseconds.

---

## 3. Backup System

**Location:** `server/backups/`
**Frequency:** Hourly (Configurable)
**Method:**
1.  **Snapshot:** A consistent SQLite snapshot is created via the Backup API (`vacuum into` equivalent).
2.  **Encryption:** The snapshot is encrypted using AES-256-CBC with a hardcoded application key.
3.  **Cleanup:** The plaintext snapshot is deleted immediately.

**Restore:**
Requires using the `server/restore_backup.js` utility to decrypt the file back into a usable `notetaker.db`.
