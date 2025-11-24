import React from 'react';
import { LatinWord } from '../types';
import { RotateCcw, Home, CheckCircle, XCircle } from 'lucide-react';

interface SessionResult {
  word: LatinWord;
  isCorrect: boolean;
}

interface SessionSummaryProps {
  results: SessionResult[];
  onRetry: () => void;
  onHome: () => void;
}

const SessionSummary: React.FC<SessionSummaryProps> = ({ results, onRetry, onHome }) => {
  const correctCount = results.filter(r => r.isCorrect).length;
  const total = results.length;
  const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const hasErrors = correctCount < total;

  return (
    <div className="flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto animate-in zoom-in-95 duration-300">
      <div className="bg-white rounded-3xl shadow-xl border border-roman-200 p-8 w-full text-center relative overflow-hidden">
         {/* Background decoration */}
         <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-roman-400 via-gold-500 to-roman-400"></div>

         <div className="mb-6 flex justify-center">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center border-8 ${percentage >= 80 ? 'border-green-100 bg-green-50 text-green-700' : percentage >= 50 ? 'border-yellow-100 bg-yellow-50 text-yellow-700' : 'border-red-100 bg-red-50 text-red-700'}`}>
                <div className="flex flex-col items-center">
                    <span className="text-4xl font-bold font-serif">{percentage}%</span>
                </div>
            </div>
         </div>

         <h2 className="text-3xl font-serif text-roman-900 font-bold mb-2">Sessie Voltooid!</h2>
         <p className="text-roman-500 mb-8">
             Je hebt <strong className="text-roman-800">{correctCount}</strong> van de <strong className="text-roman-800">{total}</strong> woorden juist.
         </p>

         <div className="space-y-3">
             {hasErrors && (
                 <button 
                    onClick={onRetry}
                    className="w-full py-4 bg-roman-800 text-gold-500 rounded-xl font-bold shadow-lg hover:bg-roman-900 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                 >
                     <RotateCcw size={20} /> Fouten Herhalen
                 </button>
             )}
             
             <button 
                onClick={onHome}
                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    !hasErrors 
                    ? 'bg-roman-800 text-gold-500 shadow-lg hover:bg-roman-900' 
                    : 'bg-white text-roman-600 border-2 border-roman-100 hover:border-roman-300'
                }`}
             >
                 <Home size={20} /> Naar Dashboard
             </button>
         </div>

         {/* Detailed List */}
         <div className="mt-8 text-left max-h-60 overflow-y-auto pr-2 no-scrollbar border-t border-roman-100 pt-4">
             <h3 className="text-xs font-bold text-roman-400 uppercase tracking-widest mb-3">Resultaten Overzicht</h3>
             <div className="space-y-2">
                 {results.map((res, idx) => (
                     <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border ${res.isCorrect ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                         <div>
                             <span className="font-bold text-roman-800 block">{res.word.latin}</span>
                             <span className="text-xs text-roman-500">{res.word.dutch}</span>
                         </div>
                         {res.isCorrect ? <CheckCircle size={18} className="text-green-500" /> : <XCircle size={18} className="text-red-500" />}
                     </div>
                 ))}
             </div>
         </div>
      </div>
    </div>
  );
};

export default SessionSummary;