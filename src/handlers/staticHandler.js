// src/handlers/staticHandler.js - Handle static content (HTML/CSS/Assets)
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { generateHTML } from '../templates/htmlTemplate.js';

// MIME types for static files
const MIME_TYPES = {
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json'
};

export const handleStaticRequest = async (req, res) => {
  const url = req.url || '/';
  console.log('Static request for:', url); // Debug log
  
  // List of static file patterns to serve from public folder
  const staticFilePatterns = [
    '/favicon.ico',
    '/favicon-16x16.png', 
    '/favicon-32x32.png',
    '/apple-touch-icon.png',
    '/android-chrome-192x192.png',
    '/android-chrome-512x512.png',
    '/site.webmanifest'
  ];
  
  // Check if this is a request for a static file
  const isStaticFile = staticFilePatterns.some(pattern => url === pattern) || 
                       url.startsWith('/favicon') || 
                       url.startsWith('/apple-touch-icon') || 
                       url.startsWith('/android-chrome');
  
  if (isStaticFile) {
    // Use process.cwd() for Vercel production compatibility
    const filePath = join(process.cwd(), 'public', url);
    console.log('Looking for static file at:', filePath); // Debug log
    
    try {
      if (existsSync(filePath)) {
        const fileContent = readFileSync(filePath);
        const ext = extname(url).toLowerCase();
        const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
        
        console.log('Serving static file:', url, 'as', mimeType); // Debug log
        
        res.writeHead(200, { 
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=31536000'
        });
        res.end(fileContent);
        return;
      } else {
        console.log('Static file not found:', filePath); // Debug log
      }
    } catch (error) {
      console.error(`Error serving static file ${url}:`, error);
    }
    
    // File not found
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('File not found');
    return;
  }
  
  // Handle main HTML page for all other requests
  console.log('Serving HTML page for:', url); // Debug log
  
  let cssContent = '';
  try {
    // Also use process.cwd() for CSS file
    cssContent = readFileSync(join(process.cwd(), 'styles.css'), 'utf8');
    console.log('CSS file loaded successfully, length:', cssContent.length);
  } catch (error) {
    console.error('Error loading CSS file:', error.message);
    console.log('Using fallback CSS');
  }

  const html = generateHTML(cssContent);
  
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
};