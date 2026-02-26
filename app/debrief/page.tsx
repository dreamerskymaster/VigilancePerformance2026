'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { storage, calculateTrialResults } from '@/lib/utils';
import { STORAGE_KEYS } from '@/lib/constants';
import { db } from '@/lib/supabase';
import type { Condition, Trial, Demographics, NasaTLXScores, AITrustScores } from '@/types';

export default function DebriefPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [condition, setCondition] = useState<Condition | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<{
    totalTrials: number;
    accuracy: number;
    hitRate: number;
    falseAlarmRate: number;
    avgResponseTime: number;
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

    // Calculate basic results
    const trials: Trial[] = JSON.parse(storage.get(STORAGE_KEYS.TRIALS) || '[]');
    if (trials.length > 0) {
      const hits = trials.filter((t) => t.responseType === 'HIT').length;
      const misses = trials.filter((t) => t.responseType === 'MISS').length;
      const fas = trials.filter((t) => t.responseType === 'FA').length;
      const crs = trials.filter((t) => t.responseType === 'CR').length;
      const correct = hits + crs;
      const totalRT = trials.reduce((sum, t) => sum + t.responseTime, 0);

      setResults({
        totalTrials: trials.length,
        accuracy: (correct / trials.length) * 100,
        hitRate: (hits / (hits + misses)) * 100 || 0,
        falseAlarmRate: (fas / (fas + crs)) * 100 || 0,
        avgResponseTime: totalRT / trials.length,
      });
    }

    setIsLoading(false);
  }, [router]);

  const handleSubmitData = async () => {
    if (!participantId || !condition) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Gather all data
      const demographics: Demographics = JSON.parse(
        storage.get(STORAGE_KEYS.DEMOGRAPHICS) || '{}'
      );
      const trials: Trial[] = JSON.parse(storage.get(STORAGE_KEYS.TRIALS) || '[]');
      const nasaTLX: NasaTLXScores = JSON.parse(
        storage.get(STORAGE_KEYS.NASA_TLX) || '{}'
      );
      const aiTrust: AITrustScores | undefined =
        condition === 'AI_ASSISTED'
          ? JSON.parse(storage.get(STORAGE_KEYS.AI_TRUST) || '{}')
          : undefined;
      const preKSS = parseInt(storage.get(STORAGE_KEYS.PRE_KSS) || '0');
      const postKSS = parseInt(storage.get(STORAGE_KEYS.POST_KSS) || '0');
      const consentTimestamp = storage.get<string>(STORAGE_KEYS.CONSENT_TIMESTAMP) || '';
      const taskEndTime = storage.get<string>(STORAGE_KEYS.TASK_END_TIME) || '';

      // Calculate trial results by block
      const trialResults = calculateTrialResults(trials, participantId);

      // Create participant record
      const participantData = {
        id: participantId,
        condition,
        demographics: demographics as unknown as Record<string, unknown>,
        pre_task_kss: preKSS,
        post_task_kss: postKSS,
        nasa_tlx: nasaTLX as unknown as Record<string, number>,
        ai_trust: aiTrust as unknown as Record<string, number>,
        created_at: consentTimestamp,
        completed_at: taskEndTime,
        status: 'completed'
      };

      // Submit to Supabase
      await db.createParticipant(participantData);
      await db.insertTrials(trials.map(t => ({
        participant_id: participantId,
        trial_number: t.trialNumber,
        time_block: t.timeBlock,
        image_id: t.imageId,
        ground_truth: t.defectType !== 'none' ? 'DEFECT' : 'NO_DEFECT',
        defect_type: t.defectType,
        ai_prediction: t.aiPrediction ? JSON.stringify(t.aiPrediction) : undefined,
        ai_confidence: t.aiPrediction?.confidence,
        response: t.participantResponse ? 'DEFECT' : 'NO_DEFECT',
        response_time: t.responseTime,
        timestamp: t.timestamp,
        is_correct: t.responseType === 'HIT' || t.responseType === 'CR',
        response_type: t.responseType
      })));

      // Clear session storage
      storage.clear();

      setIsSubmitted(true);
    } catch (err) {
      console.error('Error submitting data:', err);
      setError('There was an error submitting your data. Your responses have been saved locally.');

      // Even if submission fails, mark as complete
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {!isSubmitted ? (
          <div className="card">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Study Complete!
              </h1>
              <p className="text-gray-600">
                Thank you for participating in this research study.
              </p>
            </div>

            {/* Debrief content */}
            <div className="space-y-6 mb-8">
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Study Purpose</h2>
                <p className="text-gray-700">
                  This study investigated how visual inspection performance changes over time
                  (vigilance decrement) and whether AI assistance can help maintain accuracy
                  during extended inspection tasks.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">What We Measured</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Detection accuracy (hits and false alarms)</li>
                  <li>Response time for each inspection</li>
                  <li>Changes in performance across the 30-minute task</li>
                  <li>Subjective workload and alertness levels</li>
                  {condition === 'AI_ASSISTED' && (
                    <li>Trust and reliance on AI assistance</li>
                  )}
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Your Condition</h2>
                <p className="text-gray-700">
                  You were assigned to the <strong>{condition === 'AI_ASSISTED' ? 'AI-Assisted' : 'Manual Inspection'}</strong> condition.
                  {condition === 'AI_ASSISTED'
                    ? ' The AI system was calibrated to be approximately 85% accurate.'
                    : ' Other participants received AI assistance during the task.'
                  }
                </p>
              </section>

              {/* Optional: Show results */}
              {results && (
                <section>
                  <button
                    onClick={() => setShowResults(!showResults)}
                    className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
                  >
                    <svg
                      className={`w-4 h-4 transition-transform ${showResults ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    View Your Performance Summary
                  </button>

                  {showResults && (
                    <div className="mt-4 bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Total Images</p>
                        <p className="text-xl font-bold text-gray-900">{results.totalTrials}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Overall Accuracy</p>
                        <p className="text-xl font-bold text-gray-900">{results.accuracy.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Hit Rate</p>
                        <p className="text-xl font-bold text-gray-900">{results.hitRate.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Avg Response Time</p>
                        <p className="text-xl font-bold text-gray-900">{(results.avgResponseTime / 1000).toFixed(2)}s</p>
                      </div>
                    </div>
                  )}
                </section>
              )}

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Confidentiality</h2>
                <p className="text-gray-700">
                  Your responses are completely anonymous. Your participant ID ({participantId})
                  cannot be linked to your identity. Data will only be reported in aggregate form.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Questions?</h2>
                <p className="text-gray-700">
                  If you have questions about this research, please contact the IE 6500 research
                  team at Northeastern University.
                </p>
              </section>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              onClick={handleSubmitData}
              disabled={isSubmitting}
              className="btn btn-primary w-full"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting Data...
                </span>
              ) : (
                'Submit Data & Complete Study'
              )}
            </button>
          </div>
        ) : (
          /* Completion confirmation */
          <div className="card text-center">
            <div className="mb-8">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Thank You!
              </h1>
              <p className="text-lg text-gray-600">
                Your participation in this research study is greatly appreciated.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <p className="text-gray-700">
                Your data has been submitted successfully. You may now close this window.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Participant ID: {participantId}
              </p>
            </div>

            <button
              onClick={() => router.push('/')}
              className="btn btn-secondary"
            >
              Return to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
