import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { Save, Languages, Check, ShieldAlert, Upload, Download, Trash2, Smartphone, AlertTriangle, Video } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export function GeneralSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Branding states
  const [siteTitle, setSiteTitle] = useState("SabiRight");
  const [supportEmail, setSupportEmail] = useState("support@sabiright.com");
  const [facebookUrl, setFacebookUrl] = useState("https://facebook.com/sabiright");
  const [twitterUrl, setTwitterUrl] = useState("https://twitter.com/sabiright");
  const [instagramUrl, setInstagramUrl] = useState("https://instagram.com/sabiright");
  const [linkedinUrl, setLinkedinUrl] = useState("https://linkedin.com/company/sabiright");
  const [youtubeUrl, setYoutubeUrl] = useState("https://youtube.com/sabiright");
  const [whatsappUrl, setWhatsappUrl] = useState("https://whatsapp.com/sabiright");
  const [activeLanguages, setActiveLanguages] = useState<string[]>(["English", "Nigerian Pidgin", "Hausa", "Yoruba", "Igbo"]);
  const [homepageVideoUrl, setHomepageVideoUrl] = useState("https://www.youtube.com/watch?v=...");

  const { data: moatItems = [] } = useQuery<any[]>({
    queryKey: ['admin-moat'],
    queryFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/moat', { headers: { Authorization: `Bearer ${token}` } });
      return res.ok ? res.json() : [];
    }
  });

  // Fetch admin settings
  const { data: settings = [] } = useQuery<any[]>({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return [];
      return res.json();
    }
  });

  // Load state when settings load
  useEffect(() => {
    if (settings && settings.length > 0) {
      const findVal = (key: string) => settings.find(s => s.key === key)?.value;
      
      const title = findVal('site_title');
      if (title) setSiteTitle(title);

      const email = findVal('contact_email');
      if (email) setSupportEmail(email);

      const fb = findVal('social_facebook');
      if (fb) setFacebookUrl(fb);

      const tw = findVal('social_twitter');
      if (tw) setTwitterUrl(tw);

      const ig = findVal('social_instagram');
      if (ig) setInstagramUrl(ig);

      const li = findVal('social_linkedin');
      if (li) setLinkedinUrl(li);

      const yt = findVal('social_youtube');
      if (yt) setYoutubeUrl(yt);

      const wa = findVal('social_whatsapp');
      if (wa) setWhatsappUrl(wa);

      const video = findVal('video_demo_url');
      if (video) setHomepageVideoUrl(video);

      const langs = findVal('active_languages');
      if (langs) {
        try {
          const parsed = JSON.parse(langs);
          if (Array.isArray(parsed)) {
            setActiveLanguages(parsed);
          }
        } catch (e) {
          // If not valid JSON, use standard list
        }
      }
    }
  }, [settings]);

  // Settings save mutation
  const saveSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          key,
          value: typeof value === 'object' ? JSON.stringify(value) : value,
          category: 'frontend',
          isSecret: false
        })
      });
      if (!res.ok) throw new Error(`Failed to save ${key}`);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: "Setting Saved",
        description: `Successfully updated ${variables.key.replace('_', ' ')}`
      });
    },
    onError: (err: any) => {
      toast({
        title: "Error Saving",
        description: err.message,
        variant: "destructive"
      });
    }
  });

  const toggleLanguage = (lang: string) => {
    let updated;
    if (activeLanguages.includes(lang)) {
      // Don't allow deactivating all languages, keep at least English
      if (activeLanguages.length <= 1) {
        toast({ title: "Operation Restricted", description: "Keep at least one active language for chat.", variant: "destructive" });
        return;
      }
      updated = activeLanguages.filter(l => l !== lang);
    } else {
      updated = [...activeLanguages, lang];
    }
    setActiveLanguages(updated);
    saveSettingMutation.mutate({ key: 'active_languages', value: updated });
  };

  const handleSave = (key: string, value: string) => {
    saveSettingMutation.mutate({ key, value });
  };

  const handleExportMoatData = () => {
    if (!moatItems || moatItems.length === 0) {
      toast({
        title: "No Data",
        description: "There is no MOAT data to export.",
        variant: "destructive"
      });
      return;
    }

    const dataStr = JSON.stringify(moatItems, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const exportFileDefaultName = `moat_data_export_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', url);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    URL.revokeObjectURL(url);
    
    toast({
      title: "Success",
      description: "MOAT data exported successfully as JSON"
    });
  };

  const handleClearCache = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch('/api/admin/clear-cache', { 
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: "Success", description: "System cache cleared successfully." });
    } catch (err) {
      toast({ title: "Error", description: "Failed to clear cache", variant: "destructive" });
    }
  };

  const allAvailableLanguages = [
    { id: "English", label: "English 🇬🇧" },
    { id: "Nigerian Pidgin", label: "Nigerian Pidgin 🇳🇬" },
    { id: "Hausa", label: "Hausa 🇳🇬" },
    { id: "Yoruba", label: "Yoruba 🇳🇬" },
    { id: "Igbo", label: "Igbo 🇳🇬" }
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">General Settings</h2>
          <p className="text-slate-500 mt-1">Manage SabiRight general operational, language and branding configurations.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full border border-red-100 dark:border-red-900/30 font-bold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          Live Admin Config
        </div>
      </div>

      {/* Language Management Dashboard Card */}
      <Card className="rounded-3xl border-none shadow-sm overflow-hidden border border-slate-100 bg-linear-to-br from-indigo-50/20 to-white">
        <div className="p-8 pb-4 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
              <Languages className="h-5 w-5 text-primary" /> Multi-Language Portal Management
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Select which localized languages appear as active preferences for citizens inside SabiGuard Chat.
            </p>
          </div>
          <Badge className="bg-primary/10 text-primary border-none text-xs font-black">SINGLE PASS RAG</Badge>
        </div>

        <CardContent className="p-8 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {allAvailableLanguages.map((lang) => {
              const isActive = activeLanguages.includes(lang.id);
              return (
                <div 
                  key={lang.id} 
                  className={`flex flex-col justify-between p-4 rounded-2xl border transition-all ${
                    isActive 
                      ? "bg-primary/5 border-primary/20 shadow-xs" 
                      : "bg-slate-50 border-slate-100 opacity-60 hover:opacity-80"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-black text-slate-800">{lang.label}</span>
                    {isActive && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {isActive ? "ACTIVE IN CHAT" : "DISABLED"}
                    </span>
                    <Switch 
                      checked={isActive} 
                      onCheckedChange={() => toggleLanguage(lang.id)}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Video Snippet Management (Restored previous features) */}
      <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
        <div className="p-8 pb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" /> Video Snippet Management
          </h3>
          <p className="text-sm text-slate-500 mt-1">Manage the video featured on the public homepage layout.</p>
        </div>
        <CardContent className="p-8 pt-0">
          <div className="space-y-2">
            <Label htmlFor="video_demo_url">Homepage Video URL (YouTube Link)</Label>
            <div className="flex gap-2">
              <Input
                id="video_demo_url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={homepageVideoUrl}
                onChange={(e) => setHomepageVideoUrl(e.target.value)}
              />
              <Button 
                size="sm" 
                onClick={() => handleSave('video_demo_url', homepageVideoUrl)}
                disabled={saveSettingMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" /> Save Video Link
              </Button>
            </div>
            <p className="text-xs text-slate-400">Paste any standard YouTube URL. SabiRight automatically handles conversion to an optimized inline embed iframe.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
        <div className="p-8 pb-4">
          <h3 className="font-bold text-lg">Platform Branding</h3>
          <p className="text-sm text-slate-500 mt-1">Configure your platform's titles, emails, and global contact credentials.</p>
        </div>
        <CardContent className="p-8 pt-0 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Site Title</Label>
              <div className="flex gap-2">
                <Input value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)} />
                <Button 
                  size="icon" 
                  className="bg-blue-600 hover:bg-blue-700 shrink-0"
                  onClick={() => handleSave('site_title', siteTitle)}
                  disabled={saveSettingMutation.isPending}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Support Email</Label>
              <div className="flex gap-2">
                <Input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
                <Button 
                  size="icon" 
                  className="bg-blue-600 hover:bg-blue-700 shrink-0"
                  onClick={() => handleSave('contact_email', supportEmail)}
                  disabled={saveSettingMutation.isPending}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-500 border-b pb-2">Branding Asset Links</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border rounded-2xl bg-slate-50/50 flex items-center justify-center h-32">
                 <img src="/assets/sabiright-logo.png" alt="Light Logo Preview" className="max-h-full" />
              </div>
              <div className="p-4 border rounded-2xl bg-slate-900 flex items-center justify-center h-32">
                 <img src="/assets/sabiright-logo.png" alt="Dark Logo Preview" className="max-h-full invert" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-none shadow-sm overflow-hidden">
        <div className="p-8 pb-4">
          <h3 className="font-bold text-lg">Social Media Links</h3>
          <p className="text-sm text-slate-500 mt-1">Configure the social media links shown in the footer layout.</p>
        </div>
        <CardContent className="p-8 pt-0">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Facebook</Label>
                <div className="flex gap-2">
                  <Input value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} />
                  <Button 
                    size="icon" 
                    className="bg-blue-600 hover:bg-blue-700 shrink-0"
                    onClick={() => handleSave('social_facebook', facebookUrl)}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Twitter</Label>
                <div className="flex gap-2">
                  <Input value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} />
                  <Button 
                    size="icon" 
                    className="bg-blue-600 hover:bg-blue-700 shrink-0"
                    onClick={() => handleSave('social_twitter', twitterUrl)}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Instagram</Label>
                <div className="flex gap-2">
                  <Input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} />
                  <Button 
                    size="icon" 
                    className="bg-blue-600 hover:bg-blue-700 shrink-0"
                    onClick={() => handleSave('social_instagram', instagramUrl)}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>LinkedIn</Label>
                <div className="flex gap-2">
                  <Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
                  <Button 
                    size="icon" 
                    className="bg-blue-600 hover:bg-blue-700 shrink-0"
                    onClick={() => handleSave('social_linkedin', linkedinUrl)}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>
               <div className="space-y-2">
                <Label>Youtube</Label>
                <div className="flex gap-2">
                  <Input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} />
                  <Button 
                    size="icon" 
                    className="bg-blue-600 hover:bg-blue-700 shrink-0"
                    onClick={() => handleSave('social_youtube', youtubeUrl)}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>
               <div className="space-y-2">
                <Label>Whatsapp</Label>
                <div className="flex gap-2">
                  <Input value={whatsappUrl} onChange={(e) => setWhatsappUrl(e.target.value)} />
                  <Button 
                    size="icon" 
                    className="bg-blue-600 hover:bg-blue-700 shrink-0"
                    onClick={() => handleSave('social_whatsapp', whatsappUrl)}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>
           </div>
        </CardContent>
      </Card>

      {/* Data Management (Restored previous features) */}
      <Card className="rounded-4xl border-none shadow-sm overflow-hidden border border-red-100 dark:border-red-900/30">
        <div className="p-8 pb-4">
          <h3 className="font-bold text-lg text-red-600 dark:text-red-400">Data Management</h3>
        </div>
        <CardContent className="p-8 pt-0 space-y-4">
           <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
             <div>
               <h4 className="font-bold">Export All Data</h4>
               <p className="text-sm text-slate-500">Download a complete backup of the system database (JSON format).</p>
             </div>
             <Button 
               variant="outline" 
               className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
               onClick={() => {
                 window.open('/api/admin/export', '_blank');
               }}
             >
                <Download className="h-4 w-4 mr-2" /> Export Database
             </Button>
           </div>
           
           <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
             <div>
               <h4 className="font-bold">Export MOAT Data</h4>
               <p className="text-sm text-slate-500">Download MOAT intelligence data for model training (JSON format).</p>
             </div>
             <Button 
               variant="outline" 
               className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
               onClick={handleExportMoatData}
             >
                <Download className="h-4 w-4 mr-2" /> Export MOAT Data
             </Button>
           </div>

           <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
             <div>
               <h4 className="font-bold text-red-600">Clear System Cache</h4>
               <p className="text-sm text-slate-500">Force refresh all system caches and sessions.</p>
             </div>
             <Button 
               className="bg-red-600 hover:bg-red-700 text-white"
               onClick={handleClearCache}
             >
                <Trash2 className="h-4 w-4 mr-2" /> Clear Cache
             </Button>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
