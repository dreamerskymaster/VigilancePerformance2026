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
      // NASA-TLX complete
      storage.set(STORAGE_KEYS.NASA_TLX, JSON.stringify(nasaTLX));

      if (condition === 'AI_ASSISTED') {
        setPhase('ai-trust');
      } else {
        // Skip AI trust for unassisted condition
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
      // AI Trust complete
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* NASA-TLX Phase */}
        {phase === 'nasa-tlx' && (
          <div className="card">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                NASA Task Load Index
              </h1>
              <p className="text-gray-600">
                Please rate your experience during the inspection task
              </p>
            </div>

            {/* Progress */}
            <div className="flex justify-center mb-6">
              <div className="flex gap-2">
                {nasaSubscales.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-3 h-3 rounded-full transition-colors ${idx === currentNasaIndex
                      ? 'bg-primary-600'
                      : idx < currentNasaIndex
                        ? 'bg-primary-300'
                        : 'bg-gray-200'
                      }`}
                  />
                ))}
              </div>
            </div>

            {/* Current question */}
            {(() => {
              const [key, subscale] = nasaSubscales[currentNasaIndex];
              return (
                <div className="mb-8">
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

            {/* Navigation */}
            <div className="flex gap-4">
              {currentNasaIndex > 0 && (
                <button
                  onClick={() => setCurrentNasaIndex(currentNasaIndex - 1)}
                  className="btn btn-secondary flex-1"
                >
                  Previous
                </button>
              )}
              <button
                onClick={handleNasaNext}
                disabled={!canProceedNasa()}
                className="btn btn-primary flex-1"
              >
                {currentNasaIndex < nasaSubscales.length - 1 ? 'Next' : 'Continue'}
              </button>
            </div>

            {/* Question counter */}
            <p className="text-center text-sm text-gray-500 mt-4">
              Question {currentNasaIndex + 1} of {nasaSubscales.length}
            </p>
          </div>
        )}

        {/* AI Trust Phase (AI-Assisted condition only) */}
        {phase === 'ai-trust' && condition === 'AI_ASSISTED' && (
          <div className="card">
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                AI Assistance Evaluation
              </h1>
              <p className="text-gray-600">
                Please rate your experience with the AI assistance
              </p>
            </div>

            {/* Progress */}
            <div className="flex justify-center mb-6">
              <div className="flex gap-2">
                {trustQuestions.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-3 h-3 rounded-full transition-colors ${idx === currentTrustIndex
                      ? 'bg-primary-600'
                      : idx < currentTrustIndex
                        ? 'bg-primary-300'
                        : 'bg-gray-200'
                      }`}
                  />
                ))}
              </div>
            </div>

            {/* Current question */}
            {(() => {
              const [key, question] = trustQuestions[currentTrustIndex];
              return (
                <div className="mb-8">
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

            {/* Navigation */}
            <div className="flex gap-4">
              {currentTrustIndex > 0 && (
                <button
                  onClick={() => setCurrentTrustIndex(currentTrustIndex - 1)}
                  className="btn btn-secondary flex-1"
                >
                  Previous
                </button>
              )}
              <button
                onClick={handleTrustNext}
                disabled={!canProceedTrust()}
                className="btn btn-primary flex-1"
              >
                {currentTrustIndex < trustQuestions.length - 1 ? 'Next' : 'Complete'}
              </button>
            </div>

            {/* Question counter */}
            <p className="text-center text-sm text-gray-500 mt-4">
              Question {currentTrustIndex + 1} of {trustQuestions.length}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
