'use client';

import type { Condition } from '@/types';

interface AIModeIndicatorProps {
    /** Current experimental condition determines which badge is shown. */
    condition: Condition;
    className?: string;
}

/**
 * Displays a pill-shaped badge indicating the current inspection mode.
 *
 * - AI_ASSISTED: purple-to-cyan gradient with animated thinking dots
 * - UNASSISTED: grey gradient with an eye emoji
 */
export default function AIModeIndicator({ condition, className = '' }: AIModeIndicatorProps) {
    const isAI = condition === 'AI_ASSISTED';

    return (
        <div className={`flex flex-col items-center ${className}`}>
            {/* Mode badge */}
            <div
                className={`
          inline-flex items-center gap-3 px-6 py-3 rounded-full shadow-lg
          font-semibold text-lg transition-all duration-300
          ${isAI
                        ? 'bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 text-white'
                        : 'bg-gradient-to-r from-gray-600 to-gray-700 text-white'
                    }
        `}
            >
                {isAI ? (
                    <>
                        <span className="text-2xl animate-pulse">🤖</span>
                        <span>AI-Assisted Mode</span>
                        {/* Animated thinking dots */}
                        <div className="flex gap-1 ml-1">
                            <span className="w-2 h-2 bg-white rounded-full ai-thinking-dot" />
                            <span className="w-2 h-2 bg-white rounded-full ai-thinking-dot" />
                            <span className="w-2 h-2 bg-white rounded-full ai-thinking-dot" />
                        </div>
                    </>
                ) : (
                    <>
                        <span className="text-2xl">👁️</span>
                        <span>Manual Inspection Mode</span>
                    </>
                )}
            </div>

            {/* Subtitle */}
            <p className={`text-center text-sm mt-2 ${isAI ? 'text-purple-600' : 'text-gray-600'}`}>
                {isAI
                    ? 'AI will highlight areas it thinks contain defects'
                    : 'Inspect the image carefully on your own'}
            </p>
        </div>
    );
}
