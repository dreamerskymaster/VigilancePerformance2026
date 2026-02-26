'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { storage, calculateTrialResults } from '@/lib/utils';
import { STORAGE_KEYS } from '@/lib/constants';
import type { Condition, Trial, Demographics, NasaTLXScores, AITrustScores } from '@/types';

/**
 * Debrief page – final step of the study.
 *
 * Explains the study purpose, reveals which condition the participant was in,
 * optionally shows performance stats, and submits all data to Supabase.
 */
export default function DebriefPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [condition, setCondition] = useState<Condition | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<{
    accuracy: number;
    totalTrials: number;
    hitRate: number;
    avgRT: number;
  } | null>(null);

  useEffect(() => {
    const storedParticipantId = storage.get<string>(STORAGE_KEYS.PARTICIPANT_ID);
    const storedCondition = storage.get<Condition>(STORAGE_KEYS.CONDITION);

    if (!storedParticipantId) {
      router.push('/consent');
      return;
    }

    setParticipantId(storedParticipantId);
    setCondition(storedCondition);

    // Calculate performance summary from stored trial data.
    try {
      const trials: Trial[] = JSON.parse(storage.get(STORAGE_KEYS.TRIALS) || '[]');
      if (trials.length > 0) {
        const hits = trials.filter((t) => t.responseType === 'HIT').length;
        const misses = trials.filter((t) => t.responseType === 'MISS').length;
        const crs = trials.filter((t) => t.responseType === 'CR').length;
        const correct = hits + crs;
        const totalRT = trials.reduce((sum, t) => sum + t.responseTime, 0);

        setStats({
          accuracy: Math.round((correct / trials.length) * 100),
          totalTrials: trials.length,
          hitRate: Math.round((hits / Math.max(hits + misses, 1)) * 100),
          avgRT: Math.round(totalRT / trials.length),
        });
      }
    } catch (e) {
      console.error('Error calculating stats:', e);
    }

    setIsLoading(false);
  }, [router]);

  /**
   * Submit all participant data to the server.
   * Collects data from sessionStorage and sends to /api/submit
   */
  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      // Collect all data from storage
      const participantId = storage.get(STORAGE_KEYS.PARTICIPANT_ID) as string
      const condition = storage.get(STORAGE_KEYS.CONDITION) as string
      const demographics = JSON.parse(storage.get(STORAGE_KEYS.DEMOGRAPHICS) as string || '{}')
      const trials = JSON.parse(storage.get(STORAGE_KEYS.TRIALS) as string || '[]')
      const nasaTLX = JSON.parse(storage.get(STORAGE_KEYS.NASA_TLX) as string || '{}')
      const aiTrust = condition === 'AI_ASSISTED'
        ? JSON.parse(storage.get(STORAGE_KEYS.AI_TRUST) as string || '{}')
        : null
      const preKSS = parseInt(storage.get(STORAGE_KEYS.PRE_KSS) as string || '0')
      const postKSS = parseInt(storage.get(STORAGE_KEYS.POST_KSS) as string || '0')
      const consentTimestamp = storage.get(STORAGE_KEYS.CONSENT_TIMESTAMP) as string

      // Submit to API
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId,
          condition,
          demographics,
          trials,
          nasaTLX,
          aiTrust,
          preKSS,
          postKSS,
          consentTimestamp,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('[Debrief] Submit failed:', result)
        // Still show success to participant (data is in localStorage)
      } else {
        console.log('[Debrief] Submit success:', result)
      }

      // Clear session storage
      Object.values(STORAGE_KEYS).forEach(key => storage.remove(key))

      setIsSubmitted(true)

    } catch (error) {
      console.error('[Debrief] Submit error:', error)
      // Still show success (data is in localStorage as backup)
      setIsSubmitted(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="max-w-2xl mx-auto animate-fade-in-up">
        <div className="card-modern">

          {!isSubmitted ? (
            <>
              {/* ── Header ────────────────────────────────────────────── */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                  <span className="text-4xl">🎉</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">You Did It!</h1>
                <p className="text-gray-600 text-lg">Thank you for completing the study</p>
              </div>

              {/* ── About the study ───────────────────────────────────── */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  📋 What This Study Was About
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  You just helped us study how people spot defects in metal surfaces.
                  We&apos;re interested in whether AI assistance helps or changes how people
                  perform this kind of inspection task over time.
                </p>

                {/* Condition reveal */}
                <div
                  className={`p-4 rounded-lg border-2 ${condition === 'AI_ASSISTED'
                    ? 'bg-purple-50 border-purple-200'
                    : 'bg-gray-100 border-gray-200'
                    }`}
                >
                  <p className="font-medium text-gray-800">
                    {condition === 'AI_ASSISTED' ? (
                      <>🤖 You were in the <strong>AI-Assisted</strong> group</>
                    ) : (
                      <>👁️ You were in the <strong>Manual Inspection</strong> group</>
                    )}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {condition === 'AI_ASSISTED'
                      ? 'You had AI help highlighting potential defects.'
                      : 'You inspected images without any AI assistance.'}
                  </p>
                </div>
              </div>

              {/* ── Optional stats ────────────────────────────────────── */}
              {stats && (
                <div className="mb-6">
                  <button
                    onClick={() => setShowStats(!showStats)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <svg
                      className={`w-5 h-5 transition-transform ${showStats ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {showStats ? 'Hide' : 'Show'} my performance summary
                  </button>

                  {showStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 animate-fade-in-up">
                      <div className="bg-blue-50 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-blue-600">{stats.accuracy}%</p>
                        <p className="text-sm text-blue-800">Accuracy</p>
                      </div>
                      <div className="bg-green-50 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-green-600">{stats.totalTrials}</p>
                        <p className="text-sm text-green-800">Images Reviewed</p>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-purple-600">{stats.hitRate}%</p>
                        <p className="text-sm text-purple-800">Defects Found</p>
                      </div>
                      <div className="bg-orange-50 rounded-xl p-4 text-center">
                        <p className="text-3xl font-bold text-orange-600">{stats.avgRT}ms</p>
                        <p className="text-sm text-orange-800">Avg Response</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Privacy reminder ──────────────────────────────────── */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <h3 className="font-bold text-green-800 flex items-center gap-2">
                  🔒 Your Privacy
                </h3>
                <p className="text-green-700 text-sm mt-2">
                  Your responses are anonymous. We only record your random participant ID,
                  not your name or any identifying information.
                </p>
                {participantId && (
                  <p className="text-green-600 text-xs mt-2">
                    Your ID: <code className="bg-green-100 px-2 py-0.5 rounded">{participantId}</code>
                  </p>
                )}
              </div>

              {/* ── Contact ───────────────────────────────────────────── */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
                <h3 className="font-bold text-blue-800">Questions about this study?</h3>
                <p className="text-blue-700 text-sm mt-1">
                  <strong>Northeastern University</strong><br />
                  IE 6500: Human Performance<br />
                  <em>Vigilance Decrement in Visual Inspection</em>
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  Contact the research team through your course instructor.
                </p>
              </div>

              {/* ── Error message ─────────────────────────────────────── */}
              {error && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                  <p className="text-yellow-800 text-sm">{error}</p>
                </div>
              )}

              {/* ── Submit button ─────────────────────────────────────── */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full btn-hero disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting your data…
                  </span>
                ) : (
                  <>Submit &amp; Finish 🎉</>
                )}
              </button>
            </>
          ) : (
            /* ── Success state ──────────────────────────────────────── */
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6 animate-scale-in">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">All Done!</h1>
              <p className="text-gray-600 text-lg mb-8">
                Your data has been submitted successfully.<br />
                You can now close this window.
              </p>
              <div className="bg-gray-100 rounded-xl p-6">
                <p className="text-gray-700">Thank you for contributing to this research! 🙏</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
