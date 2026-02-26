'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/utils';
import { STORAGE_KEYS } from '@/lib/constants';
import type { Demographics } from '@/types';

/**
 * Demographics page – step 2 in the study flow.
 *
 * Uses button-based selections for most fields to minimise friction and improve
 * accessibility on touch devices. Validates all required fields before navigating
 * to /training.  Data is saved to sessionStorage under STORAGE_KEYS.DEMOGRAPHICS.
 */
export default function DemographicsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<Partial<Record<keyof Demographics, string>>>({});

  const [formData, setFormData] = useState<Demographics>({
    age: 0,
    gender: '',
    education: '',
    visionCorrection: '',
    colorVisionNormal: true,
    inspectionExperience: '',
    aiExperience: '',
  });

  useEffect(() => {
    const participantId = storage.get(STORAGE_KEYS.PARTICIPANT_ID);
    if (!participantId) {
      router.push('/consent');
      return;
    }
    setIsLoading(false);
  }, [router]);

  /** Update a single form field and clear any existing validation error for it. */
  const updateField = (field: keyof Demographics, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  /** Returns true when all required fields pass simple validation. */
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof Demographics, string>> = {};

    if (!formData.age || formData.age < 18 || formData.age > 100) {
      newErrors.age = 'Please enter a valid age (18–100)';
    }
    if (!formData.gender) newErrors.gender = 'Please select an option';
    if (!formData.education) newErrors.education = 'Please select your education level';
    if (!formData.visionCorrection) newErrors.visionCorrection = 'Please select an option';
    if (!formData.inspectionExperience) newErrors.inspectionExperience = 'Please select an option';
    if (!formData.aiExperience) newErrors.aiExperience = 'Please select an option';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    storage.set(STORAGE_KEYS.DEMOGRAPHICS, JSON.stringify(formData));
    router.push('/training');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto animate-fade-in-up">
        <div className="card-modern">

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">A Little About You</h1>
            <p className="text-gray-600">Just a few quick questions before we start</p>
          </div>

          {/* ── Step indicator ───────────────────────────────────────────── */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">✓</div>
            <div className="w-12 h-1 bg-green-500 rounded" />
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">2</div>
            <div className="w-12 h-1 bg-gray-200 rounded" />
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold">3</div>
            <div className="w-12 h-1 bg-gray-200 rounded" />
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold">4</div>
          </div>

          <div className="space-y-6">

            {/* ── Age ────────────────────────────────────────────────────── */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                How old are you? <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={18}
                max={100}
                value={formData.age || ''}
                onChange={(e) => updateField('age', parseInt(e.target.value) || 0)}
                placeholder="Enter your age"
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.age
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
                style={{ color: '#111827', backgroundColor: errors.age ? undefined : '#ffffff' }}
              />
              {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
            </div>

            {/* ── Gender ─────────────────────────────────────────────────── */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                How do you identify? <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => updateField('gender', option.toLowerCase().replace(/ /g, '-'))}
                    className={`p-3 rounded-xl border-2 font-medium transition-all text-sm ${formData.gender === option.toLowerCase().replace(/ /g, '-')
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
            </div>

            {/* ── Education ──────────────────────────────────────────────── */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                What's your highest level of education? <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.education}
                onChange={(e) => updateField('education', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.education ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                style={{ color: '#111827', backgroundColor: '#ffffff' }}
              >
                <option value="">Select one…</option>
                <option value="high-school">High School</option>
                <option value="some-college">Some College</option>
                <option value="associates">Associate's Degree</option>
                <option value="bachelors">Bachelor's Degree</option>
                <option value="masters">Master's Degree</option>
                <option value="doctorate">PhD or Doctorate</option>
                <option value="other">Other</option>
              </select>
              {errors.education && <p className="text-red-500 text-sm mt-1">{errors.education}</p>}
            </div>

            {/* ── Vision ─────────────────────────────────────────────────── */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Do you wear glasses or contacts? <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { value: 'none', label: "No, I don't" },
                  { value: 'corrected', label: 'Yes, wearing now' },
                  { value: 'not-wearing', label: 'Yes, but not now' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateField('visionCorrection', option.value)}
                    className={`p-3 rounded-xl border-2 font-medium transition-all text-sm ${formData.visionCorrection === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {errors.visionCorrection && <p className="text-red-500 text-sm mt-1">{errors.visionCorrection}</p>}
            </div>

            {/* ── Color Vision ───────────────────────────────────────────── */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Do you have normal color vision? (No color blindness)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateField('colorVisionNormal', true)}
                  className={`p-3 rounded-xl border-2 font-medium transition-all ${formData.colorVisionNormal
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                >
                  ✓ Yes, normal vision
                </button>
                <button
                  type="button"
                  onClick={() => updateField('colorVisionNormal', false)}
                  className={`p-3 rounded-xl border-2 font-medium transition-all ${!formData.colorVisionNormal
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                >
                  Some color blindness
                </button>
              </div>
            </div>

            {/* ── Inspection Experience ──────────────────────────────────── */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Have you ever done visual inspection work before? <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { value: 'none', label: 'Never' },
                  { value: 'some', label: 'A little bit' },
                  { value: 'experienced', label: 'Yes, regularly' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateField('inspectionExperience', option.value)}
                    className={`p-3 rounded-xl border-2 font-medium transition-all ${formData.inspectionExperience === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {errors.inspectionExperience && <p className="text-red-500 text-sm mt-1">{errors.inspectionExperience}</p>}
            </div>

            {/* ── AI Experience ──────────────────────────────────────────── */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                How familiar are you with AI tools (like ChatGPT)? <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { value: 'none', label: 'Never used AI' },
                  { value: 'user', label: 'Used a few times' },
                  { value: 'advanced', label: 'Use AI regularly' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateField('aiExperience', option.value)}
                    className={`p-3 rounded-xl border-2 font-medium transition-all ${formData.aiExperience === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {errors.aiExperience && <p className="text-red-500 text-sm mt-1">{errors.aiExperience}</p>}
            </div>
          </div>

          {/* ── Submit ──────────────────────────────────────────────────── */}
          <button onClick={handleSubmit} className="w-full btn-hero mt-8">
            Continue to Training →
          </button>
        </div>
      </div>
    </div>
  );
}
