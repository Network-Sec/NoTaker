# NoTaker Backup & Restore Guide

## System Overview
- **Engine:** Standard `sqlite3` (same as main app).
- **Encryption:** Node.js Native `crypto` (AES-256-CBC).
- **Process:** The system creates a temporary snapshot of the database, encrypts it to a `.enc` file, and immediately deletes the temporary snapshot.

## How to Restore

1. **Locate Backup:** Find the file in `server/backups/`.
   Example: `notetaker_backup_2025-12-26....db.enc`

2. **Run Restore Tool:**
   ```bash
   cd server
   node restore_backup.js backups/YOUR_BACKUP_FILE.db.enc
   ```

3. **Replace Database:**
   - Stop the server.
   - Rename `notetaker.db` to `notetaker.old`.
   - Rename the generated `_restored.db` file to `notetaker.db`.
   - Start the server.
