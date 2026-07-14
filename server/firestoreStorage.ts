import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import type { 
  IFirestoreStorage, UserProfile, UserCredits, AdminSetting, 
  VendorService, Professional, ProfessionalCredentials, ProfessionalLocation, ProfessionalWallet, ProfessionalApplication, ProfessionalService, MoatData, UserPlan, CreditPackage, Route, 
  Alert, Event, Job, PaymentMethod, Payment, Subscription, 
  VendorApplication, VendorLead, ForumPost, Survey, Wallet, 
  SabiGuardMessage, Faq, Testimonial, AuthResult 
} from "./types.d.ts";

export const FIREBASE_APP_ID = process.env.FIREBASE_APP_ID || "legal-13d13";

// Ensure Firebase is initialized with robust fallbacks
const serviceAccountPath = path.join(process.cwd(), 'legal-13d13-firebase-adminsdk-fbsvc-e736182a52.json');
if (admin.apps.length === 0) {
  let initialized = false;

  // Stage 1: Local file
  if (fs.existsSync(serviceAccountPath)) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'legal-13d13'
      });
      admin.firestore().settings({ ignoreUndefinedProperties: true });
      console.log("[firestoreStorage] Firebase Admin initialized with service account.");
      initialized = true;
    } catch (err) {
      console.error("[firestoreStorage] Failed to initialize via local service account JSON:", err);
    }
  }

  // Stage 2: JSON string from environment (with fallback safety if JSON is malformed)
  if (!initialized && process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || 'legal-13d13'
      });
      admin.firestore().settings({ ignoreUndefinedProperties: true });
      console.log("[firestoreStorage] Firebase Admin initialized via env var JSON.");
      initialized = true;
    } catch (err) {
      console.error("[firestoreStorage] Failed to initialize via FIREBASE_SERVICE_ACCOUNT_JSON:", err);
    }
  }

  // Stage 3: Individual credentials
  if (!initialized && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    try {
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID || 'legal-13d13',
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        projectId: process.env.FIREBASE_PROJECT_ID || 'legal-13d13'
      });
      admin.firestore().settings({ ignoreUndefinedProperties: true });
      console.log("[firestoreStorage] Firebase Admin initialized via individual credentials.");
      initialized = true;
    } catch (err) {
      console.error("[firestoreStorage] Failed to initialize via individual credentials:", err);
    }
  }

  if (!initialized) {
    console.warn("[firestoreStorage] Firebase Admin not initialized. Features may fail.");
  }
}

const getCollection = (name: string) => {
  // Check both root and artifacts path to ensure compatibility with different environments
  const appId = process.env.FIREBASE_APP_ID || FIREBASE_APP_ID;
  console.error(`[Firestore] Fetching collection: ${name} (AppId: ${appId})`);
  return admin.firestore().collection('artifacts').doc(appId).collection(name);
};

