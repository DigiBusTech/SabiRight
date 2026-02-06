import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Settings, Users, CreditCard, MapPin, Calendar, Briefcase, Store, 
  Shield, Key, CheckCircle2, XCircle, Eye, EyeOff, Save, Bell, Mail, Trash2, Plus, Edit, Building2, Coins,
  BarChart3, Download, FileSpreadsheet, FileText, Flag, LogIn, User, ChevronRight, HelpCircle, MessageSquare, Upload
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { Link, useLocation } from "wouter";

const getAdminHeaders = async () => {
  const token = await auth.currentUser?.getIdToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

const PaymentItem = ({ payment, isManual }: { payment: any; isManual: boolean }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const approvePayment = useMutation({
    mutationFn: async (paymentId: string) => {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (!res.ok) throw new Error('Failed to approve payment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      toast({ title: "Approved", description: "Payment approved and credited" });
    }
  });

  const rejectPayment = useMutation({
    mutationFn: async ({ paymentId, reason }: { paymentId: string; reason?: string }) => {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/payments/${paymentId}/reject`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      if (!res.ok) throw new Error('Failed to reject payment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      toast({ title: "Rejected", description: "Payment rejected" });
    }
  });

  return (
    <div className="p-3 md:p-4 border rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-bold text-sm uppercase">{(payment?.type || 'payment').toString().replace('_', ' ')}</p>
            <Badge className={
              payment?.status === 'completed' ? 'bg-green-100 text-green-800' :
              payment?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }>
              {payment?.status || 'unknown'}
            </Badge>
            {isManual && <Badge variant="outline" className="border-blue-200 text-blue-700">Manual</Badge>}
          </div>
          <p className="text-xs md:text-sm text-slate-500">{payment?.description || 'No description'}</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-[10px] md:text-xs text-slate-400">
              {payment?.createdAt ? new Date(payment.createdAt).toLocaleString() : 'Date unknown'}
            </p>
            <span className="text-[10px] text-slate-300">|</span>
            <p className="text-[10px] text-slate-400">Method: {payment?.paymentMethod || 'Unknown'}</p>
          </div>
          
          {payment.metadata && (
            <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-100 text-xs text-slate-600">
              {payment.metadata.credits && <p className="mb-1"><span className="font-semibold">Credits:</span> {payment.metadata.credits}</p>}
              {payment.metadata.reference && <p className="mb-1"><span className="font-semibold">Ref:</span> {payment.metadata.reference}</p>}
              
              {Array.isArray(payment.metadata.manualFields) && payment.metadata.manualFields.length > 0 && (
                <div className="mt-2 space-y-2">
                  <p className="font-bold text-slate-700 border-b pb-1">Manual Payment Details:</p>
                  {payment.metadata.manualFields.map((f: any, i: number) => (
                    <div key={i} className="flex flex-col gap-1">
                      <span className="text-slate-500 font-medium">{f.name}:</span>
                      {f.type === 'file' ? (
                        <div className="mt-1">
                          {typeof f.value === 'string' && f.value.startsWith('data:') ? (
                            <div className="relative group">
                              <img src={f.value} alt={f.name} className="h-32 rounded border shadow-sm cursor-zoom-in" onClick={() => window.open(f.value)} />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                                <Eye className="text-white h-6 w-6" />
                              </div>
                            </div>
                          ) : (
                            <a href={f.value} target="_blank" rel="noreferrer" className="inline-flex items-center text-blue-600 hover:underline font-medium">
                              <FileText className="h-4 w-4 mr-1" /> View Receipt / File
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="break-all bg-white p-1 rounded border border-slate-100">{f.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {payment.rejectionReason && (
            <p className="mt-2 text-xs text-red-600 font-medium p-2 bg-red-50 rounded border border-red-100">
              Rejection Reason: {payment.rejectionReason}
            </p>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-3 min-w-[120px]">
          <div className="text-right">
            <p className="font-bold text-lg md:text-xl text-slate-900">{payment?.currency || 'NGN'} {(payment?.amount || 0).toLocaleString()}</p>
            <p className="text-[10px] text-slate-400">Transaction ID: {payment?.id ? payment.id.substring(0, 8) : 'unknown'}...</p>
          </div>
          
          {isManual && payment?.status === 'pending' && (
            <div className="flex flex-col gap-2 w-full">
              <Button
                size="sm"
                variant="default"
                className="w-full bg-green-600 hover:bg-green-700 shadow-sm"
                onClick={() => {
                  if (confirm(`Approve payment of ${payment?.currency || 'NGN'} ${payment?.amount || 0} for ${(payment?.type || 'payment').toString().replace('_', ' ')}?`)) {
                    approvePayment.mutate(payment.id);
                  }
                }}
                disabled={approvePayment.isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="w-full shadow-sm"
                onClick={() => {
                  const reason = prompt('Please provide a reason for rejection:');
                  if (reason !== null) {
                    rejectPayment.mutate({ paymentId: payment.id, reason });
                  }
                }}
                disabled={rejectPayment.isPending}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          )}
          
          {!isManual && payment.status === 'pending' && (
            <Badge variant="outline" className="text-slate-400 italic">Processing Automatically</Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user, profile, loading } = useAuth();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [showSecrets, setShowSecrets] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserForStorage, setSelectedUserForStorage] = useState<string | null>(null);
  const [storageAmount, setStorageAmount] = useState("");

  const [setupKey, setSetupKey] = useState("");
  const [isSettingUp, setIsSettingUp] = useState(false);

  const handleAdminSetup = async () => {
    if (!profile?.userId) return;
    setIsSettingUp(true);
    try {
      const res = await fetch(`/api/admin/setup/${profile.userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setupKey })
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Success", description: "You are now an admin. Refreshing..." });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast({ title: "Error", description: data.error || "Setup failed", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Request failed", variant: "destructive" });
    } finally {
      setIsSettingUp(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  console.log('[AdminDashboard] Profile state:', { 
    hasProfile: !!profile, 
    isAdmin: profile?.isAdmin, 
    userId: profile?.userId,
    userEmail: user?.email 
  });

  // Protection Check
  if (!profile?.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <Shield className="h-16 w-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Admin Access Required</h2>
        <p className="text-slate-500 mb-8 max-w-md">
          This area is restricted to administrators. If you are a developer, you can use the setup key to grant yourself admin access.
          <br /><br />
          <span className="text-xs text-slate-400">Current User: {user?.email}</span>
        </p>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 w-full max-w-sm">
          <div className="space-y-4">
            <div className="text-left">
              <Label htmlFor="setupKey" className="text-xs font-bold uppercase text-slate-500">Setup Key</Label>
              <Input 
                id="setupKey"
                type="password" 
                placeholder="Enter admin setup key" 
                value={setupKey}
                onChange={(e) => setSetupKey(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button 
              onClick={handleAdminSetup} 
              disabled={isSettingUp || !setupKey}
              className="w-full"
            >
              {isSettingUp ? "Processing..." : "Grant Admin Access"}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/app")}
              className="w-full text-slate-500"
            >
              Return to App
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Fetch admin data with auth headers
  const { data: settings = [] } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/settings', { headers });
      return res.ok ? res.json() : [];
    }
  });

  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/users', { headers });
      return res.ok ? res.json() : [];
    }
  });

  const { data: vendorApps = [] } = useQuery({
    queryKey: ['admin-vendor-apps'],
    queryFn: async () => {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/vendor-applications', { headers });
      return res.ok ? res.json() : [];
    }
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['admin-vendors'],
    queryFn: async () => {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/vendors', { headers });
      return res.ok ? res.json() : [];
    }
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/payments', { headers });
      return res.ok ? res.json() : [];
    }
  });

  const { data: adminJobs = [] } = useQuery({
    queryKey: ['admin-jobs'],
    queryFn: async () => {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/jobs', { headers });
      return res.ok ? res.json() : [];
    }
  });

  const { data: adminEvents = [] } = useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/events', { headers });
      return res.ok ? res.json() : [];
    }
  });

  const { data: adminVendorServices = [] } = useQuery({
    queryKey: ['admin-vendor-services'],
    queryFn: async () => {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/vendor-services', { headers });
      return res.ok ? res.json() : [];
    }
  });

  const { data: moatItems = [] } = useQuery({
    queryKey: ['admin-moat'],
    queryFn: async () => {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/moat', { headers });
      return res.ok ? res.json() : [];
    }
  });

  const { data: faqs = [] } = useQuery({
    queryKey: ['admin-faqs'],
    queryFn: async () => {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/faqs', { headers });
      return res.ok ? res.json() : [];
    }
  });

  const { data: testimonials = [] } = useQuery({
    queryKey: ['admin-testimonials'],
    queryFn: async () => {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/testimonials', { headers });
      return res.ok ? res.json() : [];
    }
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: async () => {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/plans', { headers });
      return res.ok ? res.json() : [];
    }
  });

  const { data: creditPackages = [] } = useQuery({
    queryKey: ['admin-credit-packages'],
    queryFn: async () => {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/credit-packages', { headers });
      return res.ok ? res.json() : [];
    }
  });

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ['admin-payment-methods'],
    queryFn: async () => {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/payment-methods', { headers });
      return res.ok ? res.json() : [];
    }
  });

  const { data: surveys = [] } = useQuery({
    queryKey: ['admin-surveys'],
    queryFn: async () => {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/surveys', { headers });
      return res.ok ? res.json() : [];
    }
  });

  const { data: surveyStats = {} } = useQuery({
    queryKey: ['admin-surveys-stats'],
    queryFn: async () => {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/surveys/stats', { headers });
      return res.ok ? res.json() : {};
    }
  });

  const saveSetting = useMutation({
    mutationFn: async ({ key, value, category, isSecret }: { key: string; value: string; category: string; isSecret?: boolean }) => {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers,
        body: JSON.stringify({ key, value, category, isSecret })
      });
      if (!res.ok) throw new Error('Failed to save');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast({ title: "Saved", description: "Setting updated successfully" });
    }
  });

  const approveVendor = useMutation({
    mutationFn: async (userId: string) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/vendor/${userId}/approve`, { method: 'POST', headers });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendor-apps'] });
      toast({ title: "Approved", description: "Vendor application approved" });
    }
  });

  const rejectVendor = useMutation({
    mutationFn: async (userId: string) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/vendor/${userId}/reject`, { method: 'POST', headers });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendor-apps'] });
      toast({ title: "Rejected", description: "Vendor application rejected" });
    }
  });

  const approveKYC = useMutation({
    mutationFn: async (userId: string) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/kyc/${userId}/approve`, { method: 'POST', headers });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: "Approved", description: "KYC verification approved" });
    }
  });

  const approveVendorService = useMutation({
    mutationFn: async (serviceId: string) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/vendor-services/${serviceId}/approve`, { method: 'POST', headers });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendor-services'] });
      toast({ title: "Approved", description: "Vendor service approved" });
    }
  });

  const rejectVendorService = useMutation({
    mutationFn: async (serviceId: string) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/vendor-services/${serviceId}/reject`, { method: 'POST', headers });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendor-services'] });
      toast({ title: "Rejected", description: "Vendor service rejected" });
    }
  });

  const rejectKYC = useMutation({
    mutationFn: async (userId: string) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/kyc/${userId}/reject`, { method: 'POST', headers });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: "Rejected", description: "KYC verification rejected" });
    }
  });

  const updateCredits = useMutation({
    mutationFn: async ({ userId, totalCredits }: { userId: string; totalCredits: number }) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/users/${userId}/credits`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ totalCredits })
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: "Updated", description: "User credits updated" });
    }
  });

  const updateStorageLimit = useMutation({
    mutationFn: async ({ userId, limitBytes }: { userId: string; limitBytes: number }) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/users/${userId}/storage-limit`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ limitBytes })
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: "Updated", description: "User storage limit updated" });
    }
  });

  const assignPlan = useMutation({
    mutationFn: async ({ userId, planId }: { userId: string; planId: string }) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/users/${userId}/plan`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ planId })
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: "Assigned", description: "Plan assigned to user" });
    }
  });

  const toggleAdmin = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/users/${userId}/toggle-admin`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ isAdmin })
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: "Updated", description: "User admin status updated" });
    }
  });

  const toggleVendor = useMutation({
    mutationFn: async ({ userId, vendorMode }: { userId: string; vendorMode: boolean }) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/vendor/mode/${userId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ vendorMode })
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: "Updated", description: "User vendor status updated" });
    }
  });

  // FAQ Mutations
  const createFaq = useMutation({
    mutationFn: async (faq: any) => {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/faqs', {
        method: 'POST',
        headers,
        body: JSON.stringify(faq)
      });
      if (!res.ok) throw new Error('Failed to create FAQ');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
      toast({ title: "Created", description: "FAQ added successfully" });
    }
  });

  const updateFaq = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/faqs/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to update FAQ');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
      toast({ title: "Updated", description: "FAQ updated successfully" });
    }
  });

  const deleteFaq = useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/faqs/${id}`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) throw new Error('Failed to delete FAQ');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
      toast({ title: "Deleted", description: "FAQ removed" });
    }
  });

  // Testimonial Mutations
  const createTestimonial = useMutation({
    mutationFn: async (testimonial: any) => {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/testimonials', {
        method: 'POST',
        headers,
        body: JSON.stringify(testimonial)
      });
      if (!res.ok) throw new Error('Failed to create testimonial');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      toast({ title: "Created", description: "Testimonial added successfully" });
    }
  });

  const updateTestimonial = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to update testimonial');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      toast({ title: "Updated", description: "Testimonial updated successfully" });
    }
  });

  const deleteTestimonial = useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) throw new Error('Failed to delete testimonial');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      toast({ title: "Deleted", description: "Testimonial removed" });
    }
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: "Deleted", description: "User deleted successfully" });
    }
  });

  const updateUser = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-vendors'] });
      toast({ title: "Updated", description: "User details updated successfully" });
      setEditingUser(null);
    }
  });

  const impersonateUser = useMutation({
    mutationFn: async (userId: string) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/users/${userId}/impersonate`, {
        method: 'POST',
        headers
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Success", description: "Logging in as user..." });
      // In a real app, you would use data.token to sign in
      // For now, we'll just log it and show a message
      console.log('Impersonation token:', data.token);
      window.open(`/auth/login?token=${data.token}`, '_blank');
    }
  });

  const createPlan = useMutation({
    mutationFn: async (plan: any) => {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers,
        body: JSON.stringify(plan)
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      toast({ title: "Created", description: "Plan created successfully" });
      setNewPlan({ name: '', type: 'basic', userType: 'user', price: 0, credits: 10, description: '' });
    }
  });

  const updatePlan = useMutation({
    mutationFn: async ({ planId, updates }: { planId: string; updates: any }) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/plans/${planId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      toast({ title: "Updated", description: "Plan updated successfully" });
      setEditingPlan(null);
    }
  });

  const deletePlan = useMutation({
    mutationFn: async (planId: string) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/plans/${planId}`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] });
      toast({ title: "Deleted", description: "Plan deleted successfully" });
    }
  });

  // Credit Package Mutations
  const createCreditPackage = useMutation({
    mutationFn: async (packageData: any) => {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/credit-packages', {
        method: 'POST',
        headers,
        body: JSON.stringify(packageData)
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-credit-packages'] });
      toast({ title: "Success", description: "Credit package created" });
      setShowNewPackageForm(false);
      setNewCreditPackage({ name: '', credits: 0, price: 0, bonus: 0, description: '', popular: false });
    }
  });

  const updateCreditPackage = useMutation({
    mutationFn: async ({ packageId, updates }: { packageId: string; updates: any }) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/credit-packages/${packageId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-credit-packages'] });
      toast({ title: "Updated", description: "Credit package updated" });
      setEditingPackage(null);
    }
  });

  const deleteCreditPackage = useMutation({
    mutationFn: async (packageId: string) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/credit-packages/${packageId}`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-credit-packages'] });
      toast({ title: "Deleted", description: "Package deleted successfully" });
    }
  });

  // Payment Method Mutations
  const createPaymentMethod = useMutation({
    mutationFn: async (methodData: any) => {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/payment-methods', {
        method: 'POST',
        headers,
        body: JSON.stringify(methodData)
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payment-methods'] });
      toast({ title: "Success", description: "Payment method created" });
      setShowNewPaymentMethodForm(false);
      setNewPaymentMethod({ name: '', type: 'manual', description: '', instructions: '', active: true, fields: [] });
    }
  });

  const deletePaymentMethod = useMutation({
    mutationFn: async (methodId: string) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/payment-methods/${methodId}`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payment-methods'] });
      toast({ title: "Deleted", description: "Payment method deleted successfully" });
    }
  });

  const togglePaymentMethod = useMutation({
    mutationFn: async ({ methodId, active }: { methodId: string; active: boolean }) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/payment-methods/${methodId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ active })
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payment-methods'] });
      toast({ title: "Updated", description: "Payment method status updated" });
    }
  });

  const approvePayment = useMutation({
    mutationFn: async (paymentId: string) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/payments/${paymentId}/approve`, {
        method: 'POST',
        headers
      });
      if (!res.ok) throw new Error('Failed to approve payment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      toast({ title: "Approved", description: "Payment approved and credited" });
    }
  });

  const rejectPayment = useMutation({
    mutationFn: async ({ paymentId, reason }: { paymentId: string; reason?: string }) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/payments/${paymentId}/reject`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason })
      });
      if (!res.ok) throw new Error('Failed to reject payment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      toast({ title: "Rejected", description: "Payment rejected" });
    }
  });

  // Flagged Posts Query
  const { data: flaggedPosts = [] } = useQuery({
    queryKey: ['admin-flagged-posts'],
    queryFn: async () => {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/flagged-posts', { headers });
      return res.ok ? res.json() : [];
    }
  });

  // Flagged Posts Mutations
  const reinstatePost = useMutation({
    mutationFn: async (postId: string) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/flagged-posts/${postId}/reinstate`, {
        method: 'POST',
        headers
      });
      if (!res.ok) throw new Error('Failed to reinstate');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-flagged-posts'] });
      toast({ title: "Reinstated", description: "Post has been reinstated and is now visible to users" });
    }
  });

  const deleteFlaggedPost = useMutation({
    mutationFn: async (postId: string) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/flagged-posts/${postId}`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) throw new Error('Failed to delete');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-flagged-posts'] });
      toast({ title: "Deleted", description: "Post has been permanently deleted" });
    }
  });

  const deleteJob = useMutation({
    mutationFn: async (jobId: string) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/jobs/${jobId}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
      toast({ title: "Deleted", description: "Job deleted successfully" });
    }
  });

  const createJob = useMutation({
    mutationFn: async (job: any) => {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers,
        body: JSON.stringify(job)
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
      toast({ title: "Created", description: "Job created successfully" });
      setNewJob({ title: '', company: '', location: '', type: 'Full-time', workMode: 'Remote', salary: '', description: '', contact: '' });
    }
  });

  const updateJob = useMutation({
    mutationFn: async ({ jobId, updates }: { jobId: string; updates: any }) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/jobs/${jobId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
      toast({ title: "Updated", description: "Job updated successfully" });
      setEditingJob(null);
    }
  });

  const deleteEvent = useMutation({
    mutationFn: async (eventId: string) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/events/${eventId}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      toast({ title: "Deleted", description: "Event deleted successfully" });
    }
  });

  const createEvent = useMutation({
    mutationFn: async (event: any) => {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers,
        body: JSON.stringify(event)
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      toast({ title: "Created", description: "Event created successfully" });
      setNewEvent({ title: '', description: '', date: '', time: '', location: '', category: 'workshop', organizer: 'Admin', maxAttendees: 100 });
    }
  });

  const updateEvent = useMutation({
    mutationFn: async ({ eventId, updates }: { eventId: string; updates: any }) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      toast({ title: "Updated", description: "Event updated successfully" });
      setEditingEvent(null);
    }
  });

  const deleteMoat = useMutation({
    mutationFn: async (id: string) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/moat/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-moat'] });
      toast({ title: "Deleted", description: "MOAT entry deleted" });
    }
  });

  const createMoat = useMutation({
    mutationFn: async (data: any) => {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/moat', {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-moat'] });
      toast({ title: "Success", description: "MOAT data uploaded" });
    }
  });

  // Escrow Disputes
  const { data: disputes = [] } = useQuery({
    queryKey: ['admin-disputes'],
    queryFn: async () => {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/disputes', { headers });
      return res.ok ? res.json() : [];
    }
  });

  const joinDispute = useMutation({
    mutationFn: async (disputeId: string) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/disputes/${disputeId}/join`, {
        method: 'POST',
        headers
      });
      if (!res.ok) throw new Error('Failed to join dispute');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      toast({ title: "Joined Dispute", description: "You have joined the dispute chat. User and vendor can no longer message." });
    }
  });

  const resolveDispute = useMutation({
    mutationFn: async ({ disputeId, resolution, notes }: { disputeId: string, resolution: string, notes: string }) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution, notes })
      });
      if (!res.ok) throw new Error('Failed to resolve dispute');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      toast({ title: "Dispute Resolved", description: "The dispute has been marked as resolved." });
    }
  });

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [newPlan, setNewPlan] = useState({ name: '', type: 'basic', userType: 'user', price: 0, credits: 10, description: '' });
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [resolvingDispute, setResolvingDispute] = useState<any>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: string; title: string; description: string } | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolutionValue, setResolutionValue] = useState("user_favor");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [editingVendor, setEditingVendor] = useState<any>(null);
  const [newMoat, setNewMoat] = useState({ title: '', content: '', source: '', category: 'constitution' });
  const [editingJob, setEditingJob] = useState<any>(null);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [newJob, setNewJob] = useState<any>({ title: '', company: '', location: '', type: 'Full-time', workMode: 'Remote', salary: '', description: '', contact: '' });
  const [newEvent, setNewEvent] = useState<any>({ title: '', description: '', date: '', time: '', location: '', category: 'workshop', organizer: 'Admin', maxAttendees: 100 });
  
  // Credit package states
  const [showNewPackageForm, setShowNewPackageForm] = useState(false);
  const [newCreditPackage, setNewCreditPackage] = useState({ 
    name: '', 
    credits: 0, 
    price: 0, 
    bonus: 0, 
    description: '', 
    popular: false 
  });
  
  // Payment method states
  const [showNewPaymentMethodForm, setShowNewPaymentMethodForm] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    name: '',
    type: 'manual',
    description: '',
    instructions: '',
    active: true,
    fields: [] as Array<{ name: string; type: 'text' | 'file'; required: boolean; placeholder: string }>
  });
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<any>(null);

  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'system',
    subject: '',
    bodyTemplate: '',
    channels: { email: true, push: false, in_app: true }
  });

  // FAQ management states
  const [showFaqForm, setShowFaqForm] = useState(false);
  const [editingFaq, setEditingFaq] = useState<any>(null);
  const [newFaq, setNewFaq] = useState({
    question: '',
    answer: '',
    category: 'general',
    order: 0,
    isActive: true
  });

  // Testimonial management states
  const [showTestimonialForm, setShowTestimonialForm] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<any>(null);
  const [newTestimonial, setNewTestimonial] = useState({
    name: '',
    role: '',
    content: '',
    avatar: '',
    rating: 5,
    isActive: true
  });
  const [smtpSettings, setSmtpSettings] = useState({
    host: '',
    port: '587',
    username: '',
    password: '',
    fromEmail: '',
    fromName: '',
    encryption: 'tls'
  });

  const { data: notificationTemplates = [] } = useQuery({
    queryKey: ['admin-notification-templates'],
    queryFn: async () => {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/notifications/templates', { headers });
      return res.ok ? res.json() : [];
    }
  });

  const { data: smtpData } = useQuery({
    queryKey: ['admin-smtp-settings'],
    queryFn: async () => {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/notifications/smtp', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setSmtpSettings({
            host: data.host || '',
            port: data.port?.toString() || '587',
            username: data.username || '',
            password: data.password || '',
            fromEmail: data.fromEmail || '',
            fromName: data.fromName || '',
            encryption: data.encryption || 'tls'
          });
        }
        return data;
      }
      return null;
    }
  });

  const createTemplate = useMutation({
    mutationFn: async (template: any) => {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/notifications/templates', {
        method: 'POST',
        headers,
        body: JSON.stringify(template)
      });
      if (!res.ok) throw new Error('Failed to create template');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notification-templates'] });
      toast({ title: "Created", description: "Notification template created successfully" });
      setNewTemplate({ name: '', type: 'system', subject: '', bodyTemplate: '', channels: { email: true, push: false, in_app: true } });
    }
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ templateId, updates }: { templateId: string; updates: any }) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/notifications/templates/${templateId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to update template');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notification-templates'] });
      toast({ title: "Updated", description: "Notification template updated successfully" });
      setEditingTemplate(null);
    }
  });

  const deleteTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/notifications/templates/${templateId}`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) throw new Error('Failed to delete template');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notification-templates'] });
      toast({ title: "Deleted", description: "Notification template deleted successfully" });
    }
  });

  const saveSmtpSettings = useMutation({
    mutationFn: async (settings: any) => {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/notifications/smtp', {
        method: 'POST',
        headers,
        body: JSON.stringify(settings)
      });
      if (!res.ok) throw new Error('Failed to save SMTP settings');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-smtp-settings'] });
      toast({ title: "Saved", description: "SMTP settings saved successfully" });
    }
  });

  const testSmtpConnection = useMutation({
    mutationFn: async () => {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/notifications/smtp/test', {
        method: 'POST',
        headers,
        body: JSON.stringify(smtpSettings)
      });
      if (!res.ok) throw new Error('SMTP connection test failed');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "SMTP connection test successful" });
    },
    onError: () => {
      toast({ title: "Failed", description: "SMTP connection test failed", variant: "destructive" });
    }
  });

  const getSetting = (key: string) => settings.find((s: any) => s.key === key)?.value || '';

  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});

  const handleSettingChange = (key: string, value: string) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSetting = (key: string, category: string, isSecret: boolean = false) => {
    const value = localSettings[key] ?? getSetting(key);

    // Validation for SEO keywords
    if (key === 'seo_keywords' && value) {
      if (!value.includes(',')) {
        toast({ 
          title: "Format Suggestion", 
          description: "Consider using comma-separated keywords for better SEO results.", 
          variant: "default" 
        });
      }
    }

    saveSetting.mutate({ key, value, category, isSecret });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-3 md:p-6 pb-20">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-sm md:text-base text-slate-500">Manage your platform settings and users</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/app">
              <Button variant="outline" size="sm" className="gap-2">
                <ChevronRight className="h-4 w-4 rotate-180" /> Back to App
              </Button>
            </Link>
            <Badge className="bg-red-600 text-white w-fit">Admin Access</Badge>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold text-blue-700">{users.length}</p>
                  <p className="text-[10px] md:text-xs text-blue-600/70">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <Store className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold text-green-700">{vendorApps.filter((a: any) => a.status === 'approved').length}</p>
                  <p className="text-[10px] md:text-xs text-green-600/70">Active Vendors</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold text-purple-700">{adminEvents.length}</p>
                  <p className="text-[10px] md:text-xs text-purple-600/70">Events</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold text-amber-700">{payments.length}</p>
                  <p className="text-[10px] md:text-xs text-amber-600/70">Transactions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="settings" className="space-y-4">
          <div className="overflow-x-auto -mx-3 px-3 pb-1">
            <TabsList className="bg-white border inline-flex w-auto min-w-full md:w-full">
              <TabsTrigger value="settings" className="text-xs md:text-sm whitespace-nowrap"><Settings className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" /><span className="hidden sm:inline">Settings</span><span className="sm:hidden">Set</span></TabsTrigger>
              <TabsTrigger value="api-keys" className="text-xs md:text-sm whitespace-nowrap"><Key className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" /><span className="hidden sm:inline">API Keys</span><span className="sm:hidden">API</span></TabsTrigger>
              <TabsTrigger value="plans" className="text-xs md:text-sm whitespace-nowrap"><CreditCard className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" /> Plans</TabsTrigger>
              <TabsTrigger value="credits" className="text-xs md:text-sm whitespace-nowrap"><Coins className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" /><span className="hidden sm:inline">Credits</span><span className="sm:hidden">Cred</span></TabsTrigger>
              <TabsTrigger value="payment-methods" className="text-xs md:text-sm whitespace-nowrap"><Building2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" /><span className="hidden sm:inline">Payment Methods</span><span className="sm:hidden">Pay</span></TabsTrigger>
              <TabsTrigger value="payments" className="text-xs md:text-sm whitespace-nowrap"><CreditCard className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" /><span className="hidden sm:inline">Transactions</span><span className="sm:hidden">Trans</span></TabsTrigger>
              <TabsTrigger value="users" className="text-xs md:text-sm whitespace-nowrap"><Users className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" /> Users</TabsTrigger>
              <TabsTrigger value="vendor-services" className="text-xs md:text-sm whitespace-nowrap"><Briefcase className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" /> Services</TabsTrigger>
              <TabsTrigger value="vendors" className="text-xs md:text-sm whitespace-nowrap"><Store className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" /><span className="hidden sm:inline">Vendors</span><span className="sm:hidden">Vend</span></TabsTrigger>
              <TabsTrigger value="notifications" className="text-xs md:text-sm whitespace-nowrap" data-testid="tab-notifications"><Bell className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" /><span className="hidden sm:inline">Notifications</span><span className="sm:hidden">Notif</span></TabsTrigger>
              <TabsTrigger value="jobs" className="text-xs md:text-sm whitespace-nowrap"><Briefcase className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" /> Jobs</TabsTrigger>
              <TabsTrigger value="events" className="text-xs md:text-sm whitespace-nowrap"><Calendar className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" /> Events</TabsTrigger>
              <TabsTrigger value="faqs" className="text-xs md:text-sm whitespace-nowrap"><HelpCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" /> FAQs</TabsTrigger>
              <TabsTrigger value="testimonials" className="text-xs md:text-sm whitespace-nowrap"><MessageSquare className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" /> Reviews</TabsTrigger>
              <TabsTrigger value="moat" className="text-xs md:text-sm whitespace-nowrap"><Shield className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" /> MOAT</TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs md:text-sm whitespace-nowrap"><BarChart3 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" /><span className="hidden sm:inline">Analytics</span><span className="sm:hidden">Stats</span></TabsTrigger>
              <TabsTrigger value="surveys" className="text-xs md:text-sm whitespace-nowrap"><MessageSquare className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" /><span className="hidden sm:inline">Adoption</span><span className="sm:hidden">Surv</span></TabsTrigger>
              <TabsTrigger value="flagged-posts" className="text-xs md:text-sm whitespace-nowrap"><Flag className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" /><span className="hidden sm:inline">Flagged Posts</span><span className="sm:hidden">Flags</span></TabsTrigger>
          <TabsTrigger value="escrow" className="text-xs md:text-sm whitespace-nowrap"><Shield className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" /><span className="hidden sm:inline">Escrow</span><span className="sm:hidden">Escrow</span></TabsTrigger>
        </TabsList>
          </div>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Branding</CardTitle>
                  <p className="text-sm text-slate-500">Configure your platform's visual identity and basic information.</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Site Title */}
                    <div className="space-y-2">
                      <Label htmlFor="site_title">Site Title</Label>
                      <div className="flex gap-2">
                        <Input
                          id="site_title"
                          placeholder="DigiZen AI"
                          value={localSettings['site_title'] ?? getSetting('site_title')}
                          onChange={(e) => handleSettingChange('site_title', e.target.value)}
                        />
                        <Button size="sm" onClick={() => handleSaveSetting('site_title', 'branding')}>
                          <Save className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-[10px] text-slate-500">The name of your platform as it appears in the browser tab and emails.</p>
                    </div>

                    {/* Contact Email */}
                    <div className="space-y-2">
                      <Label htmlFor="contact_email">Support Email</Label>
                      <div className="flex gap-2">
                        <Input
                          id="contact_email"
                          placeholder="support@digizen.ai"
                          value={localSettings['contact_email'] ?? getSetting('contact_email')}
                          onChange={(e) => handleSettingChange('contact_email', e.target.value)}
                        />
                        <Button size="sm" onClick={() => handleSaveSetting('contact_email', 'contact')}>
                          <Save className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Logo URL */}
                    <div className="space-y-2">
                      <Label htmlFor="site_logo">Logo URL</Label>
                      <div className="flex gap-2">
                        <Input
                          id="site_logo"
                          placeholder="https://example.com/logo.png"
                          value={localSettings['site_logo'] ?? getSetting('site_logo')}
                          onChange={(e) => handleSettingChange('site_logo', e.target.value)}
                        />
                        <div className="relative">
                          <Input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="logo-upload"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const formData = new FormData();
                                formData.append('file', file);
                                try {
                                  const res = await fetch('/api/upload', {
                                    method: 'POST',
                                    body: formData
                                  });
                                  const data = await res.json();
                                  if (data.url) {
                                    handleSettingChange('site_logo', data.url);
                                    toast({ title: "Uploaded", description: "Logo uploaded successfully. Click save to apply." });
                                  }
                                } catch (err) {
                                  toast({ title: "Upload Failed", description: "Failed to upload logo", variant: "destructive" });
                                }
                              }
                            }}
                          />
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => document.getElementById('logo-upload')?.click()}
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button size="sm" onClick={() => handleSaveSetting('site_logo', 'branding')}>
                          <Save className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-2 p-2 border rounded bg-slate-50 flex items-center justify-center h-20">
                        {(localSettings['site_logo'] ?? getSetting('site_logo')) ? (
                          <img src={localSettings['site_logo'] ?? getSetting('site_logo')} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
                        ) : (
                          <span className="text-xs text-slate-400">No logo set</span>
                        )}
                      </div>
                    </div>

                    {/* Favicon URL */}
                    <div className="space-y-2">
                      <Label htmlFor="site_favicon">Favicon URL</Label>
                      <div className="flex gap-2">
                        <Input
                          id="site_favicon"
                          placeholder="https://example.com/favicon.ico"
                          value={localSettings['site_favicon'] ?? getSetting('site_favicon')}
                          onChange={(e) => handleSettingChange('site_favicon', e.target.value)}
                        />
                        <div className="relative">
                          <Input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="favicon-upload"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const formData = new FormData();
                                formData.append('file', file);
                                try {
                                  const res = await fetch('/api/upload', {
                                    method: 'POST',
                                    body: formData
                                  });
                                  const data = await res.json();
                                  if (data.url) {
                                    handleSettingChange('site_favicon', data.url);
                                    toast({ title: "Uploaded", description: "Favicon uploaded successfully. Click save to apply." });
                                  }
                                } catch (err) {
                                  toast({ title: "Upload Failed", description: "Failed to upload favicon", variant: "destructive" });
                                }
                              }
                            }}
                          />
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => document.getElementById('favicon-upload')?.click()}
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button size="sm" onClick={() => handleSaveSetting('site_favicon', 'branding')}>
                          <Save className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-2 p-2 border rounded bg-slate-50 flex items-center justify-center h-20">
                        {(localSettings['site_favicon'] ?? getSetting('site_favicon')) ? (
                          <img src={localSettings['site_favicon'] ?? getSetting('site_favicon')} alt="Favicon Preview" className="h-8 w-8 object-contain" />
                        ) : (
                          <span className="text-xs text-slate-400">No favicon set</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Primary Color */}
                    <div className="space-y-2">
                      <Label htmlFor="primary_color">Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primary_color"
                          type="color"
                          className="w-12 h-10 p-1"
                          value={localSettings['primary_color'] ?? getSetting('primary_color') ?? '#3b82f6'}
                          onChange={(e) => handleSettingChange('primary_color', e.target.value)}
                        />
                        <Input
                          placeholder="#3b82f6"
                          value={localSettings['primary_color'] ?? getSetting('primary_color') ?? '#3b82f6'}
                          onChange={(e) => handleSettingChange('primary_color', e.target.value)}
                        />
                        <Button size="sm" onClick={() => handleSaveSetting('primary_color', 'branding')}>
                          <Save className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Secondary Color */}
                    <div className="space-y-2">
                      <Label htmlFor="secondary_color">Secondary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="secondary_color"
                          type="color"
                          className="w-12 h-10 p-1"
                          value={localSettings['secondary_color'] ?? getSetting('secondary_color') ?? '#1e293b'}
                          onChange={(e) => handleSettingChange('secondary_color', e.target.value)}
                        />
                        <Input
                          placeholder="#1e293b"
                          value={localSettings['secondary_color'] ?? getSetting('secondary_color') ?? '#1e293b'}
                          onChange={(e) => handleSettingChange('secondary_color', e.target.value)}
                        />
                        <Button size="sm" onClick={() => handleSaveSetting('secondary_color', 'branding')}>
                          <Save className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>SEO & Metadata</CardTitle>
                  <p className="text-sm text-slate-500">Optimize how your platform appears in search engines.</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="seo_description">Meta Description</Label>
                    <div className="flex gap-2">
                      <Textarea
                        id="seo_description"
                        placeholder="DigiZen AI is a comprehensive platform for..."
                        value={localSettings['seo_description'] ?? getSetting('seo_description')}
                        onChange={(e) => handleSettingChange('seo_description', e.target.value)}
                      />
                      <Button size="sm" onClick={() => handleSaveSetting('seo_description', 'seo')}>
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seo_keywords">Meta Keywords</Label>
                    <div className="flex gap-2">
                      <Input
                        id="seo_keywords"
                        placeholder="AI, Governance, Community, Nigeria"
                        value={localSettings['seo_keywords'] ?? getSetting('seo_keywords')}
                        onChange={(e) => handleSettingChange('seo_keywords', e.target.value)}
                      />
                      <Button size="sm" onClick={() => handleSaveSetting('seo_keywords', 'seo')}>
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-[10px] text-slate-500">Comma-separated list of keywords for SEO.</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Footer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="footer_text">Footer Copyright Text</Label>
                    <div className="flex gap-2">
                      <Input
                        id="footer_text"
                        placeholder="© 2024 DigiZen AI. All rights reserved."
                        value={localSettings['footer_text'] ?? getSetting('footer_text')}
                        onChange={(e) => handleSettingChange('footer_text', e.target.value)}
                      />
                      <Button size="sm" onClick={() => handleSaveSetting('footer_text', 'branding')}>
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50/30">
                <CardHeader>
                  <CardTitle className="text-red-700">Data Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-red-100 rounded-lg bg-white">
                    <div>
                      <h4 className="font-bold text-slate-800">Export All Data</h4>
                      <p className="text-sm text-slate-500">Download a complete backup of the system database (JSON format).</p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => setConfirmAction({
                        type: 'export',
                        title: 'Export Database',
                        description: 'Are you sure you want to export the entire database? This may contain sensitive information.'
                      })}
                    >
                      <Download className="h-4 w-4 mr-2" /> Export Database
                    </Button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-red-100 rounded-lg bg-white">
                    <div>
                      <h4 className="font-bold text-red-700">Clear System Cache</h4>
                      <p className="text-sm text-slate-500">Force refresh all system caches and sessions.</p>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => setConfirmAction({
                        type: 'cache',
                        title: 'Clear System Cache',
                        description: 'This will force all users to re-authenticate and clear temporary server data. Continue?'
                      })}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Clear Cache
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api-keys">
            <Card>
              <CardHeader>
                <CardTitle>Platform API Keys</CardTitle>
                <p className="text-sm text-slate-500">Configure external service connections. Payment keys are managed in Payment Methods tab.</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* AI Configuration */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    AI Provider Settings
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border">
                    <div className="space-y-2">
                      <Label>Default AI Provider</Label>
                      <Select 
                        value={localSettings['ai_provider'] ?? getSetting('ai_provider') ?? 'google'}
                        onValueChange={(v) => handleSettingChange('ai_provider', v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="google">Google Gemini (Default)</SelectItem>
                          <SelectItem value="openai">OpenAI (ChatGPT)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-slate-500">Choose which AI service powers suggestions across the platform.</p>
                    </div>
                    <div className="flex items-end pb-1">
                      <Button size="sm" onClick={() => handleSaveSetting('ai_provider', 'ai')}>Save Provider</Button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="flex items-center justify-between">
                          Google Gemini API Key
                          <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setShowSecrets(!showSecrets)}>
                            {showSecrets ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                            {showSecrets ? 'Hide' : 'Show'}
                          </Button>
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            type={showSecrets ? "text" : "password"}
                            placeholder="AIzaSy..."
                            value={localSettings['google_gemini_api_key'] ?? getSetting('google_gemini_api_key')}
                            onChange={(e) => handleSettingChange('google_gemini_api_key', e.target.value)}
                          />
                          <Button size="sm" onClick={() => handleSaveSetting('google_gemini_api_key', 'ai', true)}>
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center justify-between">
                          OpenAI API Key
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            type={showSecrets ? "text" : "password"}
                            placeholder="sk-..."
                            value={localSettings['openai_api_key'] ?? getSetting('openai_api_key')}
                            onChange={(e) => handleSettingChange('openai_api_key', e.target.value)}
                          />
                          <Button size="sm" onClick={() => handleSaveSetting('openai_api_key', 'ai', true)}>
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Google Maps API Key</Label>
                        <div className="flex gap-2">
                          <Input
                            type={showSecrets ? "text" : "password"}
                            placeholder="AIza..."
                            value={localSettings['google_maps_api_key'] ?? getSetting('google_maps_api_key')}
                            onChange={(e) => handleSettingChange('google_maps_api_key', e.target.value)}
                          />
                          <Button size="sm" onClick={() => handleSaveSetting('google_maps_api_key', 'maps', true)}>
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>reCAPTCHA Site Key</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Site Key"
                            value={localSettings['captcha_site_key'] ?? getSetting('captcha_site_key')}
                            onChange={(e) => handleSettingChange('captcha_site_key', e.target.value)}
                          />
                          <Button size="sm" onClick={() => handleSaveSetting('captcha_site_key', 'security')}>
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>reCAPTCHA Secret Key</Label>
                        <div className="flex gap-2">
                          <Input
                            type={showSecrets ? "text" : "password"}
                            placeholder="Secret Key"
                            value={localSettings['captcha_secret_key'] ?? getSetting('captcha_secret_key')}
                            onChange={(e) => handleSettingChange('captcha_secret_key', e.target.value)}
                          />
                          <Button size="sm" onClick={() => handleSaveSetting('captcha_secret_key', 'security', true)}>
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans">
            <div className="space-y-6">
              {/* Create New Plan */}
              <Card>
                <CardHeader>
                  <CardTitle>Create New Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label>Plan Name</Label>
                      <Input
                        placeholder="e.g. Basic Monthly"
                        value={newPlan.name}
                        onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                      />
                      <p className="text-[10px] text-slate-500">Public name of the subscription plan</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Tier Level</Label>
                      <select
                        className="w-full h-10 px-3 border rounded-md text-sm"
                        value={newPlan.type}
                        onChange={(e) => setNewPlan({ ...newPlan, type: e.target.value })}
                      >
                        <option value="free">Free</option>
                        <option value="basic">Basic</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                      <p className="text-[10px] text-slate-500">Service tier for feature access</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Target Audience</Label>
                      <select
                        className="w-full h-10 px-3 border rounded-md text-sm"
                        value={newPlan.userType}
                        onChange={(e) => setNewPlan({ ...newPlan, userType: e.target.value })}
                      >
                        <option value="user">Regular User</option>
                        <option value="vendor">Service Vendor</option>
                      </select>
                      <p className="text-[10px] text-slate-500">Who can subscribe to this plan</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Price (NGN)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newPlan.price}
                        onChange={(e) => setNewPlan({ ...newPlan, price: parseInt(e.target.value) || 0 })}
                      />
                      <p className="text-[10px] text-slate-500">Monthly billing amount in Naira</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Credit Allowance</Label>
                      <Input
                        type="number"
                        placeholder="10"
                        value={newPlan.credits}
                        onChange={(e) => setNewPlan({ ...newPlan, credits: parseInt(e.target.value) || 10 })}
                      />
                      <p className="text-[10px] text-slate-500">Credits provided per month/refresh</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Plan Description</Label>
                      <Input
                        placeholder="Features, benefits..."
                        value={newPlan.description}
                        onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                      />
                      <p className="text-[10px] text-slate-500">Short summary of plan features</p>
                    </div>
                  </div>
                  <Button 
                    className="mt-6" 
                    onClick={() => createPlan.mutate(newPlan)}
                    disabled={!newPlan.name}
                  >
                    Create Plan
                  </Button>
                </CardContent>
              </Card>

              {/* Existing Plans */}
              <Card>
                <CardHeader>
                  <CardTitle>Existing Plans ({plans.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {plans.length === 0 ? (
                    <p className="text-center py-8 text-slate-400">No plans created yet</p>
                  ) : (
                    <div className="space-y-3">
                      {plans.map((plan: any) => (
                        <div key={plan.id} className="p-4 border rounded-lg">
                          {editingPlan?.id === plan.id ? (
                            <div className="space-y-3">
                              <div className="grid md:grid-cols-3 gap-3">
                                <Input
                                  value={editingPlan.name}
                                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                                />
                                <Input
                                  type="number"
                                  value={editingPlan.price}
                                  onChange={(e) => setEditingPlan({ ...editingPlan, price: parseInt(e.target.value) || 0 })}
                                />
                                <Input
                                  type="number"
                                  value={editingPlan.credits}
                                  onChange={(e) => setEditingPlan({ ...editingPlan, credits: parseInt(e.target.value) || 0 })}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => updatePlan.mutate({ 
                                  planId: plan.id, 
                                  updates: { 
                                    name: editingPlan.name,
                                    price: editingPlan.price,
                                    credits: editingPlan.credits,
                                    type: editingPlan.type,
                                    userType: editingPlan.userType,
                                    description: editingPlan.description
                                  }
                                })}>
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingPlan(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-bold">{plan.name}</p>
                                <p className="text-sm text-slate-500">
                                  {plan.type} - {plan.userType} | NGN {plan.price || 0} | {plan.credits || 0} credits
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => setEditingPlan(plan)}>
                                  Edit
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => deletePlan.mutate(plan.id)}>
                                  Delete
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Credits Management Tab */}
          <TabsContent value="credits">
            <div className="space-y-6">
              {/* Credit Packages */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Credit Packages</CardTitle>
                    <Button onClick={() => setShowNewPackageForm(!showNewPackageForm)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Package
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {showNewPackageForm && (
                    <div className="p-4 border rounded-lg mb-4 bg-slate-50">
                      <p className="font-bold mb-3">Create Credit Package</p>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Package Name</Label>
                          <Input
                            placeholder="e.g., Starter Pack"
                            value={newCreditPackage.name}
                            onChange={(e) => setNewCreditPackage({ ...newCreditPackage, name: e.target.value })}
                          />
                          <p className="text-[10px] text-slate-500">Public name of the credit bundle</p>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Credits</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={newCreditPackage.credits}
                            onChange={(e) => setNewCreditPackage({ ...newCreditPackage, credits: parseInt(e.target.value) || 0 })}
                          />
                          <p className="text-[10px] text-slate-500">Base number of credits in this package</p>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Price (NGN)</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={newCreditPackage.price}
                            onChange={(e) => setNewCreditPackage({ ...newCreditPackage, price: parseInt(e.target.value) || 0 })}
                          />
                          <p className="text-[10px] text-slate-500">Cost to purchase this bundle</p>
                        </div>
                        <div className="space-y-1.5">
                          <Label>Bonus Credits (optional)</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={newCreditPackage.bonus}
                            onChange={(e) => setNewCreditPackage({ ...newCreditPackage, bonus: parseInt(e.target.value) || 0 })}
                          />
                          <p className="text-[10px] text-slate-500">Extra credits given as an incentive</p>
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                          <Label>Description</Label>
                          <Input
                            placeholder="e.g. Best for small businesses"
                            value={newCreditPackage.description}
                            onChange={(e) => setNewCreditPackage({ ...newCreditPackage, description: e.target.value })}
                          />
                          <p className="text-[10px] text-slate-500">Short summary of package value</p>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <Checkbox
                            checked={newCreditPackage.popular}
                            onCheckedChange={(checked) => setNewCreditPackage({ ...newCreditPackage, popular: checked as boolean })}
                          />
                          <Label>Mark as Popular</Label>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button onClick={() => createCreditPackage.mutate(newCreditPackage)}>
                          Create Package
                        </Button>
                        <Button variant="outline" onClick={() => setShowNewPackageForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {creditPackages.length === 0 ? (
                    <p className="text-center py-8 text-slate-400">No credit packages yet</p>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {creditPackages.map((pkg: any) => (
                        <div key={pkg.id} className="p-4 border rounded-lg">
                          {editingPackage?.id === pkg.id ? (
                            <div className="space-y-3">
                              <div className="grid md:grid-cols-2 gap-3">
                                <Input
                                  value={editingPackage.name}
                                  onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                                />
                                <Input
                                  type="number"
                                  value={editingPackage.credits}
                                  onChange={(e) => setEditingPackage({ ...editingPackage, credits: parseInt(e.target.value) || 0 })}
                                />
                                <Input
                                  type="number"
                                  value={editingPackage.price}
                                  onChange={(e) => setEditingPackage({ ...editingPackage, price: parseInt(e.target.value) || 0 })}
                                />
                                <Input
                                  type="number"
                                  value={editingPackage.bonus}
                                  onChange={(e) => setEditingPackage({ ...editingPackage, bonus: parseInt(e.target.value) || 0 })}
                                />
                                <Input
                                  className="md:col-span-2"
                                  value={editingPackage.description}
                                  onChange={(e) => setEditingPackage({ ...editingPackage, description: e.target.value })}
                                />
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={editingPackage.popular}
                                    onCheckedChange={(checked) => setEditingPackage({ ...editingPackage, popular: checked as boolean })}
                                  />
                                  <Label>Popular</Label>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => updateCreditPackage.mutate({ 
                                  packageId: pkg.id, 
                                  updates: { 
                                    name: editingPackage.name,
                                    credits: editingPackage.credits,
                                    price: editingPackage.price,
                                    bonus: editingPackage.bonus,
                                    description: editingPackage.description,
                                    popular: editingPackage.popular
                                  }
                                })}>
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingPackage(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-bold">{pkg.name}</p>
                                  {pkg.popular && <Badge className="bg-amber-500 text-white text-xs">Popular</Badge>}
                                </div>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="outline" onClick={() => setEditingPackage(pkg)}>
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => deleteCreditPackage.mutate(pkg.id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-sm text-slate-600">{pkg.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline">{pkg.credits} Credits</Badge>
                                {pkg.bonus > 0 && <Badge className="bg-green-100 text-green-700">+{pkg.bonus} Bonus</Badge>}
                                <Badge className="bg-blue-100 text-blue-700">NGN {pkg.price}</Badge>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Credit Costs per Feature */}
              <Card>
                <CardHeader>
                  <CardTitle>Credit Costs per Feature</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <Label>AI Legal Query (SabiDoctor)</Label>
                        <Input
                          type="number"
                          value={localSettings['credit_cost_ai_query'] ?? getSetting('credit_cost_ai_query') ?? '1'}
                          onChange={(e) => handleSettingChange('credit_cost_ai_query', e.target.value)}
                          placeholder="1"
                        />
                      </div>
                      <div>
                        <Label>Job Application</Label>
                        <Input
                          type="number"
                          value={localSettings['credit_cost_job_application'] ?? getSetting('credit_cost_job_application') ?? '2'}
                          onChange={(e) => handleSettingChange('credit_cost_job_application', e.target.value)}
                          placeholder="2"
                        />
                      </div>
                      <div>
                        <Label>Marketplace Featured Listing</Label>
                        <Input
                          type="number"
                          value={localSettings['credit_cost_marketplace_feature'] ?? getSetting('credit_cost_marketplace_feature') ?? '5'}
                          onChange={(e) => handleSettingChange('credit_cost_marketplace_feature', e.target.value)}
                          placeholder="5"
                        />
                      </div>
                      <div>
                        <Label>Traffic Alert Post</Label>
                        <Input
                          type="number"
                          value={localSettings['credit_cost_traffic_alert'] ?? getSetting('credit_cost_traffic_alert') ?? '1'}
                          onChange={(e) => handleSettingChange('credit_cost_traffic_alert', e.target.value)}
                          placeholder="1"
                        />
                      </div>
                      <div>
                        <Label>Premium Forum Post</Label>
                        <Input
                          type="number"
                          value={localSettings['credit_cost_premium_post'] ?? getSetting('credit_cost_premium_post') ?? '2'}
                          onChange={(e) => handleSettingChange('credit_cost_premium_post', e.target.value)}
                          placeholder="2"
                        />
                      </div>
                      <div>
                        <Label>Event Creation</Label>
                        <Input
                          type="number"
                          value={localSettings['credit_cost_event_creation'] ?? getSetting('credit_cost_event_creation') ?? '3'}
                          onChange={(e) => handleSettingChange('credit_cost_event_creation', e.target.value)}
                          placeholder="3"
                        />
                      </div>
                    </div>
                    <Button onClick={() => {
                      handleSaveSetting('credit_cost_ai_query', 'credit_costs', false);
                      handleSaveSetting('credit_cost_job_application', 'credit_costs', false);
                      handleSaveSetting('credit_cost_marketplace_feature', 'credit_costs', false);
                      handleSaveSetting('credit_cost_traffic_alert', 'credit_costs', false);
                      handleSaveSetting('credit_cost_premium_post', 'credit_costs', false);
                      handleSaveSetting('credit_cost_event_creation', 'credit_costs', false);
                    }}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Credit Costs
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Credit Rewards */}
              <Card>
                <CardHeader>
                  <CardTitle>Credit Rewards</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <Label>Post Like (to author)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={localSettings['credit_reward_post_like'] ?? getSetting('credit_reward_post_like') ?? '0.1'}
                          onChange={(e) => handleSettingChange('credit_reward_post_like', e.target.value)}
                          placeholder="0.1"
                        />
                      </div>
                      <div>
                        <Label>Post Comment (to author)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={localSettings['credit_reward_post_comment'] ?? getSetting('credit_reward_post_comment') ?? '0.5'}
                          onChange={(e) => handleSettingChange('credit_reward_post_comment', e.target.value)}
                          placeholder="0.5"
                        />
                      </div>
                      <div>
                        <Label>Referral Signup</Label>
                        <Input
                          type="number"
                          value={localSettings['credit_reward_referral'] ?? getSetting('credit_reward_referral') ?? '10'}
                          onChange={(e) => handleSettingChange('credit_reward_referral', e.target.value)}
                          placeholder="10"
                        />
                      </div>
                      <div>
                        <Label>Daily Login Bonus</Label>
                        <Input
                          type="number"
                          value={localSettings['credit_reward_daily_login'] ?? getSetting('credit_reward_daily_login') ?? '1'}
                          onChange={(e) => handleSettingChange('credit_reward_daily_login', e.target.value)}
                          placeholder="1"
                        />
                      </div>
                      <div>
                        <Label>Complete Profile</Label>
                        <Input
                          type="number"
                          value={localSettings['credit_reward_complete_profile'] ?? getSetting('credit_reward_complete_profile') ?? '5'}
                          onChange={(e) => handleSettingChange('credit_reward_complete_profile', e.target.value)}
                          placeholder="5"
                        />
                      </div>
                      <div>
                        <Label>Verify KYC</Label>
                        <Input
                          type="number"
                          value={localSettings['credit_reward_kyc_verification'] ?? getSetting('credit_reward_kyc_verification') ?? '20'}
                          onChange={(e) => handleSettingChange('credit_reward_kyc_verification', e.target.value)}
                          placeholder="20"
                        />
                      </div>
                    </div>
                    <Button onClick={() => {
                      handleSaveSetting('credit_reward_post_like', 'credit_rewards', false);
                      handleSaveSetting('credit_reward_post_comment', 'credit_rewards', false);
                      handleSaveSetting('credit_reward_referral', 'credit_rewards', false);
                      handleSaveSetting('credit_reward_daily_login', 'credit_rewards', false);
                      handleSaveSetting('credit_reward_complete_profile', 'credit_rewards', false);
                      handleSaveSetting('credit_reward_kyc_verification', 'credit_rewards', false);
                    }}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Credit Rewards
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payment Methods Management Tab */}
          <TabsContent value="payment-methods">
            <div className="space-y-6">
              {/* Manual Payment Methods */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Manual Payment Methods</CardTitle>
                    <Button onClick={() => setShowNewPaymentMethodForm(!showNewPaymentMethodForm)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Payment Method
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {showNewPaymentMethodForm && (
                    <div className="p-4 border rounded-lg mb-4 bg-slate-50">
                      <p className="font-bold mb-3">Create Manual Payment Method</p>
                      <div className="space-y-3">
                        <div className="grid md:grid-cols-2 gap-3">
                          <Input
                            placeholder="Method Name (e.g., Bank Transfer - GTBank)"
                            value={newPaymentMethod.name}
                            onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, name: e.target.value })}
                          />
                          <Input
                            placeholder="Short Description"
                            value={newPaymentMethod.description}
                            onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, description: e.target.value })}
                          />
                        </div>
                        <Textarea
                          placeholder="Payment Instructions (e.g., Transfer to Account: 0123456789, Bank: GTBank, Name: SabiRight)"
                          value={newPaymentMethod.instructions}
                          onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, instructions: e.target.value })}
                          rows={3}
                        />
                        
                        {/* Custom Fields Builder */}
                        <div className="border-t pt-3 mt-3">
                          <p className="font-bold mb-2">Custom Fields (for user to fill)</p>
                          {newPaymentMethod.fields.map((field, index) => (
                            <div key={index} className="flex gap-2 mb-2 items-center">
                              <Input
                                placeholder="Field Name"
                                value={field.name}
                                onChange={(e) => {
                                  const updated = [...newPaymentMethod.fields];
                                  updated[index].name = e.target.value;
                                  setNewPaymentMethod({ ...newPaymentMethod, fields: updated });
                                }}
                                className="flex-1"
                              />
                              <select
                                className="h-10 px-3 border rounded-md text-sm"
                                value={field.type}
                                onChange={(e) => {
                                  const updated = [...newPaymentMethod.fields];
                                  updated[index].type = e.target.value as 'text' | 'file';
                                  setNewPaymentMethod({ ...newPaymentMethod, fields: updated });
                                }}
                              >
                                <option value="text">Text</option>
                                <option value="file">File Upload</option>
                              </select>
                              <Input
                                placeholder="Placeholder"
                                value={field.placeholder}
                                onChange={(e) => {
                                  const updated = [...newPaymentMethod.fields];
                                  updated[index].placeholder = e.target.value;
                                  setNewPaymentMethod({ ...newPaymentMethod, fields: updated });
                                }}
                                className="flex-1"
                              />
                              <div className="flex items-center gap-1">
                                <Checkbox
                                  checked={field.required}
                                  onCheckedChange={(checked) => {
                                    const updated = [...newPaymentMethod.fields];
                                    updated[index].required = checked as boolean;
                                    setNewPaymentMethod({ ...newPaymentMethod, fields: updated });
                                  }}
                                />
                                <Label className="text-xs">Required</Label>
                              </div>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  const updated = newPaymentMethod.fields.filter((_, i) => i !== index);
                                  setNewPaymentMethod({ ...newPaymentMethod, fields: updated });
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setNewPaymentMethod({
                                ...newPaymentMethod,
                                fields: [...newPaymentMethod.fields, { name: '', type: 'text', required: false, placeholder: '' }]
                              });
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Field
                          </Button>
                        </div>

                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={newPaymentMethod.active}
                            onCheckedChange={(checked) => setNewPaymentMethod({ ...newPaymentMethod, active: checked as boolean })}
                          />
                          <Label>Active (visible to users)</Label>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button onClick={() => createPaymentMethod.mutate(newPaymentMethod)}>
                          Create Payment Method
                        </Button>
                        <Button variant="outline" onClick={() => setShowNewPaymentMethodForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {paymentMethods.length === 0 ? (
                    <p className="text-center py-8 text-slate-400">No payment methods yet</p>
                  ) : (
                    <div className="space-y-3">
                      {paymentMethods.map((method: any) => (
                        <div key={method.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-bold">{method.name}</p>
                                <Badge variant={method.active ? "default" : "secondary"}>
                                  {method.active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600">{method.description}</p>
                              {method.instructions && (
                                <div className="mt-2 p-2 bg-slate-50 rounded text-xs">
                                  <p className="font-bold mb-1">Instructions:</p>
                                  <p className="whitespace-pre-wrap">{method.instructions}</p>
                                </div>
                              )}
                              {method.fields && method.fields.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs font-bold mb-1">Custom Fields:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {method.fields.map((field: any, idx: number) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {field.name} ({field.type}){field.required && ' *'}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1 ml-2">
                              <Switch
                                checked={method.active}
                                onCheckedChange={(checked) => togglePaymentMethod.mutate({ methodId: method.id, active: checked })}
                              />
                              <Button size="sm" variant="destructive" onClick={() => deletePaymentMethod.mutate(method.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Automatic Payment Gateways Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Automatic Payment Gateways</CardTitle>
                  <p className="text-sm text-slate-600 mt-2">
                    Configure automatic payment gateways with their API keys. When enabled and configured, they will automatically appear as payment options for users.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Flutterwave */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="font-bold">Flutterwave</p>
                          <p className="text-xs text-slate-500">Card, Bank, Mobile Money</p>
                        </div>
                      </div>
                      <Switch 
                        checked={paymentMethods.find((m: any) => m.type === 'flutterwave')?.active || false}
                        onCheckedChange={async (checked) => {
                          const method = paymentMethods.find((m: any) => m.type === 'flutterwave');
                          if (method) {
                            const headers = await getAdminHeaders();
                            await fetch(`/api/admin/payment-methods/${method.id}`, {
                              method: 'PUT',
                              headers: { ...headers, 'Content-Type': 'application/json' },
                              body: JSON.stringify({ active: checked })
                            });
                            queryClient.invalidateQueries({ queryKey: ['admin-payment-methods'] });
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Input
                        type="text"
                        placeholder="Public Key"
                        defaultValue={paymentMethods.find((m: any) => m.type === 'flutterwave')?.publicKey || ''}
                        onBlur={async (e) => {
                          const method = paymentMethods.find((m: any) => m.type === 'flutterwave');
                          const headers = await getAdminHeaders();
                          if (method) {
                            await fetch(`/api/admin/payment-methods/${method.id}`, {
                              method: 'PUT',
                              headers: { ...headers, 'Content-Type': 'application/json' },
                              body: JSON.stringify({ publicKey: e.target.value })
                            });
                          } else {
                            await fetch('/api/admin/payment-methods', {
                              method: 'POST',
                              headers: { ...headers, 'Content-Type': 'application/json' },
                              body: JSON.stringify({ 
                                name: 'Flutterwave',
                                type: 'flutterwave',
                                publicKey: e.target.value,
                                active: false
                              })
                            });
                          }
                          queryClient.invalidateQueries({ queryKey: ['admin-payment-methods'] });
                        }}
                      />
                      <Input
                        type="password"
                        placeholder="Secret Key"
                        defaultValue={paymentMethods.find((m: any) => m.type === 'flutterwave')?.secretKey || ''}
                        onBlur={async (e) => {
                          const method = paymentMethods.find((m: any) => m.type === 'flutterwave');
                          const headers = await getAdminHeaders();
                          if (method) {
                            await fetch(`/api/admin/payment-methods/${method.id}`, {
                              method: 'PUT',
                              headers: { ...headers, 'Content-Type': 'application/json' },
                              body: JSON.stringify({ secretKey: e.target.value })
                            });
                          }
                          queryClient.invalidateQueries({ queryKey: ['admin-payment-methods'] });
                        }}
                      />
                      <Input
                        type="password"
                        placeholder="Encryption Key"
                        defaultValue={paymentMethods.find((m: any) => m.type === 'flutterwave')?.encryptionKey || ''}
                        onBlur={async (e) => {
                          const method = paymentMethods.find((m: any) => m.type === 'flutterwave');
                          const headers = await getAdminHeaders();
                          if (method) {
                            await fetch(`/api/admin/payment-methods/${method.id}`, {
                              method: 'PUT',
                              headers: { ...headers, 'Content-Type': 'application/json' },
                              body: JSON.stringify({ encryptionKey: e.target.value })
                            });
                          }
                          queryClient.invalidateQueries({ queryKey: ['admin-payment-methods'] });
                        }}
                      />
                      <Input
                        type="password"
                        placeholder="Webhook Hash (for webhook verification)"
                        defaultValue={paymentMethods.find((m: any) => m.type === 'flutterwave')?.webhookHash || ''}
                        onBlur={async (e) => {
                          const method = paymentMethods.find((m: any) => m.type === 'flutterwave');
                          const headers = await getAdminHeaders();
                          if (method) {
                            await fetch(`/api/admin/payment-methods/${method.id}`, {
                              method: 'PUT',
                              headers: { ...headers, 'Content-Type': 'application/json' },
                              body: JSON.stringify({ webhookHash: e.target.value })
                            });
                          }
                          queryClient.invalidateQueries({ queryKey: ['admin-payment-methods'] });
                        }}
                      />
                      <p className="text-xs text-slate-500 mt-2">
                        💡 <strong>Webhook URL:</strong> Configure this in your Flutterwave dashboard:<br/>
                        <code className="bg-slate-100 px-2 py-1 rounded text-xs">
                          https://your-domain.com/api/payments/flutterwave/webhook
                        </code>
                      </p>
                    </div>
                  </div>

                  {/* Paystack */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-bold">Paystack</p>
                          <p className="text-xs text-slate-500">Card, Bank Transfer, USSD</p>
                        </div>
                      </div>
                      <Switch 
                        checked={paymentMethods.find((m: any) => m.type === 'paystack')?.active || false}
                        onCheckedChange={async (checked) => {
                          const method = paymentMethods.find((m: any) => m.type === 'paystack');
                          if (method) {
                            const headers = await getAdminHeaders();
                            await fetch(`/api/admin/payment-methods/${method.id}`, {
                              method: 'PUT',
                              headers: { ...headers, 'Content-Type': 'application/json' },
                              body: JSON.stringify({ active: checked })
                            });
                            queryClient.invalidateQueries({ queryKey: ['admin-payment-methods'] });
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Input
                        type="text"
                        placeholder="Public Key"
                        defaultValue={paymentMethods.find((m: any) => m.type === 'paystack')?.publicKey || ''}
                        onBlur={async (e) => {
                          const method = paymentMethods.find((m: any) => m.type === 'paystack');
                          const headers = await getAdminHeaders();
                          if (method) {
                            await fetch(`/api/admin/payment-methods/${method.id}`, {
                              method: 'PUT',
                              headers: { ...headers, 'Content-Type': 'application/json' },
                              body: JSON.stringify({ publicKey: e.target.value })
                            });
                          } else {
                            await fetch('/api/admin/payment-methods', {
                              method: 'POST',
                              headers: { ...headers, 'Content-Type': 'application/json' },
                              body: JSON.stringify({ 
                                name: 'Paystack',
                                type: 'paystack',
                                publicKey: e.target.value,
                                active: false
                              })
                            });
                          }
                          queryClient.invalidateQueries({ queryKey: ['admin-payment-methods'] });
                        }}
                      />
                      <Input
                        type="password"
                        placeholder="Secret Key"
                        defaultValue={paymentMethods.find((m: any) => m.type === 'paystack')?.secretKey || ''}
                        onBlur={async (e) => {
                          const method = paymentMethods.find((m: any) => m.type === 'paystack');
                          const headers = await getAdminHeaders();
                          if (method) {
                            await fetch(`/api/admin/payment-methods/${method.id}`, {
                              method: 'PUT',
                              headers: { ...headers, 'Content-Type': 'application/json' },
                              body: JSON.stringify({ secretKey: e.target.value })
                            });
                          }
                          queryClient.invalidateQueries({ queryKey: ['admin-payment-methods'] });
                        }}
                      />
                    </div>
                  </div>

                  {/* Stripe */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="font-bold">Stripe</p>
                          <p className="text-xs text-slate-500">International Cards</p>
                        </div>
                      </div>
                      <Switch 
                        checked={paymentMethods.find((m: any) => m.type === 'stripe')?.active || false}
                        onCheckedChange={async (checked) => {
                          const method = paymentMethods.find((m: any) => m.type === 'stripe');
                          if (method) {
                            const headers = await getAdminHeaders();
                            await fetch(`/api/admin/payment-methods/${method.id}`, {
                              method: 'PUT',
                              headers: { ...headers, 'Content-Type': 'application/json' },
                              body: JSON.stringify({ active: checked })
                            });
                            queryClient.invalidateQueries({ queryKey: ['admin-payment-methods'] });
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Input
                        type="text"
                        placeholder="Publishable Key"
                        defaultValue={paymentMethods.find((m: any) => m.type === 'stripe')?.publicKey || ''}
                        onBlur={async (e) => {
                          const method = paymentMethods.find((m: any) => m.type === 'stripe');
                          const headers = await getAdminHeaders();
                          if (method) {
                            await fetch(`/api/admin/payment-methods/${method.id}`, {
                              method: 'PUT',
                              headers: { ...headers, 'Content-Type': 'application/json' },
                              body: JSON.stringify({ publicKey: e.target.value })
                            });
                          } else {
                            await fetch('/api/admin/payment-methods', {
                              method: 'POST',
                              headers: { ...headers, 'Content-Type': 'application/json' },
                              body: JSON.stringify({ 
                                name: 'Stripe',
                                type: 'stripe',
                                publicKey: e.target.value,
                                active: false
                              })
                            });
                          }
                          queryClient.invalidateQueries({ queryKey: ['admin-payment-methods'] });
                        }}
                      />
                      <Input
                        type="password"
                        placeholder="Secret Key"
                        defaultValue={paymentMethods.find((m: any) => m.type === 'stripe')?.secretKey || ''}
                        onBlur={async (e) => {
                          const method = paymentMethods.find((m: any) => m.type === 'stripe');
                          const headers = await getAdminHeaders();
                          if (method) {
                            await fetch(`/api/admin/payment-methods/${method.id}`, {
                              method: 'PUT',
                              headers: { ...headers, 'Content-Type': 'application/json' },
                              body: JSON.stringify({ secretKey: e.target.value })
                            });
                          }
                          queryClient.invalidateQueries({ queryKey: ['admin-payment-methods'] });
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payment Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="manual-pending" className="space-y-4">
                  <TabsList className="bg-slate-100 p-1">
                    <TabsTrigger value="manual-pending" className="text-xs">Manual Pending</TabsTrigger>
                    <TabsTrigger value="manual-completed" className="text-xs">Manual Completed</TabsTrigger>
                    <TabsTrigger value="automatic" className="text-xs">Automatic</TabsTrigger>
                    <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                  </TabsList>

                  <TabsContent value="manual-pending" className="space-y-3">
                    {payments.filter((p: any) => p.status === 'pending' && p.paymentMethod !== 'stripe' && p.paymentMethod !== 'paystack' && p.paymentMethod !== 'flutterwave').length === 0 ? (
                      <p className="text-center py-8 text-slate-400">No pending manual payments</p>
                    ) : (
                      payments.filter((p: any) => p.status === 'pending' && p.paymentMethod !== 'stripe' && p.paymentMethod !== 'paystack' && p.paymentMethod !== 'flutterwave')
                        .map((p: any) => <PaymentItem key={p.id} payment={p} isManual={true} />)
                    )}
                  </TabsContent>

                  <TabsContent value="manual-completed" className="space-y-3">
                    {payments.filter((p: any) => p.status === 'completed' && p.paymentMethod !== 'stripe' && p.paymentMethod !== 'paystack' && p.paymentMethod !== 'flutterwave').length === 0 ? (
                      <p className="text-center py-8 text-slate-400">No completed manual payments</p>
                    ) : (
                      payments.filter((p: any) => p.status === 'completed' && p.paymentMethod !== 'stripe' && p.paymentMethod !== 'paystack' && p.paymentMethod !== 'flutterwave')
                        .map((p: any) => <PaymentItem key={p.id} payment={p} isManual={true} />)
                    )}
                  </TabsContent>

                  <TabsContent value="automatic" className="space-y-3">
                    {payments.filter((p: any) => ['stripe', 'paystack', 'flutterwave'].includes(p.paymentMethod)).length === 0 ? (
                      <p className="text-center py-8 text-slate-400">No automatic payments yet</p>
                    ) : (
                      payments.filter((p: any) => ['stripe', 'paystack', 'flutterwave'].includes(p.paymentMethod))
                        .map((p: any) => <PaymentItem key={p.id} payment={p} isManual={false} />)
                    )}
                  </TabsContent>

                  <TabsContent value="all" className="space-y-3">
                    {payments.length === 0 ? (
                      <p className="text-center py-8 text-slate-400">No transactions yet</p>
                    ) : (
                      payments.map((p: any) => (
                        <PaymentItem 
                          key={p.id} 
                          payment={p} 
                          isManual={!['stripe', 'paystack', 'flutterwave'].includes(p.paymentMethod)} 
                        />
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <p className="text-center py-8 text-slate-400">No users registered yet</p>
                ) : (
                  <div className="space-y-3">
                    {users.map((user: any) => (
                      <div key={user.userId} className="p-3 md:p-4 border rounded-lg">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-bold text-sm md:text-base">{user.displayName || 'Unknown'}</p>
                            <p className="text-xs md:text-sm text-slate-500 truncate">{user.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[10px] md:text-xs">
                                Credits: {user.credits || 0}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] md:text-xs">
                                Storage: {Math.round((user.chatStorageUsed || 0) / 1024)}KB / {Math.round((user.chatStorageLimit || 524288) / 1024)}KB
                              </Badge>
                              {user.planId && (
                                <Badge variant="secondary" className="text-[10px] md:text-xs">
                                  Plan: {user.planId}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`text-[10px] md:text-xs ${
                              user.kycStatus === 'verified' ? 'bg-green-100 text-green-800' : 
                              user.kycStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              KYC: {user.kycStatus || 'pending'}
                            </Badge>
                            {user.isVendor && (
                              <Badge className="bg-purple-100 text-purple-800 text-[10px] md:text-xs">Vendor</Badge>
                            )}
                            {user.isAdmin && (
                              <Badge className="bg-red-100 text-red-800 text-[10px] md:text-xs">Admin</Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* User Actions */}
                        <div className="mt-3 pt-3 border-t flex flex-wrap gap-2 items-center">
                          <div className="flex items-center gap-2 mr-auto">
                            <Input
                              type="number"
                              placeholder="KB"
                              className="w-24 h-8"
                              value={selectedUserForStorage === user.userId ? storageAmount : ""}
                              onChange={(e) => {
                                setSelectedUserForStorage(user.userId);
                                setStorageAmount(e.target.value);
                              }}
                            />
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-8"
                              onClick={() => {
                                if (!storageAmount) return;
                                updateStorageLimit.mutate({ 
                                  userId: user.userId, 
                                  limitBytes: parseInt(storageAmount) * 1024 
                                });
                                setStorageAmount("");
                                setSelectedUserForStorage(null);
                              }}
                              disabled={updateStorageLimit.isPending}
                            >
                              Set Storage
                            </Button>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => setViewingUser(user)}>
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingUser(user)}>
                            <Edit className="h-4 w-4 mr-1" /> Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => impersonateUser.mutate(user.userId)}
                            disabled={impersonateUser.isPending}
                          >
                            <LogIn className="h-4 w-4 mr-1" /> Login as User
                          </Button>

                          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />
                          
                          {/* KYC Actions */}
                          {user.kycStatus === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => approveKYC.mutate(user.userId)}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" /> Verify KYC
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => rejectKYC.mutate(user.userId)}
                              >
                                <XCircle className="h-4 w-4 mr-1" /> Reject KYC
                              </Button>
                            </>
                          )}
                          
                          {/* Credits Management */}
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              placeholder="Credits"
                              className="w-24 h-8"
                              value={selectedUser === user.userId ? creditAmount : ''}
                              onChange={(e) => {
                                setSelectedUser(user.userId);
                                setCreditAmount(e.target.value);
                              }}
                            />
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                if (creditAmount) {
                                  updateCredits.mutate({ 
                                    userId: user.userId, 
                                    totalCredits: parseInt(creditAmount) 
                                  });
                                  setCreditAmount('');
                                  setSelectedUser(null);
                                }
                              }}
                            >
                              Set
                            </Button>
                          </div>

                          {/* Delete User */}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this user?')) {
                                deleteUser.mutate(user.userId);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vendors Tab */}
          <TabsContent value="vendor-services">
            <Card>
              <CardHeader>
                <CardTitle>Vendor Service Approval</CardTitle>
                <CardDescription>Review and approve service listings from vendors</CardDescription>
              </CardHeader>
              <CardContent>
                {adminVendorServices.length === 0 ? (
                  <p className="text-center py-8 text-slate-400">No service listings to review</p>
                ) : (
                  <div className="space-y-4">
                    {adminVendorServices.map((service: any) => (
                      <div key={service.id} className="p-4 border rounded-lg flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-lg">{service.name}</h4>
                            <Badge className={
                              service.status === 'approved' ? 'bg-green-100 text-green-800' :
                              service.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {service.status || 'pending'}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600">{service.description}</p>
                          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><User className="h-3 w-3" /> Vendor ID: {service.vendorId}</span>
                            <span className="flex items-center gap-1"><Coins className="h-3 w-3" /> Price: NGN {service.price}</span>
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Location: {service.location}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {service.status !== 'approved' && (
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => approveVendorService.mutate(service.id)}
                              disabled={approveVendorService.isPending}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                            </Button>
                          )}
                          {service.status !== 'rejected' && (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => rejectVendorService.mutate(service.id)}
                              disabled={rejectVendorService.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vendors">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Active Vendors</CardTitle>
                </CardHeader>
                <CardContent>
                  {vendors.length === 0 ? (
                    <p className="text-center py-8 text-slate-400">No active vendors yet</p>
                  ) : (
                    <div className="space-y-3">
                      {vendors.map((vendor: any) => (
                        <div key={vendor.userId} className="p-3 md:p-4 border rounded-lg">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-bold text-sm md:text-base">{vendor.displayName || 'Unknown'}</p>
                              <p className="text-xs md:text-sm text-slate-500">{vendor.email}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px] md:text-xs">
                                  Plan: {vendor.planId || 'None'}
                                </Badge>
                                <Badge variant="secondary" className="text-[10px] md:text-xs">
                                  Credits: {vendor.credits || 0}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => setEditingVendor(vendor)}>
                                <Edit className="h-4 w-4 mr-1" /> Edit
                              </Button>
                              <Button 
                                size="sm" 
                                variant="secondary"
                                onClick={() => impersonateUser.mutate(vendor.userId)}
                              >
                                <LogIn className="h-4 w-4 mr-1" /> Login as Vendor
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Vendor Service Listings</CardTitle>
                </CardHeader>
                <CardContent>
                  {adminVendorServices.length === 0 ? (
                    <p className="text-center py-8 text-slate-400">No service listings found</p>
                  ) : (
                    <div className="space-y-4">
                      {adminVendorServices.map((service: any) => (
                        <div key={service.id} className="p-4 border rounded-lg">
                          <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-lg">{service.name}</h3>
                                <Badge className={
                                  service.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  service.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }>
                                  {service.status || 'pending'}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600 mb-2">{service.description}</p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                <div className="bg-slate-50 p-2 rounded">
                                  <p className="text-slate-500 uppercase font-bold">Category</p>
                                  <p>{service.category}</p>
                                </div>
                                <div className="bg-slate-50 p-2 rounded">
                                  <p className="text-slate-500 uppercase font-bold">Price</p>
                                  <p>{service.price} Credits</p>
                                </div>
                                <div className="bg-slate-50 p-2 rounded">
                                  <p className="text-slate-500 uppercase font-bold">Duration</p>
                                  <p>{service.duration}</p>
                                </div>
                                <div className="bg-slate-50 p-2 rounded">
                                  <p className="text-slate-500 uppercase font-bold">Vendor ID</p>
                                  <p className="truncate">{service.vendorId}</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-row md:flex-col gap-2 justify-center">
                              {service.status !== 'approved' && (
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700 w-full"
                                  onClick={() => approveVendorService.mutate(service.id)}
                                  disabled={approveVendorService.isPending}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" /> Approve
                                </Button>
                              )}
                              {service.status !== 'rejected' && (
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  className="w-full"
                                  onClick={() => rejectVendorService.mutate(service.id)}
                                  disabled={rejectVendorService.isPending}
                                >
                                  <XCircle className="h-4 w-4 mr-2" /> Reject
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Vendor Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  {vendorApps.length === 0 ? (
                    <p className="text-center py-8 text-slate-400">No vendor applications yet</p>
                  ) : (
                    <div className="space-y-3">
                      {vendorApps.map((app: any) => (
                        <div key={app.id} className="p-3 md:p-4 border rounded-lg">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div>
                              <p className="font-bold text-sm md:text-base">{app.businessName}</p>
                              <p className="text-xs md:text-sm text-slate-500">{app.serviceType}</p>
                              <p className="text-[10px] md:text-xs text-slate-400">
                                Applied: {new Date(app.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={`text-[10px] md:text-xs ${
                                app.status === 'approved' ? 'bg-green-100 text-green-800' :
                                app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {app.status}
                              </Badge>
                              {app.status === 'pending' && (
                                <>
                                  <Button 
                                    size="sm" 
                                    className="bg-green-600 hover:bg-green-700 h-7 md:h-8"
                                    onClick={() => approveVendor.mutate(app.userId)}
                                  >
                                    <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    className="h-7 md:h-8"
                                    onClick={() => rejectVendor.mutate(app.userId)}
                                  >
                                    <XCircle className="h-3 w-3 md:h-4 md:w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <div className="space-y-6">
              {/* Notification Templates Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-blue-500" />
                    Notification Templates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Create New Template Form */}
                  <div className="p-4 border rounded-lg bg-slate-50">
                    <h4 className="font-semibold mb-4 flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Create New Template
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="template-name">Template Name</Label>
                        <Input
                          id="template-name"
                          data-testid="input-template-name"
                          placeholder="e.g., Welcome Email"
                          value={newTemplate.name}
                          onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="template-type">Type</Label>
                        <Select
                          value={newTemplate.type}
                          onValueChange={(value) => setNewTemplate({ ...newTemplate, type: value })}
                        >
                          <SelectTrigger data-testid="select-template-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="system">System</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="transactional">Transactional</SelectItem>
                            <SelectItem value="alert">Alert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="template-subject">Subject</Label>
                        <Input
                          id="template-subject"
                          data-testid="input-template-subject"
                          placeholder="e.g., Welcome to {{appName}}!"
                          value={newTemplate.subject}
                          onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="template-body">Body Template</Label>
                        <Textarea
                          id="template-body"
                          data-testid="textarea-template-body"
                          placeholder="Hello {{userName}}, welcome to our platform..."
                          rows={4}
                          value={newTemplate.bodyTemplate}
                          onChange={(e) => setNewTemplate({ ...newTemplate, bodyTemplate: e.target.value })}
                        />
                        <p className="text-xs text-slate-500">
                          Use {"{{variable}}"} placeholders for dynamic content. Common variables: {"{{userName}}"}, {"{{email}}"}, {"{{appName}}"}, {"{{link}}"}
                        </p>
                      </div>
                      <div className="space-y-3 md:col-span-2">
                        <Label>Channels</Label>
                        <div className="flex flex-wrap gap-6">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="channel-email"
                              data-testid="checkbox-channel-email"
                              checked={newTemplate.channels.email}
                              onCheckedChange={(checked) => setNewTemplate({
                                ...newTemplate,
                                channels: { ...newTemplate.channels, email: checked as boolean }
                              })}
                            />
                            <Label htmlFor="channel-email" className="flex items-center gap-1 cursor-pointer">
                              <Mail className="h-4 w-4" /> Email
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="channel-push"
                              data-testid="checkbox-channel-push"
                              checked={newTemplate.channels.push}
                              onCheckedChange={(checked) => setNewTemplate({
                                ...newTemplate,
                                channels: { ...newTemplate.channels, push: checked as boolean }
                              })}
                            />
                            <Label htmlFor="channel-push" className="flex items-center gap-1 cursor-pointer">
                              <Bell className="h-4 w-4" /> Push
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="channel-inapp"
                              data-testid="checkbox-channel-inapp"
                              checked={newTemplate.channels.in_app}
                              onCheckedChange={(checked) => setNewTemplate({
                                ...newTemplate,
                                channels: { ...newTemplate.channels, in_app: checked as boolean }
                              })}
                            />
                            <Label htmlFor="channel-inapp" className="flex items-center gap-1 cursor-pointer">
                              <Bell className="h-4 w-4" /> In-App
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      className="mt-4"
                      data-testid="button-create-template"
                      onClick={() => createTemplate.mutate(newTemplate)}
                      disabled={!newTemplate.name || !newTemplate.subject || !newTemplate.bodyTemplate}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Template
                    </Button>
                  </div>

                  {/* Existing Templates List */}
                  <div className="space-y-3">
                    <h4 className="font-semibold">Existing Templates ({notificationTemplates.length})</h4>
                    {notificationTemplates.length === 0 ? (
                      <p className="text-center py-8 text-slate-400">No notification templates created yet</p>
                    ) : (
                      <div className="space-y-3">
                        {notificationTemplates.map((template: any) => (
                          <div key={template.id} className="p-4 border rounded-lg" data-testid={`template-row-${template.id}`}>
                            {editingTemplate?.id === template.id ? (
                              <div className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                  <Input
                                    value={editingTemplate.name}
                                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                                    placeholder="Template Name"
                                  />
                                  <Select
                                    value={editingTemplate.type}
                                    onValueChange={(value) => setEditingTemplate({ ...editingTemplate, type: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="system">System</SelectItem>
                                      <SelectItem value="marketing">Marketing</SelectItem>
                                      <SelectItem value="transactional">Transactional</SelectItem>
                                      <SelectItem value="alert">Alert</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    className="md:col-span-2"
                                    value={editingTemplate.subject}
                                    onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                                    placeholder="Subject"
                                  />
                                  <Textarea
                                    className="md:col-span-2"
                                    value={editingTemplate.bodyTemplate}
                                    onChange={(e) => setEditingTemplate({ ...editingTemplate, bodyTemplate: e.target.value })}
                                    placeholder="Body Template"
                                    rows={3}
                                  />
                                </div>
                                <div className="flex flex-wrap gap-6">
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      checked={editingTemplate.channels?.email ?? false}
                                      onCheckedChange={(checked) => setEditingTemplate({
                                        ...editingTemplate,
                                        channels: { ...editingTemplate.channels, email: checked as boolean }
                                      })}
                                    />
                                    <Label className="flex items-center gap-1"><Mail className="h-4 w-4" /> Email</Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      checked={editingTemplate.channels?.push ?? false}
                                      onCheckedChange={(checked) => setEditingTemplate({
                                        ...editingTemplate,
                                        channels: { ...editingTemplate.channels, push: checked as boolean }
                                      })}
                                    />
                                    <Label className="flex items-center gap-1"><Bell className="h-4 w-4" /> Push</Label>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      checked={editingTemplate.channels?.in_app ?? false}
                                      onCheckedChange={(checked) => setEditingTemplate({
                                        ...editingTemplate,
                                        channels: { ...editingTemplate.channels, in_app: checked as boolean }
                                      })}
                                    />
                                    <Label className="flex items-center gap-1"><Bell className="h-4 w-4" /> In-App</Label>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => updateTemplate.mutate({
                                      templateId: template.id,
                                      updates: editingTemplate
                                    })}
                                  >
                                    Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingTemplate(null)}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-bold text-sm md:text-base">{template.name}</p>
                                    <Badge variant="outline" className="text-[10px]">{template.type}</Badge>
                                  </div>
                                  <p className="text-sm text-slate-600 mb-1">{template.subject}</p>
                                  <p className="text-xs text-slate-400 line-clamp-2">{template.bodyTemplate}</p>
                                  <div className="flex gap-2 mt-2">
                                    {template.channels?.email && <Badge variant="secondary" className="text-[10px]"><Mail className="h-3 w-3 mr-1" />Email</Badge>}
                                    {template.channels?.push && <Badge variant="secondary" className="text-[10px]"><Bell className="h-3 w-3 mr-1" />Push</Badge>}
                                    {template.channels?.in_app && <Badge variant="secondary" className="text-[10px]"><Bell className="h-3 w-3 mr-1" />In-App</Badge>}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    data-testid={`button-edit-template-${template.id}`}
                                    onClick={() => setEditingTemplate(template)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    data-testid={`button-delete-template-${template.id}`}
                                    onClick={() => deleteTemplate.mutate(template.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* SMTP Settings Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-green-500" />
                    SMTP Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-host">SMTP Host</Label>
                      <Input
                        id="smtp-host"
                        data-testid="input-smtp-host"
                        placeholder="smtp.example.com"
                        value={smtpSettings.host}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, host: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-port">Port</Label>
                      <Input
                        id="smtp-port"
                        data-testid="input-smtp-port"
                        placeholder="587"
                        value={smtpSettings.port}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, port: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-username">Username</Label>
                      <Input
                        id="smtp-username"
                        data-testid="input-smtp-username"
                        placeholder="your-email@example.com"
                        value={smtpSettings.username}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, username: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-password">Password</Label>
                      <Input
                        id="smtp-password"
                        data-testid="input-smtp-password"
                        type="password"
                        placeholder="••••••••"
                        value={smtpSettings.password}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, password: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-from-email">From Email</Label>
                      <Input
                        id="smtp-from-email"
                        data-testid="input-smtp-from-email"
                        placeholder="noreply@example.com"
                        value={smtpSettings.fromEmail}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, fromEmail: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-from-name">From Name</Label>
                      <Input
                        id="smtp-from-name"
                        data-testid="input-smtp-from-name"
                        placeholder="My App"
                        value={smtpSettings.fromName}
                        onChange={(e) => setSmtpSettings({ ...smtpSettings, fromName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="smtp-encryption">Encryption</Label>
                      <Select
                        value={smtpSettings.encryption}
                        onValueChange={(value) => setSmtpSettings({ ...smtpSettings, encryption: value })}
                      >
                        <SelectTrigger data-testid="select-smtp-encryption">
                          <SelectValue placeholder="Select encryption" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tls">TLS</SelectItem>
                          <SelectItem value="ssl">SSL</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <Button
                      data-testid="button-save-smtp"
                      onClick={() => saveSmtpSettings.mutate({
                        ...smtpSettings,
                        port: parseInt(smtpSettings.port) || 587
                      })}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </Button>
                    <Button
                      variant="outline"
                      data-testid="button-test-smtp"
                      onClick={() => testSmtpConnection.mutate()}
                      disabled={!smtpSettings.host || !smtpSettings.username}
                    >
                      Test Connection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        <TabsContent value="analytics" className="space-y-6">
          <div>
            <h3 className="text-lg font-bold">Analytics & Insights</h3>
            <p className="text-sm text-slate-500">Comprehensive business analytics and data export</p>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => {
                // Export to CSV
                const analyticsData = {
                  revenue: {
                    total: payments?.filter((p: any) => p.status === 'completed').reduce((sum: number, p: any) => sum + p.amount, 0) || 0,
                    byMethod: {}
                  },
                  users: {
                    total: users?.length || 0,
                    subscribed: users?.filter((u: any) => u.subscriptionId).length || 0
                  },
                  transactions: payments?.length || 0
                };

                const csvContent = [
                  ['Metric', 'Value'],
                  ['Total Revenue', analyticsData.revenue.total],
                  ['Total Users', analyticsData.users.total],
                  ['Subscribed Users', analyticsData.users.subscribed],
                  ['Total Transactions', analyticsData.transactions],
                  [''],
                  ['Payment Details'],
                  ['Date', 'User', 'Amount', 'Type', 'Status', 'Method'],
                  ...payments?.map((p: any) => [
                    new Date(p.createdAt).toLocaleDateString(),
                    p.userId,
                    p.amount,
                    p.type,
                    p.status,
                    p.paymentMethod || 'N/A'
                  ]) || []
                ].map(row => row.join(',')).join('\\n');

                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                toast({ title: "Success", description: "CSV exported successfully" });
              }}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>

            <Button
              onClick={async () => {
                // Export to Excel
                try {
                  const XLSX = await import('xlsx');
                  
                  // Summary sheet
                  const summaryData = [
                    ['DigiZen-AI Analytics Report'],
                    ['Generated:', new Date().toLocaleString()],
                    [''],
                    ['Key Metrics'],
                    ['Total Revenue', payments?.filter((p: any) => p.status === 'completed').reduce((sum: number, p: any) => sum + p.amount, 0) || 0],
                    ['Total Users', users?.length || 0],
                    ['Subscribed Users', users?.filter((u: any) => u.subscriptionId).length || 0],
                    ['Total Transactions', payments?.length || 0],
                    ['Completed Payments', payments?.filter((p: any) => p.status === 'completed').length || 0],
                    ['Pending Payments', payments?.filter((p: any) => p.status === 'pending').length || 0],
                  ];

                  // Payments sheet
                  const paymentsData = [
                    ['Date', 'User ID', 'Amount', 'Currency', 'Type', 'Status', 'Method', 'Reference'],
                    ...payments?.map((p: any) => [
                      new Date(p.createdAt).toLocaleString(),
                      p.userId,
                      p.amount,
                      p.currency || 'NGN',
                      p.type,
                      p.status,
                      p.paymentMethod || 'N/A',
                      p.reference || 'N/A'
                    ]) || []
                  ];

                  // Users sheet
                  const usersData = [
                    ['Email', 'Display Name', 'Subscription', 'Credits', 'Created At'],
                    ...users?.map((u: any) => [
                      u.email,
                      u.displayName || 'N/A',
                      u.subscriptionId ? 'Yes' : 'No',
                      u.credits || 0,
                      new Date(u.createdAt).toLocaleString()
                    ]) || []
                  ];

                  const wb = XLSX.utils.book_new();
                  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
                  const wsPayments = XLSX.utils.aoa_to_sheet(paymentsData);
                  const wsUsers = XLSX.utils.aoa_to_sheet(usersData);

                  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
                  XLSX.utils.book_append_sheet(wb, wsPayments, 'Payments');
                  XLSX.utils.book_append_sheet(wb, wsUsers, 'Users');

                  XLSX.writeFile(wb, `analytics-${new Date().toISOString().split('T')[0]}.xlsx`);
                  toast({ title: "Success", description: "Excel file exported successfully" });
                } catch (err) {
                  toast({ title: "Error", description: "Failed to export Excel", variant: "destructive" });
                }
              }}
              variant="outline"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Excel
            </Button>

            <Button
              onClick={async () => {
                // Export to PDF
                try {
                  const { jsPDF } = await import('jspdf');
                  const autoTable = (await import('jspdf-autotable')).default;

                  const doc = new jsPDF();
                  
                  // Title
                  doc.setFontSize(20);
                  doc.text('DigiZen-AI Analytics Report', 14, 20);
                  doc.setFontSize(10);
                  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

                  // Key Metrics
                  doc.setFontSize(14);
                  doc.text('Key Metrics', 14, 40);
                  
                  const metrics = [
                    ['Total Revenue', `NGN ${payments?.filter((p: any) => p.status === 'completed').reduce((sum: number, p: any) => sum + p.amount, 0) || 0}`],
                    ['Total Users', users?.length || 0],
                    ['Subscribed Users', users?.filter((u: any) => u.subscriptionId).length || 0],
                    ['Total Transactions', payments?.length || 0],
                    ['Completed Payments', payments?.filter((p: any) => p.status === 'completed').length || 0],
                    ['Pending Payments', payments?.filter((p: any) => p.status === 'pending').length || 0],
                  ];

                  (doc as any).autoTable({
                    startY: 45,
                    head: [['Metric', 'Value']],
                    body: metrics,
                  });

                  // Payments Table
                  doc.addPage();
                  doc.setFontSize(14);
                  doc.text('Recent Payments', 14, 20);

                  const paymentRows = payments?.slice(0, 50).map((p: any) => [
                    new Date(p.createdAt).toLocaleDateString(),
                    p.userId.substring(0, 8),
                    `${p.amount} ${p.currency || 'NGN'}`,
                    p.type,
                    p.status
                  ]) || [];

                  (doc as any).autoTable({
                    startY: 25,
                    head: [['Date', 'User', 'Amount', 'Type', 'Status']],
                    body: paymentRows,
                  });

                  doc.save(`analytics-${new Date().toISOString().split('T')[0]}.pdf`);
                  toast({ title: "Success", description: "PDF exported successfully" });
                } catch (err) {
                  toast({ title: "Error", description: "Failed to export PDF", variant: "destructive" });
                }
              }}
              variant="outline"
            >
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>

            <Button
              onClick={() => {
                // Export for Power BI (CSV format optimized for Power BI)
                const powerBIData = payments?.map((p: any) => {
                  const d = new Date(p.createdAt || new Date());
                  return {
                  Date: d.toISOString(),
                  Year: d.getFullYear(),
                  Month: d.getMonth() + 1,
                  Day: d.getDate(),
                  UserId: p.userId,
                  Amount: p.amount,
                  Currency: p.currency || 'NGN',
                  Type: p.type,
                  Status: p.status,
                  PaymentMethod: p.paymentMethod || 'Unknown',
                  Reference: p.reference || ''
                }}) || [];

                const headers = Object.keys(powerBIData[0] || {});
                const csvContent = [
                  headers.join(','),
                  ...powerBIData.map((row: Record<string, any>) => 
                    headers.map(header => {
                      const value = row[header];
                      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
                    }).join(',')
                  )
                ].join('\\n');

                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `powerbi-data-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                toast({ title: "Success", description: "Power BI data exported successfully" });
              }}
              variant="outline"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Export for Power BI
            </Button>
          </div>

          {/* Analytics Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Revenue Area Chart */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg font-bold">Revenue Trends</CardTitle>
                  <p className="text-xs text-slate-500">Daily revenue for the last 30 days</p>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Total: NGN {payments?.filter((p: any) => p.status === 'completed').reduce((sum: number, p: any) => sum + p.amount, 0).toLocaleString()}
                </Badge>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={(() => {
                        const last30Days = Array.from({ length: 30 }, (_, i) => {
                          const date = new Date();
                          date.setDate(date.getDate() - (29 - i));
                          return date.toISOString().split('T')[0];
                        });
                        const dailyRevenue: Record<string, number> = {};
                        payments?.filter((p: any) => p.status === 'completed').forEach((p: any) => {
                          const date = new Date(p.createdAt).toISOString().split('T')[0];
                          if (last30Days.includes(date)) {
                            dailyRevenue[date] = (dailyRevenue[date] || 0) + p.amount;
                          }
                        });
                        return last30Days.map(date => ({
                          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                          amount: dailyRevenue[date] || 0
                        }));
                      })()}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        minTickGap={30}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        tickFormatter={(value) => `₦${value >= 1000 ? (value / 1000) + 'k' : value}`}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value: number) => [`NGN ${value.toLocaleString()}`, 'Revenue']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorRev)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Payment Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">Payment Status</CardTitle>
                <p className="text-xs text-slate-500">Distribution of all transactions</p>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={(() => {
                          const statusCounts: Record<string, number> = {};
                          payments?.forEach((p: any) => {
                            statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
                          });
                          return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
                        })()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {['completed', 'pending', 'failed', 'refunded'].map((status, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={
                              status === 'completed' ? '#10b981' : 
                              status === 'pending' ? '#f59e0b' : 
                              status === 'failed' ? '#ef4444' : '#64748b'
                            } 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">User Growth</CardTitle>
                <p className="text-xs text-slate-500">New users per month (Last 6 months)</p>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(() => {
                        const months = Array.from({ length: 6 }, (_, i) => {
                          const d = new Date();
                          d.setMonth(d.getMonth() - (5 - i));
                          return d.toLocaleString('en-US', { month: 'short' });
                        });
                        const monthlyUsers: Record<string, number> = {};
                        users?.forEach((u: any) => {
                          if (u.createdAt) {
                            const month = new Date(u.createdAt).toLocaleString('en-US', { month: 'short' });
                            if (months.includes(month)) {
                              monthlyUsers[month] = (monthlyUsers[month] || 0) + 1;
                            }
                          }
                        });
                        return months.map(month => ({
                          name: month,
                          users: monthlyUsers[month] || 0
                        }));
                      })()}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Users by Spending */}
          <Card>
            <CardHeader>
              <CardTitle>Top Users by Spending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(() => {
                  const userSpending: Record<string, { total: number; email: string }> = {};
                  
                  payments?.filter((p: any) => p.status === 'completed').forEach((p: any) => {
                    const user = users?.find((u: any) => u.userId === p.userId);
                    if (user) {
                      if (!userSpending[p.userId]) {
                        userSpending[p.userId] = { total: 0, email: user.email };
                      }
                      userSpending[p.userId].total += p.amount;
                    }
                  });

                  return Object.entries(userSpending)
                    .sort(([, a], [, b]) => b.total - a.total)
                    .slice(0, 5)
                    .map(([userId, data]) => (
                      <div key={userId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{data.email}</p>
                          <p className="text-xs text-slate-500">{userId.substring(0, 8)}...</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-600">NGN {data.total.toLocaleString()}</p>
                        </div>
                      </div>
                    ));
                })()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Flagged Posts Tab */}
        <TabsContent value="surveys">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{surveys.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Satisfaction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {surveys.length > 0 
                      ? (surveys.reduce((acc: number, s: any) => acc + s.rating, 0) / surveys.length).toFixed(1)
                      : '0.0'
                    } / 5
                  </div>
                </CardContent>
              </Card>
              {Object.entries(surveyStats).map(([feature, stats]: [string, any]) => (
                <Card key={feature}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium capitalize">{feature} Avg.</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
                    <p className="text-xs text-slate-500">{stats.count} responses</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>User Feedback & Feature Adoption</CardTitle>
                <p className="text-sm text-slate-500">Analyze survey results to understand user needs and feature performance.</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {surveys.length === 0 ? (
                    <p className="text-center py-8 text-slate-400">No survey responses yet</p>
                  ) : (
                    <div className="border rounded-lg overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b">
                          <tr>
                            <th className="text-left p-3 font-medium">Feature</th>
                            <th className="text-left p-3 font-medium">Rating</th>
                            <th className="text-left p-3 font-medium">Feedback</th>
                            <th className="text-left p-3 font-medium">User</th>
                            <th className="text-left p-3 font-medium">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {surveys.map((survey: any) => (
                            <tr key={survey.id}>
                              <td className="p-3 capitalize font-medium">{survey.feature}</td>
                              <td className="p-3">
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <span key={i} className={`text-xs ${i < survey.rating ? 'text-amber-500' : 'text-slate-200'}`}>★</span>
                                  ))}
                                </div>
                              </td>
                              <td className="p-3 max-w-xs truncate">{survey.feedback || '-'}</td>
                              <td className="p-3 text-xs text-slate-500 font-mono">
                                {users.find((u: any) => u.userId === survey.userId)?.email || survey.userId.substring(0, 8)}
                              </td>
                              <td className="p-3 text-xs text-slate-500">
                                {new Date(survey.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="flagged-posts" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5" />
                  Flagged Forum Posts
                  {flaggedPosts.length > 0 && (
                    <Badge variant="destructive" className="ml-2">{flaggedPosts.length}</Badge>
                  )}
                </CardTitle>
                <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="flag-threshold" className="text-xs font-bold whitespace-nowrap">Shadow Threshold:</Label>
                    <Input
                      id="flag-threshold"
                      type="number"
                      className="w-16 h-8 text-xs"
                      value={localSettings['flag_shadow_threshold'] ?? getSetting('flag_shadow_threshold') ?? 50}
                      onChange={(e) => handleSettingChange('flag_shadow_threshold', e.target.value)}
                    />
                  </div>
                  <Button 
                    size="sm" 
                    className="h-8 px-2"
                    onClick={() => handleSaveSetting('flag_shadow_threshold', 'forum', true)}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-slate-500">
                Review posts that have reached the flag threshold and are hidden from users.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {flaggedPosts.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Flag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No flagged posts requiring review</p>
                    <p className="text-sm mt-2">Posts with 10+ flags will appear here for admin review</p>
                  </div>
                ) : (
                  flaggedPosts.map((post: any) => (
                    <Card key={post.id} className="border-red-200 bg-red-50">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="destructive">
                                  {post.flagCount || 0} flags
                                </Badge>
                                <span className="text-sm text-slate-600">
                                  by {post.author || 'Unknown'}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {post.city || 'Unknown City'}
                                </span>
                              </div>
                              <p className="text-slate-800 mb-2">{post.content}</p>
                              <div className="flex gap-2 text-xs text-slate-500">
                                <span>👍 {post.upvotes || 0}</span>
                                <span>💬 {post.comments?.length || 0} comments</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 pt-2 border-t">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => {
                                if (confirm('Reinstate this post? It will be visible to all users again.')) {
                                  reinstatePost.mutate(post.id);
                                }
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Reinstate
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1"
                              onClick={() => {
                                if (confirm('Permanently delete this post? This action cannot be undone.')) {
                                  deleteFlaggedPost.mutate(post.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete Permanently
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="escrow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Escrow Management
                {disputes.filter((d: any) => d.status === 'open' || d.status === 'under_review').length > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {disputes.filter((d: any) => d.status === 'open' || d.status === 'under_review').length}
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-slate-500">
                Manage escrow disputes and mediate between users and vendors.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {disputes.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active disputes</p>
                  </div>
                ) : (
                  disputes.map((dispute: any) => (
                    <Card key={dispute.id} className={dispute.status === 'open' ? 'border-red-200 bg-red-50/30' : ''}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <Badge className={
                                dispute.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                dispute.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                              }>
                                {(dispute.status || 'status').replace('_', ' ')}
                              </Badge>
                              <span className="text-xs text-slate-400">
                                Opened: {new Date(dispute.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <h3 className="font-bold text-lg">{dispute.reason}</h3>
                            <p className="text-sm text-slate-600">{dispute.description}</p>
                            
                            {dispute.evidence && dispute.evidence.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs font-bold mb-1">Evidence Provided:</p>
                                <div className="flex flex-wrap gap-2">
                                  {dispute.evidence.map((item: any, i: number) => (
                                    <a 
                                      key={i} 
                                      href={item.url} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="text-[10px] bg-white border px-2 py-1 rounded flex items-center gap-1 hover:bg-slate-50"
                                    >
                                      <FileText className="h-3 w-3" />
                                      {item.type} {i + 1}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-2 min-w-[150px]">
                            {dispute.status !== 'resolved' && dispute.status !== 'closed' && (
                              <>
                                {!dispute.adminJoined ? (
                                  <Button 
                                    size="sm" 
                                    className="w-full"
                                    onClick={() => joinDispute.mutate(dispute.id)}
                                    disabled={joinDispute.isPending}
                                  >
                                    Join Chat & Mediate
                                  </Button>
                                ) : (
                                  <>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="w-full bg-blue-50"
                                      onClick={() => window.location.href = `/bookings/${dispute.bookingId}`}
                                    >
                                      Go to Chat
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      className="w-full bg-green-600 hover:bg-green-700"
                                      onClick={() => {
                                        setResolvingDispute(dispute);
                                        setResolutionNotes("");
                                      }}
                                    >
                                      Resolve Dispute
                                    </Button>
                                  </>
                                )}
                              </>
                            )}
                            {dispute.status === 'resolved' && (
                              <div className="text-right">
                                <p className="text-xs font-bold text-green-600">Resolved</p>
                                <p className="text-[10px] text-slate-500">Favor: {(dispute.resolution || 'unknown').replace('_', ' ')}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Job</CardTitle>
                <p className="text-sm text-slate-500">Post a new job opportunity for users.</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Job Title</Label>
                      <Input 
                        placeholder="e.g. Senior Lawyer" 
                        value={newJob.title}
                        onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Company</Label>
                      <Input 
                        placeholder="e.g. Sabiguard Legal" 
                        value={newJob.company}
                        onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input 
                        placeholder="e.g. Lagos, Nigeria" 
                        value={newJob.location}
                        onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Salary Range</Label>
                      <Input 
                        placeholder="e.g. N200k - N400k" 
                        value={newJob.salary}
                        onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={newJob.type} onValueChange={(v) => setNewJob({ ...newJob, type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Full-time">Full-time</SelectItem>
                          <SelectItem value="Part-time">Part-time</SelectItem>
                          <SelectItem value="Contract">Contract</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Work Mode</Label>
                      <Select value={newJob.workMode} onValueChange={(v) => setNewJob({ ...newJob, workMode: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Remote">Remote</SelectItem>
                          <SelectItem value="Onsite">Onsite</SelectItem>
                          <SelectItem value="Hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Contact (Email/URL)</Label>
                    <Input 
                      placeholder="e.g. careers@company.com" 
                      value={newJob.contact}
                      onChange={(e) => setNewJob({ ...newJob, contact: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea 
                      placeholder="Detailed job description..." 
                      className="min-h-[150px]"
                      value={newJob.description}
                      onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                    />
                  </div>
                  <Button 
                    onClick={() => createJob.mutate(newJob)}
                    disabled={!newJob.title || !newJob.company || createJob.isPending}
                  >
                    {createJob.isPending ? 'Posting...' : 'Post Job'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Job Management ({adminJobs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {adminJobs.length === 0 ? (
                    <p className="text-center py-8 text-slate-400">No jobs found</p>
                  ) : (
                    adminJobs.map((job: any) => (
                      <div key={job.id} className="p-4 border rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-bold">{job.title}</p>
                          <p className="text-sm text-slate-500">{job.company} - {job.location}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditingJob(job)}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => {
                            if (confirm('Delete this job?')) deleteJob.mutate(job.id);
                          }}>Delete</Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Event</CardTitle>
                <p className="text-sm text-slate-500">Organize a new community event or workshop.</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Event Title</Label>
                      <Input 
                        placeholder="e.g. Legal Rights Workshop" 
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={newEvent.category} onValueChange={(v) => setNewEvent({ ...newEvent, category: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="workshop">Workshop</SelectItem>
                          <SelectItem value="seminar">Seminar</SelectItem>
                          <SelectItem value="townhall">Town Hall</SelectItem>
                          <SelectItem value="legal_aid">Legal Aid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input 
                        type="date"
                        value={newEvent.date}
                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Input 
                        type="time"
                        value={newEvent.time}
                        onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input 
                        placeholder="e.g. Online or Lagos Office" 
                        value={newEvent.location}
                        onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Attendees</Label>
                      <Input 
                        type="number"
                        value={newEvent.maxAttendees}
                        onChange={(e) => setNewEvent({ ...newEvent, maxAttendees: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea 
                      placeholder="What is this event about?" 
                      className="min-h-[100px]"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    />
                  </div>
                  <Button 
                    onClick={() => createEvent.mutate(newEvent)}
                    disabled={!newEvent.title || !newEvent.date || createEvent.isPending}
                  >
                    {createEvent.isPending ? 'Creating...' : 'Create Event'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Event Management ({adminEvents.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {adminEvents.length === 0 ? (
                    <p className="text-center py-8 text-slate-400">No events found</p>
                  ) : (
                    adminEvents.map((event: any) => (
                      <div key={event.id} className="p-4 border rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-bold">{event.title}</p>
                          <p className="text-sm text-slate-500">{new Date(event.date).toLocaleDateString()} - {event.location}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditingEvent(event)}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => {
                            if (confirm('Delete this event?')) deleteEvent.mutate(event.id);
                          }}>Delete</Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="faqs">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>FAQ Management</CardTitle>
                    <p className="text-sm text-slate-500">Manage frequently asked questions for users.</p>
                  </div>
                  <Button onClick={() => setShowFaqForm(!showFaqForm)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showFaqForm && (
                  <div className="p-4 border rounded-lg mb-6 bg-slate-50 space-y-4">
                    <div className="space-y-2">
                      <Label>Question</Label>
                      <Input 
                        placeholder="e.g. How do I earn credits?"
                        value={newFaq.question}
                        onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Answer</Label>
                      <Textarea 
                        placeholder="Detailed answer..."
                        value={newFaq.answer}
                        onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                        rows={4}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={newFaq.category} onValueChange={(v) => setNewFaq({ ...newFaq, category: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="billing">Billing & Credits</SelectItem>
                            <SelectItem value="marketplace">Marketplace</SelectItem>
                            <SelectItem value="vendor">Vendor Related</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Display Order</Label>
                        <Input 
                          type="number"
                          value={newFaq.order}
                          onChange={(e) => setNewFaq({ ...newFaq, order: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={newFaq.isActive}
                        onCheckedChange={(checked) => setNewFaq({ ...newFaq, isActive: checked })}
                      />
                      <Label>Active (Visible to users)</Label>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={() => createFaq.mutate(newFaq)} disabled={!newFaq.question || !newFaq.answer}>
                        Save FAQ
                      </Button>
                      <Button variant="outline" onClick={() => setShowFaqForm(false)}>Cancel</Button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {faqs.length === 0 ? (
                    <p className="text-center py-8 text-slate-400">No FAQs found</p>
                  ) : (
                    faqs.map((faq: any) => (
                      <div key={faq.id} className="p-4 border rounded-lg space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">{faq.category}</Badge>
                              {!faq.isActive && <Badge variant="secondary">Hidden</Badge>}
                              <span className="text-xs text-slate-400">Order: {faq.order}</span>
                            </div>
                            <p className="font-bold">{faq.question}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => {
                              if (confirm('Delete this FAQ?')) deleteFaq.mutate(faq.id);
                            }}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2">{faq.answer}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="testimonials">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Testimonials & Reviews</CardTitle>
                    <p className="text-sm text-slate-500">Manage user success stories and platform reviews.</p>
                  </div>
                  <Button onClick={() => setShowTestimonialForm(!showTestimonialForm)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Testimonial
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showTestimonialForm && (
                  <div className="p-4 border rounded-lg mb-6 bg-slate-50 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>User Name</Label>
                        <Input 
                          placeholder="e.g. John Doe"
                          value={newTestimonial.name}
                          onChange={(e) => setNewTestimonial({ ...newTestimonial, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Role / Title</Label>
                        <Input 
                          placeholder="e.g. Small Business Owner"
                          value={newTestimonial.role}
                          onChange={(e) => setNewTestimonial({ ...newTestimonial, role: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Content / Testimonial</Label>
                      <Textarea 
                        placeholder="What did they say?"
                        value={newTestimonial.content}
                        onChange={(e) => setNewTestimonial({ ...newTestimonial, content: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Avatar URL (Optional)</Label>
                        <Input 
                          placeholder="https://..."
                          value={newTestimonial.avatar}
                          onChange={(e) => setNewTestimonial({ ...newTestimonial, avatar: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Rating (1-5)</Label>
                        <Select 
                          value={newTestimonial.rating.toString()} 
                          onValueChange={(v) => setNewTestimonial({ ...newTestimonial, rating: parseInt(v) })}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 Stars</SelectItem>
                            <SelectItem value="4">4 Stars</SelectItem>
                            <SelectItem value="3">3 Stars</SelectItem>
                            <SelectItem value="2">2 Stars</SelectItem>
                            <SelectItem value="1">1 Star</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={newTestimonial.isActive}
                        onCheckedChange={(checked) => setNewTestimonial({ ...newTestimonial, isActive: checked })}
                      />
                      <Label>Active (Featured on home page)</Label>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={() => createTestimonial.mutate(newTestimonial)} disabled={!newTestimonial.name || !newTestimonial.content}>
                        Save Testimonial
                      </Button>
                      <Button variant="outline" onClick={() => setShowTestimonialForm(false)}>Cancel</Button>
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  {testimonials.length === 0 ? (
                    <p className="col-span-full text-center py-8 text-slate-400">No testimonials found</p>
                  ) : (
                    testimonials.map((t: any) => (
                      <Card key={t.id} className="bg-white border-slate-200">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border">
                                {t.avatar ? (
                                  <img src={t.avatar} alt={t.name} className="h-full w-full object-cover" />
                                ) : (
                                  <User className="h-5 w-5 text-slate-400" />
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-sm">{t.name}</p>
                                <p className="text-[10px] text-slate-500">{t.role}</p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => {
                                if (confirm('Delete this testimonial?')) deleteTestimonial.mutate(t.id);
                              }}>
                                <Trash2 className="h-3 w-3 text-red-500" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Badge key={i} variant="outline" className={`h-4 w-4 p-0 flex items-center justify-center border-none ${i < (t.rating || 5) ? 'text-amber-500' : 'text-slate-200'}`}>
                                ★
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-slate-600 line-clamp-3 italic">"{t.content}"</p>
                          {!t.isActive && <Badge variant="secondary" className="text-[10px]">Hidden</Badge>}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="moat">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload MOAT Data</CardTitle>
                <p className="text-sm text-slate-500">Upload laws, acts, and other data to train the AI and improve accuracy.</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input 
                        placeholder="e.g. 1999 Constitution" 
                        value={newMoat.title}
                        onChange={(e) => setNewMoat({ ...newMoat, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select 
                        value={newMoat.category}
                        onValueChange={(v) => setNewMoat({ ...newMoat, category: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="constitution">Constitution</SelectItem>
                          <SelectItem value="police_act">Police Act</SelectItem>
                          <SelectItem value="forum">Forum Data</SelectItem>
                          <SelectItem value="marketplace">Marketplace Data</SelectItem>
                          <SelectItem value="events">Events Data</SelectItem>
                          <SelectItem value="jobs">Jobs Data</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Source / Reference</Label>
                    <Input 
                      placeholder="e.g. Federal Government of Nigeria" 
                      value={newMoat.source}
                      onChange={(e) => setNewMoat({ ...newMoat, source: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Content</Label>
                    <Textarea 
                      placeholder="Paste the full text here..." 
                      className="min-h-[200px]"
                      value={newMoat.content}
                      onChange={(e) => setNewMoat({ ...newMoat, content: e.target.value })}
                    />
                  </div>
                  <Button 
                    onClick={() => createMoat.mutate(newMoat)}
                    disabled={!newMoat.title || !newMoat.content || createMoat.isPending}
                  >
                    {createMoat.isPending ? 'Uploading...' : 'Upload Data'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Existing MOAT Data ({moatItems.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {moatItems.length === 0 ? (
                    <p className="text-center py-8 text-slate-400">No MOAT data uploaded yet</p>
                  ) : (
                    moatItems.map((item: any) => (
                      <div key={item.id} className="p-4 border rounded-lg flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold">{item.title}</p>
                            <Badge variant="outline">{item.category}</Badge>
                          </div>
                          <p className="text-xs text-slate-500 mb-2">Source: {item.source}</p>
                          <p className="text-sm text-slate-600 line-clamp-3">{item.content}</p>
                        </div>
                        <Button size="sm" variant="destructive" className="ml-4" onClick={() => {
                          if (confirm('Delete this MOAT item?')) deleteMoat.mutate(item.id);
                        }}>Delete</Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
      <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={confirmAction?.type === 'cache' ? 'text-red-600' : ''}>
              {confirmAction?.title}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
            <Button 
              variant={confirmAction?.type === 'cache' ? 'destructive' : 'default'}
              onClick={async () => {
                if (confirmAction?.type === 'export') {
                  window.open('/api/admin/export', '_blank');
                } else if (confirmAction?.type === 'cache') {
                  try {
                    await fetch('/api/admin/clear-cache', { method: 'POST' });
                    toast({ title: "Success", description: "System cache cleared successfully." });
                  } catch (err) {
                    toast({ title: "Error", description: "Failed to clear cache", variant: "destructive" });
                  }
                }
                setConfirmAction(null);
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Dispute Dialog */}
      <Dialog open={!!resolvingDispute} onOpenChange={() => setResolvingDispute(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Escrow Dispute</DialogTitle>
            <DialogDescription>
              Decide how the escrow funds should be released. This action is final.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Resolution Decision</Label>
              <Select value={resolutionValue} onValueChange={setResolutionValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select outcome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user_favor">Full Refund to User</SelectItem>
                  <SelectItem value="vendor_favor">Full Payment to Vendor</SelectItem>
                  <SelectItem value="split">50/50 Split</SelectItem>
                  <SelectItem value="cancelled">Cancel & Refund All</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Internal Resolution Notes</Label>
              <Textarea 
                placeholder="Explain the reasoning for this decision..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolvingDispute(null)}>Cancel</Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                resolveDispute.mutate({
                  disputeId: resolvingDispute.id,
                  resolution: resolutionValue,
                  notes: resolutionNotes
                });
                setResolvingDispute(null);
              }}
              disabled={resolveDispute.isPending}
            >
              Confirm Resolution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={!!viewingUser} onOpenChange={() => setViewingUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {viewingUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-slate-500" />
                </div>
                <div>
                  <p className="font-bold text-lg">{viewingUser.displayName || 'Unknown'}</p>
                  <p className="text-sm text-slate-500">{viewingUser.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-slate-500">User ID</p>
                  <p className="font-mono text-xs">{viewingUser.userId}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500">Status</p>
                  <Badge variant={viewingUser.kycStatus === 'verified' ? 'default' : 'secondary'}>
                    {viewingUser.kycStatus || 'pending'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500">Credits</p>
                  <p className="font-bold">{viewingUser.credits || 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500">Plan</p>
                  <p className="font-bold">{viewingUser.planId || 'None'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500">Account Type</p>
                  <div className="flex gap-1">
                    {viewingUser.isAdmin && <Badge className="bg-red-100 text-red-800">Admin</Badge>}
                    {viewingUser.isVendor && <Badge className="bg-purple-100 text-purple-800">Vendor</Badge>}
                    {!viewingUser.isAdmin && !viewingUser.isVendor && <Badge>User</Badge>}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-500">Joined</p>
                  <p>{viewingUser.createdAt ? new Date(viewingUser.createdAt).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewingUser(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User/Vendor Dialog */}
      <Dialog open={!!editingUser || !!editingVendor} onOpenChange={() => { setEditingUser(null); setEditingVendor(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit {editingUser ? 'User' : 'Vendor'} Details</DialogTitle>
            <DialogDescription>
              Update user profile information. Email and Password cannot be changed here.
            </DialogDescription>
          </DialogHeader>
          {(editingUser || editingVendor) && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input 
                  value={(editingUser || editingVendor).displayName || ''} 
                  onChange={(e) => {
                    if (editingUser) setEditingUser({ ...editingUser, displayName: e.target.value });
                    else setEditingVendor({ ...editingVendor, displayName: e.target.value });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>KYC Status</Label>
                <Select 
                  value={(editingUser || editingVendor).kycStatus || 'pending'}
                  onValueChange={(value) => {
                    if (editingUser) setEditingUser({ ...editingUser, kycStatus: value });
                    else setEditingVendor({ ...editingVendor, kycStatus: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="is-admin" 
                    checked={(editingUser || editingVendor).isAdmin || false}
                    onCheckedChange={(checked) => {
                      if (editingUser) setEditingUser({ ...editingUser, isAdmin: checked });
                      else setEditingVendor({ ...editingVendor, isAdmin: checked });
                    }}
                  />
                  <Label htmlFor="is-admin">Admin Access</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="is-vendor" 
                    checked={(editingUser || editingVendor).isVendor || false}
                    onCheckedChange={(checked) => {
                      if (editingUser) setEditingUser({ ...editingUser, isVendor: checked });
                      else setEditingVendor({ ...editingVendor, isVendor: checked });
                    }}
                  />
                  <Label htmlFor="is-vendor">Vendor Account</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingUser(null); setEditingVendor(null); }}>Cancel</Button>
            <Button 
              onClick={() => {
                const target = editingUser || editingVendor;
                updateUser.mutate({ 
                  userId: target.userId, 
                  updates: {
                    displayName: target.displayName,
                    kycStatus: target.kycStatus,
                    isAdmin: target.isAdmin,
                    isVendor: target.isVendor
                  }
                });
              }}
              disabled={updateUser.isPending}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Job Dialog */}
      <Dialog open={!!editingJob} onOpenChange={() => setEditingJob(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Job Opportunity</DialogTitle>
          </DialogHeader>
          {editingJob && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Job Title</Label>
                  <Input 
                    value={editingJob.title}
                    onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input 
                    value={editingJob.company}
                    onChange={(e) => setEditingJob({ ...editingJob, company: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input 
                    value={editingJob.location}
                    onChange={(e) => setEditingJob({ ...editingJob, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Salary Range</Label>
                  <Input 
                    value={editingJob.salary}
                    onChange={(e) => setEditingJob({ ...editingJob, salary: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={editingJob.type} onValueChange={(v) => setEditingJob({ ...editingJob, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Work Mode</Label>
                  <Select value={editingJob.workMode} onValueChange={(v) => setEditingJob({ ...editingJob, workMode: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Remote">Remote</SelectItem>
                      <SelectItem value="Onsite">Onsite</SelectItem>
                      <SelectItem value="Hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Contact (Email/URL)</Label>
                <Input 
                  value={editingJob.contact}
                  onChange={(e) => setEditingJob({ ...editingJob, contact: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  className="min-h-[150px]"
                  value={editingJob.description}
                  onChange={(e) => setEditingJob({ ...editingJob, description: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingJob(null)}>Cancel</Button>
            <Button 
              onClick={() => updateJob.mutate({ jobId: editingJob.id, updates: editingJob })}
              disabled={updateJob.isPending}
            >
              {updateJob.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={() => setEditingEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          {editingEvent && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Event Title</Label>
                  <Input 
                    value={editingEvent.title}
                    onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={editingEvent.category} onValueChange={(v) => setEditingEvent({ ...editingEvent, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="seminar">Seminar</SelectItem>
                      <SelectItem value="townhall">Town Hall</SelectItem>
                      <SelectItem value="legal_aid">Legal Aid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input 
                    type="date"
                    value={editingEvent.date}
                    onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input 
                    type="time"
                    value={editingEvent.time}
                    onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input 
                    value={editingEvent.location}
                    onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Attendees</Label>
                  <Input 
                    type="number"
                    value={editingEvent.maxAttendees}
                    onChange={(e) => setEditingEvent({ ...editingEvent, maxAttendees: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  className="min-h-[100px]"
                  value={editingEvent.description}
                  onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEvent(null)}>Cancel</Button>
            <Button 
              onClick={() => updateEvent.mutate({ eventId: editingEvent.id, updates: editingEvent })}
              disabled={updateEvent.isPending}
            >
              {updateEvent.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
