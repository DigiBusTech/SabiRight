import { useState, useEffect, useRef } from "react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { 
  Send, Sparkles, User, ShieldCheck, Mic, AlertCircle, Plus, 
  MessageSquare, History, Trash2, Download, Store, MapPin,
  Volume2, VolumeX
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

function LoadingMessage() {
  const messages = [
    "Securely initializing citizen portal...",
    "Consulting digital civic guidelines...",
    "Aligning with constitutional rights...",
    "Reviewing local policies and traditional laws...",
    "Formulating your SabiRight response..."
  ];
  
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Avatar className="h-8 w-8 bg-primary text-white shrink-0 animate-pulse shadow-sm">
        <ShieldCheck className="h-4 w-4" />
      </Avatar>
      <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-3 max-w-[85%] shadow-sm">
        {/* Pulsing shield glow indicator */}
        <div className="relative flex items-center justify-center h-5 w-5 shrink-0">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          <ShieldCheck className="h-4 w-4 text-primary animate-pulse" />
        </div>
        
        {/* Elegant cross-fading, sliding text */}
        <div className="h-5 overflow-hidden flex items-center">
          <p key={index} className="text-xs font-semibold text-slate-600 animate-in fade-in slide-in-from-bottom-1 duration-500">
            {messages[index]}
          </p>
        </div>
      </div>
    </div>
  );
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
  const [preferredLanguage, setPreferredLanguage] = useState("English");
  
  const [isAutoSpeak, setIsAutoSpeak] = useState(false);
  const [currentlySpeakingIndex, setCurrentlySpeakingIndex] = useState<number | null>(null);
  const recognitionRef = useRef<any>(null);

  // Stop reading text when component is unmounted
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSpeak = (text: string, index: number) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast({ title: "NOT SUPPORTED", description: "Text-to-speech not supported on this browser.", variant: "destructive" });
      return;
    }

    if (currentlySpeakingIndex === index) {
      window.speechSynthesis.cancel();
      setCurrentlySpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    
    // Clean markdown and UI trigger labels out of text for clean TTS reading
    const cleanText = text.replace(/\[SHOW_PROFESSIONALS\]/g, "")
                          .replace(/[*#_`~]/g, "")
                          .replace(/[-+•]\s+/g, "") // remove bullet markers for smooth text reading
                          .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    utterance.onend = () => {
      setCurrentlySpeakingIndex(null);
    };
    utterance.onerror = () => {
      setCurrentlySpeakingIndex(null);
    };

    setCurrentlySpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  };

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

  const { data: publicSettings = {} } = useQuery<any>({
    queryKey: ['/api/settings/public'],
    queryFn: async () => {
      const res = await fetch('/api/settings/public');
      if (!res.ok) return {};
      return res.json();
    }
  });

  // Get dynamic active languages list
  const activeLangsList = (() => {
    const raw = publicSettings['active_languages'];
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // Fallback
      }
    }
    return ["English", "Nigerian Pidgin", "Hausa", "Yoruba", "Igbo"];
  })();

  const { data: sessions, isLoading: isLoadingSessions } = useQuery<ChatSession[]>({
    queryKey: ['sabiguard-chats', user?.uid],
    queryFn: async () => {
      try {
        const token = await user?.getIdToken();
        const res = await fetch(`/api/sabiguard/chats?userId=${user?.uid}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) {
          console.error("[Civic] Failed to fetch sabiguard-chats:", res.status);
          return [];
        }
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch (err) {
        console.error("[Civic] Error in sabiguard-chats query:", err);
        return [];
      }
    },
    enabled: !!user?.uid,
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: chatMessages } = useQuery<Message[]>({
    queryKey: ['sabiguard-messages', currentChatId],
    queryFn: async () => {
      try {
        if (!user || !currentChatId) return [];
        const token = await user?.getIdToken();
        const res = await fetch(`/api/sabiguard/chats/${currentChatId}/messages`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) {
          console.error("[Civic] Failed to fetch sabiguard-messages:", res.status);
          return [];
        }
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch (err) {
        console.error("[Civic] Error in sabiguard-messages query:", err);
        return [];
      }
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
          milestones: [],
          chatId: currentChatId
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
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error(e);
        }
      }
      setIsListening(false);
      return;
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast({ title: "NOT SUPPORTED", description: "Browser speech not supported.", className: "bg-red-600 text-white border-none shadow-2xl rounded-2xl p-6 font-bold" });
      return;
    }
    
      try {
        const recognition = new SR();
        recognition.continuous = false;
        recognition.interimResults = false;
        
        if (preferredLanguage === "Hausa") {
          recognition.lang = 'ha-NG';
        } else if (preferredLanguage === "Yoruba") {
          recognition.lang = 'yo-NG';
        } else if (preferredLanguage === "Igbo") {
          recognition.lang = 'ig-NG';
        } else if (preferredLanguage === "Nigerian Pidgin") {
          recognition.lang = 'pcm-NG';
        } else {
          recognition.lang = 'en-NG';
        }
        
        recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        if (transcript) {
          setInput(prev => prev ? prev + " " + transcript : transcript);
        }
      };
      
      recognition.onerror = (e: any) => {
        console.error("Speech recognition error", e);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    if ((credits?.availableCredits || 0) < 1) {
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
      const res = await fetch('/api/ai/civic/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ message: txt, chatId: cid, city: profile?.city || "Lagos", isUrgent, language: preferredLanguage }) });
      const d = await res.json();
      if (!res.ok) {
        throw new Error(d.error || "AI service error");
      }
      setMessages(p => [...p, { role: "ai", text: d.response }]);
      refetchCredits();
      queryClient.invalidateQueries({ queryKey: ['sabiguard-messages', cid] });

      // Automatically speak the response if auto-speak toggle is enabled
      if (isAutoSpeak) {
        // Use a short timeout to let state render first and select the correct index (messages.length + 1)
        setTimeout(() => {
          handleSpeak(d.response, messages.length + 1);
        }, 100);
      }
    } catch (e: any) {
      toast({ title: "ERROR", description: e.message || "AI service unavailable.", variant: "destructive", className: "bg-red-600 text-white border-none shadow-2xl rounded-2xl p-6 font-bold" });
    } finally { setIsTyping(false); }
  };

  useEffect(() => { 
    if (scrollContainerRef.current && messages.length > 0) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Separate effect for typing to avoid forced scrolls on every single character
  useEffect(() => { 
    if (isTyping && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
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
      <div className="hidden md:flex md:col-span-4 lg:col-span-3 flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm overflow-hidden"><SidebarContent /></div>
      <div className={cn("flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-full md:col-span-8 lg:col-span-9 transition-all", isUrgent ? "ring-2 ring-red-500 border-red-500 ring-inset" : "")}>
        <div className={cn("p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors", isUrgent ? "bg-red-50 dark:bg-red-950/20" : "bg-slate-50/50 dark:bg-slate-900/50")}>
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg transition-colors", isUrgent ? "bg-red-100 dark:bg-red-900/30 text-red-600" : "bg-primary/10 text-primary")}><Sparkles className="h-5 w-5" /></div>
            <div><h2 className="font-bold text-sm text-slate-800 dark:text-slate-100">SabiRight AI Agent</h2><p className="text-[10px] text-slate-500 dark:text-slate-400">{isUrgent ? "🚨 Urgent Assistance Mode" : "Law-based Guidance"}</p></div>
          </div>
          <div className="flex items-center gap-2">
            {/* Language Selector Dropdown */}
            <select
              value={preferredLanguage}
              onChange={(e) => setPreferredLanguage(e.target.value)}
              className="text-[11px] font-bold h-8 border border-slate-200 dark:border-slate-700 rounded-lg px-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 outline-none focus:border-primary cursor-pointer transition-all shadow-xs hover:border-slate-300 dark:hover:border-slate-600"
            >
              {activeLangsList.includes("English") && <option value="English">English 🇬🇧</option>}
              {activeLangsList.includes("Nigerian Pidgin") && <option value="Nigerian Pidgin">Pidgin 🇳🇬</option>}
              {activeLangsList.includes("Hausa") && <option value="Hausa">Hausa 🇳🇬</option>}
              {activeLangsList.includes("Yoruba") && <option value="Yoruba">Yoruba 🇳🇬</option>}
              {activeLangsList.includes("Igbo") && <option value="Igbo">Igbo 🇳🇬</option>}
            </select>

            {/* Auto-Speak (Voice Readout) Toggle button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                const newVal = !isAutoSpeak;
                setIsAutoSpeak(newVal);
                if (!newVal && typeof window !== 'undefined' && window.speechSynthesis) {
                  window.speechSynthesis.cancel();
                  setCurrentlySpeakingIndex(null);
                }
              }} 
              className={cn("text-[11px] h-8 font-bold transition-all px-2 sm:px-3 gap-1", isAutoSpeak ? "bg-primary text-white border-primary hover:bg-primary/95 shadow-sm animate-pulse" : "hover:bg-slate-100")}
            >
              {isAutoSpeak ? <Volume2 className="h-3.5 w-3.5 shrink-0" /> : <VolumeX className="h-3.5 w-3.5 shrink-0" />}
              <span className="hidden sm:inline">{isAutoSpeak ? "Voice On" : "Voice Off"}</span>
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsUrgent(!isUrgent)} 
              className={cn("text-[11px] h-8 font-bold transition-all px-2 sm:px-3 flex items-center gap-1", isUrgent ? "bg-red-600 text-white border-red-600 hover:bg-red-700 shadow-md" : "hover:bg-slate-100")}
            >
              <AlertCircle className={cn("h-3.5 w-3.5 shrink-0", isUrgent ? "text-white" : "text-red-500")} />
              <span className="hidden sm:inline">{isUrgent ? "Disable Urgent" : "Enable Urgent"}</span>
              <span className="sm:hidden">{isUrgent ? "Urgent" : "Normal"}</span>
            </Button>
            <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
              <SheetTrigger asChild><Button variant="outline" size="sm" className="md:hidden flex items-center gap-1.5 h-8 px-2 sm:px-3 border-primary/20 dark:border-primary/40 bg-primary/5 dark:bg-primary/10 text-primary"><History className="h-4 w-4 shrink-0" /><span className="text-[11px] font-bold hidden sm:inline">History</span></Button></SheetTrigger>
              <SheetContent side="right" className="w-[310px] p-0 border-none shadow-2xl"><div className="h-full flex flex-col p-5 bg-white dark:bg-slate-900"><SidebarContent /></div></SheetContent>
            </Sheet>
            <Button variant="outline" size="sm" onClick={() => { setMessages([]); setCurrentChatId(null); }} className="h-8 w-8 p-0 md:flex hidden hover:bg-slate-100 dark:hover:bg-slate-800"><Plus className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4" ref={scrollContainerRef} key={currentChatId || 'new'}>
          <div className="space-y-6">
          {messages.length === 0 && (<div className="text-center text-slate-400 dark:text-slate-500 mt-20"><ShieldCheck className="h-10 w-10 mx-auto mb-4 opacity-20" /><p className="text-sm">How can I help you with Nigerian law today?</p></div>)}
          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-3 max-w-[90%] animate-in fade-in slide-in-from-bottom-2 duration-300", m.role === "user" ? "ml-auto flex-row-reverse" : "")}>
              <Avatar className={cn("h-8 w-8 shrink-0 shadow-sm", m.role === "ai" ? "bg-primary" : "bg-slate-200 dark:bg-slate-800")}><AvatarFallback className="text-[10px]">{m.role === "ai" ? "AI" : "U"}</AvatarFallback></Avatar>
              <div className={cn("p-4 rounded-2xl text-sm shadow-sm prose prose-sm max-w-none transition-colors relative group", m.role === "user" ? (isUrgent ? "bg-red-600 text-white animate-pulse" : "bg-primary text-white") : "bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl rounded-tl-none text-slate-800 dark:text-slate-100")}>
                {/* Speaker icon to read this message out loud manually */}
                {m.role === "ai" && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-primary hover:text-primary-dark rounded-full bg-slate-100/80 hover:bg-slate-200 shadow-sm"
                      onClick={() => handleSpeak(m.text || m.content || "", i)}
                      title="Read out response"
                    >
                      {currentlySpeakingIndex === i ? (
                        <VolumeX className="h-4 w-4 text-red-500 animate-pulse" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}

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
          {isTyping && <LoadingMessage />}
          <div ref={bottomRef} />
        </div></div>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-3">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={isUrgent ? "Describe emergency..." : "Ask about your rights..."} className={cn("flex-1 rounded-xl h-12 bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-slate-100 transition-colors focus-visible:ring-primary", isUrgent ? "bg-red-50/50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30" : "")} />
            <Button type="button" size="icon" variant="outline" onClick={toggleListening} className={cn("h-12 w-12 rounded-xl transition-all", isListening ? "bg-red-500 text-white border-red-500 shadow-lg shadow-red-200" : "text-slate-400")}><Mic className="h-5 w-5" /></Button>
            <Button type="submit" id="send-message-btn" size="icon" className={cn("h-12 w-12 rounded-xl shadow-lg transition-all", isUrgent ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary/90")}><Send className="h-5 w-5" /></Button></form></div>
      </div>
      <SurveyDialog isOpen={showSurveyDialog} onClose={() => setShowSurveyDialog(false)} feature="civic-guard" />
      <SabiContributorModal isOpen={showSabiModal} onClose={() => setShowSabiModal(false)} />
    </div>
  );
}
