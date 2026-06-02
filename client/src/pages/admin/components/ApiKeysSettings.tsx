import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ApiKeysSettings() {
  const [googleMapsKey, setGoogleMapsKey] = useState("••••••••");
  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState("Public Site Key");
  const [recaptchaSecretKey, setRecaptchaSecretKey] = useState("••••••••");
  
  const [geminiKey, setGeminiKey] = useState("••••••••");
  const [openAiKey, setOpenAiKey] = useState("sk-...");
  const [anthropicKey, setAnthropicKey] = useState("sk-ant-...");
  const [groqKey, setGroqKey] = useState("••••••••");
  
  const [deepseekKey, setDeepseekKey] = useState("sk-...");
  const [openRouterKey, setOpenRouterKey] = useState("sk-or-...");
  const [huggingFaceToken, setHuggingFaceToken] = useState("hf_...");
  const [perplexityKey, setPerplexityKey] = useState("pplx-...");
  const [mistralKey, setMistralKey] = useState("sk-...");
  
  const [googleClientId, setGoogleClientId] = useState("106807133697-...");
  const [googleClientSecret, setGoogleClientSecret] = useState("••••••••");

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">API Keys</h2>
          <p className="text-slate-500 mt-1">Manage your platform api keys and overview.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full border border-red-100 dark:border-red-900/30">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          Admin Access
        </div>
      </div>

      <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden">
        <div className="p-8 pb-4 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg">AI Configuration</h3>
            <p className="text-sm text-slate-500 mt-1">Configure the primary AI engines powering your platform features.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
             Enterprise Ready
          </div>
        </div>
        <CardContent className="p-8 pt-0 grid md:grid-cols-2 gap-8">
          
          <div className="space-y-6">
            <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
               <h4 className="flex items-center gap-2 font-bold mb-4 text-blue-700 dark:text-blue-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  Provider Selection
               </h4>
               <div className="space-y-2">
                 <Label>Primary AI Model</Label>
                 <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option>Groq (Llama 3/Mixtral) - Free/Fast</option>
                 </select>
                 <p className="text-xs text-slate-500 mt-1">The default model used for intelligent suggestions and automated tasks.</p>
               </div>
               <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">Update Provider</Button>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">AI Credentials</h4>
              
              <div className="space-y-2">
                <Label>Google Gemini API Key</Label>
                <div className="flex gap-2">
                  <Input type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} />
                  <Button variant="outline" size="icon" className="shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></Button>
                  <Button variant="outline" size="icon" className="shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg></Button>
                  <Button size="icon" className="bg-blue-600 hover:bg-blue-700 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  </Button>
                </div>
                <p className="text-xs text-slate-500">Used for main content analysis and chatbot.</p>
              </div>

              <div className="space-y-2">
                <Label>OpenAI API Key</Label>
                <div className="flex gap-2">
                  <Input type="password" value={openAiKey} onChange={(e) => setOpenAiKey(e.target.value)} />
                  <Button variant="outline" size="icon" className="shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></Button>
                  <Button variant="outline" size="icon" className="shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg></Button>
                  <Button size="icon" className="bg-blue-600 hover:bg-blue-700 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  </Button>
                </div>
                <p className="text-xs text-slate-500">Backup provider for complex reasoning tasks.</p>
              </div>

              <div className="space-y-2">
                <Label>Anthropic Claude API Key</Label>
                <div className="flex gap-2">
                  <Input type="password" value={anthropicKey} onChange={(e) => setAnthropicKey(e.target.value)} />
                  <Button variant="outline" size="icon" className="shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></Button>
                  <Button variant="outline" size="icon" className="shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg></Button>
                  <Button size="icon" className="bg-blue-600 hover:bg-blue-700 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  </Button>
                </div>
                <p className="text-xs text-slate-500">Claude 3.5 Sonnet/Opus for high-quality generation.</p>
              </div>

              <div className="space-y-2">
                <Label>Groq API Key</Label>
                <div className="flex gap-2">
                  <Input type="password" value={groqKey} onChange={(e) => setGroqKey(e.target.value)} />
                  <Button variant="outline" size="icon" className="shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></Button>
                  <Button variant="outline" size="icon" className="shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg></Button>
                  <Button size="icon" className="bg-blue-600 hover:bg-blue-700 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  </Button>
                </div>
                <p className="text-xs text-slate-500">Fast & Free Llama 3 / Mixtral models via Groq Cloud.</p>
              </div>

               <div className="pt-4 space-y-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Free AI Models</h4>
                <div className="space-y-2">
                  <Label>DeepSeek API Key</Label>
                  <div className="flex gap-2">
                    <Input type="password" value={deepseekKey} onChange={(e) => setDeepseekKey(e.target.value)} />
                    <Button variant="outline" size="icon" className="shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></Button>
                    <Button variant="outline" size="icon" className="shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg></Button>
                    <Button size="icon" className="bg-blue-600 hover:bg-blue-700 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    </Button>
                  </div>
                </div>
                 <div className="space-y-2">
                  <Label>OpenRouter API Key</Label>
                  <div className="flex gap-2">
                    <Input type="password" value={openRouterKey} onChange={(e) => setOpenRouterKey(e.target.value)} />
                    <Button variant="outline" size="icon" className="shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></Button>
                    <Button variant="outline" size="icon" className="shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg></Button>
                    <Button size="icon" className="bg-blue-600 hover:bg-blue-700 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    </Button>
                  </div>
                </div>
                 <div className="space-y-2">
                  <Label>HuggingFace Token</Label>
                  <div className="flex gap-2">
                    <Input type="password" value={huggingFaceToken} onChange={(e) => setHuggingFaceToken(e.target.value)} />
                    <Button variant="outline" size="icon" className="shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></Button>
                    <Button variant="outline" size="icon" className="shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg></Button>
                    <Button size="icon" className="bg-blue-600 hover:bg-blue-700 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    </Button>
                  </div>
                </div>
                 <div className="space-y-2">
                  <Label>Perplexity API Key</Label>
                  <div className="flex gap-2">
                    <Input type="password" value={perplexityKey} onChange={(e) => setPerplexityKey(e.target.value)} />
                    <Button variant="outline" size="icon" className="shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></Button>
                    <Button variant="outline" size="icon" className="shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg></Button>
                    <Button size="icon" className="bg-blue-600 hover:bg-blue-700 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    </Button>
                  </div>
                </div>
                 <div className="space-y-2">
                  <Label>Mistral API Key</Label>
                  <div className="flex gap-2">
                    <Input type="password" value={mistralKey} onChange={(e) => setMistralKey(e.target.value)} />
                    <Button variant="outline" size="icon" className="shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></Button>
                    <Button variant="outline" size="icon" className="shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg></Button>
                    <Button size="icon" className="bg-blue-600 hover:bg-blue-700 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Infrastructure & Maps</h4>
                 <Button variant="link" className="text-blue-600 p-0 h-auto">SETUP GUIDE</Button>
               </div>
               
               <div className="space-y-2">
                  <Label>Google Maps API Key</Label>
                  <div className="flex gap-2">
                    <Input type="password" value={googleMapsKey} onChange={(e) => setGoogleMapsKey(e.target.value)} />
                    <Button variant="outline" size="icon" className="shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></Button>
                    <Button variant="outline" size="icon" className="shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg></Button>
                    <Button size="icon" className="bg-blue-600 hover:bg-blue-700 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">Powers SabiMove, location search, and service radius mapping.</p>
               </div>
            </div>

            <div className="space-y-4">
               <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Security (reCAPTCHA v3)</h4>
               
               <div className="space-y-2">
                  <Label>Site Key</Label>
                  <div className="flex gap-2">
                    <Input value={recaptchaSiteKey} onChange={(e) => setRecaptchaSiteKey(e.target.value)} />
                    <Button variant="outline" size="icon" className="shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg></Button>
                    <Button size="icon" className="bg-blue-600 hover:bg-blue-700 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    </Button>
                  </div>
               </div>
               
               <div className="space-y-2">
                  <Label>Secret Key</Label>
                  <div className="flex gap-2">
                    <Input type="password" value={recaptchaSecretKey} onChange={(e) => setRecaptchaSecretKey(e.target.value)} />
                    <Button variant="outline" size="icon" className="shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></Button>
                    <Button variant="outline" size="icon" className="shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg></Button>
                    <Button size="icon" className="bg-blue-600 hover:bg-blue-700 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    </Button>
                  </div>
               </div>
            </div>
            
            <div className="p-6 bg-orange-50/50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/30">
               <h4 className="flex items-center gap-2 font-bold mb-4 text-orange-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
                  Google Authentication (SSO)
               </h4>
               <p className="text-xs text-slate-500 mb-4">Configure OAuth 2.0 for one-click user sign-in.</p>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label>Client ID</Label>
                    <div className="flex gap-2">
                      <Input value={googleClientId} onChange={(e) => setGoogleClientId(e.target.value)} />
                      <Button variant="outline" size="icon" className="shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg></Button>
                      <Button size="icon" className="bg-blue-600 hover:bg-blue-700 shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                      </Button>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label>Client Secret</Label>
                    <div className="flex gap-2">
                      <Input type="password" value={googleClientSecret} onChange={(e) => setGoogleClientSecret(e.target.value)} />
                      <Button variant="outline" size="icon" className="shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></Button>
                      <Button variant="outline" size="icon" className="shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg></Button>
                      <Button size="icon" className="bg-blue-600 hover:bg-blue-700 shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                      </Button>
                    </div>
                 </div>
               </div>
            </div>
            
          </div>
        </CardContent>
      </Card>
      
    </div>
  );
}
