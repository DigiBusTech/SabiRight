import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { Send, ArrowLeft, Image as ImageIcon, X, Clock, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

export default function BookingDetail() {
  const [, params] = useRoute<{id: string}>("/app/bookings/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
    mutationFn: async (payload: { msg: string; attachments?: string[] }) => {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/bookings/${id}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          message: payload.msg, 
          attachments: payload.attachments || [], 
          senderId: user?.uid 
        })
      });
      if (!res.ok) throw new Error('Failed to send');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-messages', id] });
      setMessage("");
      setSelectedImage(null);
    },
    onError: (err: any) => {
      toast({
        title: "Error sending message",
        description: err.message,
        variant: "destructive"
      });
    }
  });

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDimension = 800; // Compress to max 800px width/height for DB optimization

          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string); // fallback
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7); // 70% quality JPEG
          resolve(compressedBase64);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    setIsCompressing(true);
    try {
      const compressedBase64 = await compressImage(file);
      setSelectedImage(compressedBase64);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error compressing image",
        description: "Could not compress the selected image.",
        variant: "destructive"
      });
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSend = () => {
    if (!message.trim() && !selectedImage) return;
    sendMessageMutation.mutate({
      msg: message,
      attachments: selectedImage ? [selectedImage] : []
    });
  };

  const formatMessageTime = (createdAt: any) => {
    if (!createdAt) return "";
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

  if (isLoading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading conversation...</div>;
  
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
          {/* Pre-Case File - visible for BOTH user/citizen and professional */}
          {booking.description.includes("---") && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 text-blue-800 dark:text-blue-300 rounded-2xl p-4 mb-4 shadow-sm">
              <p className="text-xs font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                SabiRight Pre-Case File & AI Chat Summary
              </p>
              <div className="prose prose-sm dark:prose-invert text-blue-700 dark:text-blue-300 max-w-none">
                <p className="whitespace-pre-wrap">{booking.description.split("---")[1].trim()}</p>
              </div>
            </div>
          )}

          {/* Initial Message */}
          <div className={`flex items-start gap-3 ${isVendor ? 'flex-row' : 'flex-row-reverse'}`}>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {isVendor ? 'U' : 'Me'}
              </AvatarFallback>
            </Avatar>
            <div className={`rounded-2xl p-3 max-w-[80%] flex flex-col ${isVendor ? 'bg-white border text-slate-800' : 'bg-primary text-white'}`}>
              <p className="text-sm whitespace-pre-wrap">{booking.description.split("---")[0].trim()}</p>
              <span className="text-[9px] opacity-70 mt-1.5 self-end flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                {new Date(booking.createdAt || Date.now()).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Dynamic Messages */}
          {messages
            .slice()
            .sort((a: any, b: any) => {
              const aDate = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : a.createdAt?._seconds ? a.createdAt._seconds * 1000 : new Date(a.createdAt).getTime();
              const bDate = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : b.createdAt?._seconds ? b.createdAt._seconds * 1000 : new Date(b.createdAt).getTime();
              return aDate - bDate;
            })
            .map((msg: any) => {
              const isMe = msg.senderId === user?.uid;
              return (
                <div key={msg.id || msg.createdAt || Math.random()} className={`flex items-start gap-3 ${!isMe ? 'flex-row' : 'flex-row-reverse'}`}>
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {isMe ? 'Me' : (isVendor ? 'U' : 'P')}
                  </AvatarFallback>
                </Avatar>
                <div className={`rounded-2xl p-3 max-w-[80%] flex flex-col ${!isMe ? 'bg-white border text-slate-800 shadow-sm' : 'bg-primary text-white'}`}>
                  {msg.message && <p className="text-sm whitespace-pre-wrap">{msg.message}</p>}
                  
                  {/* Attachments rendering */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {msg.attachments.map((att: any, idx: number) => {
                        const url = typeof att === 'string' ? att : att.url;
                        if (url && (url.startsWith('data:image/') || url.includes('uploads/'))) {
                          return (
                            <img 
                              key={idx} 
                              src={url} 
                              alt="Attached file" 
                              className="rounded-lg max-w-full max-h-60 object-contain shadow-sm border border-slate-200" 
                            />
                          );
                        }
                        return null;
                      })}
                    </div>
                  )}

                  <span className="text-[9px] opacity-70 mt-1.5 self-end flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {formatMessageTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </CardContent>

        {/* Selected Image Preview */}
        {selectedImage && (
          <div className="p-3 bg-slate-50 border-t flex items-center gap-3">
            <div className="relative h-16 w-16 rounded-lg border border-slate-200 overflow-hidden shadow-sm">
              <img src={selectedImage} alt="Selected preview" className="h-full w-full object-cover" />
              <button 
                onClick={() => setSelectedImage(null)} 
                className="absolute top-0.5 right-0.5 bg-red-500 text-white p-0.5 rounded-full hover:bg-red-600 transition-colors shadow"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <p className="text-xs text-slate-500 font-medium">Image selected (auto-compressed)</p>
          </div>
        )}

        <div className="p-3 bg-white border-t flex gap-2 items-center">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageSelect} 
            accept="image/*" 
            className="hidden" 
          />
          <Button 
            variant="outline" 
            size="icon" 
            type="button"
            disabled={isCompressing || sendMessageMutation.isPending}
            onClick={() => fileInputRef.current?.click()}
            className="h-10 w-10 shrink-0 rounded-full border-slate-200 hover:bg-slate-100 text-slate-500"
            title="Upload Image"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>

          <Input 
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder={isCompressing ? "Processing image..." : "Type your message..."}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            disabled={isCompressing || sendMessageMutation.isPending}
            className="flex-1 bg-slate-50 border-slate-200 h-10"
          />

          <Button 
            disabled={(!message.trim() && !selectedImage) || sendMessageMutation.isPending || isCompressing}
            onClick={handleSend}
            className="shrink-0 rounded-full w-10 h-10 p-0 flex items-center justify-center shadow-sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
