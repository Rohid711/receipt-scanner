import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../utils/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check if we're on client-side
    if (typeof window !== 'undefined') {
      // If not loading and no user, redirect to sign in
      if (!loading && !user) {
        router.push('/signin');
      }
    }
  }, [user, loading, router]);

  // Show loading or nothing while checking authentication
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If we have a user, render the children
  return <>{children}</>;
} 