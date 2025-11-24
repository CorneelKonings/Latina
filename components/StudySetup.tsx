import React, { useState, useMemo, useEffect } from 'react';
import { LatinWord, MasteryLevel, StudyInputMode } from '../types';
import { Play, RotateCcw, X, AlertTriangle, CheckSquare, Layers, ListFilter, Target, Keyboard, Mic, GalleryVerticalEnd } from 'lucide-react';

interface StudySetupProps {
  words: LatinWord[];
  onStart: (words: LatinWord[], mode: StudyInputMode) => void;
  onCancel: () => void;
}

interface ChapterRange {
    startIndex: number;
    endIndex: number;
    label: string;
}

const StudySetup: React.FC<StudySetupProps> = ({ words, onStart, onCancel }) => {
  const [mode, setMode] = useState<'repetition' | 'specific'>('repetition');
  const [inputMode, setInputMode] = useState<StudyInputMode>('flashcard');
  
  // State for "Herhaling" (Advanced Range Mode 30 + Filters)
  const [repCaput, setRepCaput] = useState<number>(1);
  const [repScope, setRepScope] = useState<'whole' | 'range'>('whole');
  const [repRangeIndex, setRepRangeIndex] = useState<number>(0);
  const [repOnlyHard, setRepOnlyHard] = useState(false);

  // State for "Specifiek" (Range Mode 10)
  const [specCaput, setSpecCaput] = useState<number>(1);
  const [specRangeIndex, setSpecRangeIndex] = useState<number>(0);

  // 1. Robust Global Sort: Chapter then Numeric ID
  const sortedGlobalWords = useMemo(() => {
    return [...words].sort((a, b) => {
        // 1. Compare Chapter
        const chapA = Number(a.chapter);
        const chapB = Number(b.chapter);
        if (chapA !== chapB) return chapA - chapB;
        
        // 2. Compare Numeric ID suffix (e.g. c1-001 -> 1)
        const getNum = (id: string) => {
            // Try to find hyphenated number first: c1-001
            const match = id.match(/-(\d+)$/);
            if (match) return parseInt(match[1], 10);
            
            // Fallback: any sequence of digits at end
            const match2 = id.match(/(\d+)$/);
            return match2 ? parseInt(match2[1], 10) : 0;
        };
        
        const numA = getNum(a.id);
        const numB = getNum(b.id);
        if (numA !== numB) return numA - numB;
        
        // 3. Fallback string compare
        return a.id.localeCompare(b.id);
    });
  }, [words]);

  // Determine active chapter based on mode
  const activeCaput = mode === 'repetition' ? repCaput : specCaput;

  // 2. Get words ONLY for the active chapter (prevents overlap/shifting)
  const activeChapterWords = useMemo(() => {
      return sortedGlobalWords.filter(w => w.chapter === activeCaput);
  }, [sortedGlobalWords, activeCaput]);

  // 3. Generate Ranges relative to the CHAPTER list
  const generateRanges = (step: number): ChapterRange[] => {
      const ranges: ChapterRange[] = [];
      if (activeChapterWords.length === 0) return ranges;

      for (let i = 0; i < activeChapterWords.length; i += step) {
          const chunk = activeChapterWords.slice(i, i + step);
          if (chunk.length === 0) continue;

          const first = chunk[0];
          const last = chunk[chunk.length - 1];

          // Helper to get display ID (e.g. "1" from "c1-001")
          const getDisplayId = (word: LatinWord) => {
              const match = word.id.match(/-(\d+)$/);
              return match ? parseInt(match[1], 10) : null;
          };

          const startID = getDisplayId(first);
          const endID = getDisplayId(last);

          // If IDs are standard, use them. If not (user added), use relative index.
          const label = (startID !== null && endID !== null) 
              ? `${startID} - ${endID}` 
              : `${i + 1} - ${i + chunk.length}`;

          ranges.push({
              startIndex: i,
              endIndex: i + step,
              label: label
          });
      }
      return ranges;
  };

  const currentRanges = useMemo(() => {
      const step = mode === 'repetition' ? 30 : 10;
      return generateRanges(step);
  }, [activeChapterWords, mode]);

  // Validate range indices when chapter changes
  useEffect(() => {
      setRepRangeIndex(0);
      setSpecRangeIndex(0);
  }, [activeCaput, mode]);

  const handleStart = () => {
    let selection: LatinWord[] = [];

    if (mode === 'repetition') {
        if (repScope === 'whole') {
            selection = activeChapterWords;
        } else {
            const range = currentRanges[repRangeIndex];
            if (range) {
                selection = activeChapterWords.slice(range.startIndex, range.endIndex);
            }
        }

        if (repOnlyHard) {
            selection = selection.filter(w => w.srs.level <= MasteryLevel.Learning);
        }

        if (selection.length === 0) {
             alert(repOnlyHard 
                ? "Geen moeilijke woorden gevonden in deze selectie. Goed gedaan!" 
                : "Geen woorden gevonden.");
            return;
        }
    } else {
        // Specific Mode
        const range = currentRanges[specRangeIndex];
        if (range) {
             selection = activeChapterWords.slice(range.startIndex, range.endIndex);
        }
            
        if (selection.length === 0) {
             alert("Geen woorden gevonden in deze reeks.");
            return;
        }
    }

    onStart(selection, inputMode);
  };

  const availableChapters = useMemo(() => {
      const chapters = new Set(words.map(w => w.chapter));
      // Ensure 1-7 are always visible
      [1,2,3,4,5,6,7].forEach(c => chapters.add(c));
      return Array.from(chapters).sort((a: number, b: number) => a - b);
  }, [words]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-roman-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-roman-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-roman-100 flex justify-between items-center bg-roman-50">
          <h2 className="text-2xl font-serif text-roman-800 font-bold">Studie Opzet</h2>
          <button onClick={onCancel} className="text-roman-400 hover:text-roman-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          
          {/* Input Mode Selection */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-roman-500 uppercase mb-2">Studiemethode</label>
            <div className="bg-roman-100 p-1 rounded-xl flex">
                <button
                    onClick={() => setInputMode('flashcard')}
                    className={`flex-1 py-3 rounded-lg flex flex-col items-center gap-1 transition-all ${
                        inputMode === 'flashcard' ? 'bg-white shadow-sm text-roman-900' : 'text-roman-500 hover:text-roman-700'
                    }`}
                >
                    <GalleryVerticalEnd size={20} />
                    <span className="text-xs font-bold">Kaart</span>
                </button>
                 <button
                    onClick={() => setInputMode('typing')}
                    className={`flex-1 py-3 rounded-lg flex flex-col items-center gap-1 transition-all ${
                        inputMode === 'typing' ? 'bg-white shadow-sm text-roman-900' : 'text-roman-500 hover:text-roman-700'
                    }`}
                >
                    <Keyboard size={20} />
                    <span className="text-xs font-bold">Typen</span>
                </button>
                 <button
                    onClick={() => setInputMode('voice')}
                    className={`flex-1 py-3 rounded-lg flex flex-col items-center gap-1 transition-all ${
                        inputMode === 'voice' ? 'bg-white shadow-sm text-roman-900' : 'text-roman-500 hover:text-roman-700'
                    }`}
                >
                    <Mic size={20} />
                    <span className="text-xs font-bold">Spraak</span>
                </button>
            </div>
          </div>

          <div className="h-px bg-roman-100 mb-6"></div>

          {/* Mode Selection */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => setMode('repetition')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                mode === 'repetition' 
                  ? 'border-roman-500 bg-roman-50 text-roman-900' 
                  : 'border-roman-100 bg-white text-roman-400 hover:border-roman-300'
              }`}
            >
              <RotateCcw size={32} />
              <span className="font-bold text-sm uppercase tracking-wide">Herhaling</span>
            </button>
            <button
              onClick={() => setMode('specific')}
              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                mode === 'specific' 
                  ? 'border-roman-500 bg-roman-50 text-roman-900' 
                  : 'border-roman-100 bg-white text-roman-400 hover:border-roman-300'
              }`}
            >
              <Target size={32} />
              <span className="font-bold text-sm uppercase tracking-wide">Specifiek</span>
            </button>
          </div>

          {mode === 'repetition' ? (
            <div className="space-y-6 animate-in slide-in-from-left-4 fade-in">
              {/* Caput Selector */}
              <div>
                <label className="block text-xs font-bold text-roman-500 uppercase mb-2">Selecteer Caput</label>
                <div className="flex flex-wrap gap-2">
                  {availableChapters.map(num => (
                    <button
                      key={num}
                      onClick={() => setRepCaput(num)}
                      className={`w-10 h-10 rounded-lg font-serif font-bold transition-colors flex items-center justify-center ${
                        repCaput === num
                          ? 'bg-roman-600 text-white shadow-md'
                          : 'bg-roman-100 text-roman-600 hover:bg-roman-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scope Toggle */}
              <div className="bg-roman-100 p-1 rounded-lg flex">
                  <button 
                    onClick={() => setRepScope('whole')}
                    className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                        repScope === 'whole' ? 'bg-white text-roman-900 shadow-sm' : 'text-roman-500'
                    }`}
                  >
                      <Layers size={16} /> Volledig Caput
                  </button>
                  <button 
                    onClick={() => setRepScope('range')}
                    className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                        repScope === 'range' ? 'bg-white text-roman-900 shadow-sm' : 'text-roman-500'
                    }`}
                  >
                      <ListFilter size={16} /> Deel Selectie
                  </button>
              </div>

              {/* Range Selector (30) */}
              {repScope === 'range' && (
                  <div className="animate-in fade-in slide-in-from-top-1">
                     <label className="block text-xs font-bold text-roman-500 uppercase mb-2">
                         Kies Reeks (per 30)
                     </label>
                     <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto no-scrollbar">
                       {currentRanges.map((range, idx) => (
                          <button
                            key={idx}
                            onClick={() => setRepRangeIndex(idx)}
                            className={`py-2 px-3 rounded-lg text-sm font-bold border transition-all text-left ${
                                repRangeIndex === idx
                                 ? 'border-roman-500 bg-roman-50 text-roman-900'
                                 : 'border-roman-200 text-roman-500 hover:border-roman-400'
                            }`}
                          >
                              <span className="block">Woord {range.label}</span>
                          </button>
                       ))}
                       {currentRanges.length === 0 && <span className="text-sm text-roman-400 italic">Geen reeksen gevonden voor dit hoofdstuk.</span>}
                     </div>
                  </div>
              )}

              {/* Hard Filter */}
              <div 
                onClick={() => setRepOnlyHard(!repOnlyHard)}
                className={`p-3 rounded-lg border cursor-pointer flex items-center gap-3 transition-colors ${
                    repOnlyHard ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-white border-roman-200 text-roman-500'
                }`}
              >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${repOnlyHard ? 'bg-orange-500 border-orange-500' : 'border-roman-300'}`}>
                      {repOnlyHard && <CheckSquare size={14} className="text-white" />}
                  </div>
                  <div className="flex-1">
                      <span className="text-sm font-bold block">Alleen moeilijke woorden</span>
                      <span className="text-xs opacity-70">
                          {repScope === 'range' ? 'Binnen geselecteerde reeks' : 'Binnen hele caput'}
                      </span>
                  </div>
                  <AlertTriangle size={18} className={repOnlyHard ? 'text-orange-500' : 'text-roman-300'} />
              </div>

            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">
              <div className="bg-roman-50 p-4 rounded-lg border border-roman-100">
                  <p className="text-roman-700 text-sm italic">
                      Kies een hoofdstuk en een reeks van 10 woorden.
                  </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-roman-500 uppercase mb-2">Selecteer Caput</label>
                <div className="flex flex-wrap gap-2">
                  {availableChapters.map(num => (
                    <button
                      key={num}
                      onClick={() => setSpecCaput(num)}
                      className={`w-10 h-10 rounded-lg font-serif font-bold transition-colors flex items-center justify-center ${
                        specCaput === num
                          ? 'bg-roman-600 text-white shadow-md'
                          : 'bg-roman-100 text-roman-600 hover:bg-roman-200'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

               {/* Range Selector (10) */}
              <div className="animate-in fade-in slide-in-from-top-1">
                 <label className="block text-xs font-bold text-roman-500 uppercase mb-2">
                     Kies Reeks (per 10)
                 </label>
                 <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto no-scrollbar">
                   {currentRanges.map((range, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSpecRangeIndex(idx)}
                        className={`py-2 px-2 rounded-lg text-sm font-bold border transition-all flex flex-col items-center justify-center ${
                            specRangeIndex === idx
                             ? 'border-roman-500 bg-roman-50 text-roman-900'
                             : 'border-roman-200 text-roman-500 hover:border-roman-400'
                        }`}
                      >
                          <span>{range.label}</span>
                      </button>
                   ))}
                   {currentRanges.length === 0 && <span className="text-sm text-roman-400 italic">Geen reeksen gevonden.</span>}
                 </div>
              </div>

            </div>
          )}
        </div>

        <div className="p-6 border-t border-roman-100 bg-roman-50">
          <button
            onClick={handleStart}
            className="w-full py-4 bg-roman-800 text-gold-500 rounded-xl font-bold shadow-lg shadow-roman-900/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Play size={20} fill="currentColor" />
            Start Sessie
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudySetup;