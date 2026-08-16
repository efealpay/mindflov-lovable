// @ts-nocheck
import React, { useState } from 'react';
import { X, Zap, Check, Lock, Key, Diamond } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequireAuth: () => void;
  onVerifyLicense: (key: string) => Promise<void>;
  subscriptionTier: string;
  userEmail?: string;
  isAnonymous?: boolean;
  globalConfig?: any;
}

const PRODUCT_URLS = {
  plus: 'https://aikreativ.gumroad.com/l/mindflov',
  pro: 'https://aikreativ.gumroad.com/l/mindflov'
};

const UpgradeModal: React.FC<UpgradeModalProps> = ({ 
  isOpen, onClose, onRequireAuth, onVerifyLicense, subscriptionTier, userEmail, isAnonymous, globalConfig
}) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  
  const getCheckoutLink = (baseLink: string | undefined, defaultLink: string, email: string | undefined) => {
    const link = baseLink || defaultLink;
    if (!email) return link;
    const sep = link.includes('?') ? '&' : '?';
    return `${link}${sep}email=${encodeURIComponent(email)}`;
  };

  if (!isOpen) return null;

  const handleVerify = async () => {
    if (!licenseKey.trim()) return;
    setVerifying(true);
    setError('');
    try {
      await onVerifyLicense(licenseKey.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || "Invalid license key");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0f172a] border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/10 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-6 text-center space-y-3">
          <div className="mx-auto w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
            <Lock className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Unlock Limitless Creativity</h2>
            <p className="text-indigo-200/60 mt-1 text-sm">Choose the plan that matches your ambition.</p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-8 pb-4">
          {/* Plus Plan */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col hover:border-indigo-500/50 transition-colors">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" /> {globalConfig?.PLUS_NAME || 'Plus'}
            </h3>
            <p className="text-xs text-white/50 mb-4">{globalConfig?.PLUS_DESC || 'Perfect for individual thinkers.'}</p>
            <div className="text-3xl font-black text-white mb-6">$11.99 <span className="text-sm text-white/40 font-normal">/ month</span></div>
            <div className="space-y-3 mb-8 flex-1">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Check className="w-3 h-3 text-emerald-400" /> 100,000 AI Tokens
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Check className="w-3 h-3 text-emerald-400" /> Cloud Sync & Backup
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Check className="w-3 h-3 text-emerald-400" /> Standard Support
              </div>
            </div>
            
            {subscriptionTier === 'plus' || subscriptionTier === 'pro' ? (
              <button 
                disabled
                className="w-full py-3 bg-white/10 text-white font-bold rounded-lg transition-colors text-sm opacity-50"
              >
                {subscriptionTier === 'plus' ? 'Current Plan' : 'Included in Pro'}
              </button>
            ) : isAnonymous ? (
              <button 
                onClick={onRequireAuth}
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-colors text-sm"
              >
                Get Plus
              </button>
            ) : (
              <a 
                href={getCheckoutLink(globalConfig?.PLUS_LINK, 'https://aikreativ.gumroad.com/l/mindflov?option=pizz1rFrLl29En5bhfwGnw%3D%3D', userEmail)}
                data-gumroad-overlay-checkout="true"
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-colors text-sm text-center block"
              >
                Get Plus
              </a>
            )}
          </div>

          {/* Pro Plan */}
          <div className="bg-gradient-to-b from-indigo-600/20 to-violet-900/40 border border-indigo-500/50 rounded-xl p-5 flex flex-col relative overflow-hidden shadow-[0_0_30px_rgba(99,102,241,0.15)]">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-indigo-400" />
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Diamond className="w-4 h-4 text-emerald-400" /> {globalConfig?.PRO_NAME || 'Pro'}
            </h3>
            <p className="text-xs text-indigo-200/60 mb-4">{globalConfig?.PRO_DESC || 'For power users and teams.'}</p>
            <div className="text-3xl font-black text-white mb-6">$29.99 <span className="text-sm text-white/40 font-normal">/ month</span></div>
            <div className="space-y-3 mb-8 flex-1">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Check className="w-3 h-3 text-emerald-400" /> 250,000 AI Tokens
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Check className="w-3 h-3 text-emerald-400" /> Neural Network Synthesis
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Check className="w-3 h-3 text-emerald-400" /> Choose Your GenAI Models
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300 items-start">
                <Check className="w-3 h-3 mt-0.5 text-emerald-400 shrink-0" /> 
                <span className="leading-snug">Priority & Premium Support<br/><span className="text-[10px] text-indigo-300">Get answers faster</span></span>
              </div>
            </div>
            
            {subscriptionTier === 'pro' ? (
              <button 
                disabled
                className="w-full py-3 bg-gradient-to-r from-indigo-900 to-violet-900 text-white font-bold rounded-lg text-sm opacity-50"
              >
                Current Plan
              </button>
            ) : isAnonymous ? (
              <button 
                onClick={onRequireAuth}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] text-sm"
              >
                {subscriptionTier === 'plus' ? 'Upgrade to Pro' : 'Get Pro'}
              </button>
            ) : (
              <a 
                href={getCheckoutLink(globalConfig?.PRO_LINK, 'https://aikreativ.gumroad.com/l/mindflov?option=OCbMeuNmxIesF2k8l6Bh5Q%3D%3D', userEmail)}
                data-gumroad-overlay-checkout="true"
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] text-sm text-center block"
              >
                {subscriptionTier === 'plus' ? 'Upgrade to Pro' : 'Get Pro'}
              </a>
            )}
          </div>
        </div>

        <div className="px-8 pb-6">
          <div className="pt-4 border-t border-slate-700/50">
            <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-2 block">Already have a license key?</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Paste your Gumroad key..."
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  className="w-full bg-black/50 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <button 
                onClick={handleVerify}
                disabled={verifying || !licenseKey.trim()}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-bold rounded-lg text-sm transition-colors"
              >
                {verifying ? '...' : 'Verify'}
              </button>
            </div>
            {error && <p className="text-red-400 text-xs mt-2 font-medium">{error}</p>}
          </div>
          <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest mt-4">
            Secure Payment • 7-Day Money Back Guarantee
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
