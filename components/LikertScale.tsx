'use client';

import { useState } from 'react';

interface LikertScaleProps {
  question: string;
  description?: string;
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
  value: number | null;
  onChange: (value: number) => void;
  showNumbers?: boolean;
  midLabels?: { value: number; label: string }[];
}

export default function LikertScale({
  question,
  description,
  min,
  max,
  minLabel,
  maxLabel,
  value,
  onChange,
  showNumbers = true,
  midLabels = [],
}: LikertScaleProps) {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  
  const points = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  const getMidLabel = (point: number) => {
    const midLabel = midLabels.find((ml) => ml.value === point);
    return midLabel?.label;
  };

  return (
    <div className="w-full">
      {/* Question */}
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">{question}</h3>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>

      {/* Scale */}
      <div className="flex flex-col items-center">
        {/* Labels row */}
        <div className="w-full flex justify-between mb-2">
          <span className="text-sm text-gray-600 max-w-[120px] text-left">{minLabel}</span>
          <span className="text-sm text-gray-600 max-w-[120px] text-right">{maxLabel}</span>
        </div>

        {/* Points row */}
        <div className="flex justify-between w-full max-w-xl gap-1">
          {points.map((point) => {
            const isSelected = value === point;
            const isHovered = hoveredValue === point;
            const midLabel = getMidLabel(point);

            return (
              <div key={point} className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => onChange(point)}
                  onMouseEnter={() => setHoveredValue(point)}
                  onMouseLeave={() => setHoveredValue(null)}
                  className={`
                    w-10 h-10 rounded-full border-2 transition-all duration-150
                    flex items-center justify-center font-medium
                    ${isSelected
                      ? 'bg-primary-600 border-primary-600 text-white scale-110'
                      : isHovered
                        ? 'border-primary-400 bg-primary-50 text-primary-600'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }
                  `}
                  aria-label={`Select ${point}`}
                  aria-pressed={isSelected}
                >
                  {showNumbers && point}
                </button>
                {midLabel && (
                  <span className="text-xs text-gray-500 mt-1 text-center max-w-[60px]">
                    {midLabel}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected value indicator */}
        {value !== null && (
          <div className="mt-3 text-sm text-primary-600 font-medium">
            Selected: {value}
          </div>
        )}
      </div>
    </div>
  );
}

// NASA-TLX specific component with 21-point scale (0-100, step 5)
interface NasaTLXScaleProps {
  subscale: string;
  description: string;
  lowLabel: string;
  highLabel: string;
  value: number | null;
  onChange: (value: number) => void;
}

export function NasaTLXScale({
  subscale,
  description,
  lowLabel,
  highLabel,
  value,
  onChange,
}: NasaTLXScaleProps) {
  const points = Array.from({ length: 21 }, (_, i) => i * 5);

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">{subscale}</h3>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>

      <div className="flex flex-col items-center">
        <div className="w-full flex justify-between mb-2">
          <span className="text-sm text-gray-600">{lowLabel}</span>
          <span className="text-sm text-gray-600">{highLabel}</span>
        </div>

        {/* Slider-style scale */}
        <div className="w-full max-w-2xl">
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={value ?? 50}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer
                       accent-primary-600"
            aria-label={subscale}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            {[0, 25, 50, 75, 100].map((tick) => (
              <span key={tick}>{tick}</span>
            ))}
          </div>
        </div>

        {value !== null && (
          <div className="mt-2 text-sm text-primary-600 font-medium">
            Rating: {value}
          </div>
        )}
      </div>
    </div>
  );
}

// KSS specific component with descriptive labels
interface KSSScaleProps {
  value: number | null;
  onChange: (value: number) => void;
}

export function KSSScale({ value, onChange }: KSSScaleProps) {
  const kssItems = [
    { value: 1, label: 'Extremely alert' },
    { value: 2, label: 'Very alert' },
    { value: 3, label: 'Alert' },
    { value: 4, label: 'Rather alert' },
    { value: 5, label: 'Neither alert nor sleepy' },
    { value: 6, label: 'Some signs of sleepiness' },
    { value: 7, label: 'Sleepy, but no effort to stay awake' },
    { value: 8, label: 'Sleepy, some effort to stay awake' },
    { value: 9, label: 'Very sleepy, great effort to stay awake' },
  ];

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Karolinska Sleepiness Scale (KSS)
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Please indicate your current level of alertness/sleepiness
        </p>
      </div>

      <div className="space-y-2">
        {kssItems.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={`
              w-full p-3 rounded-lg border-2 text-left transition-all duration-150
              flex items-center gap-3
              ${value === item.value
                ? 'border-primary-600 bg-primary-50 text-primary-900'
                : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
              }
            `}
          >
            <span className={`
              w-8 h-8 rounded-full flex items-center justify-center font-bold
              ${value === item.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600'
              }
            `}>
              {item.value}
            </span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
