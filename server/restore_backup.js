const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Must match backup_service.js
const PASSWORD = 'NoTaker_Backup_Secret_Key_2025'; 
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; 

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
        const salt = 'NoTaker_Fixed_Salt'; 
        const key = crypto.scryptSync(password, salt, 32);

        const input = fs.createReadStream(inputPath);
        
        // Read IV from beginning of file
        let iv = null;
        input.once('readable', () => {
            iv = input.read(IV_LENGTH);
            if (!iv) {
                reject(new Error("File too short"));
                return;
            }

            const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
            const output = fs.createWriteStream(outputPath);

            input.pipe(decipher).pipe(output);

            output.on('finish', () => resolve());
            output.on('error', reject);
            decipher.on('error', reject);
        });
    });
}

decryptFile(inputPath, outputPath, PASSWORD)
    .then(() => console.log("Restore complete. You can now replace notetaker.db with the restored file."))
    .catch(err => console.error("Restore failed:", err));
