// Import NextAuth for authentication functionality
import NextAuth from 'next-auth';

// Import our auth configuration (contains settings for pages, callbacks, etc.)
import { authConfig } from '@/app/(auth)/auth.config';

// Create and export the middleware function that will run on matched routes
// NextAuth(authConfig).auth creates a middleware function that checks authentication
export default NextAuth(authConfig).auth;

// Next.js-specific configuration for middleware
export const config = {
  // matcher defines which routes this middleware will run on:
  matcher: [
    '/',           // Home page
    '/:id',        // Dynamic routes (like individual chat pages)
    '/api/:path*', // All API routes
    '/login',      // Login page
    '/register',   // Register page
  ],
};
