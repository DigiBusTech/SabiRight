import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Send, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function BookingDetail() {
  const [, params] = useRoute<{id: string}>("/app/bookings/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  
  const id = params ? params.id : "";

  const { data: bookingDetails, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: async () => {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load booking');
      return res.json();
    },
    enabled: !!id
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['booking-messages', id],
    queryFn: async () => {
      if (!user) return [];
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/bookings/${id}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return [];
        return res.json();
      } catch (e) {
        return [];
      }
    },
    enabled: !!id && !!user,
    refetchInterval: 3000
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (msg: string) => {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/bookings/${id}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: msg, senderId: user?.uid })
      });
      if (!res.ok) throw new Error('Failed to send');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-messages', id] });
      setMessage("");
    }
  });

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading conversation...</div>;
  
  if (!bookingDetails?.booking) return (
    <div className="p-8 text-center space-y-4">
      <h2 className="text-xl font-bold">Conversation not found</h2>
      <Button onClick={() => setLocation("/app/marketplace")}>Back to Marketplace</Button>
    </div>
  );

  const booking = bookingDetails.booking;
  const isVendor = user?.uid === booking.vendorId;
  const otherPartyName = isVendor ? booking.customerName : booking.service?.name || "Professional";

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation(isVendor ? "/app/professional-dashboard" : "/app/marketplace")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Conversation with {otherPartyName}</h2>
          <p className="text-sm text-slate-500">Subject: {booking.description.split("---")[0].trim()}</p>
        </div>
        <Badge className="ml-auto bg-blue-100 text-blue-800 border-blue-200">
          Active Case
        </Badge>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-slate-200 shadow-sm">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {/* Pre-Case File - visible for professionals */}
          {isVendor && booking.description.includes("---") && (
            <div className="bg-blue-100 border border-blue-200 rounded-2xl p-4 mb-4">
              <p className="text-xs font-bold text-blue-800 mb-2">Pre-Case File Summary</p>
              <div className="prose prose-sm text-blue-700 max-w-none">
                <p className="whitespace-pre-wrap">{booking.description.split("---")[1].trim()}</p>
              </div>
            </div>
          )}

          {/* Initial Message */}
          <div className={`flex items-start gap-3 ${isVendor ? 'flex-row' : 'flex-row-reverse'}`}>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {isVendor ? 'U' : 'Me'}
              </AvatarFallback>
            </Avatar>
            <div className={`rounded-2xl p-3 max-w-[80%] ${isVendor ? 'bg-white border text-slate-800' : 'bg-primary text-white'}`}>
              <p className="text-sm whitespace-pre-wrap">{booking.description.split("---")[0].trim()}</p>
            </div>
          </div>

          {/* Dynamic Messages */}
          {messages.map((msg: any, i: number) => {
            const isMe = msg.senderId === user?.uid;
            return (
              <div key={i} className={`flex items-start gap-3 ${!isMe ? 'flex-row' : 'flex-row-reverse'}`}>
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {isMe ? 'Me' : 'P'}
                  </AvatarFallback>
                </Avatar>
                <div className={`rounded-2xl p-3 max-w-[80%] ${!isMe ? 'bg-white border text-slate-800' : 'bg-primary text-white'}`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
        <div className="p-3 bg-white border-t flex gap-2">
          <Input 
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type your message..."
            onKeyDown={e => e.key === 'Enter' && message.trim() && sendMessageMutation.mutate(message)}
            className="flex-1 bg-slate-50 border-slate-200"
          />
          <Button 
            disabled={!message.trim() || sendMessageMutation.isPending}
            onClick={() => sendMessageMutation.mutate(message)}
            className="shrink-0 rounded-full w-10 h-10 p-0 flex items-center justify-center"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
