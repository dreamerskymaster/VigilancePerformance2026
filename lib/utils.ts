import { v4 as uuidv4 } from 'uuid';
import type { 
  Condition, 
  Trial, 
  TrialResult, 
  TimeBlock, 
  ResponseType,
  ImageData,
  AIPrediction 
} from '@/types';
import { STUDY_CONFIG, TIME_BLOCKS } from './constants';

/**
 * Generate a unique participant ID
 */
export function generateParticipantId(): string {
  return `P_${Date.now()}_${uuidv4().slice(0, 8)}`;
}

/**
 * Randomly assign participant to a condition
 */
export function assignCondition(): Condition {
  return Math.random() < 0.5 ? 'AI_ASSISTED' : 'UNASSISTED';
}

/**
 * Get the time block for a given trial number
 */
export function getTimeBlock(trialNumber: number): TimeBlock {
  if (trialNumber <= 60) return 1;
  if (trialNumber <= 120) return 2;
  return 3;
}

/**
 * Determine the response type based on ground truth and response
 */
export function getResponseType(
  isDefect: boolean,
  responseIsDefect: boolean
): ResponseType {
  if (isDefect && responseIsDefect) return 'HIT';
  if (isDefect && !responseIsDefect) return 'MISS';
  if (!isDefect && responseIsDefect) return 'FA';
  return 'CR';
}

/**
 * Calculate d' (d-prime) with log-linear correction for extreme values
 */
export function calculateDPrime(hitRate: number, falseAlarmRate: number): number {
  // Apply log-linear correction for extreme rates
  const correctedHR = Math.max(0.01, Math.min(0.99, hitRate));
  const correctedFAR = Math.max(0.01, Math.min(0.99, falseAlarmRate));
  
  // Convert to z-scores
  const zHR = zScore(correctedHR);
  const zFAR = zScore(correctedFAR);
  
  return zHR - zFAR;
}

/**
 * Calculate response criterion (c)
 */
export function calculateCriterion(hitRate: number, falseAlarmRate: number): number {
  const correctedHR = Math.max(0.01, Math.min(0.99, hitRate));
  const correctedFAR = Math.max(0.01, Math.min(0.99, falseAlarmRate));
  
  const zHR = zScore(correctedHR);
  const zFAR = zScore(correctedFAR);
  
  return -0.5 * (zHR + zFAR);
}

/**
 * Convert probability to z-score (inverse normal CDF)
 */
function zScore(p: number): number {
  // Approximation of inverse normal CDF (probit function)
  const a = [
    -3.969683028665376e1,
    2.209460984245205e2,
    -2.759285104469687e2,
    1.383577518672690e2,
    -3.066479806614716e1,
    2.506628277459239e0
  ];
  const b = [
    -5.447609879822406e1,
    1.615858368580409e2,
    -1.556989798598866e2,
    6.680131188771972e1,
    -1.328068155288572e1
  ];
  const c = [
    -7.784894002430293e-3,
    -3.223964580411365e-1,
    -2.400758277161838e0,
    -2.549732539343734e0,
    4.374664141464968e0,
    2.938163982698783e0
  ];
  const d = [
    7.784695709041462e-3,
    3.224671290700398e-1,
    2.445134137142996e0,
    3.754408661907416e0
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q, r;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
           ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
           (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
            ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
}

/**
 * Calculate trial results for a specific time block
 */
export function calculateTrialResults(
  trials: Trial[],
  participantId?: string,
  timeBlock?: TimeBlock
): TrialResult {
  const filteredTrials = timeBlock 
    ? trials.filter(t => t.timeBlock === timeBlock)
    : trials;

  const hits = filteredTrials.filter(t => t.responseType === 'HIT').length;
  const misses = filteredTrials.filter(t => t.responseType === 'MISS').length;
  const falseAlarms = filteredTrials.filter(t => t.responseType === 'FA').length;
  const correctRejections = filteredTrials.filter(t => t.responseType === 'CR').length;

  const totalSignals = hits + misses;
  const totalNoise = falseAlarms + correctRejections;

  const hitRate = totalSignals > 0 ? hits / totalSignals : 0;
  const falseAlarmRate = totalNoise > 0 ? falseAlarms / totalNoise : 0;

  const responseTimes = filteredTrials.map(t => t.responseTime);
  const meanRT = responseTimes.length > 0 
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
    : 0;

  return {
    participantId: participantId || '',
    timeBlock: timeBlock || 1,
    hits,
    misses,
    falseAlarms,
    correctRejections,
    hitRate,
    falseAlarmRate,
    dPrime: calculateDPrime(hitRate, falseAlarmRate),
    criterion: calculateCriterion(hitRate, falseAlarmRate),
    meanRT,
  };
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Format milliseconds to human-readable time
 */
export function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Format date to ISO string
 */
export function formatTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Check if browser meets minimum requirements
 */
export function checkBrowserRequirements(): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check screen resolution
  if (typeof window !== 'undefined') {
    if (window.innerWidth < STUDY_CONFIG.minDisplayResolution.width) {
      issues.push(`Screen width must be at least ${STUDY_CONFIG.minDisplayResolution.width}px`);
    }
    if (window.innerHeight < STUDY_CONFIG.minDisplayResolution.height) {
      issues.push(`Screen height must be at least ${STUDY_CONFIG.minDisplayResolution.height}px`);
    }
  }
  
  // Check for required browser features
  if (typeof performance === 'undefined' || typeof performance.now !== 'function') {
    issues.push('Browser does not support high-precision timing');
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Get high-precision timestamp
 */
export function getTimestamp(): number {
  return performance.now();
}

/**
 * Calculate response time in milliseconds
 */
export function calculateResponseTime(startTime: number): number {
  return Math.round(performance.now() - startTime);
}

/**
 * Local storage helpers with error handling
 */
export const storage = {
  get: <T>(key: string): T | null => {
    if (typeof window === 'undefined') return null;
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from sessionStorage: ${key}`, error);
      return null;
    }
  },
  
  set: <T>(key: string, value: T): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to sessionStorage: ${key}`, error);
      return false;
    }
  },
  
  remove: (key: string): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from sessionStorage: ${key}`, error);
      return false;
    }
  },
  
  clear: (): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      sessionStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing sessionStorage', error);
      return false;
    }
  },
};
