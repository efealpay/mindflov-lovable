// @ts-nocheck
import React, { useState } from 'react';
import { X, Settings2, User, Key, Trash2, AlertCircle, Loader2, Bug } from 'lucide-react';
import { sendPasswordResetEmail, deleteUser, signOut } from '@/lib/cloud/auth';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  modelSettings: {
    expansion: string;
    insight: string;
    plan: string;
    neural: string;
  };
  setModelSettings: (settings: any) => void;
  includeParentContext: boolean;
  setIncludeParentContext: (val: boolean) => void;
  subscriptionTier: string;
  setSubscriptionTier: (tier: string) => void;
  auth?: any;
  user?: any;
  isDebugMode?: boolean;
  setIsDebugMode?: (val: boolean) => void;
  globalConfig?: any;
}

const MODELS = [
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', desc: 'Fastest, Standard choice for basic text tasks.' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', desc: 'Fast & Lightweight, optimal for cost.' },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview', desc: 'Complex Text & Reasoning.' }
];

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, modelSettings, setModelSettings, includeParentContext, setIncludeParentContext, subscriptionTier, setSubscriptionTier, auth, user, isDebugMode, setIsDebugMode, globalConfig }) => {
  const [activeTab, setActiveTab] = useState<'models' | 'account' | 'debug'>('models');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleChange = (key: string, value: string) => {
    setModelSettings({ ...modelSettings, [key]: value });
  };

  const handleResetPassword = async () => {
    if (!user || user.isAnonymous || !user.email) {
      setError("Cannot reset password for this account type.");
      return;
    }
    setLoadingAction('reset');
    setError('');
    setSuccessMsg('');
    try {
      await sendPasswordResetEmail(auth, user.email);
      setSuccessMsg("Password reset email sent to your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to delete your account? This action is irreversible.")) return;
    setLoadingAction('delete');
    setError('');
    setSuccessMsg('');
    try {
      await deleteUser(user);
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        setError("For security, please sign out and sign back in before deleting your account.");
      } else {
        setError(err.message || "Failed to delete account.");
      }
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/10 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Tabs */}
        <div className="flex border-b border-white/10 bg-black/20">
          <button
            onClick={() => setActiveTab('models')}
            className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-bold tracking-wide transition-colors ${activeTab === 'models' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-white'}`}
          >
            <Settings2 className="w-4 h-4" /> Models
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-bold tracking-wide transition-colors ${activeTab === 'account' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-white'}`}
          >
            <User className="w-4 h-4" /> Account
          </button>
          {user?.email === 'efe.alpay@gmail.com' && (
            <button
              onClick={() => setActiveTab('debug')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-bold tracking-wide transition-colors ${activeTab === 'debug' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400 hover:text-white'}`}
            >
              <Bug className="w-4 h-4" /> Debug
            </button>
          )}
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar space-y-5">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-400 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{successMsg}</p>
            </div>
          )}

          {activeTab === 'models' && (
            <>
              <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                <div>
                  <label className="text-xs font-bold text-white uppercase tracking-widest">Include Upstream Context</label>
                  <p className="text-[10px] text-slate-400 mt-1">If enabled, incorporates the originating nodes' context into the generative prompt.</p>
                </div>
                <button
                  onClick={() => setIncludeParentContext(!includeParentContext)}
                  className={`w-10 h-6 flex items-center rounded-full transition-colors ${includeParentContext ? 'bg-indigo-500' : 'bg-slate-700'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${includeParentContext ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Models Section */}
              <div className="relative">
                 
                 <div className="space-y-4 p-4 bg-white/5 border border-white/10 rounded-xl mt-4">
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-white uppercase tracking-widest">Concept Expansion</label>
                      <p className="text-[10px] text-slate-400">Used for generating new nodes (Neural Bridge, Metaphor, etc.)</p>
                      <select 
                         value={modelSettings.expansion}
                         onChange={(e) => handleChange('expansion', e.target.value)}
                         
                         className="w-full bg-[#020617] border border-white/20 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                      >
                         {MODELS.map(m => (
                           <option key={m.id} value={m.id}>{m.name} ({m.desc})</option>
                         ))}
                      </select>
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-bold text-white uppercase tracking-widest">Insight Extraction</label>
                      <p className="text-[10px] text-slate-400">Used for Deep Insight generation</p>
                      <select 
                         value={modelSettings.insight}
                         onChange={(e) => handleChange('insight', e.target.value)}
                         
                         className="w-full bg-[#020617] border border-white/20 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                      >
                         {MODELS.map(m => (
                           <option key={m.id} value={m.id}>{m.name} ({m.desc})</option>
                         ))}
                      </select>
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-bold text-white uppercase tracking-widest">Action Planning</label>
                      <p className="text-[10px] text-slate-400">Used for generating Execution Plans</p>
                      <select 
                         value={modelSettings.plan}
                         onChange={(e) => handleChange('plan', e.target.value)}
                         
                         className="w-full bg-[#020617] border border-white/20 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                      >
                         {MODELS.map(m => (
                           <option key={m.id} value={m.id}>{m.name} ({m.desc})</option>
                         ))}
                      </select>
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Global Neural Analysis</label>
                      <p className="text-[10px] text-slate-400">Used for holistic graph synthesis</p>
                      <select 
                         value={modelSettings.neural}
                         onChange={(e) => handleChange('neural', e.target.value)}
                         
                         className="w-full bg-[#020617] border border-white/20 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
                      >
                         {MODELS.map(m => (
                           <option key={m.id} value={m.id}>{m.name} ({m.desc})</option>
                         ))}
                      </select>
                   </div>
                 </div>
              </div>
            </>
          )}

          {activeTab === 'account' && (
            <div className="space-y-6">
              {!user || user.isAnonymous ? (
                <div className="text-center p-6 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-slate-400 text-sm">Please sign in to access account settings.</p>
                </div>
              ) : (
                <>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <h3 className="text-white font-bold text-sm mb-1">Account Info</h3>
                    <p className="text-slate-400 text-xs mb-3">You are signed in as <strong className="text-white">{user.email || 'Google User'}</strong>.</p>
                    
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <h4 className="text-white font-bold text-sm mb-2">Subscription Tier</h4>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                            subscriptionTier === 'pro' ? 'bg-indigo-500/20 text-indigo-400' :
                            subscriptionTier === 'plus' ? 'bg-emerald-500/20 text-emerald-400' :
                            'bg-slate-500/20 text-slate-400'
                        }`}>
                          {subscriptionTier === 'pro' ? 'PRO' : subscriptionTier === 'plus' ? 'PLUS' : 'FREE'}
                        </span>
                        
                        {(globalConfig?.PRO_LINK || globalConfig?.PLUS_LINK) && (
                          <a 
                            href={globalConfig.PRO_LINK || globalConfig.PLUS_LINK}
                            target="_blank"
                            rel="noopener noreferrer" 
                            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors border border-indigo-500/30 hover:border-indigo-500/50 rounded-lg px-3 py-1"
                          >
                            Manage Subscription
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <button
                      onClick={handleResetPassword}
                      disabled={loadingAction === 'reset'}
                      className="w-full relative px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex flex-col items-start gap-1 transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <Key className="w-4 h-4 text-indigo-400" />
                        {loadingAction === 'reset' ? 'Sending...' : 'Reset Password'}
                      </div>
                      <span className="text-xs text-slate-400 pl-6 text-left">Send a password reset link to your email address.</span>
                    </button>

                    <button
                      onClick={async () => {
                        try {
                          await signOut(auth);
                          onClose();
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="w-full relative px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex flex-col items-start gap-1 transition-colors"
                    >
                      <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <User className="w-4 h-4 text-indigo-400" />
                        Sign Out
                      </div>
                      <span className="text-xs text-slate-400 pl-6 text-left">Log out of your current session.</span>
                    </button>

                    <div className="pt-4 border-t border-red-500/20">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={loadingAction === 'delete'}
                        className="w-full relative px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl flex flex-col items-start gap-1 transition-colors disabled:opacity-50"
                      >
                        <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
                          {loadingAction === 'delete' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          Delete Account
                        </div>
                        <span className="text-xs text-red-400/80 pl-6 text-left">Permanently remove your account and data.</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'debug' && user?.email === 'efe.alpay@gmail.com' && (
            <div className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-white font-bold text-sm mb-1">Simulate Experience</h3>
                <p className="text-slate-400 text-xs mb-3">Dynamically lock and unlock access to advanced models, graph synthesis capabilities, and node action options.</p>
                <div className="flex gap-2">
                  <button onClick={() => setSubscriptionTier('free')} className={`flex-1 py-2 rounded border font-bold text-xs ${subscriptionTier === 'free' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}>FREE</button>
                  <button onClick={() => setSubscriptionTier('plus')} className={`flex-1 py-2 rounded border font-bold text-xs ${subscriptionTier === 'plus' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}>PLUS</button>
                  <button onClick={() => setSubscriptionTier('pro')} className={`flex-1 py-2 rounded border font-bold text-xs ${subscriptionTier === 'pro' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}>PRO</button>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-white font-bold text-sm mb-1">System Debug</h3>
                <p className="text-slate-400 text-xs mb-3">Enable visibility of internal metrics such as token counters.</p>
                <div className="flex gap-2">
                  <button onClick={() => setIsDebugMode?.(!isDebugMode)} className={`flex-1 py-2 rounded border font-bold text-xs ${isDebugMode ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}>
                    {isDebugMode ? 'Debug Mode ON' : 'Debug Mode OFF'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/20 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;
