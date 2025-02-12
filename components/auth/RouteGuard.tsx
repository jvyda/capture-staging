'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentUser } from 'aws-amplify/auth';
import { Loader2 } from 'lucide-react';
import { LoadingSpinner } from "@/components/layout/LoadingSpinner";

interface RouteGuardProps {
  children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Function to check if the current route is a public route
  const isPublicRoute = (path: string) => {
    // All routes under /auth are public
    return path.startsWith('/auth/');
  };

  useEffect(() => {
    // Check authentication on mount and route changes
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const user = await getCurrentUser();
        setIsAuthenticated(true);

        // If user is authenticated and tries to access auth pages, redirect to dashboard
        if (pathname && isPublicRoute(pathname)) {
          router.push('/');
          return;
        }
      } catch (error) {
        setIsAuthenticated(false);
        
        // If user is not authenticated and tries to access protected routes, redirect to login
        if (pathname && !isPublicRoute(pathname)) {
          // Store the attempted URL to redirect back after login
          sessionStorage.setItem('redirectUrl', pathname);
          router.push('/auth/login');
          return;
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <LoadingSpinner />
    );
  }

  // If it's a public route, render without checking auth
  if (pathname && isPublicRoute(pathname)) {
    return <>{children}</>;
  }

  // For protected routes, only render if authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Render children if all checks pass
  return <>{children}</>;
}
