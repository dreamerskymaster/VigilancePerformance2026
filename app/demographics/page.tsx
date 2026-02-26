'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/utils';
import { STORAGE_KEYS } from '@/lib/constants';
import type { Demographics } from '@/types';

export default function DemographicsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    // Check if participant has consented
    const participantId = storage.get(STORAGE_KEYS.PARTICIPANT_ID);
    if (!participantId) {
      router.push('/consent');
      return;
    }
    setIsLoading(false);
  }, [router]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.age || formData.age < 18 || formData.age > 100) {
      newErrors.age = 'Please enter a valid age (18-100)';
    }
    if (!formData.gender) {
      newErrors.gender = 'Please select your gender';
    }
    if (!formData.education) {
      newErrors.education = 'Please select your education level';
    }
    if (!formData.visionCorrection) {
      newErrors.visionCorrection = 'Please select your vision correction status';
    }
    if (!formData.inspectionExperience) {
      newErrors.inspectionExperience = 'Please select your inspection experience level';
    }
    if (!formData.aiExperience) {
      newErrors.aiExperience = 'Please select your AI experience level';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Store demographics
      storage.set(STORAGE_KEYS.DEMOGRAPHICS, JSON.stringify(formData));

      // Navigate to training
      router.push('/training');
    } catch (error) {
      console.error('Error saving demographics:', error);
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof Demographics, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
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
      <div className="max-w-2xl mx-auto">
        <div className="card">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Participant Information
            </h1>
            <p className="text-gray-600">
              Please complete the following demographic questionnaire
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Age */}
            <div>
              <label className="form-label">Age *</label>
              <input
                type="number"
                min={18}
                max={100}
                value={formData.age || ''}
                onChange={(e) => updateField('age', parseInt(e.target.value) || 0)}
                className={`form-input ${errors.age ? 'border-red-500' : ''}`}
                placeholder="Enter your age"
              />
              {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
            </div>

            {/* Gender */}
            <div>
              <label className="form-label">Gender *</label>
              <select
                value={formData.gender}
                onChange={(e) => updateField('gender', e.target.value)}
                className={`form-select ${errors.gender ? 'border-red-500' : ''}`}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
            </div>

            {/* Education */}
            <div>
              <label className="form-label">Highest Level of Education *</label>
              <select
                value={formData.education}
                onChange={(e) => updateField('education', e.target.value)}
                className={`form-select ${errors.education ? 'border-red-500' : ''}`}
              >
                <option value="">Select education level</option>
                <option value="high-school">High school diploma or equivalent</option>
                <option value="some-college">Some college</option>
                <option value="associates">Associate's degree</option>
                <option value="bachelors">Bachelor's degree</option>
                <option value="masters">Master's degree</option>
                <option value="doctorate">Doctoral degree</option>
                <option value="other">Other</option>
              </select>
              {errors.education && <p className="text-red-500 text-sm mt-1">{errors.education}</p>}
            </div>

            {/* Vision correction */}
            <div>
              <label className="form-label">Vision Correction *</label>
              <select
                value={formData.visionCorrection}
                onChange={(e) => updateField('visionCorrection', e.target.value)}
                className={`form-select ${errors.visionCorrection ? 'border-red-500' : ''}`}
              >
                <option value="">Select your vision status</option>
                <option value="none">No correction needed</option>
                <option value="glasses">Glasses (wearing now)</option>
                <option value="contacts">Contact lenses (wearing now)</option>
                <option value="corrective-surgery">Corrective surgery (LASIK, etc.)</option>
                <option value="not-wearing">Need correction but not wearing</option>
              </select>
              {errors.visionCorrection && (
                <p className="text-red-500 text-sm mt-1">{errors.visionCorrection}</p>
              )}
            </div>

            {/* Color vision */}
            <div>
              <label className="form-label">Color Vision</label>
              <div className="flex gap-6 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="colorVision"
                    checked={formData.colorVisionNormal === true}
                    onChange={() => updateField('colorVisionNormal', true)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-gray-700">Normal color vision</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="colorVision"
                    checked={formData.colorVisionNormal === false}
                    onChange={() => updateField('colorVisionNormal', false)}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-gray-700">Color vision deficiency</span>
                </label>
              </div>
            </div>

            {/* Inspection experience */}
            <div>
              <label className="form-label">
                Experience with Visual Inspection Tasks *
              </label>
              <select
                value={formData.inspectionExperience}
                onChange={(e) => updateField('inspectionExperience', e.target.value)}
                className={`form-select ${errors.inspectionExperience ? 'border-red-500' : ''}`}
              >
                <option value="">Select experience level</option>
                <option value="none">No experience</option>
                <option value="minimal">Minimal (less than 1 month)</option>
                <option value="some">Some (1-6 months)</option>
                <option value="moderate">Moderate (6 months - 2 years)</option>
                <option value="extensive">Extensive (2+ years)</option>
              </select>
              {errors.inspectionExperience && (
                <p className="text-red-500 text-sm mt-1">{errors.inspectionExperience}</p>
              )}
            </div>

            {/* AI experience */}
            <div>
              <label className="form-label">
                Experience with AI/Machine Learning Tools *
              </label>
              <select
                value={formData.aiExperience}
                onChange={(e) => updateField('aiExperience', e.target.value)}
                className={`form-select ${errors.aiExperience ? 'border-red-500' : ''}`}
              >
                <option value="">Select experience level</option>
                <option value="none">No experience</option>
                <option value="user">User (I use AI tools like ChatGPT, etc.)</option>
                <option value="intermediate">Intermediate (some technical understanding)</option>
                <option value="advanced">Advanced (developer/researcher)</option>
              </select>
              {errors.aiExperience && (
                <p className="text-red-500 text-sm mt-1">{errors.aiExperience}</p>
              )}
            </div>

            {/* Submit button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary w-full"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving...
                  </span>
                ) : (
                  'Continue to Training'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
