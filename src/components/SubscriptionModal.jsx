import React, { useEffect, useState } from 'react';
import { X, Check, Loader2, Sparkles, Shield, Rocket } from 'lucide-react';
import { subscriptionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Button from './Button';

export default function SubscriptionModal({ isOpen, onClose }) {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const fetchPlans = async () => {
        try {
          const response = await subscriptionAPI.getAllPlans();
          setPlans(response.data?.data?.items || []);
        } catch (error) {
          toast.error('Failed to load subscription plans');
        } finally {
          setLoading(false);
        }
      };
      fetchPlans();
    }
  }, [isOpen]);

  const handlePurchase = async (planId) => {
    setPurchasingId(planId);
    try {
      await subscriptionAPI.purchasePlan(planId);
      toast.success('Subscription activated successfully!');
      await refreshUser();
      onClose(); // Close modal after successful purchase
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to purchase plan');
    } finally {
      setPurchasingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-300">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 transition-colors z-20"
        >
          <X size={24} className="text-slate-500" />
        </button>

        <div className="p-8 md:p-12">
          <div className="text-center mb-10">
            <span className="inline-block px-4 py-1.5 mb-4 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider">
              Upgrade Your Experience
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-4">
              Subscription Required
            </h2>
            <p className="text-slate-500 max-w-md mx-auto">
              Please choose a subscription plan to continue with your service request.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const isPremium = plan.name === 'premium';
                const isTrial = plan.name === 'trial';
                const isPro = plan.name === 'pro';

                // Only show trial if user has no subscription history or is currently 'none'
                if (isTrial && user?.subscription?.planName !== 'none') return null;

                return (
                  <div
                    key={plan._id}
                    className={`relative flex flex-col p-6 rounded-3xl border transition-all duration-300 hover:shadow-xl ${
                      isPremium
                        ? 'bg-slate-900 border-slate-800 text-white shadow-2xl scale-105 z-10'
                        : isTrial
                        ? 'bg-blue-50 border-blue-200 text-slate-900 ring-2 ring-blue-400/20'
                        : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  >
                    {isPremium && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                        Best Value
                      </div>
                    )}
                    
                    {isTrial && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                        New User Offer
                      </div>
                    )}

                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        {isTrial && <Rocket size={20} className="text-blue-600" />}
                        {plan.name === 'basic' && <Rocket size={20} className="text-blue-500" />}
                        {plan.name === 'pro' && <Shield size={20} className="text-indigo-500" />}
                        {plan.name === 'premium' && <Sparkles size={20} className="text-amber-400" />}
                        <h3 className="font-display text-lg font-bold capitalize">
                          {isTrial ? 'Free Trial' : plan.name}
                        </h3>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">₹{plan.price}</span>
                        <span className={`text-xs ${isPremium ? 'text-slate-400' : 'text-slate-500'}`}>
                          {isTrial ? '/ lifetime' : `/${plan.durationMonths === 1 ? 'mo' : `${plan.durationMonths}mo`}`}
                        </span>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-8 flex-1">
                      <li className="flex items-start gap-2 text-sm">
                        <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{plan.docLimit} Documents</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{plan.requestLimitPerMonth === -1 ? 'Unlimited' : plan.requestLimitPerMonth} Requests</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm">
                        <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span className="capitalize">{plan.allowedTiers.join(' & ')} Access</span>
                      </li>
                    </ul>

                    <Button
                      variant={isPremium ? 'primary' : isTrial ? 'primary' : 'outline'}
                      className={`w-full justify-center rounded-xl py-2.5 font-bold text-sm ${
                        isPremium ? 'bg-white text-slate-900 hover:bg-slate-100 border-none' : 
                        isTrial ? 'bg-blue-600 text-white hover:bg-blue-700 border-none' : ''
                      }`}
                      disabled={purchasingId === plan._id}
                      onClick={() => handlePurchase(plan._id)}
                    >
                      {purchasingId === plan._id ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        isTrial ? 'Claim Trial' : 'Select Plan'
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-10 text-center">
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors"
            >
              Maybe later, I'll browse more services
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
