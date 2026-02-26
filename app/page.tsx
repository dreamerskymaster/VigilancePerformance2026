'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = () => {
    setIsLoading(true);
    router.push('/consent');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center">
        {/* Header */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-primary-600 rounded-full flex items-center justify-center">
            <svg 
              className="w-10 h-10 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Visual Inspection Study
          </h1>
          <p className="text-lg text-gray-600">
            IE6500 Human Performance Research
          </p>
        </div>

        {/* Info Card */}
        <div className="card mb-8 text-left">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            About This Study
          </h2>
          <p className="text-gray-600 mb-4">
            Thank you for your interest in participating in this research study 
            conducted at Northeastern University. This study investigates how 
            people perform visual inspection tasks and how AI assistance may 
            affect performance over time.
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-primary-600">~45</div>
              <div className="text-sm text-gray-600">Minutes Duration</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-primary-600">180</div>
              <div className="text-sm text-gray-600">Images to Review</div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Requirements:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Normal or corrected-to-normal vision</li>
              <li>• No color vision deficiency</li>
              <li>• Quiet environment with minimal distractions</li>
              <li>• Desktop or laptop computer (not mobile)</li>
              <li>• Stable internet connection</li>
            </ul>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={isLoading}
          className="btn btn-primary btn-xl w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Loading...
            </span>
          ) : (
            'Begin Study'
          )}
        </button>

        {/* Footer */}
        <p className="mt-8 text-sm text-gray-500">
          Northeastern University • Department of Mechanical and Industrial Engineering
        </p>
      </div>
    </main>
  );
}
