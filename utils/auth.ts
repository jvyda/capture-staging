import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';

export async function checkAuthStatus() {
  try {
    const user = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    return {
      isAuthenticated: true,
      user: {
        ...attributes,
        username: user.username,
      },
    };
  } catch (error) {
    return {
      isAuthenticated: false,
      user: null,
    };
  }
}

export function getRequiredAuthRoute(path: string, isAuthenticated: boolean) {
  const protectedRoutes = ['/dashboard', '/profile', '/settings'];
  const authRoutes = ['/auth/login', '/auth/signup'];

  // If on a protected route and not authenticated, redirect to login
  if (protectedRoutes.some(route => path.startsWith(route)) && !isAuthenticated) {
    return '/auth/login';
  }

  // If on an auth route and authenticated, redirect to dashboard
  if (authRoutes.some(route => path === route) && isAuthenticated) {
    return '/dashboard';
  }

  return null;
}
