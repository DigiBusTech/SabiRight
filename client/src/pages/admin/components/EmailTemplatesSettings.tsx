import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";

export function EmailTemplatesSettings() {
  const [templateName, setTemplateName] = useState("");
  const [subjectLine, setSubjectLine] = useState("");
  
  const templates = [
    { id: 1, name: "Post Removed by Moderator", type: "post_removed", snippet: "Your post \"{{content}}\" has been removed for violating community guidelines following a review..." },
    { id: 2, name: "Booking Confirmed", type: "booking_confirmed", snippet: "Your booking for {{serviceName}} has been confirmed by {{vendorName}}..." },
    { id: 3, name: "New Booking Request", type: "new_booking_request", snippet: "You have a new booking request for {{serviceName}} from {{clientName}}..." },
    { id: 4, name: "Credits Added", type: "credits_added", snippet: "You have received {{amount}} credits. Reason: {{reason}}. Total credits: {{total}}..." },
    { id: 5, name: "Dispute Opened", type: "dispute_opened", snippet: "Dispute Opened: {{bookingId}}..." },
    { id: 6, name: "Vendor Application Approved", type: "vendor_application_approved", snippet: "Hello {{name}}, We are pleased to inform you that your vendor application for SabiRight has been ap..." },
    { id: 7, name: "Vendor Application Rejected", type: "vendor_application_rejected", snippet: "Hello {{name}}, Your vendor application has been reviewed and unfortunately was not approved at thi..." },
    { id: 8, name: "Wallet Top-up", type: "wallet_topup", snippet: "Your wallet has been credited with {{amount}}. New balance: {{balance}}. Reference: {{reference}}..." },
    { id: 9, name: "Welcome Email", type: "welcome_email", snippet: "Hello {{name}}, Welcome to SabiRight! We are excited to have you on board. SabiRight is your all-i..." }
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Email Templates</h2>
          <p className="text-slate-500 mt-1">Manage your platform email templates and overview.</p>
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
            <h3 className="font-bold text-lg">Rich Email Templates</h3>
            <p className="text-sm text-slate-500 mt-1">Manage beautiful, formatted email communications for your users.</p>
          </div>
          <Button variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M4 7V4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3"/><polyline points="14 2 14 8 20 8"/><path d="M5 11h8"/><path d="M5 15h8"/><path d="M5 19h4"/></svg>
             Rich Formatting
          </Button>
        </div>
        
        <CardContent className="p-8 pt-0 space-y-8">
          
          <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
             <h4 className="flex items-center gap-2 font-bold text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
                Template Variable Guide
             </h4>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                   <p className="font-mono text-blue-600 text-sm">{`{{userName}}`}</p>
                   <p className="text-xs text-slate-500 mt-1">Recipient's full name</p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                   <p className="font-mono text-blue-600 text-sm">{`{{code}}`}</p>
                   <p className="text-xs text-slate-500 mt-1">Verification code</p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                   <p className="font-mono text-blue-600 text-sm">{`{{expiry}}`}</p>
                   <p className="text-xs text-slate-500 mt-1">Code expiry time</p>
                </div>
                <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                   <p className="font-mono text-blue-600 text-sm">{`{{appName}}`}</p>
                   <p className="text-xs text-slate-500 mt-1">SabiRight</p>
                </div>
             </div>
             
             <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-900/30">
                <h5 className="flex items-center gap-2 font-bold text-orange-600 text-sm mb-1">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                   Email Identity Tip
                </h5>
                <p className="text-xs text-orange-700 dark:text-orange-400">
                   To show your logo in the recipient's inbox (as a profile image), associate your "From Email" address with a <a href="#" className="underline font-bold">Gravatar</a> account or a Google Workspace profile. We automatically include your favicon in the email body.
                </p>
             </div>
          </div>
          
          <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-6">
             <h4 className="flex items-center gap-2 font-bold text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                Create New Email Template
             </h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Template Name</Label>
                 <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g., Welcome Email" className="bg-white dark:bg-slate-950" />
               </div>
               <div className="space-y-2">
                 <Label>Subject Line</Label>
                 <Input value={subjectLine} onChange={(e) => setSubjectLine(e.target.value)} placeholder="e.g., Welcome to SabiRight!" className="bg-white dark:bg-slate-950" />
               </div>
             </div>
             <div className="space-y-2">
               <Label>Email Body (Rich Text Editor)</Label>
               <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
                  <div className="flex items-center gap-1 p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                     <select className="h-8 rounded bg-transparent text-sm border-none outline-none mr-2">
                        <option>Normal</option>
                     </select>
                     <Button variant="ghost" size="icon" className="h-8 w-8 rounded"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16"/><path d="M12 4v16"/></svg></Button>
                     <Button variant="ghost" size="icon" className="h-8 w-8 rounded font-bold">B</Button>
                     <Button variant="ghost" size="icon" className="h-8 w-8 rounded italic">I</Button>
                     <Button variant="ghost" size="icon" className="h-8 w-8 rounded underline">U</Button>
                     <Button variant="ghost" size="icon" className="h-8 w-8 rounded line-through">S</Button>
                     <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                     <Button variant="ghost" size="icon" className="h-8 w-8 rounded"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/></svg></Button>
                     <Button variant="ghost" size="icon" className="h-8 w-8 rounded"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg></Button>
                     <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                     <Button variant="ghost" size="icon" className="h-8 w-8 rounded"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></Button>
                     <Button variant="ghost" size="icon" className="h-8 w-8 rounded"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></Button>
                  </div>
                  <div className="p-4 h-64 overflow-y-auto outline-none" contentEditable></div>
               </div>
             </div>
             <div className="flex justify-end">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">Create Email Template</Button>
             </div>
          </div>
          
          <div className="space-y-4">
             <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Manage Templates</h4>
             <div className="space-y-3">
                {templates.map(t => (
                   <div key={t.id} className="p-4 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center group hover:border-blue-200 transition-colors">
                      <div>
                         <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-bold">{t.name}</h5>
                            <Badge variant="secondary" className="text-[10px] uppercase font-mono bg-slate-100 text-slate-500">{t.type}</Badge>
                         </div>
                         <p className="text-sm text-slate-500 italic">"{t.snippet}"</p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button variant="outline" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                         <Button variant="outline" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                   </div>
                ))}
             </div>
          </div>
          
        </CardContent>
      </Card>
    </div>
  );
}
