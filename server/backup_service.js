const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
// We use standard sqlite3 here. This ensures compatibility with the main app.
// The main app logic remains untouched.
const sqlite3 = require('sqlite3');

// --- CONFIGURATION ---
const BACKUP_DIR = path.join(__dirname, 'backups');
const BACKUP_INTERVAL_MS = 60 * 60 * 6000; // 1 hour
const BACKUP_PASSWORD = 'NoTaker_Backup_Secret_Key_2025'; 
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; 

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Encrypts a file using Node.js native crypto module (App-Level Encryption).
 * This removes dependency on system-level OpenSSL libraries or specific SQLCipher builds.
 */
function encryptFile(inputPath, outputPath, password) {
    return new Promise((resolve, reject) => {
        const salt = 'NoTaker_Fixed_Salt'; 
        const key = crypto.scryptSync(password, salt, 32);
        const iv = crypto.randomBytes(IV_LENGTH);

        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        const input = fs.createReadStream(inputPath);
        const output = fs.createWriteStream(outputPath);

        output.write(iv);
        input.pipe(cipher).pipe(output);

        output.on('finish', () => resolve());
        output.on('error', reject);
        input.on('error', reject);
    });
}

/**
 * Performs a backup using standard SQLite backup API, then encrypts the result.
 */
function performBackup(db) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const tempBackupPath = path.join(BACKUP_DIR, `temp_backup_${timestamp}.db`);
    const finalBackupPath = path.join(BACKUP_DIR, `notetaker_backup_${timestamp}.db.enc`);

    console.log(`[Backup] Creating snapshot via VACUUM INTO: ${tempBackupPath}`);

    // VACUUM INTO fails if file exists
    if (fs.existsSync(tempBackupPath)) {
        try { fs.unlinkSync(tempBackupPath); } catch(e) {}
    }

    // Use VACUUM INTO for a safe, atomic snapshot (Requires SQLite 3.27+)
    db.run(`VACUUM INTO ?`, [tempBackupPath], function(err) {
        if (err) {
            console.error('[Backup] Snapshot (VACUUM INTO) failed:', err.message);
            return;
        }

        // VERIFY SNAPSHOT INTEGRITY BEFORE ENCRYPTING
        const checkDb = new sqlite3.Database(tempBackupPath, sqlite3.OPEN_READONLY);
        checkDb.get("SELECT count(*) as count FROM sqlite_master WHERE type='table'", (err, row) => {
            checkDb.close();
            
            if (err || !row || row.count === 0) {
                console.error('[Backup] CRITICAL: Snapshot is empty or invalid. Aborting encryption.');
                // Try to delete the bad file
                if(fs.existsSync(tempBackupPath)) {
                    try { fs.unlinkSync(tempBackupPath); } catch(e) {}
                }
                return;
            }

            console.log(`[Backup] Snapshot verified (${row.count} tables). Encrypting...`);
            
            encryptFile(tempBackupPath, finalBackupPath, BACKUP_PASSWORD)
                .then(() => {
                    console.log(`[Backup] Encrypted to: ${finalBackupPath}`);
                    // Securely delete the temporary plaintext file
                    fs.unlink(tempBackupPath, (err) => {
                        if (err) console.error('[Backup] Warning: Failed to delete temp file:', err);
                    });
                    
                    cleanupOldBackups();
                })
                .catch(err => {
                    console.error('[Backup] Encryption failed:', err);
                    // Cleanup temp file on error
                    if(fs.existsSync(tempBackupPath)) fs.unlinkSync(tempBackupPath);
                });
        });
    });
}

function cleanupOldBackups() {
    fs.readdir(BACKUP_DIR, (err, files) => {
        if (err) {
            console.error('[Backup] cleanup failed to read dir:', err);
            return;
        }

        const backups = files
            .filter(f => f.startsWith('notetaker_backup_') && f.endsWith('.enc'))
            .map(f => {
                try {
                    return {
                        name: f,
                        path: path.join(BACKUP_DIR, f),
                        time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime()
                    };
                } catch(e) { return null; }
            })
            .filter(Boolean)
            .sort((a, b) => b.time - a.time); // Newest first

        const KEEP_COUNT = 24;
        if (backups.length > KEEP_COUNT) {
            const toDelete = backups.slice(KEEP_COUNT);
            toDelete.forEach(backup => {
                fs.unlink(backup.path, (err) => {
                    if (err) console.error(`[Backup] Failed to delete old backup ${backup.name}:`, err);
                    else console.log(`[Backup] Deleted old backup: ${backup.name}`);
                });
            });
        }
    });
}

function startBackupService(db) {
    console.log('[Backup] Service initialized (Node.js Native Crypto).');
    
    // Initial backup after startup
    setTimeout(() => performBackup(db), 10000); 

    setInterval(() => {
        performBackup(db);
    }, BACKUP_INTERVAL_MS);
}

module.exports = { startBackupService };
