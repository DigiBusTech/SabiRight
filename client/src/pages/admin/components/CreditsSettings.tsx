import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Save, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";

export function CreditsSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});

  const { data: settings = [] } = useQuery<any[]>({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.ok ? res.json() : [];
    }
  });

  const saveSetting = useMutation({
    mutationFn: async ({ key, value, category }: { key: string, value: string, category: string }) => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ key, value, category })
      });
      if (!res.ok) throw new Error('Failed to save');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast({ title: "Saved", description: "Setting updated successfully" });
    }
  });

  const getSetting = (key: string) => settings.find((s: any) => s.key === key)?.value || "";

  const handleSave = (key: string, category: string) => {
    const value = localSettings[key] ?? getSetting(key);
    saveSetting.mutate({ key, value, category });
  };

  const handleChange = (key: string, value: string) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Credits & Rewards</h2>
          <p className="text-slate-500 mt-1">Manage platform costs and referral incentives.</p>
        </div>
      </div>

      <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <CardTitle>Referral Rewards</CardTitle>
        </CardHeader>
        <CardContent className="p-8 pt-0 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Referral Signup Reward (to new user)</Label>
              <div className="flex gap-2">
                <Input 
                  type="number" 
                  value={localSettings['credit_reward_referral'] ?? getSetting('credit_reward_referral') ?? '10'} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('credit_reward_referral', e.target.value)} 
                />
                <Button size="icon" onClick={() => handleSave('credit_reward_referral', 'credit_rewards')}>
                  <Save className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-slate-500">Credits given to the new user when they sign up with a code.</p>
            </div>
            <div className="space-y-2">
              <Label>Referrer Bonus (to inviter)</Label>
              <div className="flex gap-2">
                <Input 
                  type="number" 
                  value={localSettings['referral_reward_credits'] ?? getSetting('referral_reward_credits') ?? '50'} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('referral_reward_credits', e.target.value)} 
                />
                <Button size="icon" onClick={() => handleSave('referral_reward_credits', 'credit_rewards')}>
                  <Save className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-slate-500">Credits given to the person who shared the referral link.</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <CardTitle>Feature Costs</CardTitle>
        </CardHeader>
        <CardContent className="p-8 pt-0 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>AI Legal Query Cost</Label>
              <div className="flex gap-2">
                <Input 
                  type="number" 
                  value={localSettings['credit_cost_ai_query'] ?? getSetting('credit_cost_ai_query') ?? '1'} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('credit_cost_ai_query', e.target.value)} 
                />
                <Button size="icon" onClick={() => handleSave('credit_cost_ai_query', 'credit_costs')}>
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
