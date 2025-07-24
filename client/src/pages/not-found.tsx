import React from 'react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20 shadow-2xl">
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-white mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-white/90 mb-4">Page Not Found</h2>
          <p className="text-white/70 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link href="/">
            <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg">
              Go to Dashboard
            </button>
          </Link>
          
          <Link href="/landing">
            <button className="w-full bg-white/10 text-white font-semibold py-3 px-6 rounded-lg hover:bg-white/20 transition-all duration-200 border border-white/20">
              Back to Landing
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
