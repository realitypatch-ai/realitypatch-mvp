// src/handlers/staticHandler.js - Handle static content (HTML/CSS)
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { __dirname } from '../../server.js';
import { generateHTML } from '../templates/htmlTemplate.js';

export const handleStaticRequest = async (req, res) => {
  // Load CSS content
  let cssContent = '';
  try {
    cssContent = readFileSync(join(__dirname, 'styles.css'), 'utf8');
    console.log('CSS file loaded successfully, length:', cssContent.length);
  } catch (error) {
    console.error('Error loading CSS file:', error.message);
    console.log('Using fallback CSS');
    // Fallback CSS is built into the HTML template
  }

  const html = generateHTML(cssContent);
  
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
};