'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/utils';
import { STORAGE_KEYS, DEFECT_TYPES } from '@/lib/constants';
import { generateTrainingImages, getAIPrediction } from '@/lib/imageData';
import ImageDisplay from '@/components/ImageDisplay';
import ResponseButtons from '@/components/ResponseButtons';
import type { ImageData, Condition } from '@/types';

type TrainingPhase = 'intro' | 'defect-examples' | 'practice' | 'ready';

/**
 * Training Page – Step 3 of the study
 * 
 * Takes the participant through:
 * 1. Intro instructions
 * 2. Visual examples of all 6 defect types
 * 3. Interactive practice trials with immediate feedback
 */
export default function TrainingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [condition, setCondition] = useState<Condition | null>(null);
  const [phase, setPhase] = useState<TrainingPhase>('intro');
  const [currentDefectIndex, setCurrentDefectIndex] = useState(0);
  const [trainingImages, setTrainingImages] = useState<ImageData[]>([]);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceResults, setPracticeResults] = useState<{ correct: number; total: number }>({
    correct: 0,
    total: 0,
  });
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<{ isCorrect: boolean; actualDefect: boolean } | null>(null);

  useEffect(() => {
    const participantId = storage.get(STORAGE_KEYS.PARTICIPANT_ID);
    const storedCondition = storage.get(STORAGE_KEYS.CONDITION) as Condition;

    if (!participantId) {
      router.push('/consent');
      return;
    }

    setCondition(storedCondition);
    setTrainingImages(generateTrainingImages());
    setIsLoading(false);
  }, [router]);

  const defectTypes = Object.entries(DEFECT_TYPES).filter(([key]) => key !== 'none');

  /**
   * Handle participant's practice response.
   * Shows feedback briefly, then auto-advances to next image.
   * No "Next" button needed - improves flow.
   */
  const handlePracticeResponse = (isDefect: boolean) => {
    const currentImage = trainingImages[practiceIndex]
    const actualDefect = currentImage.defectType !== 'none'
    const isCorrect = isDefect === actualDefect

    // Update results
    setPracticeResults(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }))

    // Show feedback
    setLastAnswer({ isCorrect, actualDefect })
    setShowFeedback(true)

    // Auto-advance after 1.5 seconds
    setTimeout(() => {
      setShowFeedback(false)
      setLastAnswer(null)

      if (practiceIndex < trainingImages.length - 1) {
        // Move to next practice image
        setPracticeIndex(practiceIndex + 1)
      } else {
        // Practice complete - show ready screen
        setPhase('ready')
      }
    }, 1500)
  }

  const handleStartTask = () => {
    storage.set(STORAGE_KEYS.TRAINING_COMPLETE, 'true');
    router.push('/task');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-blue-50 to-indigo-100 relative">


      <div className="max-w-4xl mx-auto animate-fade-in-up">
        {/* ── Top Progress Tracker ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div
            className={`px-4 py-2 rounded-full font-bold text-sm transition-all shadow-sm ${phase === 'intro' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
              }`}
          >
            1. Intro
          </div>
          <div className="w-12 h-1 bg-blue-200 rounded-full" />
          <div
            className={`px-4 py-2 rounded-full font-bold text-sm transition-all shadow-sm ${phase === 'defect-examples' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
              }`}
          >
            2. Examples
          </div>
          <div className="w-12 h-1 bg-blue-200 rounded-full" />
          <div
            className={`px-4 py-2 rounded-full font-bold text-sm transition-all shadow-sm ${phase === 'practice' || phase === 'ready' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'
              }`}
          >
            3. Practice
          </div>
        </div>

        {/* ── Phase 1: Intro ─────────────────────────────────────────────────── */}
        {phase === 'intro' && (
          <div className="card-modern max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-4 shadow-inner">
                <span className="text-4xl">📚</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Let's Learn What to Look For
              </h1>
              <p className="text-gray-600 text-lg">
                Before the main task, we'll show you examples of each defect type
              </p>
            </div>

            <div className="space-y-6 mb-8">
              <div className="bg-white rounded-xl border-2 border-gray-100 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-xl">🔍</span> Your Task
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  You will be inspecting images of hot-rolled steel strip surfaces. Your job is
                  to identify whether each image contains a surface defect or not. There are 6 types
                  of surface defects you may encounter.
                </p>
              </div>

              {condition === 'AI_ASSISTED' ? (
                <div className="bg-purple-50 rounded-xl border-2 border-purple-200 p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
                  <h2 className="text-lg font-bold text-purple-900 mb-2 flex items-center gap-2">
                    <span className="text-xl animate-pulse">🤖</span> AI Assistance
                  </h2>
                  <p className="text-purple-800 leading-relaxed mb-3">
                    You have been assigned to the <strong>AI-Assisted</strong> condition.
                    During the inspection task, an AI system will trace suspected defect regions
                    and provide a confidence score.
                  </p>
                  <p className="text-purple-900 font-medium bg-purple-100/50 p-3 rounded-lg border border-purple-200/50">
                    💡 Important: The AI is helpful but not perfect. Use the AI predictions as a guide,
                    but always trust your own judgment.
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl border-2 border-gray-200 p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <span className="text-xl">👁️</span> Manual Inspection
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    You have been assigned to the <strong>Manual Inspection</strong> condition.
                    You will inspect each image independently and make your own judgment about
                    whether a defect is present. Take your time to be thorough.
                  </p>
                </div>
              )}
            </div>

            <button onClick={() => setPhase('defect-examples')} className="btn-hero w-full">
              View Defect Examples →
            </button>
          </div>
        )}

        {/* ── Phase 2: Defect Examples ────────────────────────────────────────── */}
        {phase === 'defect-examples' && (
          <div className="card-modern">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b pb-6 border-gray-100">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <span className="bg-blue-100 text-blue-700 w-10 h-10 rounded-full flex items-center justify-center text-lg">
                  {currentDefectIndex + 1}
                </span>
                Defect Examples
              </h1>

              <div className="flex gap-2 bg-gray-100 p-1.5 rounded-full">
                {defectTypes.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentDefectIndex(idx)}
                    className={`w-8 h-8 rounded-full font-bold text-sm transition-all flex items-center justify-center ${idx === currentDefectIndex
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-transparent text-gray-500 hover:bg-gray-200'
                      }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {(() => {
              const [key, info] = defectTypes[currentDefectIndex];
              return (
                <div className="grid md:grid-cols-2 gap-8 items-center animate-fade-in-up" key={key}>
                  {/* Image */}
                  <div className="flex justify-center">
                    <div className="relative p-2 bg-white rounded-2xl shadow-xl border border-gray-100">
                      <img
                        src={`/images/${key}_001.jpg`}
                        alt={`Example of ${info.fullName} defect`}
                        className="w-[350px] h-[350px] object-cover rounded-xl"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.img-fallback')) {
                            const fallback = document.createElement('div');
                            fallback.className = 'img-fallback w-[350px] h-[350px] bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300';
                            fallback.innerHTML = `<div class="text-center text-gray-500"><p class="font-medium text-lg">${info.fullName}</p><p class="text-sm">Example Image Missing</p></div>`;
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-3 ml-[-2px] tracking-tight">{info.fullName}</h2>
                      <p className="text-gray-600 text-lg leading-relaxed">{info.description}</p>
                    </div>

                    <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-r-xl p-5 shadow-sm">
                      <h3 className="font-bold text-yellow-900 mb-2 flex items-center gap-2">
                        <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        What to look for
                      </h3>
                      <p className="text-yellow-800 font-medium">
                        {info.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex gap-4 mt-10 pt-6 border-t border-gray-100">
              <button
                onClick={() => setCurrentDefectIndex(Math.max(0, currentDefectIndex - 1))}
                className={`flex-1 py-4 font-bold rounded-xl border-2 transition-all ${currentDefectIndex === 0
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                  }`}
                disabled={currentDefectIndex === 0}
              >
                ← Previous
              </button>

              <button
                onClick={() => {
                  if (currentDefectIndex < defectTypes.length - 1) {
                    setCurrentDefectIndex(currentDefectIndex + 1);
                  } else {
                    setPhase('practice');
                  }
                }}
                className="flex-1 py-4 font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20"
              >
                {currentDefectIndex < defectTypes.length - 1 ? 'Next Defect →' : 'Start Practice →'}
              </button>
            </div>
          </div>
        )}

        {/* ── Phase 3: Practice ──────────────────────────────────────────────── */}
        {phase === 'practice' && (
          <div className="relative">
            {/* Feedback overlay */}
            {showFeedback && (
              <div className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none ${lastAnswer?.isCorrect
                  ? 'bg-green-500/30'
                  : 'bg-red-500/30'
                }`}>
                <div className={`text-6xl font-bold animate-scale-in ${lastAnswer?.isCorrect ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {lastAnswer?.isCorrect ? '✓ Correct!' : '✗ Try Again'}
                </div>
              </div>
            )}

            {/* Practice content */}
            <div className="card-modern max-w-2xl mx-auto">
              <div className="text-center mb-4">
                <p className="text-gray-600">
                  Practice Image {practiceIndex + 1} of {trainingImages.length}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Score: {practiceResults.correct} / {practiceResults.total}
                </p>
              </div>

              {/* Image display */}
              <div className="flex justify-center mb-6">
                <ImageDisplay
                  image={trainingImages[practiceIndex]}
                  aiPrediction={condition === 'AI_ASSISTED' ? getAIPrediction(trainingImages[practiceIndex].id) : undefined}
                  showAI={condition === 'AI_ASSISTED'}
                />
              </div>

              {/* Response buttons - disabled during feedback */}
              <ResponseButtons
                onResponse={handlePracticeResponse}
                disabled={showFeedback}
              />

              <p className="text-center text-sm text-gray-500 mt-4">
                Click your answer - the next image will appear automatically
              </p>
            </div>
          </div>
        )}

        {/* ── Phase 4: Ready ────────────────────────────────────────────────── */}
        {phase === 'ready' && (
          <div className="card-modern max-w-2xl mx-auto text-center animate-scale-in">
            <div className="mb-8 mt-4">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
                Training Complete!
              </h1>
              <p className="text-lg text-gray-600 font-medium">
                You scored <span className="text-green-600 font-bold">{practiceResults.correct}</span> out of {practiceResults.total} on the practice trials.
              </p>
            </div>

            <div className="bg-gray-50 border-2 border-gray-100 rounded-2xl p-8 mb-8 text-left shadow-sm">
              <h2 className="font-bold text-gray-900 mb-6 flex items-center gap-2 text-xl">
                <span>⚠️</span> Before You Begin
              </h2>
              <ul className="space-y-4 text-gray-700 font-medium">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-xs">⏱️</span></div>
                  <span>The main task will last approximately <strong>30 minutes</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-xs">📸</span></div>
                  <span>You will inspect a continuous flow of <strong>180 images</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-xs">🎯</span></div>
                  <span>Try to respond as <strong>quickly and accurately</strong> as possible</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-xs">🚫</span></div>
                  <span>Please do not take breaks during the task</span>
                </li>
                {condition === 'AI_ASSISTED' && (
                  <li className="flex items-start gap-3 mt-6 pt-4 border-t border-gray-200">
                    <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-xs">🤖</span></div>
                    <span className="text-purple-800">Remember: The AI is a guide, but <strong>you make the final decision!</strong></span>
                  </li>
                )}
              </ul>
            </div>

            <button onClick={handleStartTask} className="btn-hero w-full shadow-blue-600/30">
              Start Inspection Task 🚀
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
