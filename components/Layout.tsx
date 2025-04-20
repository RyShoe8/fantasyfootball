import React from 'react';
import { useSleeper } from '../contexts/SleeperContext';
import Login from './Login';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, isLoading } = useSleeper();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

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
                <h1 className="text-xl font-bold text-gray-800">🏈 Fantasy Football Assistant</h1>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex items-center space-x-4">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  {user.avatar ? (
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
                      {user.display_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="text-gray-700">{user.display_name}</span>
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
} 