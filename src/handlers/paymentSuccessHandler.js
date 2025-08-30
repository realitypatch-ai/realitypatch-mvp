// src/handlers/paymentSuccessHandler.js - Handle Stripe payment success redirect
import { generatePaymentSuccessHTML } from '../templates/paymentSuccessTemplate.js';

export const handlePaymentSuccessRequest = async (req, res) => {
  console.log('💳 Payment success page requested');
  
  // In paymentSuccessHandler.js, replace the try block:
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const sessionId = url.searchParams.get('session_id');
    const success = url.searchParams.get('success');
    
    console.log('Payment success params:', { sessionId, success });
    
    // Add this debug line
    console.log('About to generate HTML...');
    
    const html = generatePaymentSuccessHTML(sessionId, success, false);
    
    console.log('HTML generated successfully');
    
    res.writeHead(200, { 
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache'
    });
    res.end(html);
    
  } catch (error) {
    console.error('Payment success handler error:', error);
    console.error('Error stack:', error.stack); // Add this line
    
    // Simple fallback instead of calling broken template
    const fallbackHtml = `
      <html>
        <body>
          <h1>Payment Successful</h1>
          <p>Credits added. <a href="/">Return to RealityPatch</a></p>
        </body>
      </html>
    `;
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(fallbackHtml);
  }
};