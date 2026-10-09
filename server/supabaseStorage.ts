import { createClient, SupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import type { 
  IStorage, UserProfile, UserCredits, AdminSetting, 
  VendorService, Professional, UserPlan, CreditPackage, Route, 
  Alert, Event, Job, PaymentMethod, Payment, Subscription, 
  VendorApplication, VendorLead, ForumPost, Survey, Wallet, 
  SabiGuardMessage, Faq, Testimonial, AuthResult 
} from "./types.d.ts";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://njtwsuwlxbfxvzbmsrzr.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qdHdzdXdseGJmeHZ6Ym1zcnpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTEzNDc2NiwiZXhwIjoyMTA2NzEwNzY2fQ.rh8rBesuoau-5R8DxawHPf93TmMscrAuK3rFn7lWpic";

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

console.log(`[SupabaseStorage] Initialized Supabase client for: ${SUPABASE_URL}`);

// Local persistent cache for routes & alerts if Supabase tables don't exist yet
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch {}
}
const ROUTES_FILE = path.join(DATA_DIR, 'routes.json');
const ALERTS_FILE = path.join(DATA_DIR, 'alerts.json');

function loadLocalRoutes(): Route[] {
  try {
    if (fs.existsSync(ROUTES_FILE)) {
      return JSON.parse(fs.readFileSync(ROUTES_FILE, 'utf8'));
    }
  } catch {}
  return [];
}

function saveLocalRoutes(routes: Route[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(ROUTES_FILE, JSON.stringify(routes, null, 2), 'utf8');
  } catch (e) {
    console.error('[supabaseStorage] Error saving local routes:', e);
  }
}

function loadLocalAlerts(): Alert[] {
  try {
    if (fs.existsSync(ALERTS_FILE)) {
      return JSON.parse(fs.readFileSync(ALERTS_FILE, 'utf8'));
    }
  } catch {}
  return [];
}

function saveLocalAlerts(alerts: Alert[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(ALERTS_FILE, JSON.stringify(alerts, null, 2), 'utf8');
  } catch (e) {
    console.error('[supabaseStorage] Error saving local alerts:', e);
  }
}

export const supabaseStorage: IStorage = {
  // User Profile
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw new Error(`Could not fetch user profile: ${error.message}`);
      if (!data) return null;
      return {
        userId: data.id,
        email: data.email,
        displayName: data.display_name,
        phoneNumber: data.phone_number,
        dob: data.dob,
        gender: data.gender,
        state: data.state,
        city: data.city,
        isAdmin: !!data.is_admin,
        isVendor: !!data.is_vendor,
        emailVerified: !!data.email_verified,
        emailVerificationStatus: data.email_verification_status || 'verified',
        emailVerifiedAt: data.email_verified_at,
        vendorMode: !!data.vendor_mode,
        referralCode: data.referral_code,
        referredBy: data.referred_by,
        chatStorageLimit: data.chat_storage_limit || 524288,
        chatStorageUsed: data.chat_storage_used || 0,
        createdAt: data.created_at ? new Date(data.created_at) : new Date()
      };
    } catch (e) {
      console.error('[supabaseStorage] getUserProfile error:', e);
      throw e;
    }
  },

  async toggleUserAdmin(userId: string, isAdmin: boolean): Promise<boolean> {
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: isAdmin, updated_at: new Date().toISOString() })
      .eq('id', userId);
    return !error;
  },

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const payload: any = { updated_at: new Date().toISOString() };
    if (updates.displayName !== undefined) payload.display_name = updates.displayName;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.phoneNumber !== undefined) payload.phone_number = updates.phoneNumber;
    if (updates.dob !== undefined) payload.dob = updates.dob;
    if (updates.gender !== undefined) payload.gender = updates.gender;
    if (updates.state !== undefined) payload.state = updates.state;
    if (updates.city !== undefined) payload.city = updates.city;
    if (updates.isAdmin !== undefined) payload.is_admin = updates.isAdmin;
    if (updates.isVendor !== undefined) payload.is_vendor = updates.isVendor;
    if (updates.vendorMode !== undefined) payload.vendor_mode = updates.vendorMode;
    if (updates.emailVerified !== undefined) payload.email_verified = updates.emailVerified;
    if (updates.emailVerificationStatus !== undefined) payload.email_verification_status = updates.emailVerificationStatus;

    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...payload }, { onConflict: 'id' });

    if (error) throw new Error(`Could not update user profile: ${error.message}`);
    return await this.getUserProfile(userId);
  },
  async createUser(user: any): Promise<any> {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id || user.userId,
        email: user.email || null,
        display_name: user.displayName || user.name || null,
        created_at: new Date().toISOString()
      }, { onConflict: 'id' });
    if (error) console.error('[supabaseStorage] createUser error:', error);
    return { id: user.id || user.userId };
  },

  async deleteUser(userId: string): Promise<boolean> {
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    return !error;
  },

  async getAllUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error || !data) return [];
    const { data: creditRows } = await supabase.from('credits').select('user_id,total_credits,used_credits');
    const creditMap = new Map<string, number>((creditRows || []).map((c: any) => [c.user_id, Math.max(0, (c.total_credits ?? 0) - (c.used_credits ?? 0))]));
    const { data: subRows } = await supabase.from('subscriptions').select('user_id,plan_id').eq('status', 'active');
    const subMap = new Map<string, string>((subRows || []).map((s: any) => [s.user_id, s.plan_id]));
    const plans = await this.getAllPlans();
    const planNameMap = new Map<string, string>(plans.map(p => [p.id, p.name]));

    return data.map((d: any) => {
      const activePlanId = subMap.get(d.id) || (d.is_vendor ? 'plan-vendor' : 'plan-free');
      return {
        userId: d.id,
        credits: creditMap.get(d.id) ?? 0,
        planId: activePlanId,
        planName: planNameMap.get(activePlanId) || activePlanId,
        email: d.email,
        displayName: d.display_name,
        phoneNumber: d.phone_number,
        dob: d.dob,
        gender: d.gender,
        state: d.state,
        city: d.city,
        isAdmin: !!d.is_admin,
        isVendor: !!d.is_vendor,
        emailVerified: !!d.email_verified,
        emailVerificationStatus: d.email_verification_status || 'verified',
        vendorMode: !!d.vendor_mode,
        referralCode: d.referral_code,
        referredBy: d.referred_by,
        chatStorageLimit: d.chat_storage_limit || 524288,
        chatStorageUsed: d.chat_storage_used || 0,
        createdAt: d.created_at ? new Date(d.created_at) : new Date()
      };
    });
  },

  async generateReferralCode(userId: string): Promise<string> {
    const code = "SABI" + userId.substring(0, 6).toUpperCase();
    await supabase.from('profiles').update({ referral_code: code }).eq('id', userId);
    return code;
  },

  async processReferral(newUserId: string, referralCode: string): Promise<void> {
    const { data: referrers } = await supabase
      .from('profiles')
      .select('id')
      .eq('referral_code', referralCode)
      .limit(1);

    if (referrers && referrers.length > 0) {
      const referrerId = referrers[0].id;
      const { data: claimed } = await supabase
        .from('profiles')
        .update({ referred_by: referrerId })
        .eq('id', newUserId)
        .is('referred_by', null)
        .select('id');
      if (referrerId !== newUserId && claimed && claimed.length > 0) {
        await this.addCredits(newUserId, 10, `Referral signup bonus (Code: ${referralCode})`);
        await this.addCredits(referrerId, 20, `Referral bonus for inviting user ${newUserId}`);
      }
    }
  },

  // Credits & Plans
  async getBalance(userId: string): Promise<{ totalCredits: number; usedCredits: number; availableCredits: number; planCredits: number; renewalDate?: string | null; planId?: string; planName?: string }> {
    const [, plan] = await Promise.all([
      this.ensureCreditsRow(userId),
      this.getUserPlan(userId)
    ]);
    await this.refreshAllowance(userId, plan);
    const credits = await this.getUserCredits(userId);
    const total = credits?.totalCredits ?? 0;
    const used = credits?.usedCredits ?? 0;
    const planCredits = credits?.planCredits ?? 0;
    return {
      totalCredits: total,
      usedCredits: used,
      availableCredits: Math.max(0, total - used),
      planCredits,
      renewalDate: credits?.renewalDate,
      planId: plan?.id || 'free',
      planName: plan?.name || 'Citizen Free'
    };
  },

  async getUserCredits(userId: string): Promise<UserCredits | null> {
    const { data } = await supabase.from('credits').select('*').eq('user_id', userId).maybeSingle();
    if (!data) {
      return { userId, totalCredits: 10, usedCredits: 0, planCredits: 10 };
    }
    return {
      userId,
      totalCredits: data.total_credits ?? 10,
      usedCredits: data.used_credits ?? 0,
      planCredits: data.plan_credits ?? 0,
      renewalDate: data.renewal_date
    };
  },

  async ensureCreditsRow(userId: string): Promise<void> {
    await supabase
      .from('credits')
      .upsert({ user_id: userId, total_credits: 10, used_credits: 0, plan_credits: 10 }, { onConflict: 'user_id', ignoreDuplicates: true });
  },

  async logCredit(userId: string, amount: number, feature: string, description: string): Promise<void> {
    await supabase.from('credit_logs').insert({
      id: `cl-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      user_id: userId,
      amount,
      description,
      feature,
      created_at: new Date().toISOString()
    });
  },

  // Compare-and-swap loop so concurrent requests cannot double-spend or lose updates.
  async mutateCredits(userId: string, fn: (row: any) => { total_credits?: number; used_credits?: number; [k: string]: any } | null): Promise<boolean> {
    await this.ensureCreditsRow(userId);
    for (let attempt = 0; attempt < 8; attempt++) {
      const { data: row } = await supabase.from('credits').select('*').eq('user_id', userId).maybeSingle();
      if (!row) return false;
      const patch = fn(row);
      if (!patch) return false;
      const { data: updated, error } = await supabase
        .from('credits')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('total_credits', row.total_credits ?? 0)
        .eq('used_credits', row.used_credits ?? 0)
        .select('user_id');
      if (!error && updated && updated.length > 0) return true;
    }
    return false;
  },

  async deductCredits(userId: string, amount: number, feature: string, description: string): Promise<boolean> {
    if (!Number.isFinite(amount) || amount <= 0) return false;
    const ok = await this.mutateCredits(userId, (row) => {
      const available = (row.total_credits ?? 0) - (row.used_credits ?? 0);
      if (available < amount) return null;
      return { used_credits: (row.used_credits ?? 0) + amount };
    });
    if (ok) await this.logCredit(userId, -amount, feature, description);
    return ok;
  },

  async addCredits(userId: string, credits: number, description: string, feature = 'bonus_or_topup'): Promise<void> {
    if (!Number.isFinite(credits) || credits <= 0) return;
    const ok = await this.mutateCredits(userId, (row) => ({ total_credits: (row.total_credits ?? 0) + credits }));
    if (!ok) throw new Error('Could not add credits, please retry');
    await this.logCredit(userId, credits, feature, description);
  },

  async removeCredits(userId: string, amount: number, description: string, feature = 'admin_remove'): Promise<boolean> {
    if (!Number.isFinite(amount) || amount <= 0) return false;
    const ok = await this.mutateCredits(userId, (row) => {
      const currentTotal = row.total_credits ?? 0;
      const currentUsed = row.used_credits ?? 0;
      const available = Math.max(0, currentTotal - currentUsed);
      const actualDeduct = Math.min(available, amount);
      if (actualDeduct <= 0) return null;
      const newTotal = Math.max(0, currentTotal - actualDeduct);
      const newUsed = Math.min(currentUsed, newTotal);
      return { total_credits: newTotal, used_credits: newUsed };
    });
    if (ok) await this.logCredit(userId, -amount, feature, description);
    return ok;
  },

  async refundCredits(userId: string, amount: number, feature: string): Promise<void> {
    if (!Number.isFinite(amount) || amount <= 0) return;
    const ok = await this.mutateCredits(userId, (row) => ({ used_credits: Math.max(0, (row.used_credits ?? 0) - amount) }));
    if (ok) await this.logCredit(userId, amount, feature, 'Refund');
  },

  async setUserCredits(userId: string, totalCredits: number): Promise<void> {
    await this.ensureCreditsRow(userId);
    const plan = await this.getUserPlan(userId);
    const planAllowance = plan ? (plan.monthlyCredits || plan.credits || 0) : 0;
    const planPart = Math.min(totalCredits, planAllowance);

    // Keep existing renewal_date if in future, else set it 30 days ahead so refresh doesn't immediately overwrite
    const { data: current } = await supabase.from('credits').select('renewal_date').eq('user_id', userId).maybeSingle();
    let renewalDate = current?.renewal_date;
    if (!renewalDate || new Date(renewalDate).getTime() <= Date.now()) {
      renewalDate = new Date(Date.now() + 30 * 86400000).toISOString();
    }

    const ok = await this.mutateCredits(userId, () => ({
      total_credits: totalCredits,
      used_credits: 0,
      plan_credits: planPart,
      renewal_date: renewalDate,
      last_free_refresh: new Date().toISOString()
    }));
    if (!ok) throw new Error('Could not set user credits');
    await this.logCredit(userId, totalCredits, 'admin_set', 'Balance set by admin');
  },

  // Replaces the plan allowance but keeps any purchased/bonus credits that are still unspent.
  async applyPlanAllowance(userId: string, allowance: number, extra: Record<string, any> = {}): Promise<void> {
    await this.mutateCredits(userId, (row) => {
      const oldAllowance = row.plan_credits ?? 0;
      const purchasedTotal = Math.max(0, (row.total_credits ?? 0) - oldAllowance);
      const purchasedLeft = Math.max(0, purchasedTotal - Math.max(0, (row.used_credits ?? 0) - oldAllowance));
      return { total_credits: purchasedLeft + allowance, used_credits: 0, plan_credits: allowance, ...extra };
    });
  },

  async refreshAllowance(userId: string, userPlan?: UserPlan | null): Promise<void> {
    await this.ensureCreditsRow(userId);
    const plan = userPlan || await this.getUserPlan(userId);
    if (!plan) return;

    const { data: row } = await supabase.from('credits').select('*').eq('user_id', userId).maybeSingle();
    if (!row) return;

    const now = Date.now();
    const renewalTime = row.renewal_date ? new Date(row.renewal_date).getTime() : 0;

    // Daily refreshes removed by policy: all plans use fixed monthly/yearly allowances.
    // If credits run out before renewal, the user must upgrade or purchase credit packages.
    const isPeriodRolledOver = !row.renewal_date || renewalTime <= now;
    if (!isPeriodRolledOver) {
      return;
    }

    const days = plan.billingCycle === 'yearly' ? 365 : 30;
    const nextRenewal = new Date(now + days * 86400000).toISOString();
    const allowance = plan.monthlyCredits || plan.credits || 0;

    await this.applyPlanAllowance(userId, allowance, {
      renewal_date: nextRenewal,
      last_free_refresh: new Date().toISOString()
    });
    if (allowance > 0) {
      await this.logCredit(userId, allowance, 'plan_refresh', `Plan allowance refreshed: ${plan.name}`);
    }
  },

  async refreshDailyCredits(userId: string, dailyCredits?: number): Promise<void> {
    // Daily refills disabled by policy; all plans use monthly allowance rollover
    await this.refreshAllowance(userId);
  },

  async refreshMonthlyCredits(userId: string, monthlyCredits?: number): Promise<void> {
    await this.refreshAllowance(userId);
  },
  async getCreditLog(userId: string): Promise<any[]> {
    const { data } = await supabase.from('credit_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return data || [];
  },

  async getAllPlans(): Promise<UserPlan[]> {
    const { data } = await supabase.from('plans').select('*');
    if (!data || data.length === 0) return [];
    return data.map((p: any) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      userType: p.user_type,
      price: Number(p.price),
      credits: p.credits,
      monthlyCredits: p.monthly_credits,
      billingCycle: p.billing_cycle,
      storageMb: p.storage_mb !== undefined && p.storage_mb !== null 
        ? Number(p.storage_mb) 
        : (p.type === 'enterprise' ? 50 : p.type === 'pro' ? 5 : p.type === 'basic' ? 1 : 0.5),
      features: Array.isArray(p.features) ? p.features : [],
      description: p.description
    } as UserPlan));
  },

  async getPlansByType(type: string, userType: 'user' | 'vendor'): Promise<UserPlan[]> {
    const all = await this.getAllPlans();
    return all.filter(p => p.type === type && p.userType === userType);
  },

  async getPlanById(planId: string): Promise<UserPlan | null> {
    const all = await this.getAllPlans();
    return all.find(p => p.id === planId) || null;
  },

  async getUserPlan(userId: string): Promise<UserPlan | null> {
    const sub = await this.getUserSubscription(userId);
    const [plans, profile] = await Promise.all([
      this.getAllPlans(),
      sub?.planId ? Promise.resolve(null) : this.getUserProfile(userId)
    ]);
    if (sub && sub.planId) {
      const plan = plans.find(candidate => candidate.id === sub.planId);
      if (plan) return plan;
    }
    const fallbackProfile = profile || await this.getUserProfile(userId);
    const defaultPlanId = fallbackProfile?.isVendor ? 'plan-vendor' : 'plan-free';
    return plans.find(candidate => candidate.id === defaultPlanId) || null;
  },

  async getUserSubscription(userId: string): Promise<Subscription | null> {
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data) return null;
    return {
      id: data.id,
      userId: data.user_id,
      planId: data.plan_id,
      status: data.status,
      startDate: data.start_date,
      endDate: data.end_date,
      createdAt: new Date(data.created_at)
    };
  },

  async assignDefaultPlan(userId: string, userType: 'user' | 'vendor'): Promise<UserPlan | null> {
    const planId = userType === 'vendor' ? 'plan-vendor' : 'plan-free';
    const plan = await this.getPlanById(planId);
    if (plan) {
      await this.createSubscription({
        userId,
        planId: plan.id,
        status: 'active',
        startDate: new Date().toISOString()
      });
    }
    return plan;
  },

  async createPlan(plan: Omit<UserPlan, 'id' | 'createdAt'>): Promise<UserPlan> {
    const id = `plan-${Date.now()}`;
    const newPlan: UserPlan = { id, ...plan, createdAt: new Date() };
    await supabase.from('plans').insert({
      id,
      name: plan.name,
      type: plan.type,
      user_type: plan.userType,
      price: plan.price,
      credits: plan.credits,
      monthly_credits: plan.monthlyCredits || plan.credits,
      billing_cycle: plan.billingCycle || 'monthly',
      storage_mb: plan.storageMb ?? (plan.type === 'enterprise' ? 50 : plan.type === 'pro' ? 5 : plan.type === 'basic' ? 1 : 0.5),
      features: plan.features || [],
      description: plan.description || ''
    });
    return newPlan;
  },

  async updatePlan(planId: string, updates: Partial<UserPlan>): Promise<UserPlan | null> {
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.price !== undefined) payload.price = updates.price;
    if (updates.credits !== undefined) payload.credits = updates.credits;
    if (updates.monthlyCredits !== undefined) payload.monthly_credits = updates.monthlyCredits;
    if (updates.billingCycle !== undefined) payload.billing_cycle = updates.billingCycle;
    if (updates.storageMb !== undefined) payload.storage_mb = updates.storageMb;
    if ((updates as any).storage_mb !== undefined) payload.storage_mb = (updates as any).storage_mb;
    if (updates.type !== undefined) payload.type = updates.type;
    if (updates.userType !== undefined) payload.user_type = updates.userType;
    if (updates.features !== undefined) payload.features = updates.features;
    if (updates.description !== undefined) payload.description = updates.description;
    await supabase.from('plans').update(payload).eq('id', planId);
    return await this.getPlanById(planId);
  },

  async deletePlan(planId: string): Promise<boolean> {
    const { error } = await supabase.from('plans').delete().eq('id', planId);
    return !error;
  },

  async createSubscription(sub: Omit<Subscription, 'id' | 'createdAt'>): Promise<Subscription> {
    const id = `sub-${Date.now()}`;
    const newSub: Subscription = { id, createdAt: new Date(), ...sub };
    await supabase.from('subscriptions').insert({
      id,
      user_id: sub.userId,
      plan_id: sub.planId,
      status: sub.status || 'active',
      start_date: sub.startDate || new Date().toISOString()
    });
    return newSub;
  },

  // Cancels any active subscription, starts the new one and applies its credit allowance and storage limit.
  async activatePlan(userId: string, planId: string): Promise<Subscription | null> {
    const plan = await this.getPlanById(planId);
    if (!plan) return null;
    await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('user_id', userId).eq('status', 'active');
    const sub = await this.createSubscription({
      userId,
      planId,
      status: 'active',
      startDate: new Date().toISOString()
    });

    const allowance = plan.monthlyCredits || plan.credits || 0;
    const days = plan.billingCycle === 'yearly' ? 365 : 30;
    const renewalDate = new Date(Date.now() + days * 86400000).toISOString();

    await this.applyPlanAllowance(userId, allowance, {
      renewal_date: renewalDate,
      last_free_refresh: new Date().toISOString()
    });

    // Update storage limit dynamically based on plan's storageMb configuration
    const storageMb = plan.storageMb ?? (plan.type === 'enterprise' ? 50 : plan.type === 'pro' ? 5 : plan.type === 'basic' ? 1 : 0.5);
    const chatStorageLimit = Math.max(524288, Math.round(Number(storageMb) * 1024 * 1024));
    await this.updateUserProfile(userId, { chatStorageLimit });

    await this.logCredit(userId, allowance, 'plan_assigned', `Assigned plan ${plan.name}`);
    return sub;
  },

  // Cancels active subscription, reverts user to default Free plan allowance and storage, keeps purchased credits.
  async removePlan(userId: string): Promise<void> {
    await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('user_id', userId).eq('status', 'active');
    const profile = await this.getUserProfile(userId);
    const defaultPlanId = profile?.isVendor ? 'plan-vendor' : 'plan-free';
    const freePlan = await this.getPlanById(defaultPlanId);
    const allowance = freePlan ? (freePlan.monthlyCredits || freePlan.credits || 10) : 10;
    const days = 30;
    const renewalDate = new Date(Date.now() + days * 86400000).toISOString();

    await this.applyPlanAllowance(userId, allowance, {
      renewal_date: renewalDate,
      last_free_refresh: new Date().toISOString()
    });

    // Revert storage limit to default Free plan limit dynamically
    const freeStorageMb = freePlan?.storageMb ?? 0.5;
    const chatStorageLimit = Math.max(524288, Math.round(Number(freeStorageMb) * 1024 * 1024));
    await this.updateUserProfile(userId, { chatStorageLimit });
    await this.logCredit(userId, allowance, 'plan_removed', `Reverted to ${freePlan?.name || 'Citizen Free'} plan`);
  },

  async updateSubscriptionStatus(subscriptionId: string, status: 'active' | 'cancelled' | 'pending'): Promise<void> {
    await supabase.from('subscriptions').update({ status }).eq('id', subscriptionId);
  },

  async getCreditPackages(): Promise<CreditPackage[]> {
    const { data } = await supabase.from('credit_packages').select('*').eq('is_active', true);
    if (!data || data.length === 0) {
      return [
        { id: 'cp-starter', name: 'Starter Civic Pack', credits: 50, price: 500, bonus: 0 },
        { id: 'cp-standard', name: 'Standard Citizen Pack', credits: 200, price: 1800, bonus: 20 },
        { id: 'cp-pro', name: 'Pro Legal Pack', credits: 500, price: 4000, bonus: 50 }
      ];
    }
    return data;
  },

  async createCreditPackage(data: Omit<CreditPackage, 'id'>): Promise<CreditPackage> {
    const id = `cp-${Date.now()}`;
    const newPkg = { id, ...data, is_active: true };
    await supabase.from('credit_packages').insert(newPkg);
    return newPkg as any;
  },

  async updateCreditPackage(packageId: string, updates: Partial<CreditPackage>): Promise<CreditPackage | null> {
    await supabase.from('credit_packages').update(updates).eq('id', packageId);
    return null;
  },

  async deleteCreditPackage(packageId: string): Promise<boolean> {
    const { error } = await supabase.from('credit_packages').delete().eq('id', packageId);
    return !error;
  },

  // Admin & Settings
  async getAdminSetting(key: string): Promise<AdminSetting | null> {
    const { data, error } = await supabase.from('admin_settings').select('*').eq('key', key).maybeSingle();
    if (error) throw new Error(`Failed to read setting "${key}": ${error.message}`);
    if (!data) return null;
    return { key: data.key, value: data.value, category: data.category, isSecret: !!data.is_secret };
  },

  async getAdminSettings(category?: string): Promise<AdminSetting[]> {
    let q = supabase.from('admin_settings').select('*');
    if (category) q = q.eq('category', category);
    const { data, error } = await q;
    if (error) throw new Error(`Failed to read admin settings: ${error.message}`);
    return (data || []).map((d: any) => ({
      key: d.key,
      value: d.value,
      category: d.category,
      isSecret: !!d.is_secret
    }));
  },

  async setAdminSetting(key: string, value: any, category: string, isSecret: boolean): Promise<void> {
    const strVal = typeof value === 'object' ? JSON.stringify(value) : String(value);
    const { error } = await supabase.from('admin_settings').upsert({
      key,
      value: strVal,
      category,
      is_secret: isSecret,
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' });
    if (error) throw new Error(`Failed to save setting "${key}": ${error.message}`);
  },

  async getImpersonationToken(userId: string): Promise<string> {
    return `impersonate-${userId}-${Date.now()}`;
  },

  // SabiGuard & Moat Data
  async getSabiGuardMessages(chatId: string): Promise<SabiGuardMessage[]> {
    const { data } = await supabase
      .from('sabiguard_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    return (data || []).map((m: any) => ({
      id: m.id,
      chatId: m.chat_id,
      userId: m.user_id,
      role: m.role,
      content: m.content,
      timestamp: new Date(m.created_at),
      createdAt: new Date(m.created_at)
    }));
  },

  async addSabiGuardMessage(chatId: string, role: 'user' | 'ai', content: string): Promise<void> {
    await supabase.from('sabiguard_messages').insert({
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      chat_id: chatId,
      role,
      content,
      created_at: new Date().toISOString()
    });
  },

  async updateChatStorageUsed(userId: string, bytes: number): Promise<void> {
    // bytes is a delta (negative when chats are deleted)
    const { data } = await supabase.from('profiles').select('chat_storage_used').eq('id', userId).maybeSingle();
    const next = Math.max(0, (data?.chat_storage_used || 0) + bytes);
    await supabase.from('profiles').update({ chat_storage_used: next }).eq('id', userId);
  },

  async getMoatData(category?: string): Promise<any[]> {
    let q = supabase.from('moat_data').select('*');
    if (category) q = q.eq('category', category);
    const { data } = await q;
    return (data || []).map((d: any) => ({
      id: d.id,
      title: d.title,
      content: d.content,
      category: d.category,
      source: d.source,
      metadata: d.metadata,
      createdAt: new Date(d.created_at)
    }));
  },

  async createMoatData(data: any): Promise<any> {
    const id = `moat-${Date.now()}`;
    const item = { id, ...data, created_at: new Date().toISOString() };
    await supabase.from('moat_data').insert(item);
    return item;
  },

  async deleteMoatData(id: string): Promise<void> {
    await supabase.from('moat_data').delete().eq('id', id);
  },

  // Professionals & Marketplace
  async getProfessionals(filters?: { status?: string; role?: string; city?: string; verified?: boolean }): Promise<Professional[]> {
    let q = supabase.from('professionals').select('*');
    if (filters?.status) q = q.eq('status', filters.status);
    if (filters?.role) q = q.eq('role', filters.role);
    if (filters?.verified !== undefined) q = q.eq('verified', filters.verified);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map((p: any) => {
      const loc = p.location || {};
      const lat = p.latitude ?? loc.latitude;
      const lon = p.longitude ?? loc.longitude;
      return {
        id: p.id,
        userId: p.user_id,
        displayName: p.display_name,
        email: p.email,
        phoneNumber: p.phone_number,
        role: p.role,
        specializations: Array.isArray(p.specializations) ? p.specializations : [],
        status: p.status,
        verified: !!p.verified,
        credentials: p.credentials || {},
        location: {
          ...loc,
          latitude: lat,
          longitude: lon
        },
        wallet: { NGN: 0, USD: 0, credits: 0, updatedAt: new Date() },
        rating: p.rating !== null && p.rating !== undefined ? Number(p.rating) : undefined,
        reviewCount: p.review_count || 0,
        publicProfile: p.public_profile || {},
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at)
      };
    });
  },

  async getProfessionalById(professionalId: string): Promise<Professional | null> {
    const { data, error } = await supabase.from('professionals').select('*').eq('id', professionalId).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      id: data.id,
      userId: data.user_id,
      displayName: data.display_name,
      email: data.email,
      phoneNumber: data.phone_number,
      role: data.role,
      specializations: Array.isArray(data.specializations) ? data.specializations : [],
      status: data.status,
      verified: !!data.verified,
      credentials: data.credentials || {},
      location: data.location || {},
      wallet: { NGN: 0, USD: 0, credits: 0, updatedAt: new Date() },
      rating: data.rating !== null && data.rating !== undefined ? Number(data.rating) : undefined,
      reviewCount: data.review_count || 0,
      publicProfile: data.public_profile || {},
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },

  async createProfessional(data: Omit<Professional, 'id' | 'createdAt' | 'updatedAt'>): Promise<Professional> {
    const id = `pro-${Date.now()}`;
    const newPro = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
    await supabase.from('professionals').insert({
      id,
      user_id: data.userId,
      display_name: data.displayName,
      email: data.email,
      phone_number: data.phoneNumber,
      role: data.role,
      specializations: data.specializations,
      status: data.status,
      verified: data.verified,
      credentials: data.credentials,
      location: data.location,
      public_profile: data.publicProfile
    });
    return newPro as Professional;
  },

  async updateProfessional(professionalId: string, updates: Partial<Professional>): Promise<void> {
    const payload: any = { updated_at: new Date().toISOString() };
    if (updates.displayName !== undefined) payload.display_name = updates.displayName;
    if (updates.verified !== undefined) payload.verified = updates.verified;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.specializations !== undefined) payload.specializations = updates.specializations;
    await supabase.from('professionals').update(payload).eq('id', professionalId);
  },

  async getProfessionalServices(filters: { professionalId?: string; type?: string; city?: string }): Promise<any[]> {
    return this.getVendorServices(filters as any);
  },

  async createProfessionalService(service: any): Promise<any> {
    return this.createVendorService(service);
  },

  async getProfessionalServiceById(serviceId: string): Promise<any | null> {
    return this.getVendorServiceById(serviceId);
  },

  async updateProfessionalService(serviceId: string, updates: any): Promise<void> {
    return this.updateVendorService(serviceId, updates);
  },

  async deleteProfessionalService(serviceId: string): Promise<void> {
    await this.deleteVendorService(serviceId);
  },

  async getVendorServices(filters?: { vendorId?: string; type?: string; city?: string }): Promise<VendorService[]> {
    let q = supabase.from('vendor_services').select('*');
    if (filters?.vendorId) q = q.eq('professional_id', filters.vendorId);
    if (filters?.type) q = q.eq('type', filters.type);
    const { data } = await q;
    return (data || []).map((s: any) => ({
      id: s.id,
      professionalId: s.professional_id,
      vendorId: s.professional_id,
      name: s.name,
      type: s.type,
      specialization: s.specialization,
      description: s.description,
      location: s.location,
      latitude: s.latitude,
      longitude: s.longitude,
      contactPhone: s.contact_phone,
      contactEmail: s.contact_email,
      priceRange: s.price_range,
      priceList: s.price_list || [],
      verified: !!s.verified,
      rating: s.rating || '5.0',
      createdAt: new Date(s.created_at)
    } as any));
  },

  async getVendorServiceById(serviceId: string): Promise<VendorService | null> {
    const { data } = await supabase.from('vendor_services').select('*').eq('id', serviceId).maybeSingle();
    if (!data) return null;
    return {
      id: data.id,
      professionalId: data.professional_id,
      vendorId: data.professional_id,
      name: data.name,
      type: data.type,
      specialization: data.specialization,
      description: data.description,
      location: data.location,
      priceRange: data.price_range,
      verified: !!data.verified,
      createdAt: new Date(data.created_at)
    } as any;
  },

  async getAllVendorServices(): Promise<any[]> {
    return this.getVendorServices();
  },

  async createVendorService(service: any): Promise<any> {
    const id = `vs-${Date.now()}`;
    const newService = { id, createdAt: new Date(), ...service };
    await supabase.from('vendor_services').insert({
      id,
      professional_id: service.professionalId || service.vendorId,
      name: service.name,
      type: service.type,
      specialization: service.specialization,
      description: service.description,
      location: service.location,
      contact_phone: service.contactPhone,
      contact_email: service.contactEmail,
      price_range: service.priceRange
    });
    return newService;
  },

  async updateVendorService(id: string, updates: any): Promise<void> {
    await supabase.from('vendor_services').update(updates).eq('id', id);
  },

  async deleteVendorService(id: string): Promise<boolean> {
    const { error } = await supabase.from('vendor_services').delete().eq('id', id);
    return !error;
  },

  async approveVendorService(id: string): Promise<void> {
    await supabase.from('vendor_services').update({ verified: true }).eq('id', id);
  },

  async rejectVendorService(id: string): Promise<void> {
    await supabase.from('vendor_services').update({ verified: false }).eq('id', id);
  },

  async getAllVendorApplications(): Promise<VendorApplication[]> {
    const { data } = await supabase.from('vendor_applications').select('*').order('submitted_at', { ascending: false });
    return (data || []).map((a: any) => ({
      id: a.id,
      userId: a.user_id,
      businessName: a.business_name,
      serviceType: a.service_type,
      status: a.status,
      businessDocument: a.business_document,
      taxId: a.tax_id,
      createdAt: a.created_at ? new Date(a.created_at) : new Date(a.submitted_at || Date.now())
    }));
  },

  async submitVendorApplication(userId: string, application: any): Promise<any> {
    const id = `va-${Date.now()}`;
    const newApp = {
      id,
      user_id: userId,
      business_name: application.businessName,
      service_type: application.serviceType,
      credentials: application.credentials || [],
      status: 'pending',
      notes: application.notes,
      business_document: application.businessDocument,
      tax_id: application.taxId,
      submitted_at: new Date().toISOString()
    };
    await supabase.from('vendor_applications').insert(newApp);
    return { id, userId, ...application, status: 'pending', createdAt: new Date() };
  },

  async updateVendorApplication(id: string, updates: any): Promise<void> {
    await supabase.from('vendor_applications').update(updates).eq('id', id);
  },

  async approveVendorApplication(id: string, notes?: string): Promise<void> {
    const { data: app } = await supabase.from('vendor_applications').select('*').eq('id', id).maybeSingle();
    if (!app) return;
    await supabase.from('vendor_applications').update({ status: 'approved', notes, reviewed_at: new Date().toISOString() }).eq('id', id);
    await supabase.from('profiles').update({ is_vendor: true, vendor_mode: true }).eq('id', app.user_id);
    await supabase.from('professionals').upsert({
      id: `pro-${app.user_id}`,
      user_id: app.user_id,
      display_name: app.business_name,
      role: app.role || 'lawyer',
      specializations: [app.service_type],
      status: 'active',
      verified: true
    }, { onConflict: 'user_id' });
  },

  async rejectVendorApplication(id: string, notes?: string): Promise<void> {
    await supabase.from('vendor_applications').update({ status: 'rejected', notes, reviewed_at: new Date().toISOString() }).eq('id', id);
  },

  // Direct Bookings & Pre-Case Files (Lean B2C/B2B Model)
  async createBooking(data: any): Promise<any> {
    const id = `bk-${Date.now()}`;
    const newBk = {
      id,
      user_id: data.userId,
      vendor_id: data.vendorId,
      service_id: data.serviceId || null,
      title: data.title || 'Legal Consultation',
      description: data.description || '',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await supabase.from('direct_bookings').insert(newBk);
    return { id, ...data, status: 'pending', createdAt: new Date() };
  },

  async getBookingsByUserId(userId: string): Promise<any[]> {
    const { data } = await supabase
      .from('direct_bookings')
      .select('*')
      .or(`user_id.eq.${userId},vendor_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    return (data || []).map((b: any) => ({
      id: b.id,
      userId: b.user_id,
      vendorId: b.vendor_id,
      serviceId: b.service_id,
      title: b.title,
      description: b.description,
      status: b.status,
      agreedFee: b.agreed_fee,
      createdAt: new Date(b.created_at)
    }));
  },

  async getBookingById(bookingId: string): Promise<any | null> {
    const { data } = await supabase
      .from('direct_bookings')
      .select('*, pre_case_files(*)')
      .eq('id', bookingId)
      .maybeSingle();
    if (!data) return null;
    return {
      id: data.id,
      userId: data.user_id,
      vendorId: data.vendor_id,
      serviceId: data.service_id,
      title: data.title,
      description: data.description,
      status: data.status,
      agreedFee: data.agreed_fee,
      contactPhone: data.contact_phone,
      channel: data.channel,
      caseFile: data.pre_case_files,
      createdAt: new Date(data.created_at)
    };
  },

  async getBookingDetails(id: string): Promise<any | null> {
    return await this.getBookingById(id);
  },

  async getVendorLeads(vendorId: string): Promise<any[]> {
    const { data } = await supabase
      .from('direct_bookings')
      .select('*, pre_case_files(*)')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });

    if (!data) return [];
    return data.map((b: any) => ({
      id: b.id,
      vendorId: b.vendor_id,
      customerId: b.user_id,
      customerName: b.title || 'Civic Client',
      customerPhone: b.contact_phone || '',
      serviceType: b.service_id || 'Legal Consultation',
      message: b.description || b.pre_case_files?.issue_summary || 'Legal counsel requested',
      status: b.status || 'new',
      caseFile: b.pre_case_files || null,
      channel: b.channel || 'web',
      createdAt: b.created_at
    }));
  },

  async createVendorLead(lead: any): Promise<any> {
    const id = `bk-${Date.now()}`;
    await supabase.from('direct_bookings').insert({
      id,
      user_id: lead.customerId || lead.userId,
      vendor_id: lead.vendorId,
      title: lead.customerName ? `Lead: ${lead.customerName}` : 'Legal Lead',
      description: lead.message,
      contact_phone: lead.customerPhone,
      status: 'pending',
      created_at: new Date().toISOString()
    });
    return { id, ...lead, createdAt: new Date() };
  },

  async getBookingsByVendorId(vendorId: string): Promise<any[]> {
    return await this.getVendorLeads(vendorId);
  },

  async createVendorBooking(booking: any): Promise<any> {
    return await this.createBooking(booking);
  },

  async updateVendorBooking(bookingId: string, updates: any): Promise<void> {
    await this.updateBookingStatus(bookingId, updates.status || 'confirmed');
  },

  async getPreCaseFile(caseFileId: string): Promise<any | null> {
    const { data } = await supabase.from('pre_case_files').select('*').eq('id', caseFileId).maybeSingle();
    return data || null;
  },

  async getPreCaseFilesByUserId(userId: string): Promise<any[]> {
    const { data } = await supabase.from('pre_case_files').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return data || [];
  },

  async updateBookingStatus(id: string, status: string): Promise<void> {
    await supabase.from('direct_bookings').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  },

  async createBookingMessage(data: { bookingId: string; senderId: string; message: string; attachments?: any[]; isAdminMessage: boolean }): Promise<any> {
    const id = `bm-${Date.now()}`;
    await supabase.from('direct_booking_messages').insert({
      id,
      booking_id: data.bookingId,
      sender_id: data.senderId,
      message: data.message,
      attachments: data.attachments || [],
      is_admin_message: data.isAdminMessage || false,
      created_at: new Date().toISOString()
    });
    return { id, ...data, createdAt: new Date() };
  },

  async getBookingMessages(bookingId: string, limit?: number): Promise<any[]> {
    let q = supabase
      .from('direct_booking_messages')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });
    if (limit) q = q.limit(limit);
    const { data } = await q;
    return (data || []).map((m: any) => ({
      id: m.id,
      bookingId: m.booking_id,
      senderId: m.sender_id,
      message: m.message,
      attachments: m.attachments || [],
      isAdminMessage: m.is_admin_message,
      createdAt: new Date(m.created_at)
    }));
  },

  async getContractByBookingId(bookingId: string): Promise<any | null> { return null; },
  async createContract(data: any): Promise<any> { return { id: `ct-${Date.now()}`, ...data }; },
  async signContract(bookingId: string, signerType: 'user' | 'vendor'): Promise<any> { return { success: true }; },
  async getDisputes(): Promise<any[]> { return []; },
  async getDisputeByBookingId(bookingId: string): Promise<any | null> { return null; },
  async getDisputeById(id: string): Promise<any | null> { return null; },
  async createDispute(data: any): Promise<any> { return { id: `dp-${Date.now()}`, ...data, status: 'resolved' }; },
  async resolveDispute(id: string, resolution: string, notes: string, adminId: string): Promise<any> { return { success: true }; },
  async joinDispute(id: string, adminId: string): Promise<any> { return { success: true }; },

  // Civic Content & Forum
  async getFaqs(): Promise<Faq[]> {
    const { data } = await supabase.from('faqs').select('*').order('sort_order', { ascending: true });
    return (data || []).map((f: any) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
      category: f.category || 'general',
      isActive: !!f.is_active,
      order: f.sort_order || 1,
      createdAt: new Date(f.created_at)
    }));
  },

  async createFaq(faq: any): Promise<Faq> {
    const id = `faq-${Date.now()}`;
    const item = { id, question: faq.question, answer: faq.answer, category: faq.category || 'general', is_active: true };
    await supabase.from('faqs').insert(item);
    return { id, ...faq, isActive: true, createdAt: new Date() };
  },

  async updateFaq(id: string, updates: any): Promise<Faq | null> {
    await supabase.from('faqs').update(updates).eq('id', id);
    const faqs = await this.getFaqs();
    return faqs.find(f => f.id === id) || null;
  },

  async deleteFaq(id: string): Promise<boolean> {
    const { error } = await supabase.from('faqs').delete().eq('id', id);
    return !error;
  },

  async getTestimonials(): Promise<Testimonial[]> {
    const { data } = await supabase.from('testimonials').select('*');
    return (data || []).map((t: any) => ({
      id: t.id,
      author: t.author || t.name || 'Anonymous',
      name: t.name,
      role: t.role,
      content: t.content,
      rating: t.rating || 5,
      isActive: !!t.is_active,
      createdAt: new Date(t.created_at)
    }));
  },

  async createTestimonial(testimonial: any): Promise<Testimonial> {
    const id = `testi-${Date.now()}`;
    await supabase.from('testimonials').insert({ id, ...testimonial, is_active: true });
    return { id, ...testimonial, isActive: true, createdAt: new Date() };
  },

  async updateTestimonial(id: string, updates: any): Promise<null> {
    await supabase.from('testimonials').update(updates).eq('id', id);
    return null;
  },

  async deleteTestimonial(id: string): Promise<boolean> {
    const { error } = await supabase.from('testimonials').delete().eq('id', id);
    return !error;
  },

  async getForumPosts(): Promise<ForumPost[]> {
    const { data } = await supabase.from('forum_posts').select('*').order('created_at', { ascending: false });
    return (data || []).map((p: any) => ({
      id: p.id,
      userId: p.user_id,
      authorName: p.author_name,
      title: p.title,
      content: p.content,
      category: p.category,
      city: p.city,
      upvotes: p.upvotes || 0,
      downvotes: p.downvotes || 0,
      comments: p.comments || [],
      createdAt: new Date(p.created_at)
    }));
  },

  async getForumPost(postId: string): Promise<ForumPost | null> {
    const { data } = await supabase.from('forum_posts').select('*').eq('id', postId).maybeSingle();
    if (!data) return null;
    return {
      id: data.id,
      userId: data.user_id,
      authorName: data.author_name,
      title: data.title,
      content: data.content,
      category: data.category,
      city: data.city,
      upvotes: data.upvotes || 0,
      downvotes: data.downvotes || 0,
      comments: data.comments || [],
      createdAt: new Date(data.created_at)
    };
  },

  async createForumPost(post: any): Promise<ForumPost> {
    const id = `fp-${Date.now()}`;
    const newPost = { id, ...post, created_at: new Date().toISOString() };
    await supabase.from('forum_posts').insert({
      id,
      user_id: post.userId,
      author_name: post.authorName,
      title: post.title,
      content: post.content,
      category: post.category,
      city: post.city
    });
    return newPost as ForumPost;
  },

  async updateForumPost(postId: string, updates: any): Promise<void> {
    await supabase.from('forum_posts').update(updates).eq('id', postId);
  },

  async deleteForumPost(postId: string): Promise<void> {
    await supabase.from('forum_posts').delete().eq('id', postId);
  },

  async addForumComment(postId: string, comment: any): Promise<any> {
    const post = await this.getForumPost(postId);
    const comments = post?.comments || [];
    comments.push(comment);
    await supabase.from('forum_posts').update({ comments }).eq('id', postId);
    return comment;
  },

  async deleteForumComment(postId: string, commentId: string): Promise<void> {},
  async voteForumPost(postId: string, userId: string, type: 'up' | 'down'): Promise<void> {
    const post = await this.getForumPost(postId);
    if (!post) return;
    if (type === 'up') {
      await supabase.from('forum_posts').update({ upvotes: (post.upvotes || 0) + 1 }).eq('id', postId);
    } else {
      await supabase.from('forum_posts').update({ downvotes: (post.downvotes || 0) + 1 }).eq('id', postId);
    }
  },
  async voteForumComment(postId: string, commentId: string, userId: string): Promise<void> {},

  // Events & Jobs
  async getEvents(): Promise<Event[]> {
    const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false });
    return (data || []).map((e: any) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      date: e.date,
      time: e.time,
      location: e.location,
      city: e.city,
      category: e.category,
      organizer: e.organizer,
      organizerId: e.organizer_id,
      maxAttendees: e.max_attendees,
      attendees: e.attendees || [],
      createdAt: new Date(e.created_at)
    }));
  },

  async createEvent(event: any): Promise<Event> {
    const id = `ev-${Date.now()}`;
    const newEv = { id, ...event, created_at: new Date().toISOString() };
    await supabase.from('events').insert({
      id,
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      city: event.city,
      category: event.category,
      organizer: event.organizer,
      organizer_id: event.organizerId
    });
    return newEv as Event;
  },

  async registerForEvent(eventId: string, userId: string): Promise<void> {
    await supabase.from('saved_events').upsert({ user_id: userId, event_id: eventId }, { onConflict: 'user_id,event_id' });
  },
  async deleteEvent(eventId: string): Promise<void> {
    await supabase.from('events').delete().eq('id', eventId);
  },
  async saveEvent(userId: string, eventId: string): Promise<void> {
    await supabase.from('saved_events').upsert({ user_id: userId, event_id: eventId }, { onConflict: 'user_id,event_id' });
  },
  async unsaveEvent(userId: string, eventId: string): Promise<void> {
    await supabase.from('saved_events').delete().eq('user_id', userId).eq('event_id', eventId);
  },
  async getSavedEvents(userId: string): Promise<any[]> {
    const { data } = await supabase.from('saved_events').select('*, events(*)').eq('user_id', userId);
    return (data || []).map((d: any) => d.events).filter(Boolean);
  },

  async getJobs(limitOrCity?: number | string): Promise<Job[]> {
    let q = supabase.from('jobs').select('*');
    if (typeof limitOrCity === 'string') {
      q = q.eq('city', limitOrCity);
    } else if (typeof limitOrCity === 'number') {
      q = q.limit(limitOrCity);
    }
    const { data } = await q;
    return (data || []).map((j: any) => ({
      id: j.id,
      title: j.title,
      company: j.company,
      location: j.location,
      city: j.city,
      type: j.type,
      description: j.description,
      requirements: j.requirements || [],
      salary: j.salary,
      contactEmail: j.contact_email,
      createdAt: new Date(j.created_at)
    }));
  },

  async getJobById(jobId: string): Promise<Job | null> {
    const { data } = await supabase.from('jobs').select('*').eq('id', jobId).maybeSingle();
    if (!data) return null;
    return {
      id: data.id,
      title: data.title,
      company: data.company,
      location: data.location,
      city: data.city,
      type: data.type,
      description: data.description,
      requirements: data.requirements || [],
      salary: data.salary,
      contactEmail: data.contact_email,
      createdAt: new Date(data.created_at)
    };
  },

  async createJob(job: any): Promise<Job> {
    const id = `job-${Date.now()}`;
    const newJob = { id, ...job, created_at: new Date().toISOString() };
    await supabase.from('jobs').insert({
      id,
      title: job.title,
      company: job.company,
      location: job.location,
      city: job.city,
      type: job.type,
      description: job.description,
      requirements: job.requirements || [],
      salary: job.salary,
      contact_email: job.contactEmail
    });
    return newJob as Job;
  },

  async updateJob(jobId: string, updates: any): Promise<void> {
    await supabase.from('jobs').update(updates).eq('id', jobId);
  },

  async deleteJob(jobId: string): Promise<void> {
    await supabase.from('jobs').delete().eq('id', jobId);
  },

  async getGeneratedJobs(userId: string): Promise<Job[]> { return []; },
  async createGeneratedJob(job: any): Promise<Job> { return { id: `gen-${Date.now()}`, ...job }; },
  async deleteGeneratedJob(id: string): Promise<void> {},
  async cleanupOldGeneratedJobs(olderThanHours?: number): Promise<number> { return 0; },

  async saveJob(userId: string, jobId: string): Promise<void> {
    await supabase.from('saved_jobs').upsert({ user_id: userId, job_id: jobId }, { onConflict: 'user_id,job_id' });
  },
  async unsaveJob(userId: string, jobId: string): Promise<void> {
    await supabase.from('saved_jobs').delete().eq('user_id', userId).eq('job_id', jobId);
  },
  async getSavedJobs(userId: string): Promise<Job[]> {
    const { data } = await supabase.from('saved_jobs').select('*, jobs(*)').eq('user_id', userId);
    return (data || []).map((d: any) => d.jobs).filter(Boolean);
  },
  async getSavedJobIds(userId: string): Promise<string[]> {
    const { data } = await supabase.from('saved_jobs').select('job_id').eq('user_id', userId);
    return (data || []).map((d: any) => d.job_id);
  },
  async applyToJob(userId: string, jobId: string): Promise<any> {
    await supabase.from('applied_jobs').upsert({ user_id: userId, job_id: jobId, status: 'applied', applied_at: new Date().toISOString() }, { onConflict: 'user_id,job_id' });
    return { success: true };
  },
  async getAppliedJobs(userId: string): Promise<Job[]> {
    const { data } = await supabase.from('applied_jobs').select('*, jobs(*)').eq('user_id', userId);
    return (data || []).map((d: any) => d.jobs).filter(Boolean);
  },
  async getAppliedJobIds(userId: string): Promise<string[]> {
    const { data } = await supabase.from('applied_jobs').select('job_id').eq('user_id', userId);
    return (data || []).map((d: any) => d.job_id);
  },

  async updateDashboardTraffic(userId: string, location: string, status: string, description: string): Promise<void> {
    await supabase.from('dashboard_traffic').upsert({
      user_id: userId,
      location,
      status,
      description,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });
  },
  async getDashboardTraffic(userId: string): Promise<any | null> {
    const { data } = await supabase.from('dashboard_traffic').select('*').eq('user_id', userId).maybeSingle();
    return data || null;
  },

  // SabiGuard Chats & Notifications
  async getSabiGuardChats(userId: string): Promise<any[]> {
    const { data } = await supabase.from('sabiguard_chats').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return (data || []).map((c: any) => ({ id: c.id, userId: c.user_id, title: c.title, createdAt: new Date(c.created_at) }));
  },

  async createSabiGuardChat(userId: string, title: string): Promise<any> {
    const id = `sg-${Date.now()}`;
    await supabase.from('sabiguard_chats').insert({ id, user_id: userId, title, created_at: new Date().toISOString() });
    return { id, userId, title, createdAt: new Date() };
  },

  async getSabiGuardChat(chatId: string): Promise<any | null> {
    const { data } = await supabase.from('sabiguard_chats').select('*').eq('id', chatId).maybeSingle();
    return data ? { id: data.id, userId: data.user_id, title: data.title, createdAt: new Date(data.created_at) } : null;
  },

  async deleteSabiGuardChat(chatId: string): Promise<void> {
    await supabase.from('sabiguard_messages').delete().eq('chat_id', chatId);
    await supabase.from('sabiguard_chats').delete().eq('id', chatId);
  },

  async getNotificationsByUserId(
    userId: string,
    limit = 50,
    offset = 0,
    type?: string
  ): Promise<{ notifications: any[]; totalCount: number }> {
    let q = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false });
    if (type && type !== 'all') q = q.eq('type', type);

    const { data, count, error } = await q.range(offset, offset + limit - 1);
    if (error) throw new Error(`Could not fetch notifications: ${error.message}`);

    const notifications = (data || []).map((n: any) => ({
      id: n.id,
      userId: n.user_id,
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data,
      isRead: !!n.read_at,
      readAt: n.read_at,
      createdAt: n.created_at
    }));
    return { notifications, totalCount: count || 0 };
  },

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null);
    if (error) throw new Error(`Could not fetch unread notification count: ${error.message}`);
    return count || 0;
  },

  async markNotificationAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new Error(`Could not mark notification as read: ${error.message}`);
  },

  async markAllNotificationsAsRead(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null)
      .select('id');
    if (error) throw new Error(`Could not mark notifications as read: ${error.message}`);
    return data?.length || 0;
  },

  async getNotificationById(id: string): Promise<any | null> {
    const { data, error } = await supabase.from('notifications').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(`Could not fetch notification: ${error.message}`);
    if (!data) return null;
    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data,
      isRead: !!data.read_at,
      readAt: data.read_at,
      createdAt: data.created_at
    };
  },

  async sendNotification(n: any): Promise<any> {
    const { sendNotification: dispatchNotification } = await import('./notificationService.js');
    return dispatchNotification(n);
  },

  async createNotification(n: any): Promise<void> {
    const { error } = await supabase.from('notifications').insert({
      id: crypto.randomUUID(),
      user_id: n.userId,
      type: n.type || 'system',
      title: n.title,
      message: n.message,
      data: n.data || {},
      created_at: new Date().toISOString()
    });
    if (error) throw new Error(`Could not persist notification: ${error.message}`);
  },

  // Payment Methods & Wallets
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const { data } = await supabase.from('payment_methods').select('*');
    return (data || []).map((m: any) => ({
      id: m.id,
      name: m.name,
      type: m.type,
      active: !!m.active,
      publicKey: m.public_key,
      secretKey: m.secret_key,
      encryptionKey: m.encryption_key,
      webhookHash: m.webhook_hash,      // used for Flutterwave & Bachs webhook verification
      metadata: m.metadata || {},        // provider-specific config (isSandbox, etc.)
      instructions: m.instructions || '', // shown to users for manual payment methods
      fields: m.fields || [],            // dynamic form fields for manual methods
      description: m.description,
      createdAt: new Date(m.created_at)
    }));
  },

  async getActivePaymentMethods(): Promise<PaymentMethod[]> {
    const methods = await this.getPaymentMethods();
    return methods.filter(m => m.active);
  },

  async createPaymentMethod(data: any): Promise<PaymentMethod> {
    const id = `pm-${Date.now()}`;
    const newPm = { id, ...data, active: true, createdAt: new Date() };
    await supabase.from('payment_methods').insert({
      id,
      name: data.name,
      type: data.type,
      active: true,
      public_key: data.publicKey,
      secret_key: data.secretKey,
      encryption_key: data.encryptionKey,
      webhook_hash: data.webhookHash,
      metadata: data.metadata || {},
      instructions: data.instructions || '',
      fields: data.fields || [],
      description: data.description
    });
    return newPm;
  },

  async updatePaymentMethod(id: string, updates: any): Promise<null> {
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.active !== undefined) payload.active = updates.active;
    if (updates.publicKey !== undefined) payload.public_key = updates.publicKey;
    if (updates.secretKey !== undefined) payload.secret_key = updates.secretKey;
    if (updates.encryptionKey !== undefined) payload.encryption_key = updates.encryptionKey;
    if (updates.webhookHash !== undefined) payload.webhook_hash = updates.webhookHash;
    if (updates.metadata !== undefined) payload.metadata = updates.metadata;
    if (updates.instructions !== undefined) payload.instructions = updates.instructions;
    if (updates.fields !== undefined) payload.fields = updates.fields;
    await supabase.from('payment_methods').update(payload).eq('id', id);
    return null;
  },

  async deletePaymentMethod(id: string): Promise<boolean> {
    const { error } = await supabase.from('payment_methods').delete().eq('id', id);
    return !error;
  },

  _mapPayment(d: any): Payment {
    return {
      id: d.id,
      userId: d.user_id,
      amount: Number(d.amount),
      currency: d.currency,
      provider: d.provider,
      type: d.type,
      status: d.status,
      providerRef: d.provider_ref,
      description: d.description,
      metadata: d.metadata || {},
      createdAt: d.created_at ? new Date(d.created_at) : new Date()
    } as any;
  },

  async getPayments(userId?: string): Promise<Payment[]> {
    let q = supabase.from('payments').select('*').order('created_at', { ascending: false });
    if (userId) q = q.eq('user_id', userId);
    const { data } = await q;
    return (data || []).map((d: any) => this._mapPayment(d));
  },

  async createPayment(payment: any): Promise<Payment> {
    const id = `pay-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const row = {
      id,
      user_id: payment.userId,
      amount: payment.amount,
      currency: payment.currency || 'NGN',
      provider: payment.provider,
      type: payment.type,
      status: 'pending',
      description: payment.description || null,
      metadata: { ...(payment.metadata || {}), reference: payment.metadata?.reference || `PAY-${id}` }
    };
    const { data, error } = await supabase.from('payments').insert(row).select('*').single();
    if (error) throw new Error(`Could not create payment: ${error.message}`);
    return this._mapPayment(data);
  },

  async updatePayment(id: string, updates: any): Promise<void> {
    const patch: any = {};
    if (updates.status !== undefined) patch.status = updates.status;
    if (updates.providerRef !== undefined) patch.provider_ref = updates.providerRef;
    if (updates.metadata !== undefined) patch.metadata = updates.metadata;
    await supabase.from('payments').update(patch).eq('id', id);
  },

  async updatePaymentStatus(id: string, status: any, ref?: string): Promise<void> {
    const patch: any = { status };
    if (ref) patch.provider_ref = ref;
    await supabase.from('payments').update(patch).eq('id', id);
  },

  async getPayment(id: string): Promise<Payment | null> {
    const { data } = await supabase.from('payments').select('*').eq('id', id).maybeSingle();
    return data ? this._mapPayment(data) : null;
  },

  async getPaymentByReference(reference: string): Promise<Payment | null> {
    const { data } = await supabase.from('payments').select('*').eq('provider_ref', reference).maybeSingle();
    if (data) return this._mapPayment(data);
    const { data: byMeta } = await supabase.from('payments').select('*').contains('metadata', { reference }).limit(1).maybeSingle();
    return byMeta ? this._mapPayment(byMeta) : null;
  },

  /**
   * Idempotent fulfillment. The payment row (created server-side) is the source of truth for
   * who pays and what they get; provider data is only used to confirm the amount that was paid.
   */
  async fulfillPayment(paymentId: string, providerRef: string, paidAmount: number): Promise<{ ok: boolean; reason?: string }> {
    const payment = await this.getPayment(paymentId);
    if (!payment) return { ok: false, reason: 'not_found' };
    if (payment.status === 'completed') return { ok: true, reason: 'already_processed' };
    if (Math.round(paidAmount * 100) < Math.round(Number(payment.amount) * 100)) {
      await this.updatePaymentStatus(paymentId, 'failed', providerRef);
      return { ok: false, reason: 'amount_mismatch' };
    }

    // Only one caller can flip pending -> completed; everyone else sees zero rows.
    const { data: claimed, error: claimError } = await supabase
      .from('payments')
      .update({ status: 'completed', provider_ref: providerRef })
      .eq('id', paymentId)
      .neq('status', 'completed')
      .select('id');
    if (claimError) {
      console.error(`Could not mark payment ${paymentId} as completed:`, claimError);
      return { ok: false, reason: 'status_update_failed' };
    }
    if (!claimed || claimed.length === 0) {
      const latestPayment = await this.getPayment(paymentId);
      if (latestPayment?.status === 'completed') return { ok: true, reason: 'already_processed' };
      return { ok: false, reason: 'status_update_failed' };
    }

    const meta: any = payment.metadata || {};
    const userId = (payment as any).userId;
    if (payment.type === 'credit_purchase') {
      const pkg = (await this.getCreditPackages()).find((p: any) => p.id === meta.packageId);
      const credits = pkg ? Number(pkg.credits) + Number(pkg.bonus || 0) : Number(meta.credits || 0);
      if (credits > 0) await this.addCredits(userId, credits, `Credit purchase ${paymentId}`, 'purchase');
    } else if (payment.type === 'subscription' && meta.planId) {
      await this.activatePlan(userId, meta.planId);
    } else if (payment.type === 'wallet_topup') {
      await this.topUpWallet(userId, Number(payment.amount), providerRef, 'Card payment');
    }
    return { ok: true };
  },
  async getWalletByUserId(userId: string): Promise<Wallet | null> {
    const credits = await this.getUserCredits(userId);
    return {
      id: `w-${userId}`,
      userId,
      balance: (credits?.totalCredits || 0) - (credits?.usedCredits || 0),
      currency: 'NGN',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  },
  async createWallet(userId: string, currency: string): Promise<Wallet> {
    return { id: `w-${userId}`, userId, balance: 0, currency, createdAt: new Date(), updatedAt: new Date() };
  },
  async topUpWallet(userId: string, amount: number, reference: string, description: string): Promise<void> {
    await this.addCredits(userId, Math.floor(amount / 10), description);
  },
  async deductFromWallet(userId: string, amount: number, type: string, reference: string, description: string): Promise<void> {
    await this.deductCredits(userId, Math.floor(amount / 10), type, description);
  },
  async getWalletTransactions(userId: string, limit?: number): Promise<any[]> {
    return await this.getCreditLog(userId);
  },

  // Coupons, Surveys, Translations & Push Stubs
  async getAllCoupons(): Promise<any[]> { return []; },
  async getCouponByCode(code: string): Promise<any | null> { return null; },
  async createCoupon(data: any): Promise<any> { return { id: `cp-${Date.now()}`, ...data }; },
  async updateCoupon(id: string, updates: any): Promise<any> { return updates; },
  async deleteCoupon(id: string): Promise<boolean> { return true; },
  async validateCoupon(code: string): Promise<any> { return { valid: false, message: 'Invalid coupon' }; },
  async getSurveys(): Promise<Survey[]> { return []; },
  async createSurvey(survey: any): Promise<Survey> { return { id: `sr-${Date.now()}`, ...survey, createdAt: new Date() }; },
  async getTrainingTerms(): Promise<any[]> { return []; },
  async createTrainingTerm(d: any): Promise<any> { return {}; },
  async deleteTrainingTerm(id: string): Promise<void> {},
  async getAllCrowdTranslations(): Promise<any[]> { return []; },
  async getCrowdTranslationStats(): Promise<any> { return {}; },
  async submitTranslation(d: any): Promise<any> { return {}; },
  async getRandomTranslationForVerification(u: string): Promise<any | null> { return null; },
  async voteTranslation(id: string, v: boolean): Promise<void> {},
  async getVerifiedTranslations(m: number): Promise<any[]> { return []; },
  async getAllNotificationTemplates(): Promise<any[]> {
    const { data, error } = await supabase.from('notification_templates').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(`Could not fetch notification templates: ${error.message}`);
    return (data || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      type: t.type,
      subject: t.subject,
      bodyTemplate: t.body_template,
      channels: t.channels || ['in_app'],
      isActive: t.is_active !== false,
      createdAt: t.created_at,
      updatedAt: t.updated_at
    }));
  },
  async getNotificationTemplateByName(name: string): Promise<any | null> {
    const { data, error } = await supabase.from('notification_templates').select('*').eq('name', name).maybeSingle();
    if (error) throw new Error(`Could not fetch notification template: ${error.message}`);
    if (!data) return null;
    return {
      id: data.id,
      name: data.name,
      type: data.type,
      subject: data.subject,
      bodyTemplate: data.body_template,
      channels: data.channels || ['in_app'],
      isActive: data.is_active !== false,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },
  async createNotificationTemplate(data: any): Promise<any> {
    const id = crypto.randomUUID();
    const row = {
      id,
      name: data.name,
      type: data.type || 'system',
      subject: data.subject,
      body_template: data.bodyTemplate,
      channels: data.channels || ['in_app'],
      is_active: data.isActive !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from('notification_templates').insert(row);
    if (error) throw new Error(`Could not create notification template: ${error.message}`);
    return { ...row, bodyTemplate: row.body_template, isActive: row.is_active };
  },
  async updateNotificationTemplate(id: string, updates: any): Promise<any> {
    const patch: any = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.type !== undefined) patch.type = updates.type;
    if (updates.subject !== undefined) patch.subject = updates.subject;
    if (updates.bodyTemplate !== undefined) patch.body_template = updates.bodyTemplate;
    if (updates.channels !== undefined) patch.channels = updates.channels;
    if (updates.isActive !== undefined) patch.is_active = updates.isActive;
    const { data, error } = await supabase.from('notification_templates').update(patch).eq('id', id).select('id').maybeSingle();
    if (error) throw new Error(`Could not update template: ${error.message}`);
    if (!data) return null;
    return { id, ...updates };
  },
  async deleteNotificationTemplate(id: string): Promise<boolean> {
    const { data, error } = await supabase.from('notification_templates').delete().eq('id', id).select('id');
    if (error) throw new Error(`Could not delete notification template: ${error.message}`);
    return (data?.length || 0) > 0;
  },
  async getSmtpSettings(): Promise<any> {
    const s = await this.getAdminSetting('smtp_config');
    if (!s?.value) return null;
    try {
      return JSON.parse(s.value);
    } catch (error) {
      throw new Error(`Stored SMTP settings are invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
  async updateSmtpSettings(s: any): Promise<any> {
    const existing = await this.getSmtpSettings();
    const incoming = { ...s };
    // Keep the stored password when the client sends a blank or masked one
    if (!incoming.password || /^•+$/.test(String(incoming.password))) {
      if (existing?.password) incoming.password = existing.password;
    }
    await this.setAdminSetting('smtp_config', incoming, 'smtp', true);
    return incoming;
  },
  async getPushSettings(): Promise<any> {
    const s = await this.getAdminSetting('vapid_push_config');
    if (!s?.value) return null;
    try {
      return JSON.parse(s.value);
    } catch (error) {
      throw new Error(`Stored push settings are invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
  async updatePushSettings(s: any): Promise<any> {
    const existing = await this.getPushSettings();
    const incoming = { ...s };
    if (!incoming.privateKey || /^•+$/.test(String(incoming.privateKey)) || !incoming.privateKey.trim()) {
      if (existing?.privateKey) incoming.privateKey = existing.privateKey;
    }
    await this.setAdminSetting('vapid_push_config', incoming, 'push', true);
    return incoming;
  },
  async subscribeToPush(d: any): Promise<any> {
    const row = {
      id: crypto.randomUUID(),
      user_id: d.userId,
      provider: d.provider || 'webpush',
      endpoint: d.endpoint,
      p256dh: d.keys?.p256dh,
      auth: d.keys?.auth,
      created_at: new Date().toISOString()
    };
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert(row, { onConflict: 'user_id,provider,endpoint' })
      .select('*')
      .single();
    if (error) throw new Error(`Could not save push subscription: ${error.message}`);
    return {
      id: data.id,
      userId: data.user_id,
      provider: data.provider,
      endpoint: data.endpoint,
      keys: { p256dh: data.p256dh, auth: data.auth },
      createdAt: data.created_at
    };
  },
  async unsubscribeFromPush(
    userId: string,
    endpoint: string,
    provider: 'webpush' | 'expo' = 'webpush'
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('endpoint', endpoint)
      .select('id');
    if (error) throw new Error(`Could not remove push subscription: ${error.message}`);
    return (data?.length || 0) > 0;
  },
  async getPushSubscriptions(userId: string): Promise<any[]> {
    const { data, error } = await supabase.from('push_subscriptions').select('*').eq('user_id', userId);
    if (error) throw new Error(`Could not fetch push subscriptions: ${error.message}`);
    return (data || []).map((s: any) => ({
      id: s.id,
      userId: s.user_id,
      provider: s.provider || 'webpush',
      endpoint: s.endpoint,
      keys: { p256dh: s.p256dh, auth: s.auth },
      createdAt: s.created_at
    }));
  },

  // Email Verification Codes
  async setEmailVerificationCode(userId: string, email: string, codeHash: string, expires: Date): Promise<boolean> {
    const { data, error } = await supabase.rpc('issue_email_verification_code', {
      p_id: crypto.randomUUID(),
      p_user_id: userId,
      p_email: email,
      p_code_hash: codeHash,
      p_expires_at: expires.toISOString()
    });
    if (error) throw new Error(`Could not issue email verification code: ${error.message}`);
    return data === true;
  },
  async verifyEmailCode(userId: string, codeHash: string): Promise<string | null> {
    const { data, error } = await supabase.rpc('consume_email_verification_code', {
      p_user_id: userId,
      p_code_hash: codeHash
    });
    if (error) throw new Error(`Could not verify email code: ${error.message}`);
    return typeof data === 'string' ? data : null;
  },
  async clearEmailVerificationCode(userId: string): Promise<void> {
    const { error } = await supabase.from('email_verification_codes').delete().eq('user_id', userId);
    if (error) throw new Error(`Could not clear email verification code: ${error.message}`);
  },
  async sendEmailNotification(payload: any, profile?: any): Promise<any> {
    const { sendNotification: dispatchNotification } = await import('./notificationService.js');
    return await dispatchNotification({
      userId: payload.userId,
      type: payload.type || 'email',
      title: payload.title,
      message: payload.message,
      templateName: payload.templateName,
      variables: payload.variables,
      channels: ['email'],
      recipientEmail: payload.recipientEmail || profile?.email
    });
  },

  // SabiMove Routes & Traffic Alerts
  async getUserRoutes(userId: string): Promise<Route[]> {
    try {
      const { data, error } = await supabase.from('routes').select('*').eq('user_id', userId);
      if (!error && data && data.length > 0) {
        return data.map((r: any) => ({
          id: r.id,
          userId: r.user_id,
          routeName: r.route_name || r.routeName,
          startLocation: r.start_location || r.startLocation,
          endLocation: r.end_location || r.endLocation,
          startLat: Number(r.start_lat ?? r.startLat ?? 6.5244),
          startLng: Number(r.start_lng ?? r.startLng ?? 3.3792),
          endLat: Number(r.end_lat ?? r.endLat ?? 6.5244),
          endLng: Number(r.end_lng ?? r.endLng ?? 3.3792),
          status: r.status || 'unknown',
          recommendation: r.recommendation,
          cloakedStreets: r.cloaked_streets || r.cloakedStreets || [],
          createdAt: new Date(r.created_at || r.createdAt)
        }));
      }
    } catch {}
    const routes = loadLocalRoutes();
    return routes.filter(r => r.userId === userId);
  },

  async createRoute(route: Omit<Route, 'id' | 'createdAt'>): Promise<Route> {
    const newRoute: Route = {
      ...route,
      id: `route-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date(),
      status: route.status || 'unknown'
    };
    try {
      await supabase.from('routes').insert({
        id: newRoute.id,
        user_id: newRoute.userId,
        route_name: newRoute.routeName,
        start_location: newRoute.startLocation,
        end_location: newRoute.endLocation,
        start_lat: newRoute.startLat,
        start_lng: newRoute.startLng,
        end_lat: newRoute.endLat,
        end_lng: newRoute.endLng,
        status: newRoute.status,
        created_at: newRoute.createdAt.toISOString()
      });
    } catch {}
    const routes = loadLocalRoutes();
    routes.push(newRoute);
    saveLocalRoutes(routes);
    return newRoute;
  },

  async getRoute(routeId: string): Promise<Route | null> {
    try {
      const { data, error } = await supabase.from('routes').select('*').eq('id', routeId).maybeSingle();
      if (!error && data) {
        return {
          id: data.id,
          userId: data.user_id,
          routeName: data.route_name || data.routeName,
          startLocation: data.start_location || data.startLocation,
          endLocation: data.end_location || data.endLocation,
          startLat: Number(data.start_lat ?? data.startLat ?? 6.5244),
          startLng: Number(data.start_lng ?? data.startLng ?? 3.3792),
          endLat: Number(data.end_lat ?? data.endLat ?? 6.5244),
          endLng: Number(data.end_lng ?? data.endLng ?? 3.3792),
          status: data.status || 'unknown',
          recommendation: data.recommendation,
          cloakedStreets: data.cloaked_streets || data.cloakedStreets || [],
          createdAt: new Date(data.created_at || data.createdAt)
        };
      }
    } catch {}
    const routes = loadLocalRoutes();
    return routes.find(r => r.id === routeId) || null;
  },

  async updateRouteStatus(routeId: string, status: string, recommendation?: string, cloakedStreets?: string[]): Promise<void> {
    try {
      await supabase.from('routes').update({
        status,
        recommendation,
        cloaked_streets: cloakedStreets,
        updated_at: new Date().toISOString()
      }).eq('id', routeId);
    } catch {}
    const routes = loadLocalRoutes();
    const idx = routes.findIndex(r => r.id === routeId);
    if (idx !== -1) {
      routes[idx].status = status as any;
      if (recommendation !== undefined) routes[idx].recommendation = recommendation;
      if (cloakedStreets !== undefined) routes[idx].cloakedStreets = cloakedStreets;
      saveLocalRoutes(routes);
    }
  },

  async deleteRoute(routeId: string): Promise<void> {
    try {
      await supabase.from('routes').delete().eq('id', routeId);
    } catch {}
    const routes = loadLocalRoutes();
    const filtered = routes.filter(r => r.id !== routeId);
    saveLocalRoutes(filtered);
  },

  async getRouteAlerts(routeId: string): Promise<Alert[]> {
    try {
      const { data, error } = await supabase.from('alerts').select('*').eq('route_id', routeId);
      if (!error && data && data.length > 0) {
        return data.map((a: any) => ({
          id: a.id,
          routeId: a.route_id,
          userId: a.user_id,
          alertType: a.alert_type,
          message: a.message,
          severity: a.severity,
          createdAt: new Date(a.created_at),
          acknowledged: !!a.acknowledged
        }));
      }
    } catch {}
    const alerts = loadLocalAlerts();
    return alerts.filter(a => a.routeId === routeId);
  },

  async createAlert(alert: Omit<Alert, 'id' | 'createdAt' | 'acknowledged'>): Promise<Alert> {
    const newAlert: Alert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date(),
      acknowledged: false
    };
    try {
      await supabase.from('alerts').insert({
        id: newAlert.id,
        route_id: newAlert.routeId,
        user_id: newAlert.userId,
        alert_type: newAlert.alertType,
        message: newAlert.message,
        severity: newAlert.severity,
        acknowledged: false,
        created_at: newAlert.createdAt.toISOString()
      });
    } catch {}
    const alerts = loadLocalAlerts();
    alerts.push(newAlert);
    saveLocalAlerts(alerts);
    return newAlert;
  },

  async acknowledgeAlert(alertId: string): Promise<void> {
    try {
      await supabase.from('alerts').update({ acknowledged: true }).eq('id', alertId);
    } catch {}
    const alerts = loadLocalAlerts();
    const alert = alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      saveLocalAlerts(alerts);
    }
  }
};

export const APP_ID = process.env.APP_ID || "sabiright-core";

export async function verifyUserToken(token: string): Promise<AuthResult> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return { valid: false, error: 'invalid_token' };
    return { valid: true, userId: user.id };
  } catch (error) {
    return { valid: false, error: 'invalid_token' };
  }
}

export async function verifyAdminToken(token: string): Promise<AuthResult> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return { valid: false, error: 'invalid_token' };
    const flags = await getSupabaseUserFlags(user.id);
    if (!flags.isAdmin) return { valid: false, error: 'not_admin' };
    return { valid: true, userId: user.id, isAdmin: true };
  } catch (error) {
    return { valid: false, error: 'invalid_token' };
  }
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  const flags = await getSupabaseUserFlags(userId);
  return flags.isAdmin;
}

export async function getSupabaseUserFlags(userId: string): Promise<{ isAdmin: boolean; isVendor: boolean }> {
  const profile = await supabaseStorage.getUserProfile(userId);
  if (!profile) return { isAdmin: false, isVendor: false };
  return { isAdmin: !!profile.isAdmin, isVendor: !!profile.isVendor };
}

export const getUserFlags = getSupabaseUserFlags;
export const storage = supabaseStorage;
