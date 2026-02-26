// Type definitions for Vigilance Study

export type Condition = 'AI_ASSISTED' | 'UNASSISTED';
export type DefectType = 'Cr' | 'In' | 'Pa' | 'PS' | 'RS' | 'Sc' | 'none';
export type ResponseType = 'HIT' | 'MISS' | 'FA' | 'CR';
export type TimeBlock = 1 | 2 | 3;

export interface Demographics {
  age: number;
  gender: string;
  education: string;
  visionCorrection: string;
  colorVisionNormal: boolean;
  inspectionExperience: string;
  aiExperience: string;
}

export interface NasaTLXScores {
  mentalDemand: number | null;
  physicalDemand: number | null;
  temporalDemand: number | null;
  performance: number | null;
  effort: number | null;
  frustration: number | null;
}

export interface AITrustScores {
  reliability: number | null;
  trust: number | null;
  reliance: number | null;
  confidence: number | null;
  helpfulness: number | null;
}

export interface ImageData {
  id: string;
  filename: string;
  defectType: DefectType;
  hasDefect: boolean;
  boundingBox?: BoundingBox;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AIPrediction {
  imageId: string;
  prediction: 'DEFECT' | 'NO_DEFECT';
  confidence: number;
  boundingBox?: BoundingBox;
  isCorrect: boolean;
}

export interface Trial {
  trialNumber: number;
  imageId: string;
  defectType: DefectType;
  participantResponse: boolean;
  responseType: ResponseType;
  responseTime: number;
  timestamp: string;
  timeBlock: TimeBlock;
  aiPrediction?: AIPrediction;
}

export interface TrialResult {
  participantId: string;
  timeBlock: TimeBlock;
  hits: number;
  misses: number;
  falseAlarms: number;
  correctRejections: number;
  hitRate: number;
  falseAlarmRate: number;
  dPrime: number;
  criterion: number;
  meanRT: number;
}

export interface StudyConfig {
  totalImages: number;
  imagesPerBlock: number;
  defectPrevalence: number;
  aiAccuracy: number;
  aiTPR: number;
  aiTNR: number;
  trainingImages: number;
  minDisplayResolution: { width: number; height: number };
}

export interface Participant {
  id: string;
  condition: Condition;
  demographics?: Demographics;
  preKSS?: number;
  postKSS?: number;
  nasaTLX?: NasaTLXScores;
  aiTrust?: AITrustScores;
}

export interface SessionState {
  participantId: string | null;
  condition: Condition | null;
  currentPhase: string;
  currentTrial: number;
  startTime: number | null;
}
