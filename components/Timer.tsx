'use client';

import { useState, useEffect, useRef } from 'react';

interface TimerProps {
  startTime: number | null;
  isRunning?: boolean;
  className?: string;
}

/**
 * Displays elapsed time (MM:SS) since startTime (epoch milliseconds).
 * Resets when startTime changes; pauses when isRunning is false.
 */
export default function Timer({
  startTime,
  isRunning = true,
  className = '',
}: TimerProps) {
  const [displayTime, setDisplayTime] = useState('00:00');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!startTime || !isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const updateTimer = () => {
      const elapsed = Date.now() - startTime;
      const totalSeconds = Math.floor(elapsed / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      setDisplayTime(
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateTimer();
    intervalRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startTime, isRunning]);

  return (
    <div
      className={`flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm ${className}`}
    >
      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="font-mono text-xl font-semibold text-gray-700">{displayTime}</span>
    </div>
  );
}

// ------------------------------------
// Block progress indicator
// ------------------------------------

interface BlockTimerProps {
  currentBlock: 1 | 2 | 3;
  blockStartTime?: number | null;
  className?: string;
}

/**
 * Displays which of the three trial blocks the participant is currently in,
 * with a filled checkmark for completed blocks.
 */
export function BlockTimer({ currentBlock, className = '' }: BlockTimerProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="text-sm font-medium text-gray-600">Block:</span>
      <div className="flex gap-1.5">
        {[1, 2, 3].map((block) => (
          <div
            key={block}
            className={`
              w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm
              transition-all duration-300 transform
              ${block === currentBlock
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white scale-110 shadow-lg'
                : block < currentBlock
                  ? 'bg-green-100 text-green-700 border-2 border-green-300'
                  : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
              }
            `}
          >
            {block < currentBlock ? '✓' : block}
          </div>
        ))}
      </div>
    </div>
  );
}
