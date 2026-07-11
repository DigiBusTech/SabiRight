import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
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
      const token = await user.getIdToken();
      const res = await fetch(`/api/bookings/user/${user.uid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load bookings');
      return res.json();
    },
    enabled: !!user?.uid
  });

  // Bookings as a Professional/Vendor
  const { data: professionalBookings = [], isLoading: isLoadingPro } = useQuery({
    queryKey: ['bookings-professional', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      const token = await user.getIdToken();
      const res = await fetch(`/api/bookings/vendor/${user.uid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load bookings');
      return res.json();
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
        <div className="flex p-1 bg-slate-100 rounded-xl max-w-md shadow-sm">
          <button
            onClick={() => setActiveTab('citizen')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all",
              activeTab === 'citizen' 
                ? "bg-white text-primary shadow-sm" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50/50"
            )}
          >
            <UserCheck className="h-3.5 w-3.5" />
            As Citizen/Client ({citizenBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('professional')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all",
              activeTab === 'professional' 
                ? "bg-white text-primary shadow-sm" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50/50"
            )}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            As Professional ({professionalBookings.length})
          </button>
        </div>
      )}

      {currentBookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-2xl mx-auto">
          <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4 animate-bounce" />
          <h3 className="text-lg font-bold text-slate-900">
            {activeTab === 'citizen' ? "No citizen conversations yet" : "No client conversations yet"}
          </h3>
          <p className="text-slate-500 mt-2 text-sm px-4">
            {activeTab === 'citizen' 
              ? "Start a chat in the Civic Guard AI Agent or go to the Marketplace to connect with a professional."
              : "Client bookings and referrals from SabiRight AI chat will appear here."}
          </p>
          {activeTab === 'citizen' && (
            <div className="flex justify-center gap-3 mt-6">
              <Link href="/app/marketplace">
                <a className="px-4 py-2 bg-primary text-white font-bold text-xs rounded-lg hover:bg-primary/90 transition-all shadow-sm">
                  Browse Marketplace
                </a>
              </Link>
              <Link href="/app/civic-guard">
                <a className="px-4 py-2 border border-primary/20 text-primary font-bold text-xs rounded-lg bg-primary/5 hover:bg-primary/10 transition-all">
                  Chat with SabiGuard
                </a>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 max-w-4xl">
          {getSortedBookings(currentBookings).map((booking: any) => (
            <Link key={booking.id} href={`/app/bookings/${booking.id}`}>
              <Card className="hover:border-primary/50 transition-all hover:shadow-md cursor-pointer rounded-2xl border-slate-200/80 shadow-sm group">
                <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 group-hover:bg-blue-100/50 transition-colors">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                        {activeTab === 'citizen' 
                          ? (booking.service?.name || 'Professional Service') 
                          : `Client: ${booking.customerName || 'Anonymous Citizen'}`}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 max-w-xl leading-relaxed">
                        {booking.description?.split("---")[0]?.trim() || "No subject or description provided"}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs font-semibold text-slate-400">
                        <div className="flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Created: {formatBookingDate(booking.createdAt)}</span>
                        </div>
                        {booking.description?.includes("---") && (
                          <span className="bg-blue-50 text-blue-700 text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 font-bold">
                            <Sparkles className="h-3 w-3" /> Includes Pre-Case File
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-green-100 hover:bg-green-100 text-green-800 border-green-200 hidden sm:flex font-bold text-xs px-2.5 py-1 rounded-full">
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
