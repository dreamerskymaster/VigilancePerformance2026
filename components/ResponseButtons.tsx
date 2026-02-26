'use client';

import { useEffect, useCallback } from 'react';

interface ResponseButtonsProps {
  onResponse: (isDefect: boolean) => void;
  disabled?: boolean;
  showKeyboardHints?: boolean;
}

export default function ResponseButtons({
  onResponse,
  disabled = false,
  showKeyboardHints = true,
}: ResponseButtonsProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (disabled) return;

      // D or Left Arrow = Defect
      if (event.key === 'd' || event.key === 'D' || event.key === 'ArrowLeft') {
        event.preventDefault();
        onResponse(true);
      }
      // N or Right Arrow = No Defect
      else if (event.key === 'n' || event.key === 'N' || event.key === 'ArrowRight') {
        event.preventDefault();
        onResponse(false);
      }
    },
    [disabled, onResponse]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-6">
        {/* Defect Button */}
        <button
          onClick={() => onResponse(true)}
          disabled={disabled}
          className={`
            response-btn-defect
            px-8 py-4 rounded-xl text-xl font-bold
            transition-all duration-150
            ${disabled 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
            }
          `}
          aria-label="Mark as defective"
        >
          <span className="flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            DEFECT
          </span>
        </button>

        {/* No Defect Button */}
        <button
          onClick={() => onResponse(false)}
          disabled={disabled}
          className={`
            response-btn-no-defect
            px-8 py-4 rounded-xl text-xl font-bold
            transition-all duration-150
            ${disabled 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
            }
          `}
          aria-label="Mark as no defect"
        >
          <span className="flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            NO DEFECT
          </span>
        </button>
      </div>

      {/* Keyboard shortcuts hint */}
      {showKeyboardHints && (
        <div className="flex gap-8 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300 font-mono text-xs">D</kbd>
            <span>or</span>
            <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300 font-mono text-xs">←</kbd>
            <span>= Defect</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300 font-mono text-xs">N</kbd>
            <span>or</span>
            <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300 font-mono text-xs">→</kbd>
            <span>= No Defect</span>
          </span>
        </div>
      )}
    </div>
  );
}
