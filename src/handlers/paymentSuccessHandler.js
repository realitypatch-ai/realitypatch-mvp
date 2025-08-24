// src/handlers/paymentSuccessHandler.js - Handle Stripe payment success redirect
import { generatePaymentSuccessHTML } from '../templates/paymentSuccessTemplate.js';

export const handlePaymentSuccessRequest = async (req, res) => {
  console.log('💳 Payment success page requested');
  
  try {
    // Parse URL to get query parameters
    const url = new URL(req.url, `http://${req.headers.host}`);
    const sessionId = url.searchParams.get('session_id');
    const success = url.searchParams.get('success');
    
    console.log('Payment success params:', { sessionId, success });
    
    // Generate success page HTML
    const html = generatePaymentSuccessHTML(sessionId, success);
    
    res.writeHead(200, { 
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache'
    });
    res.end(html);
    
  } catch (error) {
    console.error('❌ Payment success handler error:', error);
    
    // Fallback error page
    const errorHtml = generatePaymentSuccessHTML(null, null, true);
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end(errorHtml);
  }
};