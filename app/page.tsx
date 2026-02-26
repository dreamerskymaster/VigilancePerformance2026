'use client';

import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-2xl w-full text-center animate-fade-in-up">
        {/* Logo/Icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur rounded-2xl mb-8">
          <span className="text-5xl">🔍</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Visual Inspection Study
        </h1>

        {/* Subtitle */}
        <p className="text-xl text-blue-200 mb-2">
          Vigilance Decrement in Visual Inspection
        </p>

        {/* Course info */}
        <p className="text-blue-300 mb-8">
          Northeastern University • IE 6500: Human Performance
        </p>

        {/* Description */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-8 text-left">
          <p className="text-white/90 leading-relaxed">
            In this study, you'll inspect metal surface images and identify defects.
            The task takes about <strong>25 minutes</strong> and helps us understand
            how attention and accuracy change over time.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <p className="text-3xl font-bold text-white">90</p>
            <p className="text-sm text-blue-200">Images</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <p className="text-3xl font-bold text-white">25</p>
            <p className="text-sm text-blue-200">Minutes</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <p className="text-3xl font-bold text-white">3</p>
            <p className="text-sm text-blue-200">Blocks</p>
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={() => router.push('/consent')}
          className="btn-hero text-xl px-12 py-5"
        >
          Begin Study →
        </button>

        {/* Footer */}
        <p className="text-blue-300/60 text-sm mt-8">
          By participating, you confirm you are 18 years or older.
        </p>
      </div>
    </div>
  );
}
