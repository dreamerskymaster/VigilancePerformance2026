'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/utils';
import { STORAGE_KEYS, DEFECT_TYPES, STUDY_CONFIG } from '@/lib/constants';
import { generateTrainingImages, getAIPrediction } from '@/lib/imageData';
import ImageDisplay from '@/components/ImageDisplay';
import ResponseButtons from '@/components/ResponseButtons';
import type { ImageData, Condition } from '@/types';

type TrainingPhase = 'intro' | 'defect-examples' | 'practice' | 'ready';

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

  const handlePracticeResponse = (isDefect: boolean) => {
    const currentImage = trainingImages[practiceIndex];
    const actualDefect = currentImage.defectType !== 'none';
    const isCorrect = isDefect === actualDefect;

    setLastAnswer({ isCorrect, actualDefect });
    setPracticeResults((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    setShowFeedback(true);
  };

  const handleNextPractice = () => {
    setShowFeedback(false);
    setLastAnswer(null);

    if (practiceIndex < trainingImages.length - 1) {
      setPracticeIndex(practiceIndex + 1);
    } else {
      setPhase('ready');
    }
  };

  const handleStartTask = () => {
    storage.set(STORAGE_KEYS.TRAINING_COMPLETE, 'true');
    router.push('/task');
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
      <div className="max-w-4xl mx-auto">
        {/* Introduction Phase */}
        {phase === 'intro' && (
          <div className="card">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Training: Metal Surface Defect Detection
            </h1>

            <div className="space-y-6 mb-8">
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Your Task</h2>
                <p className="text-gray-700">
                  You will be inspecting images of hot-rolled steel strip surfaces. Your job is
                  to identify whether each image contains a surface defect or not.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">What to Look For</h2>
                <p className="text-gray-700 mb-4">
                  There are 6 types of surface defects you may encounter. Each defect appears
                  as a distinct pattern or irregularity on the metal surface. You will see
                  examples of each type next.
                </p>
              </section>

              {condition === 'AI_ASSISTED' && (
                <section className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h2 className="text-lg font-semibold text-blue-900 mb-2">
                    AI Assistance
                  </h2>
                  <p className="text-blue-800">
                    You have been assigned to the <strong>AI-Assisted</strong> condition.
                    During the inspection task, an AI system will provide predictions about
                    whether each image contains a defect. The AI will highlight suspected
                    defect regions and provide a confidence score.
                  </p>
                  <p className="text-blue-800 mt-2">
                    <strong>Important:</strong> The AI is helpful but not perfect. You should
                    use the AI predictions as a guide, but always make your own judgment based
                    on what you see in the image.
                  </p>
                </section>
              )}

              {condition === 'UNASSISTED' && (
                <section className="bg-gray-100 border border-gray-200 rounded-lg p-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Manual Inspection
                  </h2>
                  <p className="text-gray-700">
                    You have been assigned to the <strong>Manual Inspection</strong> condition.
                    You will inspect each image independently and make your own judgment about
                    whether a defect is present.
                  </p>
                </section>
              )}
            </div>

            <button
              onClick={() => setPhase('defect-examples')}
              className="btn btn-primary w-full"
            >
              View Defect Examples
            </button>
          </div>
        )}

        {/* Defect Examples Phase */}
        {phase === 'defect-examples' && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Defect Types ({currentDefectIndex + 1} of {defectTypes.length})
              </h1>
              <div className="flex gap-1">
                {defectTypes.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-3 h-3 rounded-full ${idx === currentDefectIndex
                      ? 'bg-primary-600'
                      : idx < currentDefectIndex
                        ? 'bg-primary-300'
                        : 'bg-gray-200'
                      }`}
                  />
                ))}
              </div>
            </div>

            {(() => {
              const [key, info] = defectTypes[currentDefectIndex];
              return (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {info.fullName}
                    </h2>
                    <p className="text-gray-600 mt-2">{info.description}</p>
                  </div>

                  {/* Placeholder for example image */}
                  <div className="flex justify-center">
                    <div className="w-80 h-80 bg-gray-200 rounded-lg flex items-center justify-center border-2 border-gray-300">
                      <div className="text-center text-gray-500">
                        <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="font-medium">{info.fullName}</p>
                        <p className="text-sm">Example Image</p>
                        <p className="text-xs mt-2">({key}.jpg)</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-medium text-yellow-900 mb-1">Visual Characteristics</h3>
                    <p className="text-sm text-yellow-800">{info.description}</p>
                  </div>
                </div>
              );
            })()}

            <div className="flex gap-4 mt-8">
              {currentDefectIndex > 0 && (
                <button
                  onClick={() => setCurrentDefectIndex(currentDefectIndex - 1)}
                  className="btn btn-secondary flex-1"
                >
                  Previous
                </button>
              )}
              <button
                onClick={() => {
                  if (currentDefectIndex < defectTypes.length - 1) {
                    setCurrentDefectIndex(currentDefectIndex + 1);
                  } else {
                    setPhase('practice');
                  }
                }}
                className="btn btn-primary flex-1"
              >
                {currentDefectIndex < defectTypes.length - 1 ? 'Next Defect Type' : 'Start Practice'}
              </button>
            </div>
          </div>
        )}

        {/* Practice Phase */}
        {phase === 'practice' && (
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Practice Trial {practiceIndex + 1} of {trainingImages.length}
              </h1>
              <div className="text-sm text-gray-600">
                Score: {practiceResults.correct}/{practiceResults.total}
              </div>
            </div>

            {trainingImages[practiceIndex] && (
              <div className="space-y-6">
                {/* Image */}
                <div className="flex justify-center">
                  <ImageDisplay
                    image={trainingImages[practiceIndex]}
                    aiPrediction={
                      condition === 'AI_ASSISTED'
                        ? getAIPrediction(trainingImages[practiceIndex].id)
                        : undefined
                    }
                    showAI={condition === 'AI_ASSISTED' && !showFeedback}
                  />
                </div>

                {/* Feedback or Response */}
                {showFeedback && lastAnswer ? (
                  <div className="space-y-4">
                    <div
                      className={`p-4 rounded-lg text-center ${lastAnswer.isCorrect
                        ? 'bg-green-100 border border-green-300'
                        : 'bg-red-100 border border-red-300'
                        }`}
                    >
                      <p className={`text-lg font-bold ${lastAnswer.isCorrect ? 'text-green-800' : 'text-red-800'
                        }`}>
                        {lastAnswer.isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                      </p>
                      <p className={`text-sm ${lastAnswer.isCorrect ? 'text-green-700' : 'text-red-700'
                        }`}>
                        This image {lastAnswer.actualDefect ? 'contains a defect' : 'has no defect'}.
                        {trainingImages[practiceIndex].defectType !== 'none' && (
                          <span>
                            {' '}Defect type: {DEFECT_TYPES[trainingImages[practiceIndex].defectType].fullName}
                          </span>
                        )}
                      </p>
                    </div>

                    <button
                      onClick={handleNextPractice}
                      className="btn btn-primary w-full"
                    >
                      {practiceIndex < trainingImages.length - 1 ? 'Next Practice Image' : 'Complete Training'}
                    </button>
                  </div>
                ) : (
                  <ResponseButtons
                    onResponse={handlePracticeResponse}
                    disabled={showFeedback}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Ready Phase */}
        {phase === 'ready' && (
          <div className="card text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Training Complete!
              </h1>
              <p className="text-gray-600">
                You scored {practiceResults.correct} out of {practiceResults.total} on the practice trials.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
              <h2 className="font-semibold text-gray-900 mb-4">Before You Begin</h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-primary-600 mt-1">•</span>
                  The main task will last approximately <strong>30 minutes</strong>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600 mt-1">•</span>
                  You will inspect <strong>180 images</strong> in total
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600 mt-1">•</span>
                  Try to respond as <strong>quickly and accurately</strong> as possible
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600 mt-1">•</span>
                  Please do not take breaks during the task
                </li>
                {condition === 'AI_ASSISTED' && (
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-1">•</span>
                    Remember: The AI is a helpful guide, but <strong>you make the final decision</strong>
                  </li>
                )}
              </ul>
            </div>

            <button
              onClick={handleStartTask}
              className="btn btn-primary btn-xl w-full"
            >
              Start Inspection Task
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
