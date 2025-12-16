import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Sparkles, User, ShieldCheck, Copy, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  role: "user" | "ai";
  text: string;
  citations?: string[];
}

export default function CivicGuard() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "ai",
      text: "Hello! I am your Right-to-Know AI Assistant. I can help you understand your rights under the 1999 Constitution and other Nigerian laws. What situation are you facing today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now(), role: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Mock AI Response
    setTimeout(() => {
      const aiMsg: Message = {
        id: Date.now() + 1,
        role: "ai",
        text: "Under Section 34 of the 1999 Constitution of the Federal Republic of Nigeria, every individual is entitled to respect for the dignity of their person. Accordingly, no person shall be subjected to torture or to inhuman or degrading treatment.",
        citations: ["Section 34, 1999 Constitution", "Anti-Torture Act 2017"]
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:grid md:grid-cols-3 gap-6">
      {/* Main Chat Area */}
      <div className="md:col-span-2 flex flex-col bg-white rounded-3xl border shadow-sm overflow-hidden h-full">
        <div className="p-4 border-b bg-slate-50 flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
             <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-sm">Right-to-Know AI Agent</h2>
            <p className="text-xs text-slate-500">Verified Legal Knowledge Base</p>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex gap-4 max-w-[90%]", msg.role === "user" ? "ml-auto flex-row-reverse" : "")}>
                <Avatar className={cn("h-8 w-8 mt-1", msg.role === "ai" ? "bg-primary text-white" : "bg-slate-200")}>
                  {msg.role === "ai" ? <ShieldCheck className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </Avatar>
                
                <div className={cn("space-y-2", msg.role === "user" ? "items-end" : "items-start")}>
                  <div className={cn(
                    "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                    msg.role === "user" 
                      ? "bg-primary text-white rounded-tr-none" 
                      : "bg-slate-50 border rounded-tl-none"
                  )}>
                    {msg.text}
                  </div>
                  
                  {msg.citations && (
                    <div className="flex gap-2 flex-wrap">
                      {msg.citations.map((cite, i) => (
                        <span key={i} className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-full flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" /> {cite}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {msg.role === "ai" && (
                    <div className="flex gap-2">
                       <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-primary"><Copy className="h-3 w-3" /></Button>
                       <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-primary"><ThumbsUp className="h-3 w-3" /></Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
               <div className="flex gap-4 max-w-[80%]">
                 <Avatar className="h-8 w-8 bg-primary text-white"><ShieldCheck className="h-4 w-4" /></Avatar>
                 <div className="bg-slate-50 border p-4 rounded-2xl rounded-tl-none flex gap-1">
                   <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                   <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                   <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                 </div>
               </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-white">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-3"
          >
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your rights (e.g., 'Can police search my phone?')"
              className="flex-1 rounded-xl h-12 bg-slate-50 border-slate-200 focus-visible:ring-primary"
            />
            <Button type="submit" size="icon" className="h-12 w-12 rounded-xl shadow-lg">
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>

      {/* Sidebar Info */}
      <div className="hidden md:block space-y-6">
        <div className="bg-slate-900 text-white p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          <h3 className="font-bold text-lg mb-2 relative z-10">How it works</h3>
          <p className="text-sm text-slate-400 mb-4 relative z-10">
            This AI is restricted to verified legal sources. It will not answer questions outside of Nigerian Law.
          </p>
          <div className="space-y-2 text-xs font-medium text-slate-300 relative z-10">
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div> 1999 Constitution</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div> Police Act 2020</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div> Landlord & Tenant Law</div>
          </div>
        </div>

        <div className="bg-white border rounded-3xl p-6">
           <h3 className="font-bold text-sm mb-4">Common Questions</h3>
           <div className="space-y-2">
             {["Bail is Free", "Tenancy Notice Period", "Checkpoint Rights", "Employer Contracts"].map((tag) => (
               <Button key={tag} variant="outline" className="w-full justify-start text-xs h-9 rounded-lg">
                 {tag}
               </Button>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}
