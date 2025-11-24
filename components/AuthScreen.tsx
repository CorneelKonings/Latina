import React, { useState } from 'react';
import { login, register } from '../services/authService';
import { User } from '../types';
import { Loader2, User as UserIcon, Lock, Mail, ChevronRight } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
        let user;
        if (isLogin) {
            user = await login(email, password);
        } else {
            user = await register(name, email, password);
        }
        onLogin(user);
    } catch (err: any) {
        setError(err.message || 'Er is iets misgegaan.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-roman-50 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-roman-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-roman-100 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-roman-800 p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <h1 className="text-4xl font-serif font-bold text-gold-500 mb-2 relative z-10">Via Latina</h1>
                <p className="text-roman-200 text-sm uppercase tracking-widest relative z-10">Jouw weg naar Rome</p>
            </div>

            <div className="p-8">
                <h2 className="text-2xl font-serif text-roman-800 font-bold mb-6 text-center">
                    {isLogin ? 'Welkom Terug' : 'Start Je Reis'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-roman-400" size={18} />
                            <input 
                                type="text"
                                placeholder="Jouw Naam"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-roman-200 bg-roman-50 focus:outline-none focus:ring-2 focus:ring-roman-500 transition-all"
                                required={!isLogin}
                            />
                        </div>
                    )}

                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-roman-400" size={18} />
                        <input 
                            type="email"
                            placeholder="E-mailadres"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-roman-200 bg-roman-50 focus:outline-none focus:ring-2 focus:ring-roman-500 transition-all"
                            required
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-roman-400" size={18} />
                        <input 
                            type="password"
                            placeholder="Wachtwoord"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-roman-200 bg-roman-50 focus:outline-none focus:ring-2 focus:ring-roman-500 transition-all"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-4 bg-roman-800 text-gold-500 rounded-xl font-bold shadow-lg hover:bg-roman-900 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                            <>
                                {isLogin ? 'Inloggen' : 'Registreren'} <ChevronRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button 
                        onClick={() => { setIsLogin(!isLogin); setError(''); }}
                        className="text-roman-500 hover:text-roman-800 text-sm font-semibold transition-colors"
                    >
                        {isLogin ? "Nog geen account? Maak er een aan" : "Heb je al een account? Log in"}
                    </button>
                </div>
                
                <div className="mt-6 p-3 bg-blue-50 text-blue-800 text-xs rounded-lg text-center leading-relaxed">
                    Opmerking: Gegevens worden lokaal op dit apparaat opgeslagen.
                </div>
            </div>
        </div>
        
        <div className="absolute bottom-6 text-roman-300 text-xs">
            © MMXXV Via Latina
        </div>
    </div>
  );
};

export default AuthScreen;