'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateParticipantId, assignCondition, storage } from '@/lib/utils';
import { STORAGE_KEYS } from '@/lib/constants';

/**
 * ConsentPage – simplified plain-English consent form.
 * Requires the participant to scroll to the bottom before the checkbox is enabled.
 */
export default function ConsentPage() {
  const router = useRouter();
  const [hasScrolled, setHasScrolled] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAgree = async () => {
    if (!agreed) return;
    setIsLoading(true);

    const participantId = generateParticipantId();
    const condition = assignCondition();

    storage.set(STORAGE_KEYS.PARTICIPANT_ID, participantId);
    storage.set(STORAGE_KEYS.CONDITION, condition);
    storage.set(STORAGE_KEYS.CONSENT_TIMESTAMP, new Date().toISOString());

    router.push('/demographics');
  };

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-3xl mx-auto animate-fade-in-up">
        <div className="card-modern">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Before We Begin</h1>
            <p className="text-gray-600 text-lg">Please read this information carefully</p>
          </div>

          {/* Scrollable consent body */}
          <div
            className="bg-gray-50 rounded-xl p-6 mb-6 max-h-[400px] overflow-y-auto border border-gray-200 space-y-6"
            onScroll={(e) => {
              const el = e.target as HTMLDivElement;
              if (el.scrollHeight - el.scrollTop <= el.clientHeight + 100) {
                setHasScrolled(true);
              }
            }}
          >
            <section>
              <h2 className="text-xl font-bold text-blue-800 mb-3">📋 What is this study about?</h2>
              <p className="text-gray-700 leading-relaxed">
                This is a class project for <strong>IE 6500 Human Performance</strong> at Northeastern University.
                We want to learn how people spot defects in metal surfaces, and whether computer help makes a difference.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-blue-800 mb-3">🎯 What will I do?</h2>
              <ul className="text-gray-700 space-y-2">
                {[
                  'Answer a few quick questions about yourself (2 minutes)',
                  'Learn how to spot defects in metal images (5 minutes)',
                  'Look at 180 images and decide if each has a defect (30 minutes)',
                  'Tell us how you felt during the task (5 minutes)',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-gray-600 mt-3 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <strong>Total time:</strong> About 45 minutes
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-blue-800 mb-3">🤖 Will AI be involved?</h2>
              <p className="text-gray-700 mb-3">
                <strong>Maybe!</strong> You will be randomly assigned to one of two groups:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <p className="font-bold text-purple-800">Group A: With AI Helper</p>
                  <p className="text-sm text-purple-700">An AI will show you where it thinks defects are. You make the final call.</p>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
                  <p className="font-bold text-gray-800">Group B: On Your Own</p>
                  <p className="text-sm text-gray-700">You will inspect images without any AI assistance.</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm mt-3">
                Note: The AI runs locally in this app. Your answers are NOT sent to any outside AI service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-blue-800 mb-3">⚠️ Are there any risks?</h2>
              <p className="text-gray-700 leading-relaxed">
                <strong>Very minimal.</strong> The task takes about 30 minutes, so you might feel a bit tired or bored.
                That&apos;s normal! You can stop at any time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-blue-800 mb-3">🔒 What about my privacy?</h2>
              <ul className="text-gray-700 space-y-2">
                {[
                  'We do NOT collect your name, email, or student ID',
                  'You get a random code instead of using your identity',
                  'Only the researcher and instructor see the data',
                  'Results are reported as group averages, not individuals',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-blue-800 mb-3">🆓 Is this voluntary?</h2>
              <p className="text-gray-700 leading-relaxed">
                <strong>Yes, completely!</strong> You can skip any question you don&apos;t want to answer.
                You can close the browser and leave at any time. There is no penalty for stopping.
              </p>
            </section>

            <section className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h2 className="text-xl font-bold text-blue-800 mb-3">📧 Questions?</h2>
              <p className="text-gray-700">
                Contact the researcher:<br />
                <strong>Ajith Srikanth</strong><br />
                <a href="mailto:ajithsrikanth.f@northeastern.edu" className="text-blue-600 hover:underline">
                  ajithsrikanth.f@northeastern.edu
                </a>
              </p>
            </section>
          </div>

          {/* Scroll reminder */}
          {!hasScrolled && (
            <p className="text-amber-600 text-center mb-4 flex items-center justify-center gap-2 animate-pulse">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              Please scroll down to read everything
            </p>
          )}

          {/* Agreement checkbox */}
          <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${hasScrolled
              ? agreed
                ? 'border-green-400 bg-green-50'
                : 'border-gray-300 hover:border-blue-300 bg-white'
              : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
            }`}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={!hasScrolled}
              className="mt-1 w-6 h-6 rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-50"
            />
            <span className="text-gray-800">
              <strong>I have read and understood the information above.</strong><br />
              <span className="text-gray-600">I am 18 years or older and I agree to participate in this study.</span>
            </span>
          </label>

          {/* Action buttons */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => router.push('/')}
              className="flex-1 py-4 px-6 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold
                         hover:bg-gray-50 hover:border-gray-400 transition-all"
            >
              No Thanks
            </button>
            <button
              onClick={handleAgree}
              disabled={!agreed || isLoading}
              className="flex-1 btn-hero disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Setting up…
                </span>
              ) : (
                "I Agree – Let's Start! →"
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
