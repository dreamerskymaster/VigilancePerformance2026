'use client';

interface ProgressBarProps {
  current: number;
  total: number;
  showLabel?: boolean;
  showPercentage?: boolean;
  className?: string;
}

export default function ProgressBar({
  current,
  total,
  showLabel = true,
  showPercentage = false,
  className = '',
}: ProgressBarProps) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
          <span>
            Image {current} of {total}
          </span>
          {showPercentage && <span>{percentage}% complete</span>}
        </div>
      )}
      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
