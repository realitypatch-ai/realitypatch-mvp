// server.js - Main entry point
import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { router } from './src/router.js';
import { hostname, port } from './src/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Export __dirname for other modules
export { __dirname };

const server = createServer(router);

// Handler function for Vercel
const handler = (req, res) => {
  return new Promise((resolve) => {
    server.emit('request', req, res);
    res.on('finish', resolve);
  });
};

// For Vercel serverless functions
if (process.env.VERCEL) {
  // Export for Vercel
} else {
  // For local development
  server.listen(port, '127.0.0.1', () => {
    console.log(`🚀 RealityPatch running at:`);
    console.log(`   Local:   http://localhost:${port}/`);
    console.log(`   Network: http://127.0.0.1:${port}/`);
    console.log(`\n💡 Use localhost:${port} or 127.0.0.1:${port} in your browser`);
  });
}

// Export default for Vercel
export default handler;