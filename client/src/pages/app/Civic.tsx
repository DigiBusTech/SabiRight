import { useState, useEffect, useRef } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { 
  Send, Sparkles, User, ShieldCheck, Mic, AlertCircle, Plus, 
  MessageSquare, History, Trash2, Download, Store, MapPin
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import ReactMarkdown from "react-markdown";
import { SurveyDialog } from "../../components/SurveyDialog";
import { SabiContributorModal } from "../../components/SabiContributorModal";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../components/ui/sheet";
import { CustomConfirm } from "../../components/CustomConfirm";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface Message {
  role: "user" | "ai";
  text?: string;
  content?: string;
  timestamp?: string;
}

interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
}

export default function CivicGuard() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showSurveyDialog, setShowSurveyDialog] = useState(false);
  const [showSabiModal, setShowSabiModal] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [, setLocation] = useLocation();

  const { data: storageInfo } = useQuery({
    queryKey: [`storage-${user?.uid}`],
    queryFn: async () => {
      const res = await fetch(`/api/profile/${user?.uid}`);
      const d = await res.json();
      return { used: d.chatStorageUsed || 0, limit: d.chatStorageLimit || 524288 };
    },
    enabled: !!user?.uid,
  });

  const storageUsed = storageInfo?.used || 0;
  const storageLimit = storageInfo?.limit || 524288;
  const storagePercent = Math.min(100, Math.round((storageUsed / storageLimit) * 100));
  const storageFormatted = (storageUsed / 1024).toFixed(1) + ' KB';
  const limitFormatted = (storageLimit / 1024).toFixed(0) + ' KB';

  const { data: sessions, isLoading: isLoadingSessions } = useQuery<ChatSession[]>({
    queryKey: ['sabiguard-chats', user?.uid],
    queryFn: async () => {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/sabiguard/chats?userId=${user?.uid}`, { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
    enabled: !!user?.uid,
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: chatMessages } = useQuery<Message[]>({
    queryKey: ['sabiguard-messages', currentChatId],
    queryFn: async () => {
      if (!user || !currentChatId) return [];
      const token = await user?.getIdToken();
      const res = await fetch(`/api/sabiguard/chats/${currentChatId}/messages`, { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
    enabled: !!currentChatId && !!user,
  });

  const { data: suggestedProfessionals } = useQuery({
    queryKey: ['suggested-professionals', profile?.city],
    queryFn: async () => {
      const cityParam = profile?.city ? `?city=${encodeURIComponent(profile.city)}` : '';
      const res = await fetch(`/api/services${cityParam}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.slice(0, 2);
    }
  });

  const [isContacting, setIsContacting] = useState(false);
  const handleContactProfessional = async (prof: any) => {
    if (!user) return;
    setIsContacting(true);
    try {
      const token = await user.getIdToken();
      const bookingRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          serviceId: prof.id,
          userId: user.uid,
          vendorId: prof.vendorId,
          totalAmount: 0,
          description: "Referred from SabiGuard AI Assistant.",
          scheduledDate: null,
          milestones: []
        })
      });
      if (!bookingRes.ok) throw new Error("Failed to contact professional");
      const booking = await bookingRes.json();
      toast({ title: "Message Sent!", description: `Starting conversation with ${prof.name}...` });
      setTimeout(() => setLocation(`/app/bookings/${booking.id}`), 500);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsContacting(false);
    }
  };

  useEffect(() => {
    if (chatMessages) setMessages(chatMessages);
    else if (currentChatId === null) setMessages([]);
  }, [chatMessages, currentChatId]);

  const createChatMutation = useMutation({
    mutationFn: async (title: string) => {
      const token = await user?.getIdToken();
      const res = await fetch('/api/sabiguard/chats', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ userId: user?.uid, title }) });
      return res.json();
    },
    onSuccess: (nc) => { 
        queryClient.invalidateQueries({ queryKey: ['sabiguard-chats'] }); 
        setCurrentChatId(nc.id); 
    }
  });

  const deleteChatMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/sabiguard/chats/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      return res.json();
    },
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['sabiguard-chats'] }); 
      if (currentChatId) setCurrentChatId(null);
      toast({ 
        title: "SUCCESSFUL", 
        description: "Chat history removed successfully.",
        className: "bg-green-600 text-white border-none shadow-2xl rounded-2xl p-6 font-bold"
      });
    },
    onError: () => {
      toast({
        title: "ERROR",
        description: "Could not delete chat history.",
        variant: "destructive",
        className: "bg-red-600 text-white border-none shadow-2xl rounded-2xl p-6 font-bold"
      });
    }
  });

  const exportChatAsPDF = (id: string) => {
    if (messages.length === 0) {
      toast({ 
        title: "ERROR", 
        description: "No messages to export.", 
        variant: "destructive",
        className: "bg-red-600 text-white border-none shadow-2xl rounded-2xl p-6 font-bold"
      });
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("SabiRight Pre-Vetted Case File", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);

    const tableColumn = ["Role", "Message", "Timestamp"];
    const tableRows: (string | null | undefined)[][] = [];

    messages.forEach(message => {
      const messageData = [
        message.role === 'ai' ? 'SabiGuard AI' : 'User',
        message.text || message.content,
        new Date().toLocaleString()
      ];
      tableRows.push(messageData);
    });

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: { cellWidth: 'wrap' },
      columnStyles: {
        1: { cellWidth: 130 } // Adjust width for message content
      }
    });

    doc.save(`SabiRight_CaseFile_${id}.pdf`);
    toast({ 
      title: "SUCCESSFUL", 
      description: "Pre-vetted case file downloaded.", 
      className: "bg-green-600 text-white border-none shadow-2xl rounded-2xl p-6 font-bold" 
    });
  };

  const { data: credits, refetch: refetchCredits } = useQuery({
    queryKey: [`credits-${user?.uid}`],
    queryFn: async () => { const res = await fetch(`/api/credits/${user?.uid}/available`); return res.json(); },
    enabled: !!user?.uid,
  });

  const toggleListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast({ title: "NOT SUPPORTED", description: "Browser speech not supported.", className: "bg-red-600 text-white border-none shadow-2xl rounded-2xl p-6 font-bold" });
      return;
    }
    const recognition = new SR();
    recognition.onresult = (e: any) => setInput(e.results[0][0].transcript);
    recognition.start();
    setIsListening(true);
    recognition.onend = () => setIsListening(false);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    if ((credits?.totalCredits || 0) < 1) {
      toast({ 
        title: "NOT COMPLETED", 
        description: "Insufficient credits. Please upgrade.",
        variant: "destructive", 
        className: "bg-red-600 text-white border-none shadow-2xl rounded-2xl p-6 font-bold" 
      });
      return;
    }
    const txt = input; setInput(""); setIsTyping(true);
    let cid = currentChatId;
    if (!cid) { const nc = await createChatMutation.mutateAsync(txt.slice(0, 30)); cid = nc.id; setCurrentChatId(cid); }
    setMessages(p => [...p, { role: "user", text: txt }]);
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/ai/civic/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ message: txt, chatId: cid, city: profile?.city || "Lagos", isUrgent }) });
      const d = await res.json();
      if (!res.ok) {
        throw new Error(d.error || "AI service error");
      }
      setMessages(p => [...p, { role: "ai", text: d.response }]);
      refetchCredits();
      queryClient.invalidateQueries({ queryKey: ['sabiguard-messages', cid] });
    } catch (e: any) {
      toast({ title: "ERROR", description: e.message || "AI service unavailable.", variant: "destructive", className: "bg-red-600 text-white border-none shadow-2xl rounded-2xl p-6 font-bold" });
    } finally { setIsTyping(false); }
  };

  useEffect(() => { 
    if (bottomRef.current && messages.length > 0) {
      bottomRef.current.scrollIntoView({ behavior: 'auto' }); 
    }
  }, [messages]);
  
  // Separate effect for typing to avoid forced scrolls on every single character
  useEffect(() => { 
    if (isTyping && bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isTyping]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h3 className="font-bold flex items-center gap-2 text-sm text-slate-800"><History className="h-4 w-4" /> History</h3>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setCurrentChatId(null); setMessages([]); }}><Plus className="h-4 w-4" /></Button>
      </div>
      <ScrollArea className="flex-1 -mx-2 px-2">
        <div className="space-y-2 pb-6 pr-2">
          {isLoadingSessions ? (<div className="text-center py-4">...</div>) : (sessions || []).length === 0 ? (<p className="text-xs text-center text-slate-400">No chats yet</p>) : (
            (sessions || []).map((s) => (
              <div key={s.id} onClick={() => { setCurrentChatId(s.id); setIsHistoryOpen(false); }} className={cn("group w-full text-left p-2.5 rounded-xl transition-all flex items-center gap-2 border cursor-pointer", currentChatId === s.id ? "bg-primary text-white border-primary shadow-sm" : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50")}>
                <MessageSquare className={cn("h-4 w-4 shrink-0", currentChatId === s.id ? "text-white" : "text-primary")} />
                <span className="truncate flex-1 text-[10px] font-semibold leading-tight">{s.title}</span>
                <div className="flex items-center shrink-0">
                  <CustomConfirm
                    trigger={
                      <button onClick={(e) => e.stopPropagation()} className={cn("p-1 rounded transition-colors", currentChatId === s.id ? "text-white/80 hover:bg-white/20 hover:text-white" : "text-slate-400 hover:text-red-500 hover:bg-red-50")}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    }
                    title="Delete Chat History?"
                    description="This action cannot be undone. This will permanently delete this chat session."
                    onConfirm={() => deleteChatMutation.mutate(s.id)}
                  />
                  <button onClick={(e) => { e.stopPropagation(); exportChatAsPDF(s.id); }} className={cn("p-1 rounded transition-colors", currentChatId === s.id ? "text-white/80 hover:bg-white/20 hover:text-white" : "text-slate-400 hover:text-blue-500 hover:bg-blue-50")}><Download className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      <div className="pt-4 border-t mt-auto shrink-0">
        <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-tight"><span>Cloud Storage</span><span>{storagePercent}%</span></div>
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-2"><div className={cn("h-full transition-all", storagePercent > 90 ? "bg-red-500" : "bg-primary")} style={{ width: `${storagePercent}%` }} /></div>
        <p className="text-[10px] text-slate-400 font-medium">{storageFormatted} of {limitFormatted} used</p>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col md:grid md:grid-cols-12 gap-6 overflow-hidden">
      <div className="hidden md:flex md:col-span-4 lg:col-span-3 flex-col bg-white border rounded-3xl p-5 shadow-sm overflow-hidden"><SidebarContent /></div>
      <div className={cn("flex flex-col bg-white rounded-3xl border shadow-sm overflow-hidden h-full md:col-span-8 lg:col-span-9 transition-all", isUrgent ? "ring-2 ring-red-500 border-red-500 ring-inset" : "")}>
        <div className={cn("p-4 border-b flex items-center justify-between transition-colors", isUrgent ? "bg-red-50" : "bg-slate-50/50")}>
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg transition-colors", isUrgent ? "bg-red-100 text-red-600" : "bg-primary/10 text-primary")}><Sparkles className="h-5 w-5" /></div>
            <div><h2 className="font-bold text-sm">SabiGuard AI Agent</h2><p className="text-[10px] text-slate-500">{isUrgent ? "🚨 Urgent Assistance Mode" : "Law-based Guidance"}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsUrgent(!isUrgent)} className={cn("text-[11px] h-8 font-bold transition-all px-3", isUrgent ? "bg-red-600 text-white border-red-600 hover:bg-red-700 shadow-md" : "hover:bg-slate-100")}>{isUrgent ? "Disable Urgent" : "Enable Urgent"}</Button>
            <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
              <SheetTrigger asChild><Button variant="outline" size="sm" className="md:hidden flex items-center gap-2 h-8 px-3 border-primary/20 bg-primary/5 text-primary"><History className="h-4 w-4" /><span className="text-[11px] font-bold">History</span></Button></SheetTrigger>
              <SheetContent side="right" className="w-[310px] p-0 border-none shadow-2xl"><div className="h-full flex flex-col p-5 bg-white"><SidebarContent /></div></SheetContent>
            </Sheet>
            <Button variant="outline" size="sm" onClick={() => { setMessages([]); setCurrentChatId(null); }} className="h-8 w-8 p-0 md:flex hidden hover:bg-slate-100"><Plus className="h-4 w-4" /></Button>
          </div>
        </div>
        <ScrollArea className="flex-1 p-4" key={currentChatId || 'new'}>
          <div className="space-y-6">
          {messages.length === 0 && (<div className="text-center text-slate-400 mt-20"><ShieldCheck className="h-10 w-10 mx-auto mb-4 opacity-20" /><p className="text-sm">How can I help you with Nigerian law today?</p></div>)}
          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-3 max-w-[90%] animate-in fade-in slide-in-from-bottom-2 duration-300", m.role === "user" ? "ml-auto flex-row-reverse" : "")}>
              <Avatar className={cn("h-8 w-8 shrink-0 shadow-sm", m.role === "ai" ? "bg-primary" : "bg-slate-200")}><AvatarFallback className="text-[10px]">{m.role === "ai" ? "AI" : "U"}</AvatarFallback></Avatar>
              <div className={cn("p-4 rounded-2xl text-sm shadow-sm prose prose-sm max-w-none transition-colors", m.role === "user" ? (isUrgent ? "bg-red-600 text-white" : "bg-primary text-white") : "bg-slate-50 border rounded-tl-none")}>
                <ReactMarkdown>{(m.text || m.content || "").replace("[SHOW_PROFESSIONALS]", "")}</ReactMarkdown>
                {m.role === "ai" && ((m.text || m.content || "").includes("[SHOW_PROFESSIONALS]")) && suggestedProfessionals && suggestedProfessionals.length > 0 && (
                  <div className="mt-4 border-t pt-4 border-slate-200">
                    <p className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-1"><Store className="h-3.5 w-3.5" /> Suggested Professionals in your area</p>
                    <div className="flex flex-col gap-3">
                      {suggestedProfessionals.map((prof: any) => (
                        <div key={prof.id} className="bg-white border rounded-xl p-3 shadow-sm flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-sm text-slate-800">{prof.name}</p>
                              <p className="text-[11px] text-slate-500 font-medium">{prof.type}</p>
                            </div>
                            <div className="bg-green-100 text-green-800 text-[10px] px-2 py-0.5 rounded-full font-bold">Verified</div>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <MapPin className="h-3 w-3" /> {prof.location}
                          </div>
                          <Button 
                            size="sm" 
                            className="w-full h-8 text-[11px] font-bold mt-1 bg-primary text-white hover:bg-primary/90"
                            onClick={() => handleContactProfessional(prof)}
                            disabled={isContacting}
                          >
                            {isContacting ? "Connecting..." : "Contact Professional"}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (<div className="flex gap-3"><Avatar className="h-8 w-8 bg-primary text-white shrink-0 animate-pulse shadow-sm"><ShieldCheck className="h-4 w-4" /></Avatar><div className="bg-slate-50 border p-4 rounded-2xl rounded-tl-none flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span><span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span><span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span></div></div>)}
          <div ref={bottomRef} />
        </div></ScrollArea>
        <div className="p-4 border-t bg-white">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-3">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={isUrgent ? "Describe emergency..." : "Ask about your rights..."} className={cn("flex-1 rounded-xl h-12 bg-slate-50 border-slate-100 transition-colors focus-visible:ring-primary", isUrgent ? "bg-red-50/50 border-red-100" : "")} />
            <Button type="button" size="icon" variant="outline" onClick={toggleListening} className={cn("h-12 w-12 rounded-xl transition-all", isListening ? "bg-red-500 text-white border-red-500 shadow-lg shadow-red-200" : "text-slate-400")}><Mic className="h-5 w-5" /></Button>
            <Button type="submit" id="send-message-btn" size="icon" className={cn("h-12 w-12 rounded-xl shadow-lg transition-all", isUrgent ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary/90")}><Send className="h-5 w-5" /></Button></form></div>
      </div>
      <SurveyDialog isOpen={showSurveyDialog} onClose={() => setShowSurveyDialog(false)} feature="civic-guard" />
      <SabiContributorModal isOpen={showSabiModal} onClose={() => setShowSabiModal(false)} />
    </div>
  );
}
