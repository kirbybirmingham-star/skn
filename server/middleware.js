import { NextResponse } from 'next/server';
import { SERVER_CONFIG } from './config.js';

export async function middleware(request) {
  // Apply CORS headers for PayPal integration
  const response = NextResponse.next();

  // Use centralized configuration for allowed origins
  const origin = request.headers.get('origin');
  if (origin && SERVER_CONFIG.frontend.urls.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');

  // Add security headers
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Cache the PayPal SDK for better performance
  if (request.url.includes('/sdk/js')) {
    response.headers.set('Cache-Control', 'public, max-age=3600');
  }

  return response;
}