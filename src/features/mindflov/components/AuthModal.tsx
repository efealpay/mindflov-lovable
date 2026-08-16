// @ts-nocheck
import React, { useState } from 'react';
import { X, Mail, Key, Globe, Loader2, AlertCircle } from 'lucide-react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from '@/lib/cloud/auth';

const AuthModal = ({ isOpen, onClose, auth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoadingAction('email');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
         setError('An account already exists with this email address. Please sign in instead.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
         setError('Invalid email or password.');
      } else {
         setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setSuccessMsg('');
    setLoadingAction('google');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onClose();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        if (err.code === 'auth/network-request-failed') {
          setError('Network request failed. This is often caused by ad-blockers, Brave Shields, or strict privacy settings. Please try disabling them, or try opening this app in a new tab.');
        } else if (err.code === 'auth/popup-blocked') {
          setError('Sign-in popup was blocked by your browser. Please allow popups for this site or open the app in a new tab.');
        } else {
          setError(err.message || 'Google sign-in failed');
        }
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address first to reset your password.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoadingAction('reset');
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-[#0f172a] border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden p-6">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-6 text-center">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-400 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-black/50 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="you@email.com"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
              {isLogin && (
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={loadingAction === 'reset'}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {loadingAction === 'reset' ? 'Sending...' : 'Forgot password?'}
                </button>
              )}
            </div>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={!!loadingAction}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loadingAction === 'email' ? <Loader2 className="w-4 h-4 animate-spin" /> : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="my-6 flex items-center space-x-4">
          <div className="flex-1 h-px bg-slate-700"></div>
          <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">OR</span>
          <div className="flex-1 h-px bg-slate-700"></div>
        </div>

        <button 
          onClick={handleGoogle}
          disabled={!!loadingAction}
          className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 border border-white/10 disabled:opacity-50"
        >
          {loadingAction === 'google' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
          Continue with Google
        </button>

        <p className="mt-6 text-center text-sm text-slate-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>

        <p className="mt-4 text-center text-[10px] text-slate-500 max-w-[260px] mx-auto leading-relaxed">
          Google Sign-In is restricted in the preview window.<br/>
          Please open this app in a <strong>new tab</strong> to login.
        </p>
      </div>
    </div>
  );
};

export default AuthModal;

