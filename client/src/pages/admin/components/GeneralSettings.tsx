import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export function GeneralSettings() {
  const [siteTitle, setSiteTitle] = useState("SabiRight");
  const [supportEmail, setSupportEmail] = useState("support@sabiright.ng");
  const [lightLogoUrl, setLightLogoUrl] = useState("/uploads/...");
  const [darkLogoUrl, setDarkLogoUrl] = useState("/uploads/...");
  
  const [homepageVideoUrl, setHomepageVideoUrl] = useState("https://www.youtube.com/watch?v=...");
  
  const [facebookUrl, setFacebookUrl] = useState("https://facebook.com/sabiright");
  const [twitterUrl, setTwitterUrl] = useState("https://twitter.com/sabiright");
  const [instagramUrl, setInstagramUrl] = useState("https://instagram.com/sabiright");
  const [linkedinUrl, setLinkedinUrl] = useState("https://www.linkedin.com/company/sabi-right");
  const [youtubeUrl, setYoutubeUrl] = useState("https://youtube.com/sabiright");
  const [whatsappUrl, setWhatsappUrl] = useState("https://whatsapp.com/sabiright");

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">General Settings</h2>
          <p className="text-slate-500 mt-1">Manage your platform settings and overview.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full border border-red-100 dark:border-red-900/30">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          Admin Access
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Users</p>
              <h3 className="text-2xl font-black mt-1">0</h3>
            </div>
            <div className="h-10 w-10 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-500">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-slate-500">Active Vendors</p>
              <h3 className="text-2xl font-black mt-1">0</h3>
            </div>
            <div className="h-10 w-10 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center text-green-500">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg>
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Events</p>
              <h3 className="text-2xl font-black mt-1">0</h3>
            </div>
            <div className="h-10 w-10 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center text-purple-500">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-slate-500">Transactions</p>
              <h3 className="text-2xl font-black mt-1">0</h3>
            </div>
            <div className="h-10 w-10 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center text-amber-500">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden">
        <div className="p-8 pb-4">
          <h3 className="font-bold text-lg">Platform Branding</h3>
          <p className="text-sm text-slate-500 mt-1">Configure your platform's visual identity for light and dark modes.</p>
        </div>
        <CardContent className="p-8 pt-0 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Site Title</Label>
              <div className="flex gap-2">
                <Input value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)} />
                <Button size="icon" className="bg-blue-600 hover:bg-blue-700 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Support Email</Label>
              <div className="flex gap-2">
                <Input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
                <Button size="icon" className="bg-blue-600 hover:bg-blue-700 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 font-semibold text-amber-500">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                 Light Mode Assets
              </h4>
              <div className="space-y-2">
                <Label>Light Logo URL</Label>
                <div className="flex gap-2">
                  <Input value={lightLogoUrl} onChange={(e) => setLightLogoUrl(e.target.value)} className="bg-slate-50 dark:bg-slate-900" />
                  <Button variant="outline" size="icon" className="shrink-0"><Upload className="h-4 w-4" /></Button>
                  <Button size="icon" className="bg-blue-600 hover:bg-blue-700 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  </Button>
                </div>
                <div className="mt-4 p-6 border rounded-xl bg-white flex items-center justify-center h-32">
                   <img src="/assets/sabiright-logo.png" alt="Light Logo Preview" className="max-h-full" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="flex items-center gap-2 font-semibold text-blue-600">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                 Dark Mode Assets
              </h4>
               <div className="space-y-2">
                <Label>Dark Logo URL</Label>
                <div className="flex gap-2">
                  <Input value={darkLogoUrl} onChange={(e) => setDarkLogoUrl(e.target.value)} className="bg-slate-50 dark:bg-slate-900" />
                  <Button variant="outline" size="icon" className="shrink-0"><Upload className="h-4 w-4" /></Button>
                  <Button size="icon" className="bg-blue-600 hover:bg-blue-700 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  </Button>
                </div>
                <div className="mt-4 p-6 border rounded-xl bg-slate-950 flex items-center justify-center h-32">
                   <img src="/assets/sabiright-logo.png" alt="Dark Logo Preview" className="max-h-full invert" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

       <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden">
        <div className="p-8 pb-4">
          <h3 className="font-bold text-lg">Video Snippet Management</h3>
          <p className="text-sm text-slate-500 mt-1">Manage the video featured on the homepage.</p>
        </div>
        <CardContent className="p-8 pt-0">
           <div className="space-y-2">
              <Label>Homepage Video URL (YouTube Link)</Label>
              <div className="flex gap-2">
                <Input value={homepageVideoUrl} onChange={(e) => setHomepageVideoUrl(e.target.value)} />
                <Button size="icon" className="bg-blue-600 hover:bg-blue-700 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-1">Paste a YouTube link here. The platform will automatically convert it to an embeddable format.</p>
            </div>
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden">
        <div className="p-8 pb-4">
          <h3 className="font-bold text-lg">Social Media Links</h3>
          <p className="text-sm text-slate-500 mt-1">Configure the social media links shown in the footer.</p>
        </div>
        <CardContent className="p-8 pt-0">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Facebook</Label>
                <div className="flex gap-2">
                  <Input value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} />
                  <Button size="icon" className="bg-blue-600 hover:bg-blue-700 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Twitter</Label>
                <div className="flex gap-2">
                  <Input value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} />
                  <Button size="icon" className="bg-blue-600 hover:bg-blue-700 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Instagram</Label>
                <div className="flex gap-2">
                  <Input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} />
                  <Button size="icon" className="bg-blue-600 hover:bg-blue-700 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>LinkedIn</Label>
                <div className="flex gap-2">
                  <Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
                  <Button size="icon" className="bg-blue-600 hover:bg-blue-700 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  </Button>
                </div>
              </div>
               <div className="space-y-2">
                <Label>Youtube</Label>
                <div className="flex gap-2">
                  <Input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} />
                  <Button size="icon" className="bg-blue-600 hover:bg-blue-700 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  </Button>
                </div>
              </div>
               <div className="space-y-2">
                <Label>Whatsapp</Label>
                <div className="flex gap-2">
                  <Input value={whatsappUrl} onChange={(e) => setWhatsappUrl(e.target.value)} />
                  <Button size="icon" className="bg-blue-600 hover:bg-blue-700 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  </Button>
                </div>
              </div>
           </div>
        </CardContent>
      </Card>
      
       <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden border border-red-100 dark:border-red-900/30">
        <div className="p-8 pb-4">
          <h3 className="font-bold text-lg text-red-600 dark:text-red-400">Data Management</h3>
        </div>
        <CardContent className="p-8 pt-0 space-y-4">
           <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
             <div>
               <h4 className="font-bold">Export All Data</h4>
               <p className="text-sm text-slate-500">Download a complete backup of the system database (JSON format).</p>
             </div>
             <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                Export Database
             </Button>
           </div>
           
           <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
             <div>
               <h4 className="font-bold">Export MOAT Data</h4>
               <p className="text-sm text-slate-500">Download MOAT intelligence data for model training (JSON format).</p>
             </div>
             <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                Export MOAT Data
             </Button>
           </div>

           <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
             <div>
               <h4 className="font-bold text-red-600">Clear System Cache</h4>
               <p className="text-sm text-slate-500">Force refresh all system caches and sessions.</p>
             </div>
             <Button className="bg-red-600 hover:bg-red-700 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                Clear Cache
             </Button>
           </div>
        </CardContent>
      </Card>
      
    </div>
  );
}
