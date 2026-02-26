'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/utils';
import { STORAGE_KEYS, NASA_TLX_SUBSCALES, AI_TRUST_QUESTIONS } from '@/lib/constants';
import { NasaTLXScale } from '@/components/LikertScale';
import LikertScale from '@/components/LikertScale';
import type { Condition, NasaTLXScores, AITrustScores } from '@/types';

type QuestionnairePhase = 'nasa-tlx' | 'ai-trust' | 'complete';

export default function QuestionnairePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [condition, setCondition] = useState<Condition | null>(null);
  const [phase, setPhase] = useState<QuestionnairePhase>('nasa-tlx');
  const [currentNasaIndex, setCurrentNasaIndex] = useState(0);
  const [currentTrustIndex, setCurrentTrustIndex] = useState(0);

  const [nasaTLX, setNasaTLX] = useState<Record<keyof NasaTLXScores, number | null>>({
    mentalDemand: null,
    physicalDemand: null,
    temporalDemand: null,
    performance: null,
    effort: null,
    frustration: null,
  });

  const [aiTrust, setAITrust] = useState<Record<keyof AITrustScores, number | null>>({
    reliability: null,
    trust: null,
    reliance: null,
    confidence: null,
    helpfulness: null,
  });

  useEffect(() => {
    const participantId = storage.get(STORAGE_KEYS.PARTICIPANT_ID);
    const storedCondition = storage.get(STORAGE_KEYS.CONDITION) as Condition;

    if (!participantId) {
      router.push('/consent');
      return;
    }

    setCondition(storedCondition);
    setIsLoading(false);
  }, [router]);

  const nasaSubscales = Object.entries(NASA_TLX_SUBSCALES);
  const trustQuestions = Object.entries(AI_TRUST_QUESTIONS);

  const handleNasaResponse = (key: string, value: number) => {
    setNasaTLX((prev) => ({ ...prev, [key]: value }));
  };

  const handleNasaNext = () => {
    if (currentNasaIndex < nasaSubscales.length - 1) {
      setCurrentNasaIndex(currentNasaIndex + 1);
    } else {
      storage.set(STORAGE_KEYS.NASA_TLX, JSON.stringify(nasaTLX));

      if (condition === 'AI_ASSISTED') {
        setPhase('ai-trust');
      } else {
        setPhase('complete');
        router.push('/debrief');
      }
    }
  };

  const handleTrustResponse = (key: string, value: number) => {
    setAITrust((prev) => ({ ...prev, [key]: value }));
  };

  const handleTrustNext = () => {
    if (currentTrustIndex < trustQuestions.length - 1) {
      setCurrentTrustIndex(currentTrustIndex + 1);
    } else {
      storage.set(STORAGE_KEYS.AI_TRUST, JSON.stringify(aiTrust));
      setPhase('complete');
      router.push('/debrief');
    }
  };

  const canProceedNasa = () => {
    const [key] = nasaSubscales[currentNasaIndex];
    return nasaTLX[key as keyof NasaTLXScores] !== null;
  };

  const canProceedTrust = () => {
    const [key] = trustQuestions[currentTrustIndex];
    return aiTrust[key as keyof AITrustScores] !== null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Calculate progress percentage for progress bar
  const totalSteps = phase === 'nasa-tlx' ? nasaSubscales.length : trustQuestions.length;
  const currentStep = phase === 'nasa-tlx' ? currentNasaIndex : currentTrustIndex;
  const progressPercent = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto animate-fade-in-up">

        {phase === 'nasa-tlx' && (
          <div className="card-modern">
            {/* ── Header ────────────────────────────────────────────────── */}
            <div className="text-center mb-8 border-b pb-6 border-gray-100">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 shadow-inner">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
                Workload Assessment
              </h1>
              <p className="text-gray-600 text-lg">
                Please rate your experience during the inspection task
              </p>
            </div>

            {/* ── Progress Bar ─────────────────────────────────────────── */}
            <div className="mb-8">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Progress</span>
                <span className="text-sm font-bold text-blue-600">{currentNasaIndex + 1} / {nasaSubscales.length}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* ── Questionnaire Form ───────────────────────────────────── */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-200">
              {(() => {
                const [key, subscale] = nasaSubscales[currentNasaIndex];
                return (
                  <div className="animate-fade-in-up" key={`nasa-${key}`}>
                    <NasaTLXScale
                      subscale={subscale.name}
                      description={subscale.description}
                      lowLabel={subscale.lowLabel}
                      highLabel={subscale.highLabel}
                      value={nasaTLX[key as keyof NasaTLXScores] as number}
                      onChange={(value) => handleNasaResponse(key, value)}
                    />
                  </div>
                );
              })()}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentNasaIndex(Math.max(0, currentNasaIndex - 1))}
                disabled={currentNasaIndex === 0}
                className={`py-4 px-6 font-bold rounded-xl border-2 transition-all ${currentNasaIndex === 0
                    ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-transparent'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 cursor-pointer'
                  }`}
              >
                ← Back
              </button>

              <button
                onClick={handleNasaNext}
                disabled={!canProceedNasa()}
                className={`flex-1 py-4 font-bold text-lg rounded-xl transition-all shadow-md ${!canProceedNasa()
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'
                  }`}
              >
                {currentNasaIndex < nasaSubscales.length - 1 ? 'Next →' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {/* AI Trust Phase (AI-Assisted condition only) */}
        {phase === 'ai-trust' && condition === 'AI_ASSISTED' && (
          <div className="card-modern">
            {/* ── Header ────────────────────────────────────────────────── */}
            <div className="text-center mb-8 border-b pb-6 border-purple-100">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4 shadow-inner">
                <span className="text-3xl">🤖</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
                AI Assistance Evaluation
              </h1>
              <p className="text-gray-600 text-lg">
                Please rate your experience with the AI assistant
              </p>
            </div>

            {/* ── Progress Bar ─────────────────────────────────────────── */}
            <div className="mb-8">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Progress</span>
                <span className="text-sm font-bold text-purple-600">{currentTrustIndex + 1} / {trustQuestions.length}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* ── Questionnaire Form ───────────────────────────────────── */}
            <div className="bg-purple-50 rounded-2xl p-6 mb-8 border border-purple-100 shadow-sm relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-200 rounded-full blur-3xl opacity-50" />

              {(() => {
                const [key, question] = trustQuestions[currentTrustIndex];
                return (
                  <div className="animate-fade-in-up relative z-10" key={`trust-${key}`}>
                    <LikertScale
                      question={question.question}
                      min={1}
                      max={7}
                      minLabel="Strongly Disagree"
                      maxLabel="Strongly Agree"
                      value={aiTrust[key as keyof AITrustScores]}
                      onChange={(value) => handleTrustResponse(key, value)}
                      showNumbers
                      midLabels={[{ value: 4, label: 'Neutral' }]}
                    />
                  </div>
                );
              })()}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setCurrentTrustIndex(Math.max(0, currentTrustIndex - 1))}
                disabled={currentTrustIndex === 0}
                className={`py-4 px-6 font-bold rounded-xl border-2 transition-all ${currentTrustIndex === 0
                    ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-transparent'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 cursor-pointer'
                  }`}
              >
                ← Back
              </button>

              <button
                onClick={handleTrustNext}
                disabled={!canProceedTrust()}
                className={`flex-1 py-4 font-bold text-lg rounded-xl transition-all shadow-md ${!canProceedTrust()
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                    : 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-600/20'
                  }`}
              >
                {currentTrustIndex < trustQuestions.length - 1 ? 'Next →' : 'Complete Study'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
