import React from 'react';
import { Shield, LogIn } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Link } from '@tanstack/react-router';

export function AdminLogin() {
  const { login, loginStatus } = useInternetIdentity();

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Admin login error:', error);
    }
  };

  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-16 w-16 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Access</h1>
            <p className="text-gray-600">
              Sign in with Internet Identity to access the admin dashboard
            </p>
          </div>

          <div className="space-y-6">
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center space-x-3 bg-red-600 text-white py-4 px-6 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-lg"
            >
              <LogIn className="h-5 w-5" />
              <span>{isLoggingIn ? 'Signing in...' : 'Sign in with Internet Identity'}</span>
            </button>

            <div className="text-center">
              <Link
                to="/"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>

          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <div className="text-yellow-600 text-sm">
                <strong>Note:</strong> Only authorized administrators can access this dashboard. 
                The first user to initialize the system becomes the primary admin.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