export const firestoreStorage: IFirestoreStorage = {
  // User Profile
  async getUserProfile(userId: string) {
    const doc = await getCollection('profiles').doc(userId).get();
    return doc.exists ? { userId, ...doc.data() } as UserProfile : null;
  },
  async toggleUserAdmin(userId: string, isAdmin: boolean) {
    await getCollection('profiles').doc(userId).set({ isAdmin }, { merge: true });
    return true;
  },
  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    await getCollection('profiles').doc(userId).set(updates, { merge: true });
    return await this.getUserProfile(userId);
  },
  async createUser(user: any) {
    await getCollection('users').doc(user.id).set(user);
    return { id: user.id };
  },
  async deleteUser(userId: string) {
    await getCollection('profiles').doc(userId).delete();
    await getCollection('users').doc(userId).delete();
    return true;
  },
  async getAllUsers() {
    const snapshot = await getCollection('profiles').get();
    return snapshot.docs.map(doc => ({ userId: doc.id, ...doc.data() } as UserProfile));
  },
  async generateReferralCode(userId: string) { 
    const code = "SABI" + userId.substring(0, 6).toUpperCase();
    await getCollection('profiles').doc(userId).set({ referralCode: code }, { merge: true });
    return code; 
  },
  async processReferral(newUserId: string, referralCode: string) {
    console.error(`[Referral] Processing referral for new user ${newUserId} with code ${referralCode}`);
    
    // 1. Find the referrer
    const snap = await getCollection('profiles').where('referralCode', '==', referralCode).get();
    if (snap.empty) {
      console.error(`[Referral] Referrer with code ${referralCode} not found.`);
      return;
    }
    
    const referrerProfile = snap.docs[0].data() as UserProfile;
    const referrerId = snap.docs[0].id;

    if (referrerId === newUserId) {
      console.error(`[Referral] User ${newUserId} tried to refer themselves.`);
      return;
    }

    // 2. Get reward settings from Firestore
    // Default values if settings not found
    let signupReward = 10;
    let bonusReward = 20;

    try {
      const signupSetting = await this.getAdminSetting('credit_reward_referral');
      if (signupSetting && signupSetting.value) signupReward = Number(signupSetting.value);
      
      const bonusSetting = await this.getAdminSetting('referral_reward_credits');
      if (bonusSetting && bonusSetting.value) bonusReward = Number(bonusSetting.value);
    } catch (e) {
      console.error(`[Referral] Failed to fetch settings, using defaults.`, e);
    }

    console.error(`[Referral] Rewarding Referrer (${referrerId}): ${bonusReward} and New User (${newUserId}): ${signupReward}`);

    // 3. Give credits to the new user
    await this.addCredits(newUserId, signupReward, `Referral signup bonus (Code: ${referralCode})`);
    
    // 4. Give credits to the referrer
    await this.addCredits(referrerId, bonusReward, `Referral bonus for inviting user ${newUserId}`);

    // 5. Send notification to the referrer
    await this.sendNotification({
      userId: referrerId,
      type: 'referral_bonus',
      title: 'Referral Bonus Received!',
      message: `Congratulations! You received ${bonusReward} credits because someone joined using your referral code.`,
      data: { newUser: newUserId, amount: bonusReward }
    });
  },

  // Credits & Plans
  async getUserCredits(userId: string) {
    const doc = await getCollection('credits').doc(userId).get();
    return doc.exists ? { userId, ...doc.data() } as UserCredits : { userId, totalCredits: 0, usedCredits: 0 };
  },
  async deductCredits(userId: string, amount: number, feature: string, description: string) {
    const creditsRef = getCollection('credits').doc(userId);
    return await admin.firestore().runTransaction(async (transaction) => {
      const doc = await transaction.get(creditsRef);
      if (!doc.exists) return false;
      const data = doc.data() as UserCredits;
      const total = data.totalCredits || 0;
      const used = data.usedCredits || 0;
      if (total - used < amount) return false;
      transaction.update(creditsRef, { usedCredits: used + amount });
      return true;
    });
  },
  async addCredits(userId: string, credits: number, description: string) {
    await getCollection('credits').doc(userId).set({ totalCredits: admin.firestore.FieldValue.increment(credits) }, { merge: true });
  },
  async refundCredits(userId: string, amount: number, feature: string) {
    await getCollection('credits').doc(userId).set({ usedCredits: admin.firestore.FieldValue.increment(-amount) }, { merge: true });
  },
  async getAllPlans() {
    const snapshot = await getCollection('plans').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserPlan));
  },
  async getPlansByType(type: string, userType: 'user' | 'vendor') {
    const snapshot = await getCollection('plans').where('type', '==', type).where('userType', '==', userType).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserPlan));
  },
  async getUserPlan(userId: string) {
    const sub = await getCollection('subscriptions').where('userId', '==', userId).where('status', '==', 'active').get();
    if (sub.empty) return null;
    return this.getPlanById((sub.docs[0].data() as Subscription).planId);
  },
  async createPlan(plan: Omit<UserPlan, 'id' | 'createdAt'>) {
    const id = `plan-${Date.now()}`;
    const newPlan = { ...plan, id, createdAt: new Date() };
    await getCollection('plans').doc(id).set(newPlan);
    return newPlan as UserPlan;
  },
  async updatePlan(planId: string, updates: Partial<UserPlan>) {
    await getCollection('plans').doc(planId).set(updates, { merge: true });
    return this.getPlanById(planId);
  },
  async deletePlan(planId: string) {
    await getCollection('plans').doc(planId).delete();
    return true;
  },
  async getPlanById(planId: string) {
    const doc = await getCollection('plans').doc(planId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } as UserPlan : null;
  },
  async refreshDailyCredits(userId: string, dailyCredits: number) {
    const creditsRef = getCollection('credits').doc(userId);
    const now = new Date();
    const todayStr = now.toDateString();
    
    await admin.firestore().runTransaction(async (transaction) => {
      const doc = await transaction.get(creditsRef);
      if (!doc.exists) {
        transaction.set(creditsRef, {
          totalCredits: dailyCredits,
          usedCredits: 0,
          lastRefreshDate: todayStr,
          renewalDate: now
        }, { merge: true });
        return;
      }
      
      const data = doc.data() as any;
      const lastRefresh = data.lastRefreshDate;
      if (lastRefresh !== todayStr) {
        transaction.update(creditsRef, {
          usedCredits: 0,
          totalCredits: Math.max(data.totalCredits || 0, dailyCredits),
          lastRefreshDate: todayStr,
          renewalDate: now
        });
      }
    });
  },
  async getCreditLog(userId: string) {
    const snapshot = await getCollection('creditLogs').where('userId', '==', userId).orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  async setUserCredits(userId: string, totalCredits: number) {
    await getCollection('credits').doc(userId).set({ totalCredits, usedCredits: 0 }, { merge: true });
  },
  async getCreditPackages() {
    const pkgSnapshot = await getCollection('creditPackages').get();
    return pkgSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CreditPackage));
  },
  async createCreditPackage(data: Omit<CreditPackage, 'id'>) {
    const id = `pkg-${Date.now()}`;
    const newPkg = { id, ...data };
    await getCollection('creditPackages').doc(id).set(newPkg);
    return newPkg as CreditPackage;
  },
  async updateCreditPackage(packageId: string, updates: Partial<CreditPackage>) {
    await getCollection('creditPackages').doc(packageId).set(updates, { merge: true });
    const doc = await getCollection('creditPackages').doc(packageId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } as CreditPackage : null;
  },
  async deleteCreditPackage(packageId: string) {
    await getCollection('creditPackages').doc(packageId).delete();
    return true;
  },
  async updateSubscriptionStatus(id: string, status: 'active' | 'cancelled' | 'pending') {
    await getCollection('subscriptions').doc(id).set({ status }, { merge: true });
  },
  async createSubscription(sub: Omit<Subscription, 'id' | 'createdAt'>) {
    const id = `sub-${Date.now()}`;
    let endDate: string | undefined = undefined;
    try {
      const plan = await this.getPlanById(sub.planId);
      if (plan) {
        const now = Date.now();
        if (plan.type === 'free') {
          // Free tier has a 14 day trial
          endDate = new Date(now + 14 * 24 * 60 * 60 * 1000).toISOString();
        } else if (plan.billingCycle === 'yearly') {
          endDate = new Date(now + 365 * 24 * 60 * 60 * 1000).toISOString();
        } else {
          endDate = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();
        }
      }
    } catch (e) {
      console.error('Error fetching plan for subscription end date:', e);
    }
    const newSub = { id, createdAt: new Date(), endDate, ...sub };
    await getCollection('subscriptions').doc(id).set(newSub);
    return newSub as Subscription;
  },

  // Admin & Settings
  async getAdminSetting(key: string) {
    const doc = await getCollection('adminSettings').doc(key).get();
    if (doc.exists) {
        const data = doc.data() as AdminSetting;
        console.log(`[Firestore] Found setting ${key}:`, data.value ? 'HIDDEN' : 'EMPTY');
        return data;
    }
    
    // Fallback to process.env
    if (key === 'google_gemini_api_key' && process.env.GEMINI_API_KEY) {
        return { key, value: process.env.GEMINI_API_KEY, category: 'ai', isSecret: true } as AdminSetting;
    }
    
    return null;
  },
  async getAdminSettings(category?: string) {
    let q: any = getCollection('adminSettings');
    if (category) q = q.where('category', '==', category);
    const snap = await q.get();
    return snap.docs.map((doc: any) => doc.data() as AdminSetting);
  },
  async setAdminSetting(key: string, value: any, category: string, isSecret: boolean) {
    await getCollection('adminSettings').doc(key).set({ key, value, category, isSecret });
  },
  async getImpersonationToken(userId: string) { return "mock-token"; },

  // SabiGuard & Moat Data
  async getSabiGuardMessages(chatId: string) {
    const snap = await getCollection('sabiguardMessages').where('chatId', '==', chatId).get();
    const messages = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SabiGuardMessage));
    return messages.sort((a: any, b: any) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || a.timestamp || 0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || b.timestamp || 0);
      return dateA.getTime() - dateB.getTime();
    });
  },
  async addSabiGuardMessage(chatId: string, role: 'user' | 'ai', content: string) {
    await getCollection('sabiguardMessages').add({ chatId, role, content, createdAt: new Date() });
  },
  async updateChatStorageUsed(userId: string, bytes: number) {
    await getCollection('profiles').doc(userId).set({ chatStorageUsed: admin.firestore.FieldValue.increment(bytes) }, { merge: true });
  },
  async getMoatData(category?: string) {
    let q: any = getCollection('moatData');
    if (category) q = q.where('category', '==', category);
    const snap = await q.get();
    return snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as MoatData));
  },
  async createMoatData(data: Omit<MoatData, 'id' | 'createdAt'>) {
    const id = `moat-${Date.now()}`;
    const newItem = { id, createdAt: new Date(), ...data };
    if (!newItem.title) newItem.title = 'UntitledEntry';
    await getCollection('moatData').doc(id).set(newItem);
    return newItem as MoatData;
  },
  async deleteMoatData(id: string) {
    await getCollection('moatData').doc(id).delete();
  },

  // Professionals
  async getProfessionals(filters?: { status?: string; role?: string; city?: string; verified?: boolean }) {
    let q: any = getCollection('professionals');
    if (filters?.status) q = q.where('status', '==', filters.status);
    if (filters?.role) q = q.where('role', '==', filters.role);
    if (filters?.city) q = q.where('location.city', '==', filters.city);
    if (typeof filters?.verified === 'boolean') q = q.where('verified', '==', filters.verified);
    const snap = await q.get();
    return snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Professional));
  },
  async getProfessionalById(professionalId: string) {
    const doc = await getCollection('professionals').doc(professionalId).get();
    return doc.exists ? ({ id: doc.id, ...doc.data() } as Professional) : null;
  },
  async createProfessional(data: Omit<Professional, 'id' | 'createdAt' | 'updatedAt'>) {
    const id = `prof-${Date.now()}`;
    const now = new Date();
    const newProfessional = { id, createdAt: now, updatedAt: now, ...data };
    await getCollection('professionals').doc(id).set(newProfessional);
    return newProfessional as Professional;
  },
  async updateProfessional(professionalId: string, updates: Partial<Professional>) {
    await getCollection('professionals').doc(professionalId).set({ ...updates, updatedAt: new Date() }, { merge: true });
  },
  async getProfessionalServices(filters: { professionalId?: string; type?: string; city?: string }) {
    let q: any = getCollection('professionalServices');
    if (filters?.professionalId) q = q.where('professionalId', '==', filters.professionalId);
    if (filters?.type) q = q.where('type', '==', filters.type);
    if (filters?.city) q = q.where('location', '==', filters.city);
    const snap = await q.get();
    return snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as ProfessionalService));
  },
  async createProfessionalService(service: Omit<ProfessionalService, 'id' | 'createdAt'>) {
    const id = `psvc-${Date.now()}`;
    const newSvc = { id, createdAt: new Date(), ...service };
    await getCollection('professionalServices').doc(id).set(newSvc);
    return newSvc as ProfessionalService;
  },
  async getProfessionalServiceById(serviceId: string) {
    const doc = await getCollection('professionalServices').doc(serviceId).get();
    return doc.exists ? ({ id: doc.id, ...doc.data() } as ProfessionalService) : null;
  },
  async updateProfessionalService(id: string, updates: Partial<ProfessionalService>) {
    await getCollection('professionalServices').doc(id).set(updates, { merge: true });
  },
  async deleteProfessionalService(id: string) {
    await getCollection('professionalServices').doc(id).delete();
  },
  async submitProfessionalApplication(userId: string, application: Omit<ProfessionalApplication, 'id' | 'createdAt' | 'status' | 'userId'>) {
    const id = `papp-${Date.now()}`;
    const newApp = { ...application, id, userId, createdAt: new Date(), submittedAt: new Date(), status: 'pending' as const };
    await getCollection('professionalApplications').doc(id).set(newApp);
    return newApp as ProfessionalApplication;
  },
  async getProfessionalApplication(userId: string) {
    const snap = await getCollection('professionalApplications').where('userId', '==', userId).get();
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() } as ProfessionalApplication;
  },
  async getAllProfessionalApplications() {
    const snap = await getCollection('professionalApplications').get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProfessionalApplication));
  },
  async approveProfessionalApplication(userId: string) {
    const snap = await getCollection('professionalApplications').where('userId', '==', userId).get();
    if (snap.empty) return;
    const applicationDoc = snap.docs[0];
    const application = applicationDoc.data() as ProfessionalApplication;
    await getCollection('professionalApplications').doc(applicationDoc.id).set({ status: 'approved', reviewedAt: new Date() }, { merge: true });
    const profile = await this.getUserProfile(userId);
    const existingProfSnap = await getCollection('professionals').where('userId', '==', userId).get();
    if (!existingProfSnap.empty) {
      const existingId = existingProfSnap.docs[0].id;
      await getCollection('professionals').doc(existingId).set({ status: 'active', verified: true, updatedAt: new Date() }, { merge: true });
    } else {
      const id = `prof-${Date.now()}`;
      const now = new Date();
      const newProfessional: Professional = {
        id,
        userId,
        displayName: profile?.displayName || application.businessName || null,
        email: profile?.email || null,
        phoneNumber: profile?.phoneNumber || null,
        role: (application.role || 'other') as Professional['role'],
        specializations: [application.serviceType],
        status: 'active',
        verified: true,
        credentials: {
          certificates: [],
          idDocuments: [],
          adminNotes: 'Approved from application',
          submittedAt: application.submittedAt,
          approvedAt: new Date()
        },
        location: {
          street: '',
          city: '',
          state: '',
          country: '',
          latitude: 0,
          longitude: 0,
          geohash: ''
        },
        wallet: {
          NGN: 0,
          USD: 0,
          credits: 0,
          updatedAt: new Date()
        },
        createdAt: now,
        updatedAt: now
      };
      await getCollection('professionals').doc(id).set(newProfessional);
    }
    if (profile) {
      await getCollection('profiles').doc(userId).set({ isVendor: true }, { merge: true });
    }
  },
  async rejectProfessionalApplication(userId: string) {
    const snap = await getCollection('professionalApplications').where('userId', '==', userId).get();
    if (snap.empty) return;
    await getCollection('professionalApplications').doc(snap.docs[0].id).set({ status: 'rejected', reviewedAt: new Date() }, { merge: true });
  },

  // Vendor & Services (deprecated, kept for compatibility)
  async getVendorServices(filters: { type?: string; city?: string; lat?: number; lng?: number }) {
    let q: any = getCollection('vendorServices');
    if (filters?.type) q = q.where('type', '==', filters.type);
    if (filters?.city) q = q.where('city', '==', filters.city);
    const snap = await q.get();
    return snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as VendorService));
  },
  async toggleUserVendor(userId: string, isVendor: boolean) {
    await getCollection('profiles').doc(userId).set({ isVendor }, { merge: true });
    return true;
  },
  async submitVendorApplication(userId: string, application: Omit<VendorApplication, 'id' | 'createdAt' | 'status' | 'userId'>) {
    const id = `app-${Date.now()}`;
    const newApp = { ...application, id, userId, createdAt: new Date(), status: 'pending' as const };
    await getCollection('vendorApplications').doc(id).set(newApp);
    return newApp as VendorApplication;
  },
  async getVendorApplication(userId: string) {
    const snap = await getCollection('vendorApplications').where('userId', '==', userId).get();
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() } as VendorApplication;
  },
  async getAllVendorApplications() {
    const snap = await getCollection('vendorApplications').get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as VendorApplication));
  },
  async approveVendorApplication(userId: string) {
    await getCollection('profiles').doc(userId).set({ isVendor: true }, { merge: true });
  },
  async rejectVendorApplication(userId: string) { return; },
  async switchVendorMode(userId: string, mode: boolean) {
    await getCollection('profiles').doc(userId).set({ vendorMode: mode }, { merge: true });
  },
  async getAllVendors() {
    const snap = await getCollection('profiles').where('isVendor', '==', true).get();
    return snap.docs.map(doc => ({ userId: doc.id, ...doc.data() } as any as UserProfile));
  },
  async createVendorService(service: Omit<VendorService, 'id' | 'createdAt'>) {
    const id = `svc-${Date.now()}`;
    const newSvc = { id, createdAt: new Date(), ...service };
    await getCollection('vendorServices').doc(id).set(newSvc);
    return newSvc as VendorService;
  },
  async updateVendorService(id: string, updates: Partial<VendorService>) {
    await getCollection('vendorServices').doc(id).set(updates, { merge: true });
  },
  async deleteVendorService(id: string) {
    await getCollection('vendorServices').doc(id).delete();
  },

  // Routes & Alerts
  async getUserRoutes(userId: string) {
    const snap = await getCollection('routes').where('userId', '==', userId).get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Route));
  },
  async createRoute(route: Omit<Route, 'id' | 'createdAt'>) {
    const id = `route-${Date.now()}`;
    const newRoute = { id, createdAt: new Date(), ...route };
    await getCollection('routes').doc(id).set(newRoute);
    return newRoute as Route;
  },
  async getRoute(id: string) {
    const doc = await getCollection('routes').doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } as Route : null;
  },
  async updateRouteStatus(id: string, status: string, recommendation?: string, cloakedStreets?: string[]) {
    const updateData: any = { status };
    if (recommendation !== undefined) updateData.recommendation = recommendation;
    if (cloakedStreets !== undefined) updateData.cloakedStreets = cloakedStreets;
    await getCollection('routes').doc(id).set(updateData, { merge: true });
  },
  async deleteRoute(id: string) {
    await getCollection('routes').doc(id).delete();
  },
  async getRouteAlerts(id: string) {
    const snap = await getCollection('alerts').where('routeId', '==', id).get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert));
  },
  async createAlert(alert: Omit<Alert, 'id' | 'createdAt' | 'acknowledged'>) {
    const id = `alt-${Date.now()}`;
    const newAlt = { id, createdAt: new Date(), acknowledged: false, ...alert };
    await getCollection('alerts').doc(id).set(newAlt);
    return newAlt as Alert;
  },
  async acknowledgeAlert(id: string) {
    await getCollection('alerts').doc(id).set({ acknowledged: true }, { merge: true });
  },
  async updateDashboardTraffic(userId: string, location: string, status: string, description: string) {
    await getCollection('dashboardTraffic').doc(userId).set({ location, status, description, updatedAt: new Date() });
  },
  async getDashboardTraffic(userId: string) {
    const doc = await getCollection('dashboardTraffic').doc(userId).get();
    return doc.exists ? doc.data() : null;
  },

  // Email & Notifications
  async setEmailVerificationCode(userId: string, code: string, expires: Date) {
    await getCollection('verificationCodes').doc(userId).set({ code, expires });
  },
  async clearEmailVerificationCode(userId: string) {
    await getCollection('verificationCodes').doc(userId).delete();
  },
  async sendEmailNotification(n: any, profile: UserProfile | null) {
    const smtpSettings = await this.getSmtpSettings();
    if (!smtpSettings || !smtpSettings.host || !smtpSettings.username || !smtpSettings.password || !smtpSettings.fromEmail || !smtpSettings.fromName) {
      throw new Error('SMTP settings are not configured');
    }

    if (smtpSettings.isActive === false) {
      throw new Error('SMTP notifications are disabled');
    }

    if (!profile?.email) {
      throw new Error('User email address is missing');
    }

    const transporter = nodemailer.createTransport({
      host: smtpSettings.host,
      port: Number(smtpSettings.port) || 587,
      secure: smtpSettings.encryption === 'ssl' || Number(smtpSettings.port) === 465,
      auth: {
        user: smtpSettings.username,
        pass: smtpSettings.password,
      },
      tls: { rejectUnauthorized: false }
    });

    const subject = n.subject || n.title || 'SabiRight Notification';
    const text = n.text || n.message || '';
    let html = n.html || `<p>${n.message || ''}</p>`;

    if (n.templateName === 'email_verification_code') {
      html = `
        <p>Hello ${profile.displayName || profile.email || 'User'},</p>
        <p>Your SabiRight verification code is: <strong>${n.variables?.code || ''}</strong>.</p>
        <p>This code expires in ${n.variables?.expiry || '1 hour'}.</p>
      `;
    } else if (n.templateName === 'welcome_email') {
      html = `
        <p>Hello ${profile.displayName || profile.email || 'User'},</p>
        <p>${n.message || 'Welcome to SabiRight!'}</p>
      `;
    } else if (n.templateName === 'email_verified') {
      html = `
        <p>Hello ${profile.displayName || profile.email || 'User'},</p>
        <p>Your email has been successfully verified.</p>
      `;
    }

    await transporter.sendMail({
      from: `"${smtpSettings.fromName}" <${smtpSettings.fromEmail}>`,
      to: profile.email,
      subject,
      text,
      html,
    });
  },
  async sendNotification(n: any) {
    const requestedChannels = Array.isArray(n.channels) ? [...n.channels] : [];
    let persistChannels = [...requestedChannels];

    if (requestedChannels.includes('email')) {
      const profile = await this.getUserProfile(n.userId);
      try {
        await this.sendEmailNotification(n, profile);
      } catch (error) {
        console.error('[sendNotification] Email send failed, falling back to in_app notification:', error);
        persistChannels = persistChannels.filter((c) => c !== 'email');
        if (!persistChannels.includes('in_app')) {
          persistChannels.push('in_app');
        }
      }
    }

    const shouldPersistNotification = persistChannels.includes('in_app') || persistChannels.includes('push') || persistChannels.length === 0;
    if (shouldPersistNotification) {
      await getCollection('notifications').add({ ...n, channels: persistChannels, createdAt: new Date() });
    }
  },
  async createNotification(n: any) { return this.sendNotification(n); },
  async updateEmailVerificationStatus(userId: string, status: UserProfile['emailVerificationStatus']) {
    await getCollection('profiles').doc(userId).set({ emailVerificationStatus: status }, { merge: true });
  },
  async verifyEmailCode(userId: string, code: string) {
    const doc = await getCollection('verificationCodes').doc(userId).get();
    if (!doc.exists) return false;

    const data = doc.data() as any;
    if (!data || data.code !== code) return false;

    const expires = data.expires;
    if (expires) {
      const expiryDate = expires.toDate ? expires.toDate() : new Date(expires);
      if (expiryDate.getTime() < Date.now()) {
        return false;
      }
    }

    return true;
  },

  // Events
  async getEvents() {
    const snap = await getCollection('events').get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
  },
  async createEvent(event: Omit<Event, 'id' | 'createdAt'>) {
    const id = `evt-${Date.now()}`;
    const newEvt = { id, createdAt: new Date(), ...event };
    await getCollection('events').doc(id).set(newEvt);
    return newEvt as Event;
  },
  async updateEvent(id: string, updates: Partial<Event>) {
    await getCollection('events').doc(id).set(updates, { merge: true });
  },
  async deleteEvent(id: string) {
    await getCollection('events').doc(id).delete();
  },
  async registerForEvent(eventId: string, userId: string) { return; },
  async saveEvent(userId: string, eventId: string) { return; },
  async unsaveEvent(userId: string, eventId: string) { return; },
  async getSavedEvents(userId: string) { return []; },

  // Jobs
  async getJobs(limit?: number) {
    const snap = await getCollection('jobs').get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
  },
  async createJob(job: Omit<Job, 'id' | 'createdAt'>) {
    const id = `job-${Date.now()}`;
    const newJob = { id, createdAt: new Date(), ...job };
    await getCollection('jobs').doc(id).set(newJob);
    return newJob as Job;
  },
  async updateJob(id: string, updates: Partial<Job>) {
    await getCollection('jobs').doc(id).set(updates, { merge: true });
  },
  async deleteJob(id: string) {
    await getCollection('jobs').doc(id).delete();
  },
  async saveJob(u: string, j: string) { return; },
  async unsaveJob(u: string, j: string) { return; },
  async getSavedJobs(u: string) { return []; },
  async getSavedJobIds(u: string) { return []; },
  async applyToJob(u: string, j: string) { return {}; },
  async getAppliedJobs(u: string) { return []; },
  async getAppliedJobIds(u: string) { return []; },
  async updateApplicationStatus(u: string, j: string, s: string) { return; },
  async getGeneratedJobs(userId?: string) {
    let q: any = getCollection('generatedJobs');
    if (userId) q = q.where('userId', '==', userId);
    const snap = await q.get();
    return snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Job));
  },
  async createGeneratedJob(userId: string, job: Omit<Job, 'id' | 'createdAt'>) {
    const id = `gen-${Date.now()}`;
    const newJob = { id, userId, createdAt: new Date(), ...job };
    await getCollection('generatedJobs').doc(id).set(newJob);
    return newJob as Job;
  },
  async deleteGeneratedJob(id: string) {
    await getCollection('generatedJobs').doc(id).delete();
  },

  // Payments & Wallet
  async getPaymentMethods() {
    const snap = await getCollection('paymentMethods').get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentMethod));
  },
  async getActivePaymentMethods() {
    const snap = await getCollection('paymentMethods').where('active', '==', true).get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentMethod));
  },
  async createPaymentMethod(data: Omit<PaymentMethod, 'id' | 'createdAt'>) {
    const id = `pm-${Date.now()}`;
    const newItem = { id, createdAt: new Date(), ...data };
    await getCollection('paymentMethods').doc(id).set(newItem);
    return newItem as PaymentMethod;
  },
  async updatePaymentMethod(id: string, updates: Partial<PaymentMethod>) {
    await getCollection('paymentMethods').doc(id).set(updates, { merge: true });
    return null;
  },
  async deletePaymentMethod(id: string) {
    await getCollection('paymentMethods').doc(id).delete();
    return true;
  },
  async getPayments(userId?: string) {
    let q: any = getCollection('payments');
    if (userId) q = q.where('userId', '==', userId);
    const snap = await q.get();
    return snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Payment));
  },
  async createPayment(payment: Omit<Payment, 'id' | 'createdAt' | 'status'>) {
    const id = `pay-${Date.now()}`;
    const newPay = { id, createdAt: new Date(), status: 'pending' as const, ...payment };
    await getCollection('payments').doc(id).set(newPay);
    return newPay as Payment;
  },
  async updatePayment(id: string, updates: Partial<Payment>) {
    await getCollection('payments').doc(id).set(updates, { merge: true });
  },
  async updatePaymentStatus(id: string, status: Payment['status'], ref?: string) {
    await getCollection('payments').doc(id).set({ status, providerRef: ref }, { merge: true });
  },
  async getPayment(id: string) {
    const doc = await getCollection('payments').doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } as Payment : null;
  },
  async getWalletByUserId(userId: string) {
    const doc = await getCollection('wallets').doc(userId).get();
    return doc.exists ? doc.data() as Wallet : null;
  },
  async createWallet(userId: string, currency: string) {
    const wallet = { id: `w-${userId}`, userId, balance: 0, currency, createdAt: new Date(), updatedAt: new Date() };
    await getCollection('wallets').doc(userId).set(wallet);
    return wallet as Wallet;
  },
  async topUpWallet(userId: string, amount: number, reference: string, description: string) {
    await getCollection('wallets').doc(userId).update({ balance: admin.firestore.FieldValue.increment(amount), updatedAt: new Date() });
  },
  async deductFromWallet(userId: string, amount: number, type: string, reference: string, description: string) {
    await getCollection('wallets').doc(userId).update({ balance: admin.firestore.FieldValue.increment(-amount), updatedAt: new Date() });
  },

  // Vendor Stats & leads
  async getVendorStats(vendorId: string) { return {}; },
  async getVendorLeads(vendorId: string) {
    const snap = await getCollection('vendorLeads').where('vendorId', '==', vendorId).get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as VendorLead));
  },
  async getBookingsByVendorId(vendorId: string) {
    const snap = await getCollection('bookings').where('vendorId', '==', vendorId).get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  async createVendorBooking(booking: any) {
    const id = `bk-${Date.now()}`;
    const newBk = { id, createdAt: new Date(), ...booking };
    await getCollection('bookings').doc(id).set(newBk);
    return newBk;
  },
  async updateVendorBooking(id: string, updates: any) {
    await getCollection('bookings').doc(id).set(updates, { merge: true });
  },
  async getBookingById(id: string) {
    const doc = await getCollection('bookings').doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },
  async createVendorLead(lead: Omit<VendorLead, 'id' | 'createdAt'>) {
    const id = `ld-${Date.now()}`;
    const newLead = { id, createdAt: new Date(), ...lead };
    await getCollection('vendorLeads').doc(id).set(newLead);
    return newLead as VendorLead;
  },

  // Forum
  async getForumPosts() {
    const snap = await getCollection('forumPosts').orderBy('createdAt', 'desc').get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumPost));
  },
  async getForumPost(postId: string) {
    const doc = await getCollection('forumPosts').doc(postId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } as ForumPost : null;
  },
  async createForumPost(post: Omit<ForumPost, 'id' | 'createdAt'>) {
    const id = `fp-${Date.now()}`;
    const newPost = { id, createdAt: new Date(), ...post };
    await getCollection('forumPosts').doc(id).set(newPost);
    return newPost as ForumPost;
  },
  async updateForumPost(postId: string, updates: Partial<ForumPost>) {
    await getCollection('forumPosts').doc(postId).set(updates, { merge: true });
  },
  async deleteForumPost(postId: string) {
    await getCollection('forumPosts').doc(postId).delete();
  },
  async addForumComment(postId: string, comment: any) {
    await getCollection('forumPosts').doc(postId).update({ comments: admin.firestore.FieldValue.arrayUnion(comment) });
    return comment;
  },
  async deleteForumComment(postId: string, commentId: string) { return; },
  async voteForumPost(postId: string, userId: string, type: 'up' | 'down') { return; },

  // Survey
  async getSurveys() {
    const snap = await getCollection('surveys').get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Survey));
  },
  async createSurvey(survey: Omit<Survey, 'id' | 'createdAt'>) {
    const id = `sr-${Date.now()}`;
    const newSr = { id, createdAt: new Date(), ...survey };
    await getCollection('surveys').doc(id).set(newSr);
    return newSr as Survey;
  },

  // FAQ
  async getFaqs() {
    const snap = await getCollection('faqs').get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Faq));
  },
  async createFaq(faq: Omit<Faq, 'id' | 'createdAt'>) {
    const id = `faq-${Date.now()}`;
    const newFaq = { id, createdAt: new Date(), ...faq };
    await getCollection('faqs').doc(id).set(newFaq);
    return newFaq as Faq;
  },
  async updateFaq(id: string, updates: Partial<Faq>) {
    await getCollection('faqs').doc(id).set(updates, { merge: true });
    return this.getFaqs().then(f => f.find(x => x.id === id) || null);
  },
  async deleteFaq(id: string) {
    await getCollection('faqs').doc(id).delete();
    return true;
  },

  // Testimonials
  async getTestimonials() {
    const snap = await getCollection('testimonials').get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Testimonial));
  },
  async createTestimonial(testimonial: Omit<Testimonial, 'id' | 'createdAt'>) {
    const id = `ts-${Date.now()}`;
    const newTs = { id, createdAt: new Date(), ...testimonial };
    await getCollection('testimonials').doc(id).set(newTs);
    return newTs as Testimonial;
  },
  async updateTestimonial(id: string, updates: Partial<Testimonial>) {
    await getCollection('testimonials').doc(id).set(updates, { merge: true });
    return null;
  },
  async deleteTestimonial(id: string) {
    await getCollection('testimonials').doc(id).delete();
    return true;
  },

  // Additional Bookings & Messages
  async createBookingMessage(data: { bookingId: string; senderId: string; message: string; attachments?: any[]; isAdminMessage: boolean }) {
    const id = `bm-${Date.now()}`;
    const { bookingId, ...message } = data;
    await getCollection('bookings').doc(bookingId).collection('messages').add({ ...message, id, createdAt: new Date() });
    return { id };
  },
  async getBookingMessages(bookingId: string, limit?: number) {
    const snap = await getCollection('bookings').doc(bookingId).collection('messages').get();
    return snap.docs.map(doc => doc.data());
  },
  async getBookingsByUserId(userId: string) {
    const snap = await getCollection('bookings').where('userId', '==', userId).get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  async getNotificationsByUserId(userId: string, limit?: number) {
    const snap = await getCollection('notifications').where('userId', '==', userId).get();
    return snap.docs.map(doc => doc.data());
  },
  async getSabiGuardChats(userId: string) {
    const snap = await getCollection('sabiguardChats')
      .where('userId', '==', userId)
      .get();
    const chats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Sort in memory to avoid requiring a composite index in Firestore
    return chats.sort((a: any, b: any) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });
  },
  async createSabiGuardChat(userId: string, title: string) {
    const id = `sg-${Date.now()}`;
    const newChat = { id, userId, title, createdAt: new Date() };
    await getCollection('sabiguardChats').doc(id).set(newChat);
    return newChat;
  },
  async deleteSabiGuardChat(chatId: string) {
    await getCollection('sabiguardChats').doc(chatId).delete();
  },
  async getUnreadNotificationCount(userId: string) { return 0; },
  async getDisputes() {
    const snap = await getCollection('disputes').get();
    return snap.docs.map(doc => doc.data());
  },
  async getTrainingTerms() { return []; },
  async getAllCrowdTranslations() { return []; },
  async getCrowdTranslationStats() { return { total: 0 }; },
  async getAllNotificationTemplates() {
    const snapshot = await getCollection('notificationTemplates').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  async getNotificationTemplateByName(name: string) {
    const snapshot = await getCollection('notificationTemplates').where('name', '==', name).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  },
  async createNotificationTemplate(d: any) {
    const id = d.id || `tmpl-${Date.now()}`;
    const newTemplate = { id, ...d, createdAt: new Date() };
    await getCollection('notificationTemplates').doc(id).set(newTemplate);
    return newTemplate;
  },
  async updateNotificationTemplate(id: string, u: any) {
    await getCollection('notificationTemplates').doc(id).set(u, { merge: true });
    const doc = await getCollection('notificationTemplates').doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },
  async deleteNotificationTemplate(id: string) {
    const docRef = getCollection('notificationTemplates').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return false;
    await docRef.delete();
    return true;
  },
  async getSmtpSettings() {
    const doc = await getCollection('adminSettings').doc('smtp').get();
    return doc.exists ? doc.data() : null;
  },
  async getPushSettings() {
    const doc = await getCollection('adminSettings').doc('push').get();
    return doc.exists ? doc.data() : null;
  },
  async getAllVendorServices() { return []; },
  async getAllCoupons() { return []; },
  async getCouponByCode(c: string) { return null; },
  async createCoupon(d: any) { return {}; },
  async updateCoupon(id: string, u: any) { return {}; },
  async deleteCoupon(id: string) { return true; },
  async validateCoupon(c: string) { return { valid: false }; },
  async getWalletTransactions(u: string, l?: number) { return []; },
  async getBookingDetails(id: string) { 
    const doc = await getCollection('bookings').doc(id).get();
    if (!doc.exists) return { booking: null };
    return { booking: { id: doc.id, ...doc.data() } }; 
  },
  async getMilestoneById(id: string) { return null; },
  async voteForumComment(p: string, c: string, u: string) { return; },
  async cleanupOldGeneratedJobs(h?: number) { return 0; },
  async getEscrowByBookingId(b: string) { return null; },
  async releaseEscrowMilestone(e: string, m: string, v: string, u: string) { return {}; },
  async getContractByBookingId(b: string) { return null; },
  async createContract(d: any) { return {}; },
  async signContract(b: string, s: any) { return {}; },
  async getDisputeByBookingId(b: string) { return null; },
  async getDisputeById(id: string) { return null; },
  async createDispute(d: any) { return {}; },
  async resolveDispute(id: string, r: string, n: string, a: string) { return {}; },
  async joinDispute(id: string, a: string) { return {}; },
  async getVendorServiceById(id: string) { return null; },
  async approveVendorService(id: string) { return; },
  async rejectVendorService(id: string) { return; },
  async getNotificationById(id: string) { return null; },
  async markNotificationAsRead(id: string) { return; },
  async markAllNotificationsAsRead(u: string) { return 0; },
  async getNotificationTemplateByName(n: string) { return null; },
  async createNotificationTemplate(d: any) { return {}; },
  async updateNotificationTemplate(id: string, u: any) { return {}; },
  async deleteNotificationTemplate(id: string) { return true; },
  async updateSmtpSettings(s: any) {
    await getCollection('adminSettings').doc('smtp').set(s);
    return s;
  },
  async updatePushSettings(s: any) {
    await getCollection('adminSettings').doc('push').set(s);
    return s;
  },
  async submitTranslation(d: any) { return {}; },
  async getRandomTranslationForVerification(u: string) { return null; },
  async voteTranslation(id: string, v: boolean) { return; },
  async getVerifiedTranslations(m: number) { return []; },
  async createTrainingTerm(d: any) { return {}; },
  async deleteTrainingTerm(id: string) { return; },
  async subscribeToPush(d: any) { return {}; },
  async unsubscribeFromPush(u: string, e: string) { return true; },
  async getPushSubscriptions(u: string) { return []; },
  async createBooking(data: any) {
    const id = `bk-${Date.now()}`;
    const newBk = { id, createdAt: new Date(), ...data };
    await getCollection('bookings').doc(id).set(newBk);
    return newBk;
  },
  async createMilestone(data: any) {
    const id = `ms-${Date.now()}`;
    const newMs = { id, createdAt: new Date(), ...data };
    await getCollection('milestones').doc(id).set(newMs);
    return newMs;
  },
  async createEscrowAccount(data: any) {
    const id = `esc-${Date.now()}`;
    const newEsc = { id, createdAt: new Date(), ...data };
    await getCollection('escrow').doc(id).set(newEsc);
    return newEsc;
  },
  async updateBookingStatus(id: string, status: string) {
    await getCollection('bookings').doc(id).set({ status }, { merge: true });
  },
  async fundEscrow(bookingId: string, amount: number, userId: string) {
    await getCollection('escrow').doc(bookingId).set({ fundedAmount: admin.firestore.FieldValue.increment(amount), fundedBy: userId }, { merge: true });
    return {};
  },
  async updateMilestoneStatus(id: string, status: string) {
    await getCollection('milestones').doc(id).set({ status }, { merge: true });
  }
};

export async function verifyAdminToken(token: string): Promise<AuthResult> {
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const flags = await getFirestoreUserFlags(decoded.uid);
    if (!flags.isAdmin) return { valid: false, error: 'not_admin' };
    return { valid: true, userId: decoded.uid, isAdmin: true };
  } catch (error) {
    return { valid: false, error: 'invalid_token' };
  }
}
export async function verifyUserToken(token: string): Promise<AuthResult> {
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return { valid: true, userId: decoded.uid };
  } catch (error) {
    return { valid: false, error: 'invalid_token' };
  }
}
export async function isUserAdmin(userId: string): Promise<boolean> {
  const flags = await getFirestoreUserFlags(userId);
  return flags.isAdmin;
}
export async function getFirestoreUserFlags(userId: string): Promise<{ isAdmin: boolean; isVendor: boolean }> {
  const doc = await getCollection('profiles').doc(userId).get();
  if (!doc.exists) return { isAdmin: false, isVendor: false };
  const data = doc.data() as any;
  return { isAdmin: !!data.isAdmin, isVendor: !!data.isVendor };
}
