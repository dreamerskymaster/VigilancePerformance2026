import type { ImageData, AIPrediction, DefectType, BoundingBox } from '@/types';
import { STUDY_CONFIG } from './constants';
import { shuffleArray } from './utils';

const DEFECT_CODES: DefectType[] = ['Cr', 'In', 'Pa', 'PS', 'RS', 'Sc'];

/**
 * Generate image metadata - flat file structure (e.g. Cr_001.jpg)
 */
export function generateImageData(): ImageData[] {
  const images: ImageData[] = [];

  // 90 defective images (15 per type × 6 types)
  DEFECT_CODES.forEach((defectType) => {
    for (let i = 1; i <= 15; i++) {
      const imageNum = i.toString().padStart(3, '0');
      images.push({
        id: `${defectType}_${imageNum}`,
        filename: `${defectType}_${imageNum}.jpg`,
        defectType,
        hasDefect: true,
        boundingBox: generateBoundingBox(),
      });
    }
  });

  // 90 non-defective images
  for (let i = 1; i <= 90; i++) {
    const imageNum = i.toString().padStart(3, '0');
    images.push({
      id: `none_${imageNum}`,
      filename: `none_${imageNum}.jpg`,
      defectType: 'none',
      hasDefect: false,
    });
  }

  return images;
}

/**
 * Generate a random bounding box as percentages (0–100) of image size.
 * Using percentages means the overlay always aligns with the image
 * regardless of the actual rendered pixel dimensions.
 */
function generateBoundingBox(): BoundingBox {
  // Width/height: 25–55% of the image
  const widthPct = 25 + Math.floor(Math.random() * 30);
  const heightPct = 20 + Math.floor(Math.random() * 30);
  // Keep the box fully inside the image
  const xPct = Math.floor(Math.random() * (100 - widthPct));
  const yPct = Math.floor(Math.random() * (100 - heightPct));
  return { x: xPct, y: yPct, width: widthPct, height: heightPct };
}

/**
 * Generate simulated AI predictions for a set of images based on configured accuracy rates.
 */
export function generateAIPredictions(images: ImageData[]): Map<string, AIPrediction> {
  const predictions = new Map<string, AIPrediction>();

  images.forEach((image) => {
    const isDefect = image.hasDefect;
    let aiPrediction: 'DEFECT' | 'NO_DEFECT';
    let isCorrect: boolean;

    if (isDefect) {
      isCorrect = Math.random() < STUDY_CONFIG.aiTPR;
      aiPrediction = isCorrect ? 'DEFECT' : 'NO_DEFECT';
    } else {
      isCorrect = Math.random() < STUDY_CONFIG.aiTNR;
      aiPrediction = isCorrect ? 'NO_DEFECT' : 'DEFECT';
    }

    const confidence = isCorrect
      ? 70 + Math.floor(Math.random() * 25)
      : 40 + Math.floor(Math.random() * 30);

    predictions.set(image.id, {
      imageId: image.id,
      prediction: aiPrediction,
      confidence,
      boundingBox: aiPrediction === 'DEFECT' ? (image.boundingBox || generateBoundingBox()) : undefined,
      isCorrect,
    });
  });

  return predictions;
}

// Module-level cache so images and predictions are stable within a session.
let cachedImages: ImageData[] | null = null;
let cachedPredictions: Map<string, AIPrediction> | null = null;

/** Return (or lazily create) the full set of 180 study images. */
export function getStudyImages(): ImageData[] {
  if (!cachedImages) {
    cachedImages = generateImageData();
  }
  return cachedImages;
}

/** Return (or lazily create) the AI prediction map. */
export function getAIPredictions(): Map<string, AIPrediction> {
  if (!cachedPredictions) {
    cachedPredictions = generateAIPredictions(getStudyImages());
  }
  return cachedPredictions;
}

/** Look up the AI prediction for a single image by ID. */
export function getAIPrediction(imageId: string): AIPrediction | undefined {
  return getAIPredictions().get(imageId);
}

/**
 * Build a balanced, shuffled trial order:
 * 30 defect + 30 non-defect images per block, across 3 blocks.
 */
export function generateTrialOrder(): ImageData[] {
  const images = getStudyImages();
  const defectImages = images.filter((img) => img.hasDefect);
  const nonDefectImages = images.filter((img) => !img.hasDefect);

  const shuffledDefects = shuffleArray(defectImages);
  const shuffledNonDefects = shuffleArray(nonDefectImages);

  const trialOrder: ImageData[] = [];

  for (let block = 0; block < 3; block++) {
    const blockDefects = shuffledDefects.slice(block * 30, (block + 1) * 30);
    const blockNonDefects = shuffledNonDefects.slice(block * 30, (block + 1) * 30);
    const blockImages = shuffleArray([...blockDefects, ...blockNonDefects]);
    trialOrder.push(...blockImages);
  }

  return trialOrder;
}

/**
 * Select a small balanced set of images for the training phase
 * (5 defect + 5 non-defect, shuffled).
 */
export function generateTrainingImages(): ImageData[] {
  const images = getStudyImages();
  const defectImages = images.filter((img) => img.hasDefect);
  const nonDefectImages = images.filter((img) => !img.hasDefect);

  const trainingImages = [
    ...shuffleArray(defectImages).slice(0, 5),
    ...shuffleArray(nonDefectImages).slice(0, 5),
  ];

  return shuffleArray(trainingImages);
}
