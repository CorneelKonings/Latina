import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, BarChart2, GraduationCap, Settings, Search, ChevronLeft, LogOut } from 'lucide-react';
import { LatinWord, ViewState, MasteryLevel, User } from './types';
import { loadWords, saveWords, resetProgress } from './services/storageService';
import { getCurrentUser, logout } from './services/authService';
import { getDueWords, calculateNextSRS } from './utils/srsLogic';
import Dashboard from './components/Dashboard';
import Flashcard from './components/Flashcard';
import AddWordForm from './components/AddWordForm';
import StudySetup from './components/StudySetup';
import AuthScreen from './components/AuthScreen';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [words, setWords] = useState<LatinWord[]>([]);
  const [view, setView] = useState<ViewState>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Study Session State
  const [sessionWords, setSessionWords] = useState<LatinWord[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [showStudySetup, setShowStudySetup] = useState(false);

  // Initial Auth Check
  useEffect(() => {
      const currentUser = getCurrentUser();
      if (currentUser) {
          setUser(currentUser);
      }
  }, []);

  // Load Data when User changes
  useEffect(() => {
    if (user) {
        const loaded = loadWords(user.email);
        setWords(loaded);
    } else {
        setWords([]);
    }
  }, [user]);

  // Save Data when Words change
  useEffect(() => {
    if (user && words.length > 0) {
      saveWords(user.email, words);
    }
  }, [words, user]);

  const handleStartSession = (selectedWords: LatinWord[]) => {
      // Shuffle selected words for better randomness
      const shuffled = [...selectedWords].sort(() => Math.random() - 0.5);
      setSessionWords(shuffled);
      setCurrentCardIndex(0);
      setSessionComplete(false);
      setShowStudySetup(false);
      setView('study');
  };

  const handleCardResult = (quality: number) => {
    const currentWord = sessionWords[currentCardIndex];
    
    // Calculate new SRS state (only update main state, not the session copy immediately)
    const newSRS = calculateNextSRS(currentWord.srs, quality);
    const updatedWords = words.map(w => w.id === currentWord.id ? { ...w, srs: newSRS } : w);
    setWords(updatedWords);

    // RETRY LOGIC: If quality is 1 (Nog niet/Hard), append to end of session
    if (quality === 1) {
        setSessionWords(prev => [...prev, currentWord]);
    }

    if (currentCardIndex < sessionWords.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    } else {
      setSessionComplete(true);
    }
  };

  const handleAddWord = (newWord: LatinWord) => {
    setWords(prev => [newWord, ...prev]);
    setView('dictionary');
  };

  const handleLogout = () => {
      logout();
      setUser(null);
  };

  const filteredWords = useMemo(() => {
    return words.filter(w => 
      w.latin.toLowerCase().includes(searchTerm.toLowerCase()) || 
      w.dutch.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [words, searchTerm]);

  // --- Views ---

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-serif font-bold text-roman-900">Via Latina</h1>
            <p className="text-roman-500 text-sm">Salve, {user?.name || 'Discipule'}.</p>
        </div>
        <button 
            onClick={() => setShowStudySetup(true)}
            className="bg-roman-800 text-gold-500 px-6 py-3 rounded-full font-bold shadow-lg shadow-roman-900/20 hover:scale-105 transition-transform flex items-center gap-2"
        >
            <GraduationCap size={20} /> Start Studie
        </button>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-roman-100 flex flex-col items-center justify-center h-32">
            <span className="text-4xl font-serif text-roman-800 font-bold">{getDueWords(words).length}</span>
            <span className="text-xs text-roman-500 uppercase mt-1">Te Leren</span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-roman-100 flex flex-col items-center justify-center h-32">
            <span className="text-4xl font-serif text-green-700 font-bold">
                {words.filter(w => w.srs.level === MasteryLevel.Mastered).length}
            </span>
            <span className="text-xs text-roman-500 uppercase mt-1">Meester</span>
        </div>
      </div>

      <Dashboard words={words} />
    </div>
  );

  const renderStudy = () => (
    <div className="h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
      {sessionComplete ? (
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-sm">
          <GraduationCap size={64} className="mx-auto text-roman-600 mb-4" />
          <h2 className="text-2xl font-serif text-roman-900 mb-2">Sessie Voltooid!</h2>
          <p className="text-roman-600 mb-6">Je voortgang is opgeslagen. Bene factum!</p>
          <button 
            onClick={() => setView('dashboard')}
            className="w-full py-3 bg-roman-800 text-white rounded-lg font-bold"
          >
            Terug naar Home
          </button>
        </div>
      ) : (
        <div className="w-full max-w-lg flex flex-col items-center landscape:flex-row landscape:justify-center landscape:gap-8">
            <div className="w-full flex justify-between items-center mb-8 px-4 landscape:hidden">
                 <button onClick={() => setView('dashboard')} className="p-2 text-roman-600 hover:bg-roman-100 rounded-full">
                     <ChevronLeft />
                 </button>
                 <span className="text-sm font-bold text-roman-400 uppercase tracking-widest">
                     Kaart {currentCardIndex + 1} / {sessionWords.length}
                 </span>
                 <div className="w-8"></div>
            </div>
            
            {/* Landscape Header (Back button only) */}
             <div className="hidden landscape:block absolute top-4 left-4 z-20">
                 <button onClick={() => setView('dashboard')} className="p-2 bg-white/80 backdrop-blur rounded-full text-roman-600 shadow-sm">
                     <ChevronLeft />
                 </button>
            </div>

            {sessionWords.length > 0 && (
                <Flashcard 
                    key={`${sessionWords[currentCardIndex].id}-${currentCardIndex}`} // Unique key to force re-render on duplicates
                    word={sessionWords[currentCardIndex]} 
                    onResult={handleCardResult} 
                    currentIndex={currentCardIndex}
                    totalCards={sessionWords.length}
                />
            )}
        </div>
      )}
    </div>
  );

  const renderDictionary = () => (
    <div className="space-y-4 pb-24 h-full flex flex-col">
       <div className="sticky top-0 bg-roman-50 z-10 py-2">
            <h2 className="text-2xl font-serif text-roman-900 mb-4 px-1">Woordenlijst</h2>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-roman-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Zoek Latijn of Nederlands..." 
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-roman-200 focus:outline-none focus:ring-2 focus:ring-roman-400 bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
       </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
        {filteredWords.slice(0, 100).map(word => (
            <div key={word.id} className="bg-white p-4 rounded-xl border border-roman-100 flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-2">
                         <span className="text-xs font-mono text-roman-400 w-10">{word.id.split('-')[1]}</span>
                         <h3 className="text-lg font-serif text-roman-900">{word.latin}</h3>
                    </div>
                    <p className="text-sm text-roman-500 ml-12">{word.dutch}</p>
                </div>
                <div className="text-right">
                    <span className="text-xs font-bold text-roman-300 uppercase block">Cap {word.chapter}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                        word.srs.level === 3 ? 'bg-green-100 text-green-700' : 
                        word.srs.level === 0 ? 'bg-gray-100 text-gray-500' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                        Lvl {word.srs.level}
                    </span>
                </div>
            </div>
        ))}
        {filteredWords.length === 0 && (
            <div className="text-center text-roman-400 mt-10">Geen woorden gevonden.</div>
        )}
      </div>
    </div>
  );

  const renderSettings = () => (
      <div className="space-y-6">
           <h2 className="text-2xl font-serif text-roman-900 mb-4">Instellingen</h2>
           
           <div className="bg-white p-6 rounded-xl border border-roman-200">
               <h3 className="font-bold text-roman-800 mb-2">Account</h3>
               <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 bg-roman-200 rounded-full flex items-center justify-center text-roman-600 font-bold text-lg">
                       {user?.name.charAt(0).toUpperCase()}
                   </div>
                   <div>
                       <div className="font-bold text-roman-900">{user?.name}</div>
                       <div className="text-xs text-roman-500">{user?.email}</div>
                   </div>
               </div>
               <button onClick={handleLogout} className="w-full py-2 border border-roman-200 text-roman-600 rounded-lg hover:bg-roman-50 flex items-center justify-center gap-2 text-sm">
                   <LogOut size={16} /> Uitloggen
               </button>
           </div>

           <div className="bg-white p-6 rounded-xl border border-roman-200">
               <h3 className="font-bold text-roman-800 mb-2">Data Beheer</h3>
               <p className="text-sm text-roman-500 mb-4">Reset je voortgang voor dit account.</p>
               <div className="flex flex-col gap-2">
                   <button onClick={() => { if(confirm("Zeker weten? Dit kan niet ongedaan worden gemaakt.")) resetProgress(user!.email); }} className="w-full py-3 border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
                       Reset Alle Voortgang
                   </button>
               </div>
           </div>
      </div>
  )

  if (!user) {
      return <AuthScreen onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-roman-50 font-sans text-roman-900 pb-20 md:pb-0 landscape:pb-0">
        {showStudySetup && (
            <StudySetup 
                words={words} 
                onStart={handleStartSession} 
                onCancel={() => setShowStudySetup(false)} 
            />
        )}

        {/* Responsive Layout Container */}
        <div className="max-w-md mx-auto min-h-screen bg-roman-50 relative shadow-2xl overflow-hidden flex flex-col landscape:flex-row landscape:max-w-4xl landscape:mx-auto landscape:h-screen">
            
            {/* Main Content Area */}
            <main className="flex-1 p-6 overflow-y-auto no-scrollbar relative z-0 landscape:order-2">
                {view === 'dashboard' && renderDashboard()}
                {view === 'study' && renderStudy()}
                {view === 'dictionary' && renderDictionary()}
                {view === 'add-word' && <AddWordForm onAdd={handleAddWord} />}
                {view === 'settings' && renderSettings()}
            </main>

            {/* Navigation - Bottom on Portrait, Left on Landscape */}
            <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-roman-200 px-6 py-4 flex justify-between items-center z-50 safe-area-bottom landscape:static landscape:w-24 landscape:h-full landscape:flex-col landscape:justify-start landscape:gap-8 landscape:border-t-0 landscape:border-r landscape:pt-10 landscape:order-1">
                
                {/* Logo for landscape */}
                <div className="hidden landscape:block text-roman-800 font-serif font-bold text-xl mb-4">VL</div>

                <button 
                    onClick={() => setView('dashboard')}
                    className={`flex flex-col items-center gap-1 ${view === 'dashboard' ? 'text-roman-800' : 'text-roman-300'}`}
                >
                    <BarChart2 size={24} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
                </button>
                 <button 
                    onClick={() => setView('dictionary')}
                    className={`flex flex-col items-center gap-1 ${view === 'dictionary' ? 'text-roman-800' : 'text-roman-300'}`}
                >
                    <BookOpen size={24} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Lijst</span>
                </button>
                
                {/* FAB for Study/Add */}
                <div className="relative -top-8 landscape:static landscape:top-auto">
                    <button 
                        onClick={() => setShowStudySetup(true)}
                        className="w-14 h-14 bg-roman-800 rounded-full text-gold-500 shadow-lg shadow-roman-900/30 flex items-center justify-center hover:scale-105 transition-transform border-4 border-roman-50 landscape:w-12 landscape:h-12 landscape:border-2"
                    >
                        <GraduationCap size={28} className="landscape:w-6 landscape:h-6" />
                    </button>
                </div>

                <button 
                    onClick={() => setView('study')} 
                    className={`flex flex-col items-center gap-1 ${view === 'study' ? 'text-roman-800' : 'text-roman-300'}`}
                >
                    <GraduationCap size={24} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Studie</span>
                </button>
                 <button 
                    onClick={() => setView('settings')}
                    className={`flex flex-col items-center gap-1 ${view === 'settings' ? 'text-roman-800' : 'text-roman-300'}`}
                >
                    <Settings size={24} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Opties</span>
                </button>
            </nav>
        </div>
    </div>
  );
}

export default App;