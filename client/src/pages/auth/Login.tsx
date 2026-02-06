import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReCAPTCHA from "react-google-recaptcha";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // For registration
  const [loading, setLoading] = useState(false);
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const captchaRef = useRef<ReCAPTCHA>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Fetch public site key
    fetch('/api/settings/public')
      .then(res => res.json())
      .then(data => {
        if (data.captcha_site_key) {
          setSiteKey(data.captcha_site_key);
        }
      })
      .catch(err => console.error('Failed to fetch site key:', err));
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
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
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Welcome back!", description: "Successfully logged in." });
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (auth.currentUser) {
            await updateProfile(auth.currentUser, { displayName: name });
            
            // Sync profile with backend and pass captchaToken
            const idToken = await auth.currentUser.getIdToken();
            await fetch(`/api/profile/${auth.currentUser.uid}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ 
                    email: auth.currentUser.email, 
                    displayName: name,
                    captchaToken
                })
            });
        }
        toast({ title: "Account created!", description: "Welcome to Digital Citizen." });
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary text-white rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            {isLogin ? "Sign in to your account" : "Create your Citizen ID"}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Access verified legal aid, jobs, and community services.
          </p>
        </div>

        <Card className="border-slate-200 shadow-xl">
          <CardHeader>
            <CardTitle>{isLogin ? "Login" : "Register"}</CardTitle>
            <CardDescription>
              {isLogin ? "Enter your credentials to access the platform." : "Join thousands of verified citizens today."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g. Uyouko Ekpo" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
              </div>

              {!isLogin && siteKey && (
                <div className="flex justify-center py-2">
                  <ReCAPTCHA
                    ref={captchaRef}
                    sitekey={siteKey}
                    onChange={(val) => console.log('Captcha value:', val)}
                  />
                </div>
              )}

              <Button type="submit" className="w-full font-bold shadow-lg" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLogin ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm font-medium text-primary hover:underline"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
