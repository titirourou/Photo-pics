'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { UserIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // If user is already logged in, redirect them to their appropriate page
    if (status === 'authenticated') {
      if (session.user?.isAdmin) {
        router.push('/admin');
      } else {
        router.push('/user');
      }
    }
  }, [session, status, router]);

  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
          PHOTO-KEY
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-12">
          Welcome to your photo library management system
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/user"
            className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-200"
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary rounded-full p-3">
              <UserIcon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-4 mb-2">
              User Access
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Browse and search through your photo collection
            </p>
          </Link>

          <Link
            href="/admin"
            className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-200"
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-primary rounded-full p-3">
              <Cog6ToothIcon className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-4 mb-2">
              Admin Access
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Manage collections, keywords, and system settings
            </p>
          </Link>
        </div>

        <div className="mt-12 text-sm text-gray-500 dark:text-gray-400">
          Sign in with your @chalktalksports.com email to continue
        </div>
      </div>
    </div>
  );
} 