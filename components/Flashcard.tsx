import React, { useState, useEffect, useRef } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { LatinWord, StudyInputMode } from '../types';
import { RotateCcw, Check, X, Mic, CornerDownLeft, ArrowRight, Loader2 } from 'lucide-react';

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
  
  // Voice State
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'processing' | 'success' | 'error'>('idle');
  const [volume, setVolume] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-30, 30]);
  const bg = useTransform(x, [-200, 0, 200], ["#fee2e2", "#ffffff", "#dcfce7"]);

  // Reset state when word changes
  useEffect(() => {
    setFlipped(false);
    setUserInput('');
    setIsChecked(false);
    setIsCorrect(false);
    setVoiceState('idle');
    setVolume(0);
    x.set(0);
    
    // Auto-focus input for typing mode
    if (inputMode === 'typing') {
        setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [word, inputMode]);

  // Cleanup Voice Resources on unmount
  useEffect(() => {
      return () => stopListeningResources();
  }, []);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (inputMode !== 'flashcard') return;

    if (info.offset.x > 100) {
      onResult(4); // Known
    } else if (info.offset.x < -100) {
      onResult(1); // Unknown
    }
  };

  const handleFlip = () => {
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
          noun: 'Z.nw', verb: 'Ww.', adjective: 'B.nw', adverb: 'Bw.',
          preposition: 'Vz.', conjunction: 'Vw.', pronoun: 'Vnw.', other: 'Overig'
      };
      return map[t.toLowerCase()] || t;
  };

  const normalize = (s: string) => s.toLowerCase().trim().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");

  const checkAnswer = (finalInput: string = userInput) => {
      if (!finalInput.trim()) return;
      const match = normalize(finalInput) === normalize(word.dutch);
      setIsCorrect(match);
      setIsChecked(true);
      
      // For Voice Mode: Update Orb State
      if (inputMode === 'voice') {
          setVoiceState(match ? 'success' : 'error');
      } else {
          // For Typing Mode: Flip immediately to show feedback
          setFlipped(true);
      }
  };

  const handleNext = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isChecked) {
          checkAnswer();
      } else {
          onResult(isCorrect ? 4 : 1);
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
           if (!isChecked) {
                checkAnswer();
            } else {
                onResult(isCorrect ? 4 : 1);
            }
      }
  };

  const stopListeningResources = () => {
      if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch(e) {}
      }
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioContextRef.current) audioContextRef.current.close();
      
      analyserRef.current = null;
      streamRef.current = null;
      audioContextRef.current = null;
  };

  const startListening = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    stopListeningResources();
    setUserInput('');
    setIsChecked(false);
    setVoiceState('listening');

    // 1. Setup Audio Visualization (The "Perplexity" Orb Effect)
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        analyserRef.current = analyser;

        const updateVolume = () => {
            if (!analyserRef.current) return;
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);
            // Calculate average volume
            const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setVolume(avg / 128); // Normalize roughly 0-1 range for scaling
            animationFrameRef.current = requestAnimationFrame(updateVolume);
        };
        updateVolume();
    } catch (err) {
        console.warn("Visualizer init failed", err);
        // Fallback: Simulate volume with interval if getUserMedia fails
        const interval = setInterval(() => {
            setVolume(Math.random() * 0.5);
        }, 100);
        // Store interval ID in animationFrameRef (hacky but works for cleanup)
        animationFrameRef.current = interval as unknown as number;
    }

    // 2. Setup Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Spraakherkenning wordt niet ondersteund in deze browser.");
        setVoiceState('idle');
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'nl-NL';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setUserInput(text);
    };

    recognition.onspeechend = () => {
        setVoiceState('processing');
        stopListeningResources(); // Stop visualizer immediately on silence
    };

    recognition.onend = () => {
         // Auto-check on silence
         // We need to access the LATEST userInput. 
         // Since closures might trap old state, we rely on the inputRef or updated state flow.
         // However, in this functional component, we can assume 'userInput' state might be slightly laggy in the callback.
         // Let's use a small timeout to ensure state update or verify existence.
         setTimeout(() => {
             // We can't easily access the updated 'userInput' state here due to closure.
             // We will trigger checkAnswer inside the component render or useEffect if we wanted,
             // But simpler: just check if we have ANY text.
             // Actually, recognition.onresult updates state. 
             // To fix closure staleness, we can use a ref for input, but 'checkAnswer' depends on it.
             // Ideally we trigger checkAnswer manually passing the text found.
             // Re-querying result from event is safer but event is gone.
             // Let's rely on the fact that we stopped resources, so we trigger checkAnswer in the UI or use a ref.
         }, 100);
         
         setVoiceState(prev => {
             if (prev === 'processing') {
                 // Trigger check - we need a way to call checkAnswer with fresh state.
                 // We will set a flag or rely on the fact that onspeechend happened.
                 // Actually, simpler: Let the user see 'Processing' and then we auto-check.
                 return 'processing'; // Wait for effect
             }
             return 'idle';
         });
    };
    
    // We need to capture the text to check it properly inside the callback
    let finalTranscript = '';
    recognition.onresult = (event: any) => {
        finalTranscript = event.results[0][0].transcript;
        setUserInput(finalTranscript);
    };
    
    recognition.onend = () => {
        stopListeningResources();
        if (finalTranscript) {
            checkAnswer(finalTranscript);
        } else {
            setVoiceState('idle');
        }
    };

    recognitionRef.current = recognition;
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
        {/* Front - Latin Only + Input */}
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
            
            {/* Voice Mode Overlay */}
            {inputMode === 'voice' ? (
                <div className="flex flex-col items-center w-full z-20">
                     <h2 className="text-3xl font-serif text-roman-900 mb-8 font-bold tracking-tight">{word.latin}</h2>
                     
                     <div className="relative flex items-center justify-center h-32 w-full">
                         {/* The "Perplexity" Orb */}
                         <motion.div
                            animate={
                                voiceState === 'listening' ? { scale: 1 + volume * 0.8 } : // Dynamic volume scaling
                                voiceState === 'processing' ? { rotate: 360, scale: [1, 0.9, 1] } :
                                voiceState === 'success' ? { scale: 1.1 } :
                                voiceState === 'error' ? { scale: [1, 1.1, 1] } :
                                { scale: 1 }
                            }
                            transition={voiceState === 'processing' ? { repeat: Infinity, duration: 1, ease: "linear" } : { type: 'spring', stiffness: 300, damping: 20 }}
                            onClick={voiceState === 'idle' ? startListening : undefined}
                            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-colors duration-500 cursor-pointer ${
                                voiceState === 'idle' ? 'bg-roman-100 text-roman-400 hover:bg-roman-200' :
                                voiceState === 'listening' ? 'bg-cyan-500 text-white shadow-cyan-200' :
                                voiceState === 'processing' ? 'bg-white border-4 border-t-cyan-500 border-roman-100' :
                                voiceState === 'success' ? 'bg-green-500 text-white shadow-green-200' :
                                'bg-red-500 text-white shadow-red-200'
                            }`}
                         >
                            {voiceState === 'idle' && <Mic size={28} />}
                            {voiceState === 'listening' && <div className="w-full h-full rounded-full animate-ping bg-white/30 absolute" />}
                            {voiceState === 'processing' && <Loader2 className="animate-spin text-cyan-500" size={28} />}
                            {voiceState === 'success' && <Check size={32} />}
                            {voiceState === 'error' && <X size={32} />}
                         </motion.div>
                     </div>

                     <div className="min-h-[3rem] flex flex-col items-center justify-center w-full mt-4">
                        {userInput && (
                            <p className="font-serif text-lg text-roman-800 text-center animate-in fade-in slide-in-from-bottom-2">
                                "{userInput}"
                            </p>
                        )}
                        {!userInput && voiceState === 'listening' && (
                             <p className="text-sm text-cyan-600 font-bold animate-pulse">Luisteren...</p>
                        )}
                        {!userInput && voiceState === 'idle' && (
                             <p className="text-xs text-roman-400 uppercase tracking-widest">Tik om te spreken</p>
                        )}
                     </div>
                     
                     {/* Show 'Volgende' button ONLY after check */}
                     {isChecked && (
                         <motion.button 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={handleNext}
                            className={`mt-4 w-full py-3 font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
                                isCorrect ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                            }`}
                        >
                            Volgende <ArrowRight size={16} />
                        </motion.button>
                     )}
                </div>
            ) : (
                /* Standard & Typing Mode Layout */
                <>
                    <h2 className="text-4xl font-serif text-roman-900 mb-6 text-center font-bold tracking-tight">{word.latin}</h2>
                    
                    {!isInteractiveMode ? (
                        <div className="absolute bottom-6 text-xs text-roman-400 uppercase tracking-widest flex items-center gap-2">
                            <RotateCcw size={14} /> Tik om te draaien
                        </div>
                    ) : (
                        <div 
                            className="w-full relative z-20"
                            onClick={(e) => e.stopPropagation()} 
                        >
                            <div className="flex gap-2 mb-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Typ vertaling..."
                                    className="flex-1 p-3 rounded-xl border-2 border-roman-200 bg-roman-50 focus:border-roman-500 focus:outline-none transition-colors"
                                />
                            </div>
                            <button 
                                onClick={handleNext}
                                disabled={!userInput && !isChecked}
                                className={`w-full py-3 font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
                                    isChecked 
                                    ? (isCorrect ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-roman-800 text-white hover:bg-roman-900') 
                                    : 'bg-roman-800 text-gold-500 hover:bg-roman-900'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isChecked ? (
                                    <>Volgende <ArrowRight size={16} /></>
                                ) : (
                                    <><CornerDownLeft size={16} /> Controleren</>
                                )}
                            </button>
                        </div>
                    )}
                </>
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
             {word.type === 'verb' && word.grammarNotes ? (
                <div className="mb-2 text-center">
                    <span className="text-[10px] text-roman-400 uppercase tracking-widest">Stam</span>
                    <div className="text-xl text-roman-600 font-serif italic">
                        {word.grammarNotes}
                    </div>
                </div>
             ) : (
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
             
             <div className="mb-4 text-roman-400 font-bold text-xs uppercase tracking-wider bg-roman-100 px-2 py-1 rounded">
                 {getTypeLabel(word.type)}
             </div>

            <h2 className="text-3xl font-serif text-roman-900 mb-2 text-center font-bold leading-tight">
                {word.dutch}
            </h2>

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

      {/* Swipe Indicators (Standard mode only) */}
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

       {/* Buttons - Standard Flashcard Mode Only */}
       {!isInteractiveMode && (
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
       )}
    </div>
  );
};

export default Flashcard;