'use client';

import { useState, useEffect } from 'react';
import type { AIPrediction } from '@/types';

interface AIOverlayProps {
    /** The AI prediction result to visualise. */
    prediction: AIPrediction;
    /** Display size of the image container in px (default 400). */
    imageSize?: number;
    /** Original image size in px used to compute bounding-box scale (default 200). */
    originalSize?: number;
}

/**
 * Renders an animated AI analysis overlay on top of an inspection image.
 *
 * Shows:
 *  - A scan-line animation while "analysing"
 *  - A top panel with the AI verdict and confidence percentage
 *  - A glowing bounding box with corner markers and a "Look here" badge (defects only)
 *  - A bottom bar showing confidence level (High / Medium / Low)
 *  - A reminder that AI can be wrong
 */
export default function AIOverlay({
    prediction,
    imageSize = 400,
    originalSize = 200,
}: AIOverlayProps) {
    const [isAnimating, setIsAnimating] = useState(true);
    const [showDetails, setShowDetails] = useState(false);

    const scale = imageSize / originalSize;

    // Trigger scan animation + stagger details reveal on each new image.
    useEffect(() => {
        setIsAnimating(true);
        setShowDetails(false);
        const t1 = setTimeout(() => setIsAnimating(false), 800);
        const t2 = setTimeout(() => setShowDetails(true), 1000);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [prediction.imageId]);

    const isDefect = prediction.prediction === 'DEFECT';
    const confidence = prediction.confidence;

    /** Returns tailwind colour classes based on confidence level. */
    const getConfidenceStyle = () => {
        if (confidence >= 85)
            return { color: 'text-green-700', bg: 'bg-green-100', label: 'High Confidence' };
        if (confidence >= 70)
            return { color: 'text-yellow-700', bg: 'bg-yellow-100', label: 'Medium Confidence' };
        return { color: 'text-orange-700', bg: 'bg-orange-100', label: 'Low Confidence' };
    };

    const confStyle = getConfidenceStyle();

    return (
        <>
            {/* ── Scanning animation overlay ───────────────────────────────────── */}
            {isAnimating && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                    <div className="ai-scan-line" />
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent" />
                </div>
            )}

            {/* ── Top panel: verdict card ──────────────────────────────────────── */}
            <div
                className={`absolute top-0 left-0 right-0 transition-all duration-500 ${showDetails ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
                    }`}
            >
                <div
                    className={`m-3 p-3 rounded-xl backdrop-blur-md shadow-lg border ${isDefect
                            ? 'bg-red-500/90 border-red-400 text-white'
                            : 'bg-green-500/90 border-green-400 text-white'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        {/* Icon + label */}
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                                {isDefect ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                        />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <p className="font-bold text-sm">
                                    {isDefect ? '⚠️ Possible Defect Found' : '✓ Surface Looks Clean'}
                                </p>
                                <p className="text-xs opacity-90">AI suggests: {isDefect ? 'DEFECT' : 'NO DEFECT'}</p>
                            </div>
                        </div>

                        {/* Confidence meter */}
                        <div className="text-right flex-shrink-0">
                            <p className="text-2xl font-bold">{confidence}%</p>
                            <p className="text-xs opacity-90">confidence</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Enhanced bounding box (defects only) ────────────────────────── */}
            {isDefect && prediction.boundingBox && showDetails && (
                <>
                    {/* Pulsing main box */}
                    <div
                        className="absolute border-4 border-red-500 rounded-lg ai-bbox-glow pointer-events-none"
                        style={{
                            left: `${prediction.boundingBox.x * scale}px`,
                            top: `${prediction.boundingBox.y * scale}px`,
                            width: `${prediction.boundingBox.width * scale}px`,
                            height: `${prediction.boundingBox.height * scale}px`,
                        }}
                    />

                    {/* Corner markers */}
                    {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((corner) => (
                        <div
                            key={corner}
                            className={`absolute w-4 h-4 border-red-400 pointer-events-none ${corner.includes('top') ? 'border-t-4' : 'border-b-4'
                                } ${corner.includes('left') ? 'border-l-4' : 'border-r-4'}`}
                            style={{
                                left: corner.includes('left')
                                    ? `${prediction.boundingBox!.x * scale - 2}px`
                                    : `${(prediction.boundingBox!.x + prediction.boundingBox!.width) * scale - 14}px`,
                                top: corner.includes('top')
                                    ? `${prediction.boundingBox!.y * scale - 2}px`
                                    : `${(prediction.boundingBox!.y + prediction.boundingBox!.height) * scale - 14}px`,
                            }}
                        />
                    ))}

                    {/* "Look here" bouncing badge above the box */}
                    <div
                        className="absolute flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-bounce pointer-events-none"
                        style={{
                            left: `${(prediction.boundingBox.x + prediction.boundingBox.width / 2) * scale - 40}px`,
                            top: `${prediction.boundingBox.y * scale - 32}px`,
                        }}
                    >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                clipRule="evenodd"
                            />
                        </svg>
                        Look here
                    </div>
                </>
            )}

            {/* ── Bottom info bar ──────────────────────────────────────────────── */}
            <div
                className={`absolute bottom-0 left-0 right-0 transition-all duration-500 ${showDetails ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}
            >
                <div className="m-3 p-2 rounded-lg bg-black/70 backdrop-blur-sm text-white text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="animate-pulse">🤖</span>
                        <span>AI Assistant</span>
                    </div>
                    <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${confStyle.bg} ${confStyle.color}`}>
                        {confStyle.label}
                    </div>
                </div>
            </div>

            {/* ── Reminder text below the image wrapper ───────────────────────── */}
            {showDetails && (
                <div className="absolute -bottom-10 left-0 right-0 text-center pointer-events-none">
                    <p className="text-xs text-gray-500 italic">
                        💡 Remember: AI can make mistakes. Trust your own judgment!
                    </p>
                </div>
            )}
        </>
    );
}
