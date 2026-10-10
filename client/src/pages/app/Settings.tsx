import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { 
  User, 
  Mail, 
  MapPin, 
  Phone, 
  Save, 
  ShieldCheck, 
  Store, 
  AlertTriangle, 
  Trash2,
  Loader2,
  ChevronRight,
  Share2,
  Copy,
  Gift,
  RefreshCw,
  Link2,
  MessageSquare,
  CheckCircle2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const NIGERIAN_CITIES = [
  "Lagos",
  "Abuja",
  "Port Harcourt",
  "Kano",
  "Ibadan",
  "Kaduna",
  "Benin City",
  "Enugu",
  "Onitsha",
  "Jos",
  "Calabar",
  "Warri",
  "Uyo",
  "Owerri",
  "Abeokuta"
];

const CITY_STATE_MAP: Record<string, string> = {
  "Lagos": "Lagos",
  "Abuja": "FCT",
  "Port Harcourt": "Rivers",
  "Kano": "Kano",
  "Ibadan": "Oyo",
  "Kaduna": "Kaduna",
  "Benin City": "Edo",
  "Enugu": "Enugu",
  "Onitsha": "Anambra",
  "Jos": "Plateau",
  "Calabar": "Cross River",
  "Warri": "Delta",
  "Uyo": "Akwa Ibom",
  "Owerri": "Imo",
  "Abeokuta": "Ogun"
};

export default function Settings() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [displayName, setDisplayName] = useState(profile?.displayName || user?.displayName || "");
  const [city, setCity] = useState(profile?.city || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingReferral, setIsGeneratingReferral] = useState(false);
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [linkCodeExpiresAt, setLinkCodeExpiresAt] = useState<number | null>(null);
  const [linkedChannelsBeforeCode, setLinkedChannelsBeforeCode] = useState<Record<string, string>>({});
  const [isGeneratingLinkCode, setIsGeneratingLinkCode] = useState(false);

  const { data: linkedChannels = [], refetch: refetchChannels, isLoading: areChannelsLoading } = useQuery<{ channel: string; linked_at: string }[]>({
    queryKey: ['channel-links', user?.uid],
    queryFn: async () => {
      const token = await user?.getIdToken?.();
      const res = await fetch('/api/channels/links', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error(`Could not load linked channels (HTTP ${res.status})`);
      return res.json();
    },
    enabled: !!user,
    refetchInterval: linkCode ? 3_000 : false
  });

  useEffect(() => {
    if (!linkCodeExpiresAt) return;
    const timeout = window.setTimeout(() => {
      setLinkCode(null);
      setLinkCodeExpiresAt(null);
    }, Math.max(0, linkCodeExpiresAt - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [linkCodeExpiresAt]);

  useEffect(() => {
    if (!linkCode) return;
    const newlyLinked = linkedChannels.find(channel =>
      linkedChannelsBeforeCode[channel.channel] !== channel.linked_at
    );
    if (!newlyLinked) return;
    setLinkCode(null);
    setLinkCodeExpiresAt(null);
    toast({
      title: `${newlyLinked.channel === 'whatsapp' ? 'WhatsApp' : 'Telegram'} connected`,
      description: "Your bot now shares your SabiRight account credits and chat history."
    });
  }, [linkCode, linkedChannels, linkedChannelsBeforeCode, toast]);

  const handleGenerateLinkCode = async () => {
    setIsGeneratingLinkCode(true);
    try {
      const token = await user?.getIdToken?.();
      const res = await fetch('/api/channels/link-code', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || `Failed to generate link code (HTTP ${res.status})`);
      }
      const data = await res.json();
      setLinkedChannelsBeforeCode(Object.fromEntries(linkedChannels.map(channel => [channel.channel, channel.linked_at])));
      setLinkCodeExpiresAt(Date.now() + 10 * 60 * 1000);
      setLinkCode(data.code);
      toast({
        title: "Link Code Generated",
        description: `Send "link ${data.code}" to the SabiRight WhatsApp or Telegram bot within 10 minutes.`
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Could not generate link code",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingLinkCode(false);
    }
  };

  const handleUnlinkChannel = async (channel: string) => {
    try {
      const token = await user?.getIdToken?.();
      const res = await fetch(`/api/channels/links/${channel}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Failed to unlink channel');
      refetchChannels();
      toast({
        title: "Channel Unlinked",
        description: `Your ${channel.toUpperCase()} account has been unlinked.`
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to unlink channel",
        variant: "destructive"
      });
    }
  };

  const referralLink = profile?.referralCode 
    ? `${window.location.origin}/auth/login?mode=register&ref=${profile.referralCode}`
    : "";

  const handleGenerateReferralCode = async () => {
    if (!user?.uid) return;
    setIsGeneratingReferral(true);
    try {
      const res = await fetch(`/api/profile/${user.uid}/referral-code`, {
        method: 'POST'
      });
      if (res.ok) {
        toast({ title: "Success", description: "Referral code generated!" });
        await refreshProfile();
      } else {
        toast({ title: "Error", description: "Failed to generate code", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "An error occurred", variant: "destructive" });
    } finally {
      setIsGeneratingReferral(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied!", description: "Link copied to clipboard" });
    } catch {
      toast({
        title: "Could not copy",
        description: "Please select and copy the link command manually.",
        variant: "destructive"
      });
    }
  };

  const handleSaveChanges = async () => {
    if (!user?.uid) return;
    
    setIsSaving(true);
    try {
      const state = city ? CITY_STATE_MAP[city] || "" : "";
      const res = await fetch(`/api/profile/${user.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          displayName,
          city,
          state,
          phone
        })
      });
      
      if (res.ok) {
        toast({ title: "Success", description: "Profile updated successfully" });
        await refreshProfile();
      } else {
        toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await signOut();
      toast({ title: "Account Deleted", description: "Your account has been deleted" });
      setLocation("/");
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete account", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const userInitials = (user?.displayName || user?.email || "U")
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6 pb-20 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white" data-testid="text-settings-title">
          Citizen Profile & Settings
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Manage your verified credentials, territory jurisdiction, and security preferences.
        </p>
      </div>

      <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm" data-testid="card-profile-photo">
        <CardHeader>
          <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white">Profile Photo</CardTitle>
          <CardDescription>Your verified citizen photo and credentials</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-20 w-20 ring-2 ring-blue-500/30" data-testid="img-avatar">
            <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || "User"} />
            <AvatarFallback className="text-lg bg-primary text-white font-bold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold text-sm text-slate-900 dark:text-white" data-testid="text-user-name">{user?.displayName || "Citizen"}</p>
            <p className="text-xs text-slate-500 font-mono" data-testid="text-user-email">{user?.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm" data-testid="card-edit-profile">
        <CardHeader>
          <CardTitle className="text-lg">Edit Profile</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName" className="flex items-center gap-2">
              <User className="h-4 w-4" /> Display Name
            </Label>
            <Input
              id="displayName"
              data-testid="input-display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> Email
            </Label>
            <Input
              id="email"
              data-testid="input-email"
              value={user?.email || ""}
              readOnly
              disabled
              className="bg-slate-50"
            />
            <p className="text-xs text-slate-500">Email cannot be changed here</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="city" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> City
            </Label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger data-testid="select-city">
                <SelectValue placeholder="Select your city" />
              </SelectTrigger>
              <SelectContent>
                {NIGERIAN_CITIES.map((cityOption) => (
                  <SelectItem key={cityOption} value={cityOption} data-testid={`option-city-${cityOption}`}>
                    {cityOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> Phone Number
            </Label>
            <Input
              id="phone"
              data-testid="input-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter your phone number"
              type="tel"
            />
          </div>

          <Button 
            onClick={handleSaveChanges} 
            disabled={isSaving}
            className="w-full"
            data-testid="button-save-changes"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
            <Link2 className="h-5 w-5 text-primary" />
            WhatsApp & Telegram Bot Integration
          </CardTitle>
          <CardDescription>
            Connect your WhatsApp or Telegram to sync your credit allowance, AI legal queries, and case files.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {linkedChannels.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500 block">Connected Channels</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {linkedChannels.map((c) => (
                  <div key={c.channel} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm font-semibold capitalize text-slate-900 dark:text-white">{c.channel} Connected</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive h-7 text-xs rounded-lg" 
                      onClick={() => handleUnlinkChannel(c.channel)}
                    >
                      Disconnect
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl space-y-3">
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              Link your WhatsApp or Telegram chat to access your SabiRight credits and legal AI assistant from your phone anytime.
            </p>
            {linkCode ? (
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500 block">Your Single-Use Link Command</Label>
                <div className="flex gap-2">
                  <Input 
                    readOnly 
                    value={`link ${linkCode}`} 
                    className="bg-white dark:bg-slate-950 border-primary/20 font-mono text-sm font-bold text-primary rounded-xl"
                  />
                  <Button 
                    size="icon" 
                    variant="outline" 
                    onClick={() => copyToClipboard(`link ${linkCode}`)}
                    className="shrink-0 rounded-xl"
                  >
                    <Copy className="h-4 w-4 text-primary" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Send this exact message to the SabiRight WhatsApp bot or Telegram bot within 10 minutes.
                </p>
              </div>
            ) : (
              <Button 
                onClick={handleGenerateLinkCode} 
                disabled={isGeneratingLinkCode || areChannelsLoading}
                variant="outline"
                className="w-full font-bold rounded-xl text-xs h-10"
              >
                {isGeneratingLinkCode ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <MessageSquare className="mr-2 h-4 w-4 text-primary" />
                )}
                Generate Link Code for WhatsApp / Telegram
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-extrabold flex items-center gap-2 text-slate-900 dark:text-white">
            <Gift className="h-5 w-5 text-primary" />
            Refer & Earn
          </CardTitle>
          <CardDescription>Invite friends to SabiRight and earn bonus credits.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!profile?.referralCode ? (
            <div className="text-center p-6 border-2 border-dashed rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
              <p className="text-xs sm:text-sm text-slate-500 mb-4">You haven't generated a referral link yet.</p>
              <Button 
                onClick={handleGenerateReferralCode} 
                disabled={isGeneratingReferral}
                className="font-bold rounded-xl text-xs h-10"
              >
                {isGeneratingReferral ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="mr-2 h-4 w-4" />
                )}
                Generate My Referral Link
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                <Label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Your Referral Link</Label>
                <div className="flex gap-2">
                  <Input 
                    readOnly 
                    value={referralLink} 
                    className="bg-white dark:bg-slate-950 border-primary/20 font-mono text-xs rounded-xl"
                  />
                  <Button 
                    size="icon" 
                    variant="outline" 
                    onClick={() => copyToClipboard(referralLink)}
                    className="shrink-0 rounded-xl"
                  >
                    <Copy className="h-4 w-4 text-primary" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Total Referrals</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{profile?.referralCount || 0}</p>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Credits Earned</p>
                  <p className="text-2xl font-black text-primary mt-0.5">{(profile?.referralCount || 0) * 50}</p>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 text-center italic">
                You receive 50 bonus credits for every verified citizen who joins using your link.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm" data-testid="card-account-status">
        <CardHeader>
          <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white">Account Status</CardTitle>
          <CardDescription>Your verification and account status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">Email Verification</p>
                <p className="text-xs text-slate-500">Official citizen verification status</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                data-testid="badge-email-status"
                className={
                  profile?.emailVerificationStatus === 'verified' 
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' 
                    : profile?.emailVerificationStatus === 'pending'
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }
              >
                {profile?.emailVerificationStatus === 'verified' 
                  ? 'Verified' 
                  : profile?.emailVerificationStatus === 'pending'
                  ? 'Pending'
                  : 'Not Verified'}
              </Badge>
              {profile?.emailVerificationStatus !== 'verified' && (
                <Link href="/app/verify-email">
                  <Button variant="outline" size="sm" className="ml-2 font-bold rounded-xl text-xs" data-testid="link-email-verification">
                    Verify Now
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-orange-500/15 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">Vendor Status</p>
                <p className="text-xs text-slate-500">Marketplace service provider portal</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                data-testid="badge-vendor-status"
                className={
                  profile?.vendorMode 
                    ? 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/30' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }
              >
                {profile?.vendorMode ? 'Active Vendor' : 'Not a Vendor'}
              </Badge>
              <Link href="/app/vendor">
                <Button variant="ghost" size="sm" className="rounded-xl" data-testid="link-vendor">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border border-rose-200 dark:border-rose-900/40 bg-white dark:bg-slate-900 shadow-sm" data-testid="card-danger-zone">
        <CardHeader>
          <CardTitle className="text-base font-extrabold flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions for your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/40">
            <h4 className="font-semibold text-red-700 mb-2">Delete Account</h4>
            <p className="text-sm text-red-600 mb-4">
              Once you delete your account, there is no going back. All your data, 
              including your profile, bookings, and credits will be permanently removed.
              This action cannot be undone.
            </p>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="gap-2"
                  data-testid="button-delete-account"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete My Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent data-testid="dialog-delete-confirm">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your 
                    account and remove all your data from our servers including your 
                    profile, bookings, wallet balance, and credits.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteAccount}
                    className="bg-red-600 hover:bg-red-700"
                    data-testid="button-confirm-delete"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Yes, delete my account"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
