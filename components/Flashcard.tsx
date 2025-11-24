import React, { useState, useEffect } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { LatinWord } from '../types';
import { RotateCcw, Check, X } from 'lucide-react';

interface FlashcardProps {
  word: LatinWord;
  onResult: (quality: number) => void;
  currentIndex?: number;
  totalCards?: number;
}

const Flashcard: React.FC<FlashcardProps> = ({ word, onResult, currentIndex, totalCards }) => {
  const [flipped, setFlipped] = useState(false);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const bg = useTransform(x, [-200, 0, 200], ["#fee2e2", "#ffffff", "#dcfce7"]); // Red tint left, Green tint right

  // Reset state when word changes
  useEffect(() => {
    setFlipped(false);
    x.set(0);
  }, [word]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 100) {
      onResult(4); // Known
    } else if (info.offset.x < -100) {
      onResult(1); // Unknown
    }
  };

  const handleFlip = () => {
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
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        onClick={handleFlip}
      >
        {/* Front - Latin Only */}
        <div 
            className="absolute w-full h-full backface-hidden bg-white rounded-2xl shadow-xl border-2 border-roman-200 flex flex-col items-center justify-center p-8 z-10"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(0deg)' }}
        >
            <div className="absolute top-6 left-6 text-roman-500 font-serif text-sm uppercase tracking-widest">
                Caput {word.chapter}
            </div>
             <div className="absolute top-6 right-6 text-roman-300 font-mono text-xs">
                 #{word.id.split('-')[1] || word.id}
            </div>
            
            <h2 className="text-5xl font-serif text-roman-900 mb-2 text-center font-bold tracking-tight">{word.latin}</h2>
            
            <div className="absolute bottom-6 text-xs text-roman-400 uppercase tracking-widest flex items-center gap-2">
                <RotateCcw size={14} /> Tik om te draaien
            </div>
        </div>

        {/* Back - Genitive/Gender + Translation */}
        <div 
            className="absolute w-full h-full backface-hidden bg-roman-50 rounded-2xl shadow-xl border-2 border-roman-200 flex flex-col items-center justify-center p-8"
            style={{ backfaceVisibility: 'hidden', transform: "rotateY(180deg)" }}
        >
             {/* Verb Stem Special Display */}
             {word.type === 'verb' && word.grammarNotes ? (
                <div className="mb-4 text-center">
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
            
             <div className="text-roman-400 font-serif text-xs uppercase tracking-widest mt-6">
                Vertaling
            </div>
        </div>
      </motion.div>

      {/* Swipe Indicators */}
      <div className="absolute top-1/2 -left-12 -translate-y-1/2 text-red-400 opacity-50 hidden md:block">
          <X size={40} />
      </div>
      <div className="absolute top-1/2 -right-12 -translate-y-1/2 text-green-400 opacity-50 hidden md:block">
          <Check size={40} />
      </div>

        {/* Buttons - Now visible on Landscape/PC as well */}
       <div className="absolute -bottom-24 left-0 right-0 flex justify-between px-4 z-50 pointer-events-auto landscape:-bottom-24 landscape:justify-around">
            <button 
                onClick={(e) => { e.stopPropagation(); onResult(1); }}
                className="flex items-center gap-2 px-6 py-4 bg-red-100 text-red-800 rounded-full shadow-lg border border-red-200 hover:bg-red-200 active:scale-95 transition-all"
            >
                <X size={24} /> Nog niet
            </button>
            <button 
                 onClick={(e) => { e.stopPropagation(); onResult(4); }}
                className="flex items-center gap-2 px-6 py-4 bg-green-100 text-green-800 rounded-full shadow-lg border border-green-200 hover:bg-green-200 active:scale-95 transition-all"
            >
                <Check size={24} /> Ik weet het
            </button>
        </div>
    </div>
  );
};

export default Flashcard;