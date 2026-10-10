import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Zap, CheckCircle2, Languages } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { SabiContributorModal } from "@/components/SabiContributorModal";

interface CreditPlan {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  bonus?: number;
  popular?: boolean;
  features: string[];
}

export default function Credits() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showSabiModal, setShowSabiModal] = useState(false);

  // Fetch available credit packages from admin settings
  const { data: creditPlans = [] } = useQuery<CreditPlan[]>({
    queryKey: ['credit-packages'],
    queryFn: async () => {
      const res = await fetch('/api/credit-packages');
      if (!res.ok) {
        // Return default plans if API fails
        return [
          {
            id: 'basic',
            name: 'Starter Pack',
            credits: 50,
            price: 2000,
            currency: 'NGN',
            features: ['50 AI queries', 'Basic support', 'Valid for 30 days']
          },
          {
            id: 'popular',
            name: 'Popular Pack',
            credits: 150,
            price: 5000,
            currency: 'NGN',
            bonus: 20,
            popular: true,
            features: ['150 AI queries', '+20 bonus credits', 'Priority support', 'Valid for 30 days']
          },
          {
            id: 'premium',
            name: 'Premium Pack',
            credits: 300,
            price: 9000,
            currency: 'NGN',
            bonus: 50,
            features: ['300 AI queries', '+50 bonus credits', 'Premium support', 'Valid for 60 days']
          },
          {
            id: 'enterprise',
            name: 'Enterprise Pack',
            credits: 1000,
            price: 25000,
            currency: 'NGN',
            bonus: 200,
            features: ['1000 AI queries', '+200 bonus credits', '24/7 support', 'Valid for 90 days']
          }
        ];
      }
      const packages = await res.json();
      // Map packages to include features array and currency
      return packages.map((pkg: any) => ({
        ...pkg,
        currency: 'NGN',
        features: [
          `${pkg.credits} credits`,
          pkg.bonus > 0 ? `+${pkg.bonus} bonus credits` : null,
          pkg.description || 'Full platform access'
        ].filter(Boolean)
      }));
    }
  });

  const handlePurchase = (plan: CreditPlan) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase credits",
        variant: "destructive"
      });
      setLocation('/auth/login');
      return;
    }

    // Navigate to payment page with plan details
    setLocation(`/app/payment?type=credit_purchase&planId=${plan.id}&amount=${plan.price}&credits=${plan.credits + (plan.bonus || 0)}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Coins className="h-7 w-7 text-amber-500" />
            Get More Credits
          </h2>
          <p className="text-slate-500 text-sm md:text-base mt-1">
            Purchase credits to access AI-powered features and services
          </p>
        </div>
      </div>

      {/* Credit Plans Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {creditPlans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative rounded-3xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white dark:bg-slate-900 overflow-hidden ${
              plan.popular 
                ? 'border-2 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30' 
                : 'border border-slate-200 dark:border-slate-800'
            }`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0">
                <div className="bg-gradient-to-l from-amber-500 to-amber-600 text-white text-[10px] font-mono font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-xs flex items-center gap-1">
                  <Zap className="h-3 w-3 fill-current" />
                  Most Popular
                </div>
              </div>
            )}
            
            <CardHeader className="pb-3 pt-6 px-6">
              <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white">{plan.name}</CardTitle>
              <div className="mt-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{formatCurrency(plan.price)}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-xs font-bold">
                    {plan.credits} Credits
                  </Badge>
                  {plan.bonus && (
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                      +{plan.bonus} Bonus
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 px-6 pb-6">
              <ul className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                onClick={() => handlePurchase(plan)}
                className={`w-full h-11 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer ${
                  plan.popular 
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white shadow-amber-500/20' 
                    : 'bg-primary hover:bg-primary/90 text-white shadow-blue-500/20'
                }`}
              >
                Purchase Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* How Credits Work */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="rounded-3xl border border-blue-200 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/60 to-white dark:from-slate-900 dark:to-slate-900/60 shadow-sm p-2">
          <CardHeader>
            <CardTitle className="text-base font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
              <Zap className="h-5 w-5 text-primary" />
              How Sovereign Credits Work
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p><strong className="text-slate-900 dark:text-white">SabiGuard AI Legal Queries:</strong> Comprehensive jurisprudence and case law scripts cost 5 credits.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p><strong className="text-slate-900 dark:text-white">Civic AI Assistance:</strong> Standard statutory queries & educational rights cost 1 credit.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <p><strong>SabiMove:</strong> Advanced route planning costs 3 credits</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <p><strong>Job Search:</strong> AI job search and recommendations cost 2 credits</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <p><strong>Daily Bonus:</strong> Log in daily to receive free credits!</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-green-700">
              <Languages className="h-5 w-5" />
              Earn Free Credits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Help us train our AI model in local Nigerian languages and earn credits for every contribution.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">+5 Credits</Badge>
                <span>For each verified translation</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">+2 Credits</Badge>
                <span>For each verification vote</span>
              </div>
            </div>
            <Button 
              className="w-full bg-green-600 hover:bg-green-700 mt-2"
              onClick={() => setShowSabiModal(true)}
            >
              Start Contributing
            </Button>
          </CardContent>
        </Card>
      </div>

      <SabiContributorModal
        isOpen={showSabiModal}
        onClose={() => setShowSabiModal(false)}
      />
    </div>
  );
}
