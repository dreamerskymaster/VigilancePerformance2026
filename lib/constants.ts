import type { StudyConfig, DefectType } from '@/types';

// Study Configuration
export const STUDY_CONFIG: StudyConfig = {
  totalImages: 90,
  imagesPerBlock: 30,
  defectPrevalence: 0.5,
  aiAccuracy: 0.85,
  aiTPR: 0.88,
  aiTNR: 0.82,
  trainingImages: 10,
  minDisplayResolution: { width: 1024, height: 768 },
};

// Defect types - use fullName for display
export const DEFECT_TYPES: Record<DefectType, { fullName: string; description: string }> = {
  Cr: { fullName: 'Crazing', description: 'Fine network of tiny cracks on the surface, like dried mud' },
  In: { fullName: 'Inclusion', description: 'Small bits of foreign material stuck in the metal' },
  Pa: { fullName: 'Patches', description: 'Uneven, discolored spots or areas' },
  PS: { fullName: 'Pitted Surface', description: 'Small holes or dents in the surface' },
  RS: { fullName: 'Rolled-in Scale', description: 'Flaky oxide material pressed into the metal' },
  Sc: { fullName: 'Scratches', description: 'Thin lines or marks scratched into the surface' },
  none: { fullName: 'No Defect', description: 'Clean surface with no visible problems' },
};

// KSS Scale - simplified descriptions
export const KSS_SCALE = [
  { value: 1, label: 'Extremely alert - Wide awake, full of energy' },
  { value: 2, label: 'Very alert - Feeling sharp and focused' },
  { value: 3, label: 'Alert - Normal, awake state' },
  { value: 4, label: 'Rather alert - Mostly awake' },
  { value: 5, label: 'Neither alert nor sleepy - In between' },
  { value: 6, label: 'Some sleepiness - Starting to feel tired' },
  { value: 7, label: 'Sleepy - Tired but can stay awake easily' },
  { value: 8, label: 'Very sleepy - Hard to stay awake' },
  { value: 9, label: 'Extremely sleepy - Fighting to stay awake' },
];

// NASA-TLX Subscales - as object for Object.entries() usage
export const NASA_TLX_SUBSCALES: Record<string, { name: string; description: string; lowLabel: string; highLabel: string }> = {
  mentalDemand: {
    name: 'Mental Effort',
    description: 'How much thinking and concentration did this task need?',
    lowLabel: 'Very Easy',
    highLabel: 'Very Hard',
  },
  physicalDemand: {
    name: 'Physical Effort',
    description: 'How much physical activity did this task need (clicking, looking)?',
    lowLabel: 'Very Easy',
    highLabel: 'Very Hard',
  },
  temporalDemand: {
    name: 'Time Pressure',
    description: 'How rushed or hurried did you feel?',
    lowLabel: 'No Rush',
    highLabel: 'Very Rushed',
  },
  performance: {
    name: 'Your Performance',
    description: 'How well do you think you did on this task?',
    lowLabel: 'Perfect',
    highLabel: 'Failed',
  },
  effort: {
    name: 'Overall Effort',
    description: 'How hard did you have to work to do well?',
    lowLabel: 'No Effort',
    highLabel: 'Maximum Effort',
  },
  frustration: {
    name: 'Frustration Level',
    description: 'How annoyed, stressed, or irritated did you feel?',
    lowLabel: 'Not At All',
    highLabel: 'Extremely',
  },
};

// AI Trust Questions - as object
export const AI_TRUST_QUESTIONS: Record<string, { question: string }> = {
  reliability: { question: 'The AI helper was reliable and usually correct.' },
  trust: { question: 'I trusted the AI to help me make good decisions.' },
  reliance: { question: 'I depended on the AI when making my choices.' },
  confidence: { question: 'The AI made me more confident in my answers.' },
  helpfulness: { question: 'The AI was helpful for completing this task.' },
};

// Time blocks
export const TIME_BLOCKS: Record<number, { start: number; end: number; label: string }> = {
  1: { start: 1, end: 30, label: 'First 7 minutes' },
  2: { start: 31, end: 60, label: 'Middle 7 minutes' },
  3: { start: 61, end: 90, label: 'Last 7 minutes' },
};

// ALL Storage Keys - COMPLETE LIST
export const STORAGE_KEYS = {
  PARTICIPANT_ID: 'vigilance_participant_id',
  CONDITION: 'vigilance_condition',
  SESSION_STATE: 'vigilance_session_state',
  TRIALS: 'vigilance_trials',
  CONSENT_TIMESTAMP: 'vigilance_consent_timestamp',
  DEMOGRAPHICS: 'vigilance_demographics',
  TRAINING_COMPLETE: 'vigilance_training_complete',
  PRE_KSS: 'vigilance_pre_kss',
  POST_KSS: 'vigilance_post_kss',
  NASA_TLX: 'vigilance_nasa_tlx',
  AI_TRUST: 'vigilance_ai_trust',
  TASK_END_TIME: 'vigilance_task_end_time',
  TASK_START_TIME: 'vigilance_task_start_time',
};
