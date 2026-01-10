
import React, { useState } from 'react';
import { UserState } from '../types';
import { INITIAL_STATE } from '../constants';
import { auth, db } from '../services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

interface AuthProps {
  onLogin: (user: UserState) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<React.ReactNode>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        try {
          const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
          if (userDoc.exists()) {
            onLogin(userDoc.data() as UserState);
          } else {
            onLogin({ ...INITIAL_STATE, accountId: email });
          }
        } catch (dbErr: any) {
          console.error("Database fetch failed:", dbErr);
          if (dbErr.code === 'permission-denied') {
             setError(
              <span>
                Auth successful, but <b>Security Rules</b> are blocking access. 
                <a 
                  href={`https://console.firebase.google.com/project/${auth.app.options.projectId}/firestore/rules`}
                  target="_blank" rel="noopener noreferrer"
                  className="underline ml-1 text-emerald-400 font-bold"
                >
                  Fix Rules in Console
                </a>
              </span>
            );
          } else {
            // Local fallback
            onLogin({ ...INITIAL_STATE, accountId: email });
          }
        }
      } else {
        if (!email || !password || (!isLogin && !name)) throw new Error("Please fill in all fields.");
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser: UserState = { ...INITIAL_STATE, name, accountId: email };
        
        try {
          await setDoc(doc(db, "users", userCredential.user.uid), newUser);
        } catch (dbErr: any) {
          console.warn("Could not save to cloud, using local session:", dbErr);
          if (dbErr.code === 'permission-denied') {
             setError(
              <span>
                Account created, but <b>Security Rules</b> prevented profile save. 
                <a 
                  href={`https://console.firebase.google.com/project/${auth.app.options.projectId}/firestore/rules`}
                  target="_blank" rel="noopener noreferrer"
                  className="underline ml-1 text-emerald-400 font-bold"
                >
                  Check Console
                </a>
              </span>
            );
          }
        }
        onLogin(newUser);
      }
    } catch (err: any) {
      setError(err.message || "An authentication error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden text-white">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[150px] rounded-full"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[150px] rounded-full"></div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center font-bold text-slate-950 text-3xl mx-auto mb-4 shadow-xl shadow-emerald-500/20">CW</div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">CoinWise AI</h1>
          <p className="text-slate-400">Master Digital Assets. Risk-Free.</p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
          <div className="flex bg-slate-800/50 p-1 rounded-xl mb-8">
            <button 
              onClick={() => setIsLogin(true)} 
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Log In
            </button>
            <button 
              onClick={() => setIsLogin(false)} 
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Your Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" 
                  placeholder="Alex Doe" 
                />
              </div>
            )}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" 
                placeholder="alex@example.com" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Security Key</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" 
                placeholder="••••••••" 
              />
            </div>
            
            {error && (
              <div className="text-rose-500 text-xs bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-center font-medium leading-relaxed animate-in shake-in-h duration-300">
                {error}
              </div>
            )}

            <button 
              disabled={isLoading} 
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-xl transition-all flex justify-center items-center gap-3 shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
            >
              {isLoading && <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
              {isLogin ? 'Access Terminal' : 'Initialize Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
