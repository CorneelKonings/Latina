import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, BarChart2, GraduationCap, Settings, Search, ChevronLeft, LogOut, AlertTriangle } from 'lucide-react';
import { LatinWord, ViewState, MasteryLevel, User } from './types';
import { loadWords, saveWords, resetProgress } from './services/StorageService';
import { getCurrentUser, logout } from './services/authService';
import { getDueWords, calculateNextSRS } from './utils/srsLogic';
import Dashboard from './components/Dashboard';
import Flashcard from './components/Flashcard';
import AddWordForm from './components/AddWordForm';
import StudySetup from './components/StudySetup';
import AuthScreen from './components/AuthScreen';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-100 max-w-md text-center">
            <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Er is iets misgegaan</h2>
            <p className="text-gray-600 mb-4 text-sm">Probeer de pagina te verversen.</p>
            <pre className="bg-gray-100 p-3 rounded text-left text-xs text-red-800 overflow-auto max-h-40 mb-4">
              {this.state.error?.message}
            </pre>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700"
            >
              Verversen
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function AppContent() {
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
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-500">
      <header className="flex items-center gap-4">
          <button onClick={() => setView('dashboard')} className="p-2 bg-white rounded-full text-roman-600 shadow-sm">
             <ChevronLeft />
          </button>
          <h2 className="text-2xl font-serif text-roman-900 font-bold">Woordenboek</h2>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-roman-400" size={18} />
        <input 
            type="text" 
            placeholder="Zoek Latijn of Nederlands..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-roman-200 bg-white focus:outline-none focus:ring-2 focus:ring-roman-400"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pb-20 no-scrollbar">
          {filteredWords.slice(0, 50).map(word => (
              <div key={word.id} className="bg-white p-4 rounded-xl shadow-sm border border-roman-100 flex justify-between items-center">
                  <div>
                      <p className="font-serif font-bold text-roman-900">{word.latin}</p>
                      <p className="text-sm text-roman-500">{word.dutch}</p>
                  </div>
                  <div className="text-right">
                      <span className="text-xs uppercase font-bold text-roman-300 block">{word.type}</span>
                      <span className="text-xs text-roman-400 block">Cap {word.chapter}</span>
                  </div>
              </div>
          ))}
          {filteredWords.length === 0 && (
              <div className="text-center text-roman-400 py-8">
                  Geen woorden gevonden.
              </div>
          )}
      </div>

       <button 
        onClick={() => setView('add-word')}
        className="fixed bottom-24 right-6 w-14 h-14 bg-roman-800 text-gold-500 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-10"
      >
        <span className="text-2xl font-bold">+</span>
      </button>
    </div>
  );

  const renderAddWord = () => (
      <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in">
          <header className="flex items-center gap-4">
            <button onClick={() => setView('dictionary')} className="p-2 bg-white rounded-full text-roman-600 shadow-sm">
                <ChevronLeft />
            </button>
            <h2 className="text-2xl font-serif text-roman-900 font-bold">Woord Toevoegen</h2>
          </header>

          <AddWordForm onAdd={handleAddWord} />
      </div>
  );

  const renderSettings = () => (
      <div className="space-y-6 animate-in fade-in duration-500">
          <header className="flex items-center gap-4">
             <button onClick={() => setView('dashboard')} className="p-2 bg-white rounded-full text-roman-600 shadow-sm">
                <ChevronLeft />
             </button>
             <h2 className="text-2xl font-serif text-roman-900 font-bold">Instellingen</h2>
          </header>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-roman-100 space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-roman-100">
                  <div className="w-12 h-12 bg-roman-100 rounded-full flex items-center justify-center text-roman-600 font-bold text-xl">
                      {user?.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                      <h3 className="font-serif font-bold text-roman-900">{user?.name}</h3>
                      <p className="text-sm text-roman-500">{user?.email}</p>
                  </div>
              </div>

              <div className="space-y-2">
                  <button 
                    onClick={() => {
                        if(confirm('Weet je zeker dat je alle voortgang wilt wissen? Dit kan niet ongedaan worden gemaakt.')) {
                            resetProgress(user!.email);
                        }
                    }}
                    className="w-full text-left p-3 rounded-lg hover:bg-red-50 text-red-600 transition-colors flex items-center gap-2"
                  >
                      <Settings size={18} /> Voortgang Resetten
                  </button>
                   <button 
                    onClick={handleLogout}
                    className="w-full text-left p-3 rounded-lg hover:bg-roman-50 text-roman-600 transition-colors flex items-center gap-2"
                  >
                      <LogOut size={18} /> Uitloggen
                  </button>
              </div>
          </div>
          
          <div className="text-center text-roman-300 text-xs">
              Via Latina AI v1.0.0
          </div>
      </div>
  );

  // --- Main Render ---

  if (!user) {
      return <AuthScreen onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-roman-50 font-sans text-roman-900 overflow-hidden relative selection:bg-gold-500 selection:text-white">
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cream-paper.png')" }}></div>

      <main className="relative z-0 h-screen overflow-y-auto no-scrollbar p-6 pb-24 max-w-2xl mx-auto">
        {view === 'dashboard' && renderDashboard()}
        {view === 'study' && renderStudy()}
        {view === 'dictionary' && renderDictionary()}
        {view === 'add-word' && renderAddWord()}
        {view === 'settings' && renderSettings()}
      </main>
      
      {/* Study Setup Modal */}
      {showStudySetup && (
          <StudySetup 
            words={words} 
            onStart={handleStartSession} 
            onCancel={() => setShowStudySetup(false)} 
        />
      )}

      {/* Bottom Navigation */}
      {view !== 'study' && view !== 'add-word' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-roman-200 px-6 py-4 flex justify-around items-center z-40 max-w-2xl mx-auto rounded-t-2xl shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)]">
          <button 
            onClick={() => setView('dashboard')}
            className={`flex flex-col items-center gap-1 transition-colors ${view === 'dashboard' ? 'text-roman-800' : 'text-roman-400 hover:text-roman-600'}`}
          >
            <BarChart2 size={24} strokeWidth={view === 'dashboard' ? 2.5 : 2} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
          </button>
          
          <button 
            onClick={() => setView('dictionary')}
            className={`flex flex-col items-center gap-1 transition-colors ${view === 'dictionary' ? 'text-roman-800' : 'text-roman-400 hover:text-roman-600'}`}
          >
            <BookOpen size={24} strokeWidth={view === 'dictionary' ? 2.5 : 2} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Woorden</span>
          </button>

          <button 
            onClick={() => setView('settings')}
            className={`flex flex-col items-center gap-1 transition-colors ${view === 'settings' ? 'text-roman-800' : 'text-roman-400 hover:text-roman-600'}`}
          >
            <Settings size={24} strokeWidth={view === 'settings' ? 2.5 : 2} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Opties</span>
          </button>
        </nav>
      )}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;