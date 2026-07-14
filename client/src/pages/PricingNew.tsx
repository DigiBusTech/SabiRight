import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Check, Zap } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function PricingNew() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: allPlans = [] } = useQuery({
    queryKey: ['public-plans'],
    queryFn: async () => {
      const res = await fetch('/api/plans');
      if (!res.ok) return [];
      return res.json();
    }
  });

  const userPlans = Array.isArray(allPlans) ? allPlans.filter((p: any) => p.userType === 'user') : [];

  const { data: creditPackages = [] } = useQuery({
    queryKey: ['credit-packages-public'],
    queryFn: async () => {
      const res = await fetch('/api/credit-packages');
      if (!res.ok) return [];
      return res.json();
    }
  });

  const handleSubscribe = (plan: any) => {
    if (!user) {
      toast({ title: 'Please log in', description: 'Sign in to subscribe', variant: 'destructive' });
      setLocation('/auth/login');
      return;
    }
    const amount = plan.price ?? 0;
    setLocation(`/app/payment?type=subscription&planId=${plan.id}&amount=${amount}`);
  };

  const handlePurchaseCredits = (pkg: any) => {
    if (!user) {
      toast({ title: 'Please log in', description: 'Sign in to purchase credits', variant: 'destructive' });
      setLocation('/auth/login');
      return;
    }
    setLocation(`/app/payment?type=credit_purchase&planId=${pkg.id}&amount=${pkg.price}&credits=${pkg.credits + (pkg.bonus || 0)}`);
  };

  const formatCurrency = (amount: any) => {
    const v = Number(amount || 0);
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(v);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar />

      <header className="pt-36 pb-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-5xl lg:text-7xl font-black mb-6">Simple, <span className="text-primary">Transparent</span> Pricing</h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">Choose the plan that fits your needs. Empower your civic life today.</p>
          </motion.div>
        </div>
      </header>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-8">
            {userPlans.map((plan: any, i: number) => (
              <motion.div
                key={plan.id || i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`bg-white p-10 rounded-[2.5rem] shadow-xl border-2 ${plan.type === 'pro' ? 'border-primary relative' : 'border-transparent'}`}
              >
                {plan.type === 'pro' && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <Zap className="h-4 w-4 fill-white" /> Most Popular
                  </div>
                )}

                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-slate-500 text-sm mb-8">{plan.description}</p>

                <div className="mb-8">
                  <span className="text-4xl font-black">{formatCurrency(plan.price)}</span>
                  <span className="text-slate-500 font-medium">{plan.billingCycle ? ` / ${plan.billingCycle}` : ''}</span>
                </div>

                <ul className="space-y-4 mb-10">
                  {(plan.features || []).map((feature: string, j: number) => (
                    <li key={j} className="flex items-center gap-3 text-sm font-medium">
                      <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                        <Check className="h-3 w-3" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button className={`w-full h-14 rounded-2xl font-bold text-lg`} onClick={() => handleSubscribe(plan)}>
                  {plan.type === 'free' ? 'Get Started' : 'Subscribe'}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Credit Packages */}
      <section className="py-16 bg-white/60">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-6">Credit Packages</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(creditPackages.length === 0 ? [] : creditPackages).map((pkg: any) => (
              <div key={pkg.id} className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-bold">{pkg.name || `${pkg.credits} Credits`}</h3>
                <p className="text-slate-500 text-sm mt-1 mb-4">{pkg.description || ''}</p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-2xl font-black">{formatCurrency(pkg.price)}</span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="px-2 py-1 rounded bg-amber-50 text-amber-700">{pkg.credits} credits</div>
                  {pkg.bonus ? <div className="px-2 py-1 rounded bg-green-50 text-green-700">+{pkg.bonus} bonus</div> : null}
                </div>

                <Button onClick={() => handlePurchaseCredits(pkg)} className="w-full">
                  Purchase
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
