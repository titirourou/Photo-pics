'use client';

import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            PHOTO-KEY
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in with your Chalk Talk Sports email
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <button
            onClick={() => signIn('google', { callbackUrl })}
            className="w-full flex items-center justify-center gap-3 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors duration-200"
          >
            <Image
              src="/google.svg"
              alt="Google Logo"
              width={20}
              height={20}
              className="w-5 h-5"
            />
            <span>Sign in with Google</span>
          </button>

          <div className="mt-4 text-sm text-center text-gray-500 dark:text-gray-400">
            Only @chalktalksports.com emails are allowed
          </div>
        </div>
      </div>
    </div>
  );
} 