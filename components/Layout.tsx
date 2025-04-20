import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSleeper } from '../contexts/SleeperContext';
import Login from './Login';
import Spinner from './Spinner';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, isLoading } = useSleeper();
  const router = useRouter();

  // Check if current page requires authentication
  const requiresAuth = !['/'].includes(router.pathname);

  useEffect(() => {
    // Log current path and auth state for debugging
    console.log('Current path:', router.pathname);
    console.log('User authenticated:', !!user);
    console.log('Requires auth:', requiresAuth);

    // Redirect to home if not authenticated and trying to access protected page
    if (requiresAuth && !user && !isLoading) {
      console.log('Redirecting to home page - not authenticated');
      router.push('/');
    }
  }, [router.pathname, user, isLoading, requiresAuth]);

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-800">🏈 Fantasy OS</h1>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex items-center space-x-4">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  {user?.avatar ? (
                    <img
                      className="h-8 w-8 rounded-full"
                      src={user.avatar}
                      alt={user.display_name}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.classList.add('bg-indigo-100');
                          parent.classList.add('text-indigo-600');
                          parent.classList.add('font-semibold');
                          parent.textContent = user.display_name.charAt(0).toUpperCase();
                        }
                      }}
                    />
                  ) : (
                    <span className="text-indigo-600 font-semibold">
                      {user?.display_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="text-gray-700">{user?.display_name}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout; 