import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCurrentUser } from 'aws-amplify/auth/server';
import { runWithAmplifyServerContext } from '@aws-amplify/adapter-nextjs';

// Define auth routes that don't require protection
const authRoutes = ['/auth/login', '/auth/signup'];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  try {
    // Get the current path
    const path = request.nextUrl.pathname;

    // Check if the current path contains parentheses, indicating a protected route
    const isProtectedRoute = /\([^)]+\)/.test(path);

    // Check authentication status using Amplify sandbox environment
    const isAuthenticated = await runWithAmplifyServerContext({
      nextServerContext: { request, response },
      operation: async (contextSpec) => {
        try {
          const user = await getCurrentUser(contextSpec);
          return !!user;
        } catch (error) {
          return false;
        }
      },
    });

    // Redirect to login if trying to access protected route while not authenticated
    if (isProtectedRoute && !isAuthenticated) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Redirect to dashboard if trying to access auth routes while authenticated
    if (authRoutes.some(route => path === route) && isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    // On error, allow the request to proceed but don't authenticate
    return response;
  }
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};