import React, { useState, useMemo } from 'react';
import { LatinWord, MasteryLevel } from '../types';
import { Play, RotateCcw, X, AlertTriangle, CheckSquare, Layers, ListFilter, Target } from 'lucide-react';

interface StudySetupProps {
  words: LatinWord[];
  onStart: (words: LatinWord[]) => void;
  onCancel: () => void;
}

// Helper to keep track of the global book number
interface WordWithIndex extends LatinWord {
    globalIndex: number;
}

const StudySetup: React.FC<StudySetupProps> = ({ words, onStart, onCancel }) => {
  const [mode, setMode] = useState<'repetition' | 'specific'>('repetition');
  
  // State for "Herhaling" (Advanced Range Mode 30 + Filters)
  const [repCaput, setRepCaput] = useState<number>(1);
  const [repScope, setRepScope] = useState<'whole' | 'range'>('whole');
  const [repRangeIndex, setRepRangeIndex] = useState<number>(0);
  const [repOnlyHard, setRepOnlyHard] = useState(false);

  // State for "Specifiek" (Range Mode 10)
  const [specCaput, setSpecCaput] = useState<number>(1);
  const [specRangeIndex, setSpecRangeIndex] = useState<number>(0);

  // 1. Calculate global order for all words to assign continuous book numbers (1, 2, ... N)
  const sortedGlobalWords = useMemo(() => {
    return [...words]
        .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
        .map((w, index) => ({ ...w, globalIndex: index + 1 }));
  }, [words]);

  // --- HERHALING DATA (Step 30) ---
  const repBaseWords = useMemo(() => {
      return sortedGlobalWords.filter(w => w.chapter === repCaput);
  }, [sortedGlobalWords, repCaput]);

  const repRanges = useMemo(() => {
    const r = [];
    if (repBaseWords.length === 0) return [];
    
    const step = 30;
    for (let i = 0; i < repBaseWords.length; i += step) {
      const chunk = repBaseWords.slice(i, i + step);
      const startNum = chunk[0].globalIndex;
      const endNum = chunk[chunk.length - 1].globalIndex;
      
      r.push({
        startIndex: i,
        endIndex: i + chunk.length,
        label: `${startNum} - ${endNum}`
      });
    }
    return r;
  }, [repBaseWords]);

  // --- SPECIFIEK DATA (Step 10) ---
  const specBaseWords = useMemo(() => {
      return sortedGlobalWords.filter(w => w.chapter === specCaput);
  }, [sortedGlobalWords, specCaput]);

  const specRanges = useMemo(() => {
    const r = [];
    if (specBaseWords.length === 0) return [];
    
    const step = 10;
    for (let i = 0; i < specBaseWords.length; i += step) {
      const chunk = specBaseWords.slice(i, i + step);
      const startNum = chunk[0].globalIndex;
      const endNum = chunk[chunk.length - 1].globalIndex;

      r.push({
        startIndex: i,
        endIndex: i + chunk.length,
        label: `${startNum} - ${endNum}`
      });
    }
    return r;
  }, [specBaseWords]);

  const handleStart = () => {
    let selection: LatinWord[] = [];

    if (mode === 'repetition') {
        if (repScope === 'whole') {
            selection = repBaseWords;
        } else {
            const range = repRanges[repRangeIndex];
            if (range) {
                // Slice from the filtered chapter list
                selection = repBaseWords.slice(range.startIndex, range.endIndex);
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
        // Specific Logic: Always ranges of 10
        const range = specRanges[specRangeIndex];
        if (range) {
            selection = specBaseWords.slice(range.startIndex, range.endIndex);
        }
            
        if (selection.length === 0) {
             alert("Geen woorden gevonden in deze reeks.");
            return;
        }
    }

    onStart(selection);
  };

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
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map(num => (
                    <button
                      key={num}
                      onClick={() => { setRepCaput(num); setRepRangeIndex(0); }}
                      className={`py-2 rounded-lg font-serif font-bold transition-colors ${
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
                       {repRanges.map((range, idx) => (
                          <button
                            key={idx}
                            onClick={() => setRepRangeIndex(idx)}
                            className={`py-2 px-3 rounded-lg text-sm font-bold border transition-all ${
                                repRangeIndex === idx
                                 ? 'border-roman-500 bg-roman-50 text-roman-900'
                                 : 'border-roman-200 text-roman-500 hover:border-roman-400'
                            }`}
                          >
                              {range.label}
                          </button>
                       ))}
                       {repRanges.length === 0 && <span className="text-sm text-roman-400 italic">Geen woorden gevonden.</span>}
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
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map(num => (
                    <button
                      key={num}
                      onClick={() => { setSpecCaput(num); setSpecRangeIndex(0); }}
                      className={`py-2 rounded-lg font-serif font-bold transition-colors ${
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
                   {specRanges.map((range, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSpecRangeIndex(idx)}
                        className={`py-2 px-2 rounded-lg text-sm font-bold border transition-all ${
                            specRangeIndex === idx
                             ? 'border-roman-500 bg-roman-50 text-roman-900'
                             : 'border-roman-200 text-roman-500 hover:border-roman-400'
                        }`}
                      >
                          {range.label}
                      </button>
                   ))}
                   {specRanges.length === 0 && <span className="text-sm text-roman-400 italic">Geen woorden gevonden.</span>}
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