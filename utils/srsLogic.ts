import { SRSData, MasteryLevel } from '../types';

/**
 * Calculates the next SRS state based on user performance.
 * @param currentSRS The current SRS state of the card.
 * @param quality 0-5 scale (0=blackout, 3=pass, 5=perfect).
 */
export const calculateNextSRS = (currentSRS: SRSData, quality: number): SRSData => {
  let { easeFactor, interval, repetitionCount } = currentSRS;

  if (quality >= 3) {
    if (repetitionCount === 0) {
      interval = 1;
    } else if (repetitionCount === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitionCount += 1;
  } else {
    repetitionCount = 0;
    interval = 1;
  }

  // Update Ease Factor
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  // Determine Level for UI
  let level = MasteryLevel.New;
  if (repetitionCount === 0) level = MasteryLevel.New;
  else if (repetitionCount < 3) level = MasteryLevel.Learning;
  else if (repetitionCount < 5) level = MasteryLevel.Reviewing;
  else level = MasteryLevel.Mastered;

  const nextReviewDate = Date.now() + interval * 24 * 60 * 60 * 1000;

  return {
    easeFactor,
    interval,
    repetitionCount,
    nextReviewDate,
    level,
  };
};

export const getDueWords = (allWords: any[]) => {
    const now = Date.now();
    return allWords.filter(w => w.srs.nextReviewDate <= now).sort((a,b) => a.srs.nextReviewDate - b.srs.nextReviewDate);
}
