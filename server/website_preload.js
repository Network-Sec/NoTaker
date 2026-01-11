const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Dynamic import for node-fetch
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';

// STATICALLY DEFINE UPLOAD DIR HERE
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// Ensure it exists immediately
if (!fs.existsSync(UPLOAD_DIR)) {
    try {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    } catch (e) {
        console.error('[Link Preview] Failed to create upload directory:', e);
    }
}

// Helper: Save remote image to local disk
async function saveRemoteImageLocally(remoteImageUrl, suffix = 'image') {
    if (!remoteImageUrl) return null;

    // Handle protocol-relative URLs
    if (remoteImageUrl.startsWith('//')) {
        remoteImageUrl = 'https:' + remoteImageUrl;
    }

    try {
        const response = await fetch(remoteImageUrl, { 
            method: 'GET',
            headers: { 
                'User-Agent': USER_AGENT,
                'Referer': new URL(remoteImageUrl).origin 
            },
            timeout: 5000 
        });

        if (!response.ok) return null;

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Setup Date-based Folder
        const date = new Date();
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const datePath = path.join(UPLOAD_DIR, `${year}-${month}-${day}`);

        if (!fs.existsSync(datePath)) {
            fs.mkdirSync(datePath, { recursive: true });
        }

        // Construct Filename
        const timestamp = Date.now();
        let newFilename = `${timestamp}_linkpreview_${suffix}`;
        let outputExtension = '.webp'; 
        let processedBuffer;

        try {
            // Try to convert to WebP
            processedBuffer = await sharp(buffer)
                .resize({ width: 800, withoutEnlargement: true })
                .webp({ quality: 75 })
                .toBuffer();
            newFilename += outputExtension;
        } catch (error) {
            // Fallback: Detect extension or default to .png
            const rawExt = path.extname(remoteImageUrl).split('?')[0];
            const safeExt = (rawExt && rawExt.length < 6) ? rawExt : '.png'; 
            newFilename += safeExt;
            processedBuffer = buffer;
        }

        const finalFilePath = path.join(datePath, newFilename);
        await fs.promises.writeFile(finalFilePath, processedBuffer);
        
        // Return the local URL path
        return `/uploads/${path.basename(datePath)}/${newFilename}`;

    } catch (error) {
        console.error(`[Link Preview] Error saving local image: ${error.message}`);
        return null;
    }
}

async function fetchLinkPreview(url) {
    console.log(`[Link Preview] Processing: ${url}`);
    
    let preview = {
        url: url,
        title: '',
        description: '',
        imageUrl: null,
        faviconUrl: null,
        siteName: '',
        mediaType: 'website'
    };

    try {
        const response = await fetch(url, { 
            headers: { 'User-Agent': USER_AGENT },
            timeout: 6000
        });

        const html = await response.ok ? await response.text() : '';
        const $ = cheerio.load(html);
        const urlObj = new URL(url);

        // --- Metadata Extraction ---
        preview.title = $('meta[property="og:title"]').attr('content') || 
                        $('meta[name="twitter:title"]').attr('content') || 
                        $('title').text() || 
                        urlObj.hostname;

        preview.description = $('meta[property="og:description"]').attr('content') || 
                              $('meta[name="twitter:description"]').attr('content') || 
                              $('meta[name="description"]').attr('content') || 
                              '';

        preview.siteName = $('meta[property="og:site_name"]').attr('content') || urlObj.hostname;

        // --- Candidates ---
        const imageCandidates = [
            $('meta[property="og:image"]').attr('content'),
            $('meta[property="og:image:secure_url"]').attr('content'),
            $('meta[name="twitter:image"]').attr('content'),
            $('link[rel="image_src"]').attr('href')
        ].filter(Boolean);

        const faviconCandidates = [
            $('link[rel="apple-touch-icon"]').attr('href'),
            $('link[rel="icon"]').attr('href'),
            $('link[rel="shortcut icon"]').attr('href')
        ].filter(Boolean);

        // --- 1. Main Image ---
        if (imageCandidates.length > 0) {
            try {
                const absoluteImgUrl = new URL(imageCandidates[0], urlObj.origin).toString();
                preview.imageUrl = await saveRemoteImageLocally(absoluteImgUrl, 'main');
            } catch (e) {}
        }

        // --- 2. Favicon ---
        if (faviconCandidates.length > 0) {
            try {
                const absoluteFavUrl = new URL(faviconCandidates[0], urlObj.origin).toString();
                preview.faviconUrl = await saveRemoteImageLocally(absoluteFavUrl, 'favicon');
            } catch (e) {}
        }

        // --- 3. Google Fallback (Crucial for Calendar/Docs) ---
        if (!preview.faviconUrl) {
            console.log(`[Link Preview] Using Google Favicon fallback for ${urlObj.hostname}`);
            const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
            preview.faviconUrl = await saveRemoteImageLocally(googleFaviconUrl, 'favicon_fallback');
        }

        // --- 4. Final Image Assignment ---
        // If no main image, use the favicon we just found
        if (!preview.imageUrl && preview.faviconUrl) {
            preview.imageUrl = preview.faviconUrl;
        }

        return preview;

    } catch (error) {
        console.error(`[Link Preview] Fatal error for ${url}: ${error.message}`);
        
        // Emergency Fallback: Just try to get the icon via Google
        try {
            const urlObj = new URL(url);
            const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
            preview.faviconUrl = await saveRemoteImageLocally(googleFaviconUrl, 'favicon_fallback');
            if(!preview.title) preview.title = urlObj.hostname;
        } catch (e) { /* ignore */ }

        return preview; 
    }
}

module.exports = { fetchLinkPreview };