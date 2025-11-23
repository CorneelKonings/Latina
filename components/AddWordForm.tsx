import React, { useState, useEffect } from 'react';
import { translateLatinWord } from '../services/geminiService';
import { LatinWord, MasteryLevel } from '../types';
import { Loader2, Plus, Sparkles, AlertCircle } from 'lucide-react';

interface AddWordFormProps {
  onAdd: (word: LatinWord) => void;
}

const AddWordForm: React.FC<AddWordFormProps> = ({ onAdd }) => {
  const [latin, setLatin] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Debounced translation effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (latin.trim().length > 1) {
        handleTranslate();
      } else {
          setResult(null);
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(timer);
  }, [latin]);

  const handleTranslate = async () => {
    if (!latin) return;
    setLoading(true);
    const data = await translateLatinWord(latin);
    setResult(data);
    setLoading(false);
  };

  const handleSave = () => {
    if (!result || !result.success) return;
    const newWord: LatinWord = {
      id: Date.now().toString(),
      latin: latin,
      dutch: result.dutch,
      type: (result.type?.toLowerCase() as any) || 'other',
      chapter: 8, // User added words go to 'Extra' caput
      gender: result.gender,
      grammarNotes: result.grammarNotes,
      srs: {
        easeFactor: 2.5,
        interval: 0,
        repetitionCount: 0,
        nextReviewDate: Date.now(),
        level: MasteryLevel.New
      }
    };
    onAdd(newWord);
    setLatin('');
    setResult(null);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-roman-100">
      <h2 className="text-xl font-serif text-roman-800 mb-4 flex items-center gap-2">
        <Plus size={20} /> Nieuw Woord
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-roman-500 uppercase mb-1">Latijn</label>
          <div className="flex gap-2 relative">
            <input
              type="text"
              value={latin}
              onChange={(e) => setLatin(e.target.value)}
              className="flex-1 p-3 rounded-lg border border-roman-200 bg-roman-50 focus:outline-none focus:ring-2 focus:ring-roman-400"
              placeholder="Typ om te vertalen (bv. agricola)..."
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-roman-400">
                {loading && <Loader2 className="animate-spin" size={20} />}
                {!loading && result && result.success && <Sparkles size={20} className="text-gold-500 animate-in fade-in zoom-in" />}
            </div>
          </div>
        </div>

        {result && (
          <div className={`p-4 rounded-lg border animate-in fade-in slide-in-from-top-2 ${result.success ? 'bg-roman-50 border-roman-200' : 'bg-red-50 border-red-100'}`}>
            {result.success ? (
                <>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <span className="text-xs text-roman-400 uppercase">Vertaling</span>
                            <p className="font-serif text-lg text-roman-900">{result.dutch}</p>
                        </div>
                        <div>
                            <span className="text-xs text-roman-400 uppercase">Type</span>
                            <p className="font-serif text-roman-800">{result.type}</p>
                        </div>
                    </div>
                    {result.grammarNotes && (
                        <div className="mb-4">
                            <span className="text-xs text-roman-400 uppercase">Grammatica</span>
                            <p className="text-sm text-roman-700 italic">{result.grammarNotes}</p>
                        </div>
                    )}
                    
                    <button
                    onClick={handleSave}
                    className="w-full py-3 bg-green-600 text-white rounded-lg font-bold shadow-sm hover:bg-green-700 transition-colors"
                    >
                    Toevoegen aan Lijst
                    </button>
                </>
            ) : (
                <div className="text-red-600 flex items-center gap-2">
                    <AlertCircle size={20} />
                    <span>Kon geen vertaling vinden. Probeer het opnieuw.</span>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddWordForm;