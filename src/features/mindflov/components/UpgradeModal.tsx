// @ts-nocheck
import React, { useState } from 'react';
import { X, Zap, Check, Lock, Diamond, Loader2, CreditCard } from 'lucide-react';
import { usePaddleCheckout } from '@/hooks/usePaddleCheckout';
import { PLAN_PRICES, getPaddleEnvironment } from '@/lib/paddle';
import { changeSubscriptionPlan, createBillingPortalSession } from '@/utils/payments.functions';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequireAuth: () => void;
  subscriptionTier: string;
  userId?: string;
  userEmail?: string;
  isAnonymous?: boolean;
  hasSubscription?: boolean;
  onPurchased?: () => void;
  globalConfig?: any;
}

const RANK: Record<string, number> = { free: 0, plus: 1, pro: 2 };

const PRICES = {
  plus: { month: 11.99, year: 119.9 },
  pro: { month: 29.99, year: 299.9 },
};

const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen, onClose, onRequireAuth, subscriptionTier, userId, userEmail, isAnonymous,
  hasSubscription, onPurchased, globalConfig,
}) => {
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const { openCheckout } = usePaddleCheckout();

  if (!isOpen) return null;

  const startPlan = async (plan: 'plus' | 'pro') => {
    if (isAnonymous || !userId) {
      onRequireAuth();
      return;
    }
    setError('');
    setNotice('');
    setBusyPlan(plan);
    try {
      const priceId = PLAN_PRICES[plan][interval];

      if (hasSubscription && RANK[subscriptionTier] > 0) {
        const result = await changeSubscriptionPlan({
          data: {
            environment: getPaddleEnvironment(),
            priceId,
            targetProductId: plan === 'pro' ? 'pro_plan' : 'plus_plan',
          },
        });
        if (result.changed) {
          setNotice(
            result.upgraded
              ? 'Upgraded — the difference for the rest of this period was charged to your card.'
              : 'Plan changed — you were not charged, and the lower price applies from your next renewal.',
          );
          onPurchased?.();
          return;
        }
      }

      await openCheckout({
        priceId,
        userId,
        customerEmail: userEmail,
        onCompleted: onPurchased,
      });
    } catch (err: any) {
      setError(err?.message || 'Could not start checkout. Please try again.');
    } finally {
      setBusyPlan(null);
    }
  };

  const openBillingPortal = async () => {
    setError('');
    setBusyPlan('portal');
    try {
      const { url } = await createBillingPortalSession({
        data: { environment: getPaddleEnvironment() },
      });
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      setError(err?.message || 'Could not open the billing portal.');
    } finally {
      setBusyPlan(null);
    }
  };

  const priceLabel = (plan: 'plus' | 'pro') => {
    const amount = PRICES[plan][interval];
    return (
      <div className="text-3xl font-black text-white mb-6">
        ${amount.toFixed(2)}
        <span className="text-sm text-white/40 font-normal"> / {interval === 'month' ? 'month' : 'year'}</span>
      </div>
    );
  };

  const ctaLabel = (plan: 'plus' | 'pro') => {
    if (subscriptionTier === plan) return 'Current Plan';
    if (RANK[subscriptionTier] > RANK[plan]) return `Switch to ${plan === 'plus' ? 'Plus' : 'Pro'}`;
    if (RANK[subscriptionTier] > 0) return `Upgrade to ${plan === 'plus' ? 'Plus' : 'Pro'}`;
    return plan === 'plus' ? 'Get Plus' : 'Get Pro';
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0f172a] border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/10 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 text-center space-y-3">
          <div className="mx-auto w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
            <Lock className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Unlock Limitless Creativity</h2>
            <p className="text-indigo-200/60 mt-1 text-sm">Choose the plan that matches your ambition.</p>
          </div>

          <div className="inline-flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1 text-xs font-bold">
            <button
              onClick={() => setInterval('month')}
              className={`px-4 py-1.5 rounded-full transition-colors ${interval === 'month' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval('year')}
              className={`px-4 py-1.5 rounded-full transition-colors flex items-center gap-2 ${interval === 'year' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white'}`}
            >
              Yearly
              <span className="text-[9px] uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">2 months free</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-8 pb-4">
          {/* Plus */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col hover:border-indigo-500/50 transition-colors">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" /> {globalConfig?.PLUS_NAME || 'Plus'}
            </h3>
            <p className="text-xs text-white/50 mb-4">{globalConfig?.PLUS_DESC || 'Perfect for individual thinkers.'}</p>
            {priceLabel('plus')}
            <div className="space-y-3 mb-8 flex-1">
              <div className="flex items-center gap-2 text-xs text-slate-300"><Check className="w-3 h-3 text-emerald-400" /> 100,000 AI Tokens</div>
              <div className="flex items-center gap-2 text-xs text-slate-300"><Check className="w-3 h-3 text-emerald-400" /> Cloud Sync &amp; Backup</div>
              <div className="flex items-center gap-2 text-xs text-slate-300"><Check className="w-3 h-3 text-emerald-400" /> Standard Support</div>
            </div>

            <button
              onClick={() => startPlan('plus')}
              disabled={subscriptionTier === 'plus' || busyPlan !== null}
              className="w-full py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white font-bold rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
            >
              {busyPlan === 'plus' && <Loader2 className="w-4 h-4 animate-spin" />}
              {ctaLabel('plus')}
            </button>
          </div>

          {/* Pro */}
          <div className="bg-gradient-to-b from-indigo-600/20 to-violet-900/40 border border-indigo-500/50 rounded-xl p-5 flex flex-col relative overflow-hidden shadow-[0_0_30px_rgba(99,102,241,0.15)]">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-indigo-400" />
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Diamond className="w-4 h-4 text-emerald-400" /> {globalConfig?.PRO_NAME || 'Pro'}
            </h3>
            <p className="text-xs text-indigo-200/60 mb-4">{globalConfig?.PRO_DESC || 'For power users and teams.'}</p>
            {priceLabel('pro')}
            <div className="space-y-3 mb-8 flex-1">
              <div className="flex items-center gap-2 text-xs text-slate-300"><Check className="w-3 h-3 text-emerald-400" /> 250,000 AI Tokens</div>
              <div className="flex items-center gap-2 text-xs text-slate-300"><Check className="w-3 h-3 text-emerald-400" /> Neural Network Synthesis</div>
              <div className="flex items-center gap-2 text-xs text-slate-300"><Check className="w-3 h-3 text-emerald-400" /> Premium Exports &amp; Frameworks</div>
              <div className="flex items-start gap-2 text-xs text-slate-300">
                <Check className="w-3 h-3 mt-0.5 text-emerald-400 shrink-0" />
                <span className="leading-snug">Priority &amp; Premium Support<br /><span className="text-[10px] text-indigo-300">Get answers faster</span></span>
              </div>
            </div>

            <button
              onClick={() => startPlan('pro')}
              disabled={subscriptionTier === 'pro' || busyPlan !== null}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 disabled:opacity-50 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/25 transition-all text-sm flex items-center justify-center gap-2"
            >
              {busyPlan === 'pro' && <Loader2 className="w-4 h-4 animate-spin" />}
              {ctaLabel('pro')}
            </button>
          </div>
        </div>

        <div className="px-8 pb-6">
          {notice && <p className="text-emerald-400 text-xs mb-3 font-medium text-center">{notice}</p>}
          {error && <p className="text-red-400 text-xs mb-3 font-medium text-center">{error}</p>}

          {hasSubscription && (
            <div className="pt-4 border-t border-slate-700/50 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-400">Manage your billing, invoices or cancel anytime.</p>
              <button
                onClick={openBillingPortal}
                disabled={busyPlan !== null}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-2"
              >
                {busyPlan === 'portal' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CreditCard className="w-3 h-3" />}
                Manage billing
              </button>
            </div>
          )}

          <p className="text-center text-[10px] text-slate-500 uppercase tracking-widest mt-4">
            Secure Payment • Cancel anytime • Access until the end of your paid period
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
