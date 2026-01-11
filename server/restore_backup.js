const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sqlite3 = require('sqlite3');

// Must match backup_service.js
const PASSWORD = 'NoTaker_Backup_Secret_Key_2025'; 
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; 
const SALT = 'NoTaker_Fixed_Salt';

if (process.argv.length < 3) {
    console.log("Usage: node restore_backup.js <path_to_encrypted_file>");
    process.exit(1);
}

const inputPath = process.argv[2];
if (!fs.existsSync(inputPath)) {
    console.error("File not found:", inputPath);
    process.exit(1);
}

const outputPath = inputPath.replace('.enc', '') + '_restored.db';

console.log(`Decrypting: ${inputPath} -> ${outputPath}`);

function decryptFile(inputPath, outputPath, password) {
    return new Promise((resolve, reject) => {
        const key = crypto.scryptSync(password, SALT, 32);

        const input = fs.createReadStream(inputPath);
        
        let iv = null;
        input.once('readable', () => {
            iv = input.read(IV_LENGTH);
            if (!iv) {
                reject(new Error("File too short or empty"));
                return;
            }

            const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
            const output = fs.createWriteStream(outputPath);

            input.pipe(decipher).pipe(output);

            output.on('finish', () => resolve());
            output.on('error', reject);
            decipher.on('error', reject);
        });
        
        input.on('error', reject);
    });
}

decryptFile(inputPath, outputPath, PASSWORD)
    .then(() => {
        console.log("Decryption successful. Verifying database integrity...");
        
        const db = new sqlite3.Database(outputPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                console.error("CRITICAL: Restored file is not a valid SQLite database:", err.message);
                process.exit(1);
            }
        });

        db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
            if (err) {
                console.error("CRITICAL: Could not read tables from restored DB:", err.message);
            } else if (!rows || rows.length === 0) {
                console.error("CRITICAL: Restored database is EMPTY (no tables found). The original backup was likely corrupted.");
            } else {
                console.log(`SUCCESS: Restored database contains ${rows.length} tables.`);
                console.log("Tables found:", rows.map(r => r.name).join(', '));
                console.log("\nTo apply this backup:");
                console.log("1. Stop the server.");
                console.log("2. Rename/Delete 'notetaker.db', 'notetaker.db-wal', and 'notetaker.db-shm'.");
                console.log(`3. Rename '${path.basename(outputPath)}' to 'notetaker.db'.`);
                console.log("4. Restart the server.");
            }
            db.close();
        });
    })
    .catch(err => {
        console.error("Restore failed:", err);
        // Clean up bad file
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    });