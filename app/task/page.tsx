'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { storage, getTimeBlock, getResponseType, getTimestamp, calculateResponseTime } from '@/lib/utils';
import { STORAGE_KEYS, STUDY_CONFIG, TIME_BLOCKS } from '@/lib/constants';
import { generateTrialOrder, getAIPrediction } from '@/lib/imageData';
import ImageDisplay from '@/components/ImageDisplay';
import ResponseButtons from '@/components/ResponseButtons';
import ProgressBar from '@/components/ProgressBar';
import Timer, { BlockTimer } from '@/components/Timer';
import { KSSScale } from '@/components/LikertScale';
import type { ImageData, Trial, Condition, TimeBlock } from '@/types';

type TaskPhase = 'pre-kss' | 'task' | 'block-break' | 'post-kss';

export default function TaskPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [condition, setCondition] = useState<Condition | null>(null);
  const [phase, setPhase] = useState<TaskPhase>('pre-kss');

  // Pre/Post KSS
  const [preKSS, setPreKSS] = useState<number | null>(null);
  const [postKSS, setPostKSS] = useState<number | null>(null);

  // Task state
  const [images, setImages] = useState<ImageData[]>([]);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [currentBlock, setCurrentBlock] = useState<TimeBlock>(1);
  const [taskStartTime, setTaskStartTime] = useState<number | null>(null);
  const [blockStartTime, setBlockStartTime] = useState<number | null>(null);
  const [imageLoadTime, setImageLoadTime] = useState<number | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  // Block break state
  const [breakTimeRemaining, setBreakTimeRemaining] = useState(30);
  const breakIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const participantId = storage.get(STORAGE_KEYS.PARTICIPANT_ID);
    const storedCondition = storage.get(STORAGE_KEYS.CONDITION) as Condition;
    const trainingComplete = storage.get(STORAGE_KEYS.TRAINING_COMPLETE);

    if (!participantId || !trainingComplete) {
      router.push('/training');
      return;
    }

    setCondition(storedCondition);
    setImages(generateTrialOrder());
    setIsLoading(false);
  }, [router]);

  const currentImage = images[currentTrialIndex];

  const handlePreKSSSubmit = () => {
    if (preKSS === null) return;

    storage.set(STORAGE_KEYS.PRE_KSS, preKSS.toString());
    const now = Date.now(); // epoch ms – used by Timer component
    setTaskStartTime(now);
    setBlockStartTime(now);
    storage.set(STORAGE_KEYS.TASK_START_TIME, now.toString());
    setPhase('task');
  };

  const handleImageLoad = useCallback(() => {
    setImageLoadTime(getTimestamp());
    setIsImageLoaded(true);
  }, []);

  const handleResponse = useCallback((isDefect: boolean) => {
    if (!currentImage || !imageLoadTime) return;

    const responseTime = calculateResponseTime(imageLoadTime);
    const actualDefect = currentImage.defectType !== 'none';
    const responseType = getResponseType(actualDefect, isDefect);
    const block = getTimeBlock(currentTrialIndex + 1);

    const trial: Trial = {
      trialNumber: currentTrialIndex + 1,
      timeBlock: block,
      imageId: currentImage.id,
      defectType: currentImage.defectType,
      participantResponse: isDefect,
      responseType,
      responseTime,
      timestamp: new Date().toISOString(),
      aiPrediction: condition === 'AI_ASSISTED' ? getAIPrediction(currentImage.id) : undefined,
    };

    const newTrials = [...trials, trial];
    setTrials(newTrials);

    // Store trials periodically
    if (newTrials.length % 10 === 0) {
      storage.set(STORAGE_KEYS.TRIALS, JSON.stringify(newTrials));
    }

    // Check if we need a block break
    const nextTrialIndex = currentTrialIndex + 1;

    if (nextTrialIndex >= STUDY_CONFIG.totalImages) {
      // Task complete
      storage.set(STORAGE_KEYS.TRIALS, JSON.stringify(newTrials));
      setPhase('post-kss');
    } else {
      const nextBlock = getTimeBlock(nextTrialIndex + 1);

      if (nextBlock !== block) {
        // Block transition - show break
        setCurrentBlock(nextBlock);
        setPhase('block-break');
        setBreakTimeRemaining(30);

        // Start break countdown
        breakIntervalRef.current = setInterval(() => {
          setBreakTimeRemaining((prev) => {
            if (prev <= 1) {
              if (breakIntervalRef.current) {
                clearInterval(breakIntervalRef.current);
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        // Continue to next trial
        setCurrentTrialIndex(nextTrialIndex);
        setIsImageLoaded(false);
        setImageLoadTime(null);
      }
    }
  }, [currentImage, imageLoadTime, currentTrialIndex, trials, condition]);

  const handleContinueFromBreak = () => {
    if (breakIntervalRef.current) {
      clearInterval(breakIntervalRef.current);
    }
    setBlockStartTime(getTimestamp());
    setCurrentTrialIndex(currentTrialIndex + 1);
    setIsImageLoaded(false);
    setImageLoadTime(null);
    setPhase('task');
  };

  const handlePostKSSSubmit = () => {
    if (postKSS === null) return;

    storage.set(STORAGE_KEYS.POST_KSS, postKSS.toString());
    storage.set(STORAGE_KEYS.TASK_END_TIME, new Date().toISOString());
    router.push('/questionnaire');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (breakIntervalRef.current) {
        clearInterval(breakIntervalRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 px-4">
      {/* Pre-task KSS */}
      {phase === 'pre-kss' && (
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Before We Begin
              </h1>
              <p className="text-gray-600">
                Please rate your current level of alertness
              </p>
            </div>

            <KSSScale value={preKSS} onChange={setPreKSS} />

            <button
              onClick={handlePreKSSSubmit}
              disabled={preKSS === null}
              className="btn btn-primary w-full mt-8"
            >
              Begin Inspection Task
            </button>
          </div>
        </div>
      )}

      {/* Main Task */}
      {phase === 'task' && currentImage && (
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <BlockTimer currentBlock={currentBlock} blockStartTime={blockStartTime} />
            <Timer startTime={taskStartTime} />
          </div>

          {/* Progress */}
          <div className="mb-6">
            <ProgressBar
              current={currentTrialIndex + 1}
              total={STUDY_CONFIG.totalImages}
              showLabel
              showPercentage
            />
          </div>

          {/* Main content card */}
          <div className="card">
            {/* Condition indicator */}
            <div className="flex justify-center mb-4">
              <span className={`
                px-3 py-1 rounded-full text-sm font-medium
                ${condition === 'AI_ASSISTED'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
                }
              `}>
                {condition === 'AI_ASSISTED' ? '🤖 AI-Assisted Mode' : '👁 Manual Inspection'}
              </span>
            </div>

            {/* Image display */}
            <div className="flex justify-center mb-8">
              <ImageDisplay
                image={currentImage}
                aiPrediction={condition === 'AI_ASSISTED' ? getAIPrediction(currentImage.id) : undefined}
                showAI={condition === 'AI_ASSISTED'}
                onLoad={handleImageLoad}
              />
            </div>

            {/* Response buttons */}
            <ResponseButtons
              onResponse={handleResponse}
              disabled={!isImageLoaded}
              showKeyboardHints
            />

            {!isImageLoaded && (
              <p className="text-center text-gray-500 mt-4 animate-pulse">
                Loading image...
              </p>
            )}
          </div>

          {/* Block indicator */}
          <div className="text-center mt-4 text-sm text-gray-500">
            Block {currentBlock} of 3 • Images {TIME_BLOCKS[currentBlock].start}-{TIME_BLOCKS[currentBlock].end}
          </div>
        </div>
      )}

      {/* Block Break */}
      {phase === 'block-break' && (
        <div className="max-w-2xl mx-auto">
          <div className="card text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Block {currentBlock - 1} Complete!
              </h1>
              <p className="text-gray-600">
                Take a short break. The task will continue in:
              </p>
            </div>

            <div className="text-5xl font-bold text-primary-600 mb-8">
              {breakTimeRemaining}s
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-gray-700">
                You've completed <strong>{(currentBlock - 1) * 60}</strong> of {STUDY_CONFIG.totalImages} images.
                <br />
                <strong>{STUDY_CONFIG.totalImages - (currentBlock - 1) * 60}</strong> images remaining.
              </p>
            </div>

            <button
              onClick={handleContinueFromBreak}
              className={`btn w-full ${breakTimeRemaining > 0 ? 'btn-secondary' : 'btn-primary'}`}
            >
              {breakTimeRemaining > 0 ? 'Skip Break & Continue' : 'Continue to Block ' + currentBlock}
            </button>
          </div>
        </div>
      )}

      {/* Post-task KSS */}
      {phase === 'post-kss' && (
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Inspection Task Complete!
              </h1>
              <p className="text-gray-600">
                Please rate your current level of alertness
              </p>
            </div>

            <KSSScale value={postKSS} onChange={setPostKSS} />

            <button
              onClick={handlePostKSSSubmit}
              disabled={postKSS === null}
              className="btn btn-primary w-full mt-8"
            >
              Continue to Questionnaire
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
