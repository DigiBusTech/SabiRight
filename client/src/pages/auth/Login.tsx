import { useState, useRef, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  ShieldCheck, 
  Loader2, 
  Eye, 
  EyeOff, 
  CheckCircle2,
  Phone,
  User,
  MapPin,
  Plus,
  Calendar as CalendarIcon,
  ChevronRight,
  ArrowLeft,
  Mail,
  KeyRound
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReCAPTCHA from "react-google-recaptcha";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", 
  "Imo", "Jagawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", 
  "Taraba", "Yobe", "Zamfara"
];

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [state, setState] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCompletingGoogleProfile, setIsCompletingGoogleProfile] = useState(false);
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const captchaRef = useRef<ReCAPTCHA>(null);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Capture referral code or mode from URL
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode')?.toLowerCase();
    const hash = window.location.hash || '';

    if (mode === 'register') {
      setIsLogin(false);
    } else if (mode === 'forgot') {
      setIsForgotPassword(true);
    } else if (mode === 'reset' || hash.includes('type=recovery') || params.get('type') === 'recovery') {
      setIsResetMode(true);
      setIsForgotPassword(false);
    }

    const ref = params.get('ref');
    if (ref) {
      setReferralCode(ref);
      toast({ title: "Referral applied", description: `You'll receive a bonus for using code ${ref}` });
    }

    // Listen for Supabase recovery event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResetMode(true);
        setIsForgotPassword(false);
      }
    });

    fetch('/api/settings/public')
      .then(res => res.json())
      .then(data => {
        if (data.captcha_site_key) {
          setSiteKey(data.captcha_site_key);
        }
      })
      .catch(err => console.error('Failed to fetch site key:', err));

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/app`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error(error);
      toast({ 
        title: "Google Auth Failed", 
        description: error.message, 
        variant: "destructive" 
      });
      setLoading(false);
    }
  };

  const handleCompleteGoogleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleUser) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const idToken = session?.access_token || '';
      await fetch(`/api/profile/${googleUser.id || googleUser.uid}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ 
          email: googleUser.email, 
          displayName: name || googleUser.displayName,
          phoneNumber,
          dob,
          gender,
          state,
          referralCode,
          isGoogleAuth: true
        })
      });

      toast({ title: "Profile Completed!", description: "Welcome to SabiRight." });
      setLocation("/app");
    } catch (error: any) {
      toast({ 
        title: "Update Failed", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLogin && password !== confirmPassword) {
      toast({ 
        title: "Passwords do not match", 
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    const captchaToken = !isLogin ? captchaRef.current?.getValue() : null;
    
    if (!isLogin && siteKey && !captchaToken) {
      toast({ 
        title: "Verification Required", 
        description: "Please complete the reCAPTCHA verification.", 
        variant: "destructive" 
      });
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        toast({ title: "Welcome back!", description: "Successfully logged in." });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name }
          }
        });
        if (error) throw error;
        if (data.user) {
          const session = data.session;
          const idToken = session?.access_token || '';
          await fetch(`/api/profile/${data.user.id}`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
            },
            body: JSON.stringify({ 
              email: data.user.email, 
              displayName: name,
              phoneNumber,
              dob,
              gender,
              state,
              referralCode,
              captchaToken
            })
          });
        }
        toast({ title: "Account created!", description: "Welcome to SabiRight." });
      }
      setLocation("/app");
    } catch (error: any) {
      console.error(error);
      toast({ 
        title: "Authentication Failed", 
        description: error.message || "Please check your credentials.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast({
        title: "Valid Email Required",
        description: "Please enter your registered email address.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/auth/login?mode=reset`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });
      if (error) throw error;
      setForgotSubmitted(true);
      toast({
        title: "Reset Link Sent",
        description: `Check your inbox at ${email.trim()} for password recovery instructions.`
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Reset Request Failed",
        description: err.message || "Unable to send password recovery link. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters.",
        variant: "destructive"
      });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast({
        title: "Passwords Do Not Match",
        description: "Please make sure your new passwords match.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({
        title: "Password Successfully Updated!",
        description: "You can now sign in with your new password."
      });
      setIsResetMode(false);
      setIsForgotPassword(false);
      setIsLogin(true);
      setPassword("");
      setLocation("/app");
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Password Update Failed",
        description: err.message || "Failed to update your password.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white overflow-hidden">
      {/* Left Column - Decorative Content (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-linear-to-br from-primary/20 to-transparent" />
          <img 
            src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=2070&auto=format&fit=crop" 
            alt="Legal Background" 
            className="w-full h-full object-cover opacity-30"
          />
        </div>
        
        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 text-white mb-12"
          >
            <div className="h-11 w-11 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center p-2 border border-white/20 shadow-lg shadow-black/20">
              <img 
                src="/assets/sabiright-icon.png" 
                alt="SabiRight Logo" 
                className="h-full w-full object-contain rounded-lg"
                onError={(e) => { (e.target as HTMLImageElement).src = "/favicon.png"; }}
              />
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight block leading-tight">
                Sabi<span className="text-primary">Right</span>
              </span>
              <span className="text-xs text-slate-400 font-medium block">
                Civic Intellect &amp; Justice Infrastructure
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-md"
          >
            <h1 className="text-5xl font-extrabold text-white leading-tight mb-6">
              Your Digital Hub for <span className="text-primary">Civic Empowerment.</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Access professional legal aid, discover verified job opportunities, and engage with your local community—all in one secure platform.
            </p>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative z-10 grid grid-cols-2 gap-6"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary mt-1" />
            <div>
              <p className="text-white font-bold">Verified Identity</p>
              <p className="text-slate-500 text-sm">Secure email verification for all citizens.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary mt-1" />
            <div>
              <p className="text-white font-bold">Expert Support</p>
              <p className="text-slate-500 text-sm">Connect with certified legal professionals.</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Column - Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 md:p-12 bg-slate-50/50">
        <div className="w-full max-w-md space-y-4 md:space-y-6">
          {/* Mobile SabiRight Brand Logo & Title */}
          <div className="flex lg:hidden flex-col items-center justify-center text-center pt-2 pb-1">
            <Link href="/" className="inline-flex items-center gap-3 group transition-transform active:scale-95">
              <div className="h-12 w-12 rounded-2xl bg-white shadow-md shadow-slate-200/80 flex items-center justify-center p-2 border border-slate-200/70">
                <img 
                  src="/assets/sabiright-icon.png" 
                  alt="SabiRight Logo" 
                  className="h-full w-full object-contain rounded-xl"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/favicon.png"; }}
                />
              </div>
              <div className="text-left">
                <span className="text-2xl font-extrabold tracking-tight text-slate-900 block leading-tight">
                  Sabi<span className="text-primary">Right</span>
                </span>
                <span className="text-[11px] font-medium text-slate-500 block -mt-0.5">
                  Civic Intellect &amp; Legal First Aid
                </span>
              </div>
            </Link>
          </div>

          <AnimatePresence mode="wait">
            {isResetMode ? (
              <motion.div
                key="reset-password-mode"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 md:space-y-6"
              >
                <div className="text-center lg:text-left space-y-1 md:space-y-2">
                  <button 
                    onClick={() => { setIsResetMode(false); setIsLogin(true); }}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary transition-colors mb-2 md:mb-4"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Sign In
                  </button>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                    Set New Password
                  </h2>
                  <p className="text-sm md:text-base text-slate-500">
                    Create a new, strong password to secure your account.
                  </p>
                </div>

                <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-2xl md:rounded-3xl overflow-hidden">
                  <CardContent className="p-5 md:p-8">
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                      <div className="space-y-1.5 md:space-y-2">
                        <Label htmlFor="reset-new-password">New Password</Label>
                        <div className="relative">
                          <Input 
                            id="reset-new-password" 
                            type={showNewPassword ? "text" : "password"} 
                            placeholder="At least 6 characters"
                            value={newPassword} 
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)} 
                            required 
                            className="h-11 md:h-12 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5 md:space-y-2">
                        <Label htmlFor="reset-confirm-password">Confirm New Password</Label>
                        <div className="relative">
                          <Input 
                            id="reset-confirm-password" 
                            type={showNewPassword ? "text" : "password"} 
                            placeholder="Repeat new password"
                            value={confirmNewPassword} 
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmNewPassword(e.target.value)} 
                            required 
                            className="h-11 md:h-12 pr-10"
                          />
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full h-11 md:h-12 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all text-sm md:text-base" 
                        disabled={loading}
                      >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save New Password &amp; Continue
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            ) : isForgotPassword ? (
              <motion.div
                key="forgot-password-mode"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 md:space-y-6"
              >
                <div className="text-center lg:text-left space-y-1 md:space-y-2">
                  <button 
                    onClick={() => { setIsForgotPassword(false); setForgotSubmitted(false); }}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary transition-colors mb-2 md:mb-4"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Sign In
                  </button>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                    Reset Password
                  </h2>
                  <p className="text-sm md:text-base text-slate-500">
                    Enter your email to receive recovery instructions.
                  </p>
                </div>

                <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-2xl md:rounded-3xl overflow-hidden">
                  <CardContent className="p-5 md:p-8">
                    {!forgotSubmitted ? (
                      <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div className="space-y-1.5 md:space-y-2">
                          <Label htmlFor="forgot-email">Registered Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                              id="forgot-email" 
                              type="email" 
                              placeholder="name@example.com" 
                              value={email} 
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} 
                              required 
                              className="h-11 md:h-12 pl-10"
                            />
                          </div>
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full h-11 md:h-12 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all text-sm md:text-base" 
                          disabled={loading}
                        >
                          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Send Recovery Link
                        </Button>
                      </form>
                    ) : (
                      <div className="space-y-4 text-center py-2">
                        <div className="h-14 w-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                          <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-bold text-lg text-slate-900">Check Your Email</h3>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            We've dispatched a password recovery link to <strong className="text-slate-900">{email}</strong>. Please check your inbox and follow the instructions.
                          </p>
                        </div>
                        <div className="pt-2 flex flex-col gap-2">
                          <Button 
                            variant="outline"
                            onClick={handleForgotPassword}
                            disabled={loading}
                            className="w-full h-10 text-xs font-semibold"
                          >
                            {loading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : "Didn't receive it? Resend link"}
                          </Button>
                          <Button 
                            variant="ghost"
                            onClick={() => { setIsForgotPassword(false); setForgotSubmitted(false); }}
                            className="w-full h-10 text-xs text-slate-500 hover:text-slate-900"
                          >
                            Return to Sign In
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ) : isCompletingGoogleProfile ? (
              <motion.div
                key="complete-profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 md:space-y-6"
              >
                <div className="text-center lg:text-left space-y-1 md:space-y-2">
                  <button 
                    onClick={() => setIsCompletingGoogleProfile(false)}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary transition-colors mb-2 md:mb-4"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Login
                  </button>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                    Complete Profile
                  </h2>
                  <p className="text-sm md:text-base text-slate-500">
                    Just a few more details to get you started.
                  </p>
                </div>

                <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-2xl md:rounded-3xl overflow-hidden">
                  <CardContent className="p-5 md:p-8">
                    <form onSubmit={handleCompleteGoogleProfile} className="space-y-4">
                      <div className="space-y-1.5 md:space-y-2">
                        <Label htmlFor="g-phone">Phone Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input 
                            id="g-phone" 
                            type="tel"
                            placeholder="+234 800 000 0000" 
                            value={phoneNumber} 
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)} 
                            required 
                            className="h-11 md:h-12 pl-10"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div className="space-y-1.5 md:space-y-2">
                          <Label htmlFor="g-dob">Date of Birth</Label>
                          <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                            <Input 
                              id="g-dob" 
                              type="date" 
                              value={dob} 
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDob(e.target.value)} 
                              required 
                              className="h-11 md:h-12 pl-10 text-xs md:text-sm"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5 md:space-y-2">
                          <Label htmlFor="g-gender">Gender</Label>
                          <Select value={gender} onValueChange={setGender} required>
                            <SelectTrigger id="g-gender" className="h-11 md:h-12">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-1.5 md:space-y-2">
                        <Label htmlFor="g-state">State of Residence</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                          <Select value={state} onValueChange={setState} required>
                            <SelectTrigger id="g-state" className="h-11 md:h-12 pl-10">
                              <SelectValue placeholder="Choose your state" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[250px]">
                              {NIGERIAN_STATES.map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                        <div className="space-y-1.5 md:space-y-2">
                          <Label htmlFor="g-referral">Referral Code (Optional)</Label>
                          <div className="relative">
                            <Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                              id="g-referral" 
                              placeholder="REF12345" 
                              value={referralCode} 
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReferralCode(e.target.value)} 
                              className="h-11 md:h-12 pl-10"
                            />
                          </div>
                        </div>

                        <Button 
                          type="submit" 
                          className="w-full h-11 md:h-12 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all mt-2 md:mt-4 text-sm md:text-base" 
                          disabled={loading}
                        >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Complete & Continue <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="auth-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4 md:space-y-6"
              >
                <div className="text-center lg:text-left space-y-1 md:space-y-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                    {isLogin ? "Welcome Back" : "Create Account"}
                  </h2>
                  <p className="text-sm md:text-base text-slate-500">
                    {isLogin 
                      ? "Enter your credentials to access your dashboard." 
                      : "Fill in your details to get started with SabiRight."}
                  </p>
                </div>

                <Card className="border-0 shadow-2xl shadow-slate-200/50 rounded-2xl md:rounded-3xl overflow-hidden">
                  <CardContent className="p-5 md:p-8">
                    {/* Mobile Trust Indicator replacing removed Google Auth empty space */}
                    <div className="flex lg:hidden items-center justify-center gap-2 py-2 px-3 bg-primary/5 border border-primary/15 rounded-xl text-primary text-xs font-medium mb-3">
                      <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                      <span>Encrypted &amp; NDPA-Compliant Civic Platform</span>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-3 md:space-y-4">
                      <AnimatePresence mode="wait">
                        {!isLogin && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3 md:space-y-4 overflow-hidden"
                          >
                            <div className="space-y-1.5 md:space-y-2">
                              <Label htmlFor="name">Full Name</Label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input 
                                  id="name" 
                                  placeholder="Uyouko Ekpo" 
                                  value={name} 
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} 
                                  required 
                                  className="h-11 md:h-12 pl-10"
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5 md:space-y-2">
                              <Label htmlFor="phone">Phone Number</Label>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input 
                                  id="phone" 
                                  type="tel"
                                  placeholder="+234 800 000 0000" 
                                  value={phoneNumber} 
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)} 
                                  required 
                                  className="h-11 md:h-12 pl-10"
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 md:gap-4">
                              <div className="space-y-1.5 md:space-y-2">
                                <Label htmlFor="dob">Date of Birth</Label>
                                <div className="relative">
                                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                                  <Input 
                                    id="dob" 
                                    type="date" 
                                    value={dob} 
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDob(e.target.value)} 
                                    required 
                                    className="h-11 md:h-12 pl-10 text-xs md:text-sm"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1.5 md:space-y-2">
                                <Label htmlFor="gender">Gender</Label>
                                <Select value={gender} onValueChange={setGender} required>
                                  <SelectTrigger id="gender" className="h-11 md:h-12">
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="space-y-1.5 md:space-y-2">
                              <Label htmlFor="state">State of Residence</Label>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                                <Select value={state} onValueChange={setState} required>
                                  <SelectTrigger id="state" className="h-11 md:h-12 pl-10">
                                    <SelectValue placeholder="Choose your state" />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-[250px]">
                                    {NIGERIAN_STATES.map(s => (
                                      <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="space-y-1.5 md:space-y-2">
                              <Label htmlFor="referral">Referral Code (Optional)</Label>
                              <div className="relative">
                                <Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input 
                                  id="referral" 
                                  placeholder="REF12345" 
                                  value={referralCode} 
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReferralCode(e.target.value)} 
                                  className="h-11 md:h-12 pl-10"
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      <div className="space-y-1.5 md:space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                          <Input 
                            id="email" 
                            type="email" 
                            placeholder="name@example.com" 
                            value={email} 
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} 
                            required 
                            className="h-11 md:h-12"
                          />
                      </div>

                      <div className="space-y-1.5 md:space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="password">Password</Label>
                          {isLogin && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsForgotPassword(true);
                                setForgotSubmitted(false);
                              }}
                              className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                            >
                              Forgot password?
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <Input 
                            id="password" 
                            type={showPassword ? "text" : "password"} 
                            value={password} 
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} 
                            required 
                            className="h-11 md:h-12 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {!isLogin && (
                        <div className="space-y-1.5 md:space-y-2">
                          <Label htmlFor="confirmPassword">Confirm Password</Label>
                          <div className="relative">
                            <Input 
                              id="confirmPassword" 
                              type={showPassword ? "text" : "password"} 
                              value={confirmPassword} 
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)} 
                              required 
                              className="h-11 md:h-12 pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      )}

                      {!isLogin && siteKey && (
                        <div className="flex justify-center py-1 md:py-2 scale-75 md:scale-90 origin-center">
                          <ReCAPTCHA
                            ref={captchaRef}
                            sitekey={siteKey}
                          />
                        </div>
                      )}

                      <Button 
                        type="submit" 
                        className="w-full h-11 md:h-12 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all text-sm md:text-base" 
                        disabled={loading}
                      >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLogin ? "Sign In" : "Create Account"}
                      </Button>
                    </form>

                    <div className="mt-6 md:mt-8 text-center">
                      <p className="text-sm text-slate-500">
                        {isLogin ? "New to SabiRight?" : "Already have an account?"}
                        <button
                          type="button"
                          onClick={() => setIsLogin(!isLogin)}
                          className="ml-1 font-bold text-primary hover:text-primary/80 transition-colors"
                        >
                          {isLogin ? "Create an account" : "Sign in instead"}
                        </button>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
          
          <p className="text-center text-[10px] text-slate-400 px-4 md:px-6">
            By continuing, you agree to our Terms of Service and Privacy Policy. 
            All legal information provided is for educational purposes.
          </p>
        </div>
      </div>
    </div>
  );
}
