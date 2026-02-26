'use client';

import { useState, useEffect } from 'react';
import type { ImageData, AIPrediction } from '@/types';
import AIOverlay from './AIOverlay';

interface ImageDisplayProps {
  image: ImageData;
  aiPrediction?: AIPrediction;
  showAI: boolean;
  onLoad?: () => void;
}

/**
 * Renders the inspection image inside the styled wrapper.
 *
 * - Shows a loading spinner while the image fetches.
 * - Shows an error placeholder if the image fails to load.
 * - Mounts the AIOverlay component when `showAI` is true and a prediction exists.
 */
export default function ImageDisplay({
  image,
  aiPrediction,
  showAI,
  onLoad,
}: ImageDisplayProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Reset loading state when the displayed image changes.
  useEffect(() => {
    setIsLoading(true);
    setImageError(false);
  }, [image.id]);

  const handleImageLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  return (
    <div className="relative">
      {/* Main image container */}
      <div className="inspection-image-wrapper relative">

        {/* Loading skeleton */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-2xl">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-gray-500 font-medium text-sm">Loading image…</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {imageError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-500 rounded-2xl">
            <svg
              className="w-16 h-16 mb-2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm font-medium">Image unavailable</span>
            <span className="text-xs mt-1 text-gray-400">{image.id}</span>
          </div>
        )}

        {/* Actual image */}
        {!imageError && (
          <img
            src={`/images/${image.filename}`}
            alt="Steel surface inspection image"
            className={`w-full h-full object-cover rounded-2xl transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'
              }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            draggable={false}
          />
        )}

        {/* AI overlay – mounted after image loads successfully */}
        {showAI && aiPrediction && !isLoading && !imageError && (
          <AIOverlay
            prediction={aiPrediction}
            imageSize={400}
            originalSize={200}
          />
        )}
      </div>
    </div>
  );
}
