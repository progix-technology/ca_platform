import { useEffect, useState } from 'react';
import { Check, Loader2, Sparkles, Shield, Rocket } from 'lucide-react';
import { subscriptionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import Button from '../components/Button';

export default function Subscription() {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState(null);

  useEffect(() => {
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
  }, []);

  const handlePurchase = async (planId) => {
    setPurchasingId(planId);
    try {
      await subscriptionAPI.purchasePlan(planId);
      toast.success('Subscription activated successfully!');
      await refreshUser(); // Update user data in context
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to purchase plan');
    } finally {
      setPurchasingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-primary-600" size={32} />
      </div>
    );
  }

  const currentPlanName = user?.subscription?.planName || 'none';

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="font-display text-3xl font-bold text-slate-900">Choose Your Plan</h2>
        <p className="text-slate-500 max-w-lg mx-auto">
          Select a plan that fits your business needs. Upgrade or downgrade anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isCurrent = currentPlanName === plan.name;
          const isPremium = plan.name === 'premium';
          const isPro = plan.name === 'pro';

          return (
            <div
              key={plan._id}
              className={`relative flex flex-col p-8 rounded-3xl border transition-all duration-300 hover:shadow-xl ${
                isPremium
                  ? 'bg-slate-900 border-slate-800 text-white shadow-2xl scale-105 z-10'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              {isPremium && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  {plan.name === 'basic' && <Rocket size={20} className="text-blue-500" />}
                  {plan.name === 'pro' && <Shield size={20} className="text-indigo-500" />}
                  {plan.name === 'premium' && <Sparkles size={20} className="text-amber-400" />}
                  <h3 className="font-display text-xl font-bold capitalize">{plan.name}</h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">₹{plan.price}</span>
                  <span className={isPremium ? 'text-slate-400' : 'text-slate-500'}>
                    /{plan.durationMonths === 1 ? 'mo' : `${plan.durationMonths}mo`}
                  </span>
                </div>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-start gap-3 text-sm">
                  <Check size={18} className="text-emerald-500 shrink-0" />
                  <span>{plan.docLimit} Document Uploads</span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <Check size={18} className="text-emerald-500 shrink-0" />
                  <span>
                    {plan.requestLimitPerMonth === -1
                      ? 'Unlimited Requests'
                      : `${plan.requestLimitPerMonth} Requests per month`}
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <Check size={18} className="text-emerald-500 shrink-0" />
                  <span className="capitalize">
                    Access to {plan.allowedTiers.join(' & ')} services
                  </span>
                </li>
                <li className="flex items-start gap-3 text-sm opacity-60">
                  <Check size={18} className="text-emerald-500 shrink-0" />
                  <span>{plan.durationMonths} Month Validity</span>
                </li>
              </ul>

              <Button
                variant={isPremium ? 'primary' : 'outline'}
                className={`w-full justify-center rounded-xl py-3 font-bold ${
                  isPremium ? 'bg-white text-slate-900 hover:bg-slate-100 border-none' : ''
                }`}
                disabled={isCurrent || purchasingId === plan._id}
                onClick={() => handlePurchase(plan._id)}
              >
                {purchasingId === plan._id ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : isCurrent ? (
                  'Current Plan'
                ) : (
                  'Get Started'
                )}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="rounded-3xl bg-blue-50 border border-blue-100 p-8 flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
          <Shield size={32} />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-slate-900 text-lg">Secure Payments</h4>
          <p className="text-slate-600 text-sm">
            All payments are processed securely. Your data and privacy are our top priority.
            Contact support for enterprise custom plans.
          </p>
        </div>
        <Button variant="ghost" className="text-blue-700 font-bold hover:bg-blue-100">
          Contact Support
        </Button>
      </div>
    </div>
  );
}
