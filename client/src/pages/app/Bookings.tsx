import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { MessageSquare, Clock, ShieldCheck, UserCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Bookings() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'citizen' | 'professional'>('citizen');
  
  // Bookings as a Citizen/Client
  const { data: citizenBookings = [], isLoading: isLoadingCitizen } = useQuery({
    queryKey: ['bookings-citizen', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/bookings/user/${user.uid}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return [];
        return await res.json();
      } catch (err) {
        console.warn("Could not load citizen bookings:", err);
        return [];
      }
    },
    enabled: !!user?.uid
  });

  // Bookings as a Professional/Vendor
  const { data: professionalBookings = [], isLoading: isLoadingPro } = useQuery({
    queryKey: ['bookings-professional', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/bookings/vendor/${user.uid}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return [];
        return await res.json();
      } catch (err) {
        console.warn("Could not load professional bookings:", err);
        return [];
      }
    },
    enabled: !!user?.uid && !!profile?.isVendor
  });

  const isLoading = isLoadingCitizen || (profile?.isVendor && isLoadingPro);
  const currentBookings = activeTab === 'citizen' ? citizenBookings : professionalBookings;

  const formatBookingDate = (createdAt: any) => {
    if (!createdAt) return "Unknown Date";
    let date: Date;
    if (createdAt.toDate && typeof createdAt.toDate === 'function') {
      date = createdAt.toDate();
    } else if (createdAt._seconds) {
      date = new Date(createdAt._seconds * 1000);
    } else {
      date = new Date(createdAt);
    }
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSortedBookings = (list: any[]) => {
    return [...list].sort((a: any, b: any) => {
      const getMs = (dateField: any) => {
        if (!dateField) return 0;
        if (dateField.toDate && typeof dateField.toDate === 'function') {
          return dateField.toDate().getTime();
        }
        if (dateField._seconds) {
          return dateField._seconds * 1000;
        }
        return new Date(dateField).getTime();
      };
      return getMs(b.createdAt) - getMs(a.createdAt); // Sorted by latest (newest first, newest at the top)
    });
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading your conversations...</div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Conversations</h2>
          <p className="text-slate-500 mt-1">Manage your chats and bookings with professionals or clients</p>
        </div>
      </div>

      {/* Modern custom sliding tabs if user is a Professional/Vendor */}
      {profile?.isVendor && (
        <div className="flex p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md shadow-xs">
          <button
            onClick={() => setActiveTab('citizen')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer",
              activeTab === 'citizen' 
                ? "bg-white dark:bg-slate-800 text-primary shadow-xs" 
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <UserCheck className="h-3.5 w-3.5" />
            As Citizen/Client ({citizenBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('professional')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer",
              activeTab === 'professional' 
                ? "bg-white dark:bg-slate-800 text-primary shadow-xs" 
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            As Professional ({professionalBookings.length})
          </button>
        </div>
      )}

      {currentBookings.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl mx-auto p-6">
          <MessageSquare className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            {activeTab === 'citizen' ? "No citizen consultations yet" : "No client bookings yet"}
          </h3>
          <p className="text-slate-500 text-xs sm:text-sm mt-2 max-w-md mx-auto leading-relaxed">
            {activeTab === 'citizen' 
              ? "Start a session with SabiRight AI or book an accredited legal practitioner from the Directory."
              : "Client retainers and inquiries from SabiRight AI will appear here."}
          </p>
          {activeTab === 'citizen' && (
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <Link href="/app/marketplace">
                <Button className="h-10 px-4 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl shadow-xs">
                  Browse Directory
                </Button>
              </Link>
              <Link href="/app/civic">
                <Button variant="outline" className="h-10 px-4 border-primary/20 text-primary font-bold text-xs rounded-xl bg-blue-50/50 dark:bg-blue-950/30">
                  Start Legal First Aid
                </Button>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 max-w-4xl">
          {getSortedBookings(currentBookings).map((booking: any) => (
            <Link key={booking.id} href={`/app/bookings/${booking.id}`}>
              <Card className="hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs group">
                <CardContent className="p-4 sm:p-6 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-primary flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900 group-hover:scale-105 transition-transform">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-primary transition-colors truncate">
                        {activeTab === 'citizen' 
                          ? (booking.service?.name || 'Professional Service') 
                          : `Client: ${booking.customerName || 'Anonymous Citizen'}`}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {booking.description?.split("---")[0]?.trim() || "No description provided"}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-3 text-xs font-semibold">
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold">
                          <Clock className="h-3 w-3" />
                          <span>{formatBookingDate(booking.createdAt)}</span>
                        </div>
                        {booking.description?.includes("---") && (
                          <span className="bg-blue-50 dark:bg-blue-950/60 text-primary dark:text-blue-300 text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 font-bold border border-blue-200 dark:border-blue-900">
                            <Sparkles className="h-3 w-3" /> Pre-Case File
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold text-xs px-2.5 py-1 rounded-full shrink-0">
                    Active
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
