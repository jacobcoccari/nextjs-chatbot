import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
    newUser: '/',
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      // Check which user is logged in.
      const isLoggedIn = !!auth?.user;
      // 2. Checks which page they are trying to use. 
      const isOnChat = nextUrl.pathname.startsWith('/');
      const isOnRegister = nextUrl.pathname.startsWith('/register');
      const isOnLogin = nextUrl.pathname.startsWith('/login');

      // Rule 1: If logged in, don't allow access to login/register pages
      if (isLoggedIn && (isOnLogin || isOnRegister)) {
        return Response.redirect(new URL('/', nextUrl as unknown as URL));
      }

      // Rule 2: Anyone can access login/register pages
      if (isOnRegister || isOnLogin) {
        return true;
      }

      // Rule 3: Chat pages need authentication
      if (isOnChat) {
        if (isLoggedIn) return true;
        return false; // Will redirect to login
      }

      if (isLoggedIn) {
        return Response.redirect(new URL('/', nextUrl as unknown as URL));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
