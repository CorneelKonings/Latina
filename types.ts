export enum MasteryLevel {
  New = 0,
  Learning = 1,
  Reviewing = 2,
  Mastered = 3
}

export interface SRSData {
  easeFactor: number;
  interval: number; // in days
  repetitionCount: number;
  nextReviewDate: number; // timestamp
  level: MasteryLevel;
}

export interface LatinWord {
  id: string;
  latin: string;
  dutch: string;
  type: 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'conjunction' | 'pronoun' | 'other';
  chapter: number; // Caput 1-7
  gender?: 'm' | 'f' | 'n' | 'm/f';
  grammarNotes?: string;
  srs: SRSData;
}

export interface StudySessionResult {
  correct: number;
  incorrect: number;
  durationSeconds: number;
  timestamp: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export type ViewState = 'dashboard' | 'study' | 'dictionary' | 'add-word' | 'settings';

export type StudyInputMode = 'flashcard' | 'typing' | 'voice';