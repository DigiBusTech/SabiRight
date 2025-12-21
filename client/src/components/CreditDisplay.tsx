import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { Zap, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CreditDisplayProps {
  compact?: boolean;
  onClick?: () => void;
}

export function CreditDisplay({ compact = false, onClick }: CreditDisplayProps) {
  const { user } = useAuth();

  const { data: credits, isLoading } = useQuery({
    queryKey: [`credits-${user?.uid}`],
    queryFn: async () => {
      if (!user?.uid) return null;
      const res = await fetch(`/api/credits/${user.uid}/available`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user?.uid,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (!credits) return null;

  const percentageUsed = credits.totalCredits > 0 
    ? Math.round((credits.usedCredits / credits.totalCredits) * 100)
    : 0;

  const isLow = credits.availableCredits <= 2;

  if (compact) {
    return (
      <div 
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold ${
          isLow 
            ? 'bg-red-50 border-red-200 text-red-700' 
            : 'bg-blue-50 border-blue-200 text-blue-700'
        }`}
        onClick={onClick}
      >
        <Zap className={`h-4 w-4 ${isLow ? 'text-red-500' : 'text-blue-500'}`} />
        {credits.availableCredits}/{credits.totalCredits}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-slate-50 border border-blue-100 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`h-8 w-8 rounded-full ${isLow ? 'bg-red-100' : 'bg-blue-100'} flex items-center justify-center`}>
            <Zap className={`h-5 w-5 ${isLow ? 'text-red-600' : 'text-blue-600'}`} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-600 uppercase">Daily Credits</p>
            <p className="text-lg font-bold text-slate-900">
              {credits.availableCredits} / {credits.totalCredits}
            </p>
          </div>
        </div>
        {isLow && (
          <Badge className="bg-red-100 text-red-700 border-red-200">Low</Badge>
        )}
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded h-2 overflow-hidden mb-3 border border-blue-100">
        <div 
          className={`h-full transition-all ${
            isLow ? 'bg-red-500' : 'bg-blue-500'
          }`}
          style={{ width: `${percentageUsed}%` }}
        />
      </div>

      <p className="text-xs text-slate-600 mb-3">
        {percentageUsed}% of daily credits used • Resets in 24 hours
      </p>

      {isLow && (
        <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
          Upgrade Plan
        </Button>
      )}
    </div>
  );
}
