import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { MessageSquare, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Bookings() {
  const { user } = useAuth();
  
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings', user?.uid],
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

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading your conversations...</div>;

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Conversations</h2>
        <p className="text-slate-500 mt-1">Manage your chats with professionals</p>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No conversations yet</h3>
          <p className="text-slate-500 mt-2">Go to the Marketplace to connect with a professional.</p>
          <Link href="/app/marketplace">
            <a className="inline-block mt-4 px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90">
              Browse Marketplace
            </a>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking: any) => (
            <Link key={booking.id} href={`/app/bookings/${booking.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer rounded-2xl shadow-sm">
                <CardContent className="p-4 sm:p-6 flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <MessageSquare className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{booking.service?.name || 'Professional Service'}</h3>
                      <p className="text-sm text-slate-600 line-clamp-1">{booking.description}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs font-medium text-slate-400">
                        <Clock className="h-3 w-3" />
                        <span>Started {new Date(booking.createdAt || Date.now()).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-200 hidden sm:flex">
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
