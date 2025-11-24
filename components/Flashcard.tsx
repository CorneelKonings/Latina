import React, { useState, useEffect, useRef } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { LatinWord, StudyInputMode } from '../types';
import { RotateCcw, Check, X, Mic, Keyboard, CornerDownLeft } from 'lucide-react';

interface FlashcardProps {
  word: LatinWord;
  onResult: (quality: number) => void;
  currentIndex?: number;
  totalCards?: number;
  inputMode?: StudyInputMode;
}

const Flashcard: React.FC<FlashcardProps> = ({ word, onResult, currentIndex, totalCards, inputMode = 'flashcard' }) => {
  const [flipped, setFlipped] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const bg = useTransform(x, [-200, 0, 200], ["#fee2e2", "#ffffff", "#dcfce7"]); // Red tint left, Green tint right

  // Reset state when word changes
  useEffect(() => {
    setFlipped(false);
    setUserInput('');
    setIsChecked(false);
    setIsCorrect(false);
    x.set(0);
    
    // Auto-focus input for typing mode
    if (inputMode === 'typing') {
        setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [word, inputMode]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    // Disable drag for typing/voice modes to force input
    if (inputMode !== 'flashcard') return;

    if (info.offset.x > 100) {
      onResult(4); // Known
    } else if (info.offset.x < -100) {
      onResult(1); // Unknown
    }
  };

  const handleFlip = () => {
      // Disable manual flip for typing/voice modes unless checked
      if (inputMode !== 'flashcard' && !isChecked) return;
      setFlipped(!flipped);
  };

  const getGenderLabel = (g?: string) => {
      if (!g) return null;
      if (g.toLowerCase() === 'f') return 'v';
      if (g.toLowerCase() === 'n') return 'o';
      if (g.toLowerCase() === 'm/f') return 'm/v';
      return g;
  };

  const getTypeLabel = (t: string) => {
      const map: Record<string, string> = {
          noun: 'Z.nw',
          verb: 'Ww.',
          adjective: 'B.nw',
          adverb: 'Bw.',
          preposition: 'Vz.',
          conjunction: 'Vw.',
          pronoun: 'Vnw.',
          other: 'Overig'
      };
      return map[t.toLowerCase()] || t;
  };

  const normalize = (s: string) => s.toLowerCase().trim().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");

  const checkAnswer = () => {
      if (!userInput.trim()) return;
      const match = normalize(userInput) === normalize(word.dutch);
      setIsCorrect(match);
      setIsChecked(true);
      setFlipped(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          checkAnswer();
      }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Spraakherkenning wordt niet ondersteund in deze browser.");
        return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'nl-NL';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setUserInput(text);
    };
    recognition.start();
  };

  const isInteractiveMode = inputMode !== 'flashcard';

  return (
    <div className="relative w-full max-w-sm h-96 landscape:h-72 landscape:w-96 perspective-1000 group">
      {/* Progress Indicator */}
      {totalCards && (
          <div className="absolute -top-6 left-0 right-0 flex justify-center gap-1 landscape:hidden">
              {Array.from({length: totalCards}).map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        i === currentIndex ? 'bg-roman-800 scale-y-150' : 
                        i < (currentIndex || 0) ? 'bg-roman-300' : 'bg-roman-100'
                    }`} 
                  />
              ))}
          </div>
      )}

      <motion.div
        className="w-full h-full relative preserve-3d cursor-pointer"
        style={{ x, rotate, backgroundColor: bg, transformStyle: "preserve-3d" }}
        drag={!isInteractiveMode ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        onClick={handleFlip}
      >
        {/* Front - Latin Only + Input if needed */}
        <div 
            className="absolute w-full h-full backface-hidden bg-white rounded-2xl shadow-xl border-2 border-roman-200 flex flex-col items-center justify-center p-6 z-10"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(0deg)' }}
        >
            <div className="absolute top-6 left-6 text-roman-500 font-serif text-sm uppercase tracking-widest">
                Caput {word.chapter}
            </div>
             <div className="absolute top-6 right-6 text-roman-300 font-mono text-xs">
                 #{word.id.split('-')[1] || word.id}
            </div>
            
            <h2 className="text-4xl font-serif text-roman-900 mb-6 text-center font-bold tracking-tight">{word.latin}</h2>
            
            {!isInteractiveMode ? (
                <div className="absolute bottom-6 text-xs text-roman-400 uppercase tracking-widest flex items-center gap-2">
                    <RotateCcw size={14} /> Tik om te draaien
                </div>
            ) : (
                <div 
                    className="w-full relative z-20"
                    onClick={(e) => e.stopPropagation()} // Prevent flip on click
                >
                    <div className="flex gap-2 mb-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={inputMode === 'typing' ? "Typ vertaling..." : "Zeg vertaling..."}
                            className="flex-1 p-3 rounded-xl border-2 border-roman-200 bg-roman-50 focus:border-roman-500 focus:outline-none transition-colors"
                        />
                        {inputMode === 'voice' && (
                            <button
                                onClick={startListening}
                                className={`p-3 rounded-xl border-2 transition-all ${
                                    isListening 
                                    ? 'bg-red-500 border-red-500 text-white animate-pulse' 
                                    : 'border-roman-200 bg-white text-roman-500'
                                }`}
                            >
                                <Mic size={20} />
                            </button>
                        )}
                    </div>
                    <button 
                        onClick={checkAnswer}
                        disabled={!userInput}
                        className="w-full py-3 bg-roman-800 text-gold-500 font-bold rounded-xl shadow-md hover:bg-roman-900 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <CornerDownLeft size={16} /> Controleren
                    </button>
                </div>
            )}
        </div>

        {/* Back - Genitive/Gender + Translation */}
        <div 
            className={`absolute w-full h-full backface-hidden rounded-2xl shadow-xl border-2 flex flex-col items-center justify-center p-8 ${
                isInteractiveMode && isChecked 
                ? (isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')
                : 'bg-roman-50 border-roman-200'
            }`}
            style={{ backfaceVisibility: 'hidden', transform: "rotateY(180deg)" }}
        >
             {/* Verb Stem Special Display */}
             {word.type === 'verb' && word.grammarNotes ? (
                <div className="mb-2 text-center">
                    <span className="text-[10px] text-roman-400 uppercase tracking-widest">Stam</span>
                    <div className="text-xl text-roman-600 font-serif italic">
                        {word.grammarNotes}
                    </div>
                </div>
             ) : (
                 /* Noun/Adjective Display */
                 <div className="flex items-center gap-3 mb-2">
                     {word.grammarNotes && (
                         <span className="text-xl text-roman-600 font-serif italic">
                             {word.grammarNotes}
                         </span>
                     )}
                     {word.gender && (
                         <span className="w-8 h-8 flex items-center justify-center bg-roman-800 text-gold-500 rounded-full text-lg font-bold uppercase">
                            {getGenderLabel(word.gender)}
                        </span>
                     )}
                 </div>
             )}
             
             {/* Word Type Abbreviation */}
             <div className="mb-4 text-roman-400 font-bold text-xs uppercase tracking-wider bg-roman-100 px-2 py-1 rounded">
                 {getTypeLabel(word.type)}
             </div>

            {/* Dutch Translation */}
            <h2 className="text-3xl font-serif text-roman-900 mb-2 text-center font-bold leading-tight">
                {word.dutch}
            </h2>

            {/* User Answer Feedback */}
            {isInteractiveMode && isChecked && (
                 <div className={`mt-4 p-2 rounded w-full text-center ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    <span className="text-xs uppercase font-bold block mb-1">Jouw antwoord</span>
                    <span className="font-serif text-lg">{userInput}</span>
                 </div>
            )}
            
             <div className="text-roman-400 font-serif text-xs uppercase tracking-widest mt-auto">
                {isInteractiveMode && !isCorrect ? 'Correctie' : 'Vertaling'}
            </div>
        </div>
      </motion.div>

      {/* Swipe Indicators (Only standard mode) */}
      {!isInteractiveMode && (
          <>
            <div className="absolute top-1/2 -left-12 -translate-y-1/2 text-red-400 opacity-50 hidden md:block">
                <X size={40} />
            </div>
            <div className="absolute top-1/2 -right-12 -translate-y-1/2 text-green-400 opacity-50 hidden md:block">
                <Check size={40} />
            </div>
          </>
      )}

        {/* Buttons - Logic changes based on mode */}
       <div className="absolute -bottom-24 left-0 right-0 flex justify-between px-4 z-50 pointer-events-auto landscape:-bottom-24 landscape:justify-around">
            {/* 
               In standard mode: always visible.
               In interactive mode: only visible after check.
            */}
            {(!isInteractiveMode || isChecked) && (
                <>
                     <button 
                        onClick={(e) => { e.stopPropagation(); onResult(1); }}
                        className="flex items-center gap-2 px-6 py-4 bg-red-100 text-red-800 rounded-full shadow-lg border border-red-200 hover:bg-red-200 active:scale-95 transition-all"
                    >
                        <X size={24} /> Nog niet
                    </button>
                    <button 
                         onClick={(e) => { e.stopPropagation(); onResult(4); }}
                        className={`flex items-center gap-2 px-6 py-4 rounded-full shadow-lg border transition-all active:scale-95 ${
                            // Highlight "Good" if auto-checked correctly
                            isInteractiveMode && isCorrect 
                            ? 'bg-green-600 text-white border-green-700 ring-4 ring-green-200' 
                            : 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
                        }`}
                    >
                        <Check size={24} /> Ik weet het
                    </button>
                </>
            )}
        </div>
    </div>
  );
};

export default Flashcard;