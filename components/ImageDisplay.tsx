'use client';

import { useState, useEffect } from 'react';
import type { ImageData, AIPrediction, BoundingBox } from '@/types';

interface ImageDisplayProps {
  image: ImageData;
  aiPrediction?: AIPrediction;
  showAI: boolean;
  onLoad?: () => void;
}

export default function ImageDisplay({
  image,
  aiPrediction,
  showAI,
  onLoad,
}: ImageDisplayProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Reset loading state when image changes
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

  // Bounding box values are 0–100 percentages of the image dimensions.
  // Using % keeps the overlay aligned with the image under any container size.
  const scaleBoundingBox = (box: BoundingBox): React.CSSProperties => ({
    left: `${box.x}%`,
    top: `${box.y}%`,
    width: `${box.width}%`,
    height: `${box.height}%`,
  });

  return (
    <div className="inspection-image-container">
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="loading-shimmer w-full h-full" />
        </div>
      )}

      {/* Error state */}
      {imageError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-500">
          <svg
            className="w-16 h-16 mb-2"
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
          <span className="text-sm">Image unavailable</span>
          <span className="text-xs mt-1">{image.id}</span>
        </div>
      )}

      {/* Image */}
      {!imageError && (
        <img
          src={`/images/${image.filename}`}
          alt={`Steel surface inspection image ${image.id}`}
          className={`inspection-image transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'
            }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          draggable={false}
        />
      )}

      {/* AI Overlay - only show if AI assistance is enabled */}
      {showAI && aiPrediction && !isLoading && !imageError && (
        <>
          {/* Bounding Box */}
          {aiPrediction.prediction === 'DEFECT' && aiPrediction.boundingBox && (
            <div
              className="ai-bounding-box animate-pulse-slow"
              style={scaleBoundingBox(aiPrediction.boundingBox)}
            />
          )}

          {/* Confidence Badge */}
          <div
            className={`ai-confidence-badge ${aiPrediction.prediction === 'DEFECT'
                ? 'bg-red-600'
                : 'bg-green-600'
              }`}
          >
            <div className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {aiPrediction.prediction === 'DEFECT' ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                )}
              </svg>
              <span>{aiPrediction.confidence}%</span>
            </div>
          </div>

          {/* AI Label */}
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            AI: {aiPrediction.prediction === 'DEFECT' ? 'Defect Detected' : 'No Defect'}
          </div>
        </>
      )}
    </div>
  );
}
