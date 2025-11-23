import { LatinWord } from '../types';
import { INITIAL_VOCABULARY } from '../data/vocabulary';

const BASE_KEY = 'via_latina_data_';

const getStorageKey = (userId: string) => `${BASE_KEY}${userId}`;

export const loadWords = (userId: string): LatinWord[] => {
  if (!userId) return INITIAL_VOCABULARY;
  
  const key = getStorageKey(userId);
  const stored = localStorage.getItem(key);
  
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse local storage", e);
    }
  }
  return INITIAL_VOCABULARY;
};

export const saveWords = (userId: string, words: LatinWord[]) => {
  if (!userId) return;
  const key = getStorageKey(userId);
  localStorage.setItem(key, JSON.stringify(words));
};

export const resetProgress = (userId: string) => {
    if (!userId) return;
    const key = getStorageKey(userId);
    localStorage.removeItem(key);
    window.location.reload();
}