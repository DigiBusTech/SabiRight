import admin from 'firebase-admin';
import { type User, type InsertUser, type Subscription, type Credits, type Plan, type CreditLog, type CloakedRoute, type TrafficAlert, type DashboardTrafficCard, type UserProfile, type VendorApplication, type Event, type VendorService, type AdminSetting, type Payment } from "@shared/schema";
import { type IStorage } from "./storage";

const FIREBASE_APP_ID = 'digital-citizen-v2';

export async function verifyAdminToken(idToken: string): Promise<{ 
  valid: boolean; 
  userId?: string; 
  isAdmin?: boolean;
  error?: 'invalid_token' | 'no_profile' | 'not_admin';
}> {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;
    
    const profileDoc = await admin.firestore()
      .collection('artifacts')
      .doc(FIREBASE_APP_ID)
      .collection('profiles')
      .doc(userId)
      .get();
    
    if (!profileDoc.exists) {
      console.log(`Admin auth: No profile found for user ${userId}`);
      return { valid: false, userId, isAdmin: false, error: 'no_profile' };
    }
    
    const profile = profileDoc.data();
    const isAdmin = profile?.isAdmin === true;
    
    if (!isAdmin) {
      console.log(`Admin auth: User ${userId} is not an admin`);
      return { valid: false, userId, isAdmin: false, error: 'not_admin' };
    }
    
    return { valid: true, userId, isAdmin: true };
  } catch (error) {
    console.error('Admin auth: Token verification failed', error);
    return { valid: false, error: 'invalid_token' };
  }
}

function initializeFirebase() {
  if (admin.apps && admin.apps.length > 0) {
    return admin.app();
  }
  
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set');
  }
  
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch (e) {
    throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON');
  }
  
  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'legal-13d13',
  });
}

initializeFirebase();
const db = admin.firestore();

const collections = {
  users: () => db.collection('artifacts').doc(FIREBASE_APP_ID).collection('users'),
  profiles: () => db.collection('artifacts').doc(FIREBASE_APP_ID).collection('profiles'),
  subscriptions: () => db.collection('artifacts').doc(FIREBASE_APP_ID).collection('subscriptions'),
  credits: () => db.collection('artifacts').doc(FIREBASE_APP_ID).collection('credits'),
  creditLogs: () => db.collection('artifacts').doc(FIREBASE_APP_ID).collection('creditLogs'),
  plans: () => db.collection('artifacts').doc(FIREBASE_APP_ID).collection('plans'),
  routes: () => db.collection('artifacts').doc(FIREBASE_APP_ID).collection('routes'),
  alerts: () => db.collection('artifacts').doc(FIREBASE_APP_ID).collection('alerts'),
  vendorApplications: () => db.collection('artifacts').doc(FIREBASE_APP_ID).collection('vendorApplications'),
  dashboardTraffic: () => db.collection('artifacts').doc(FIREBASE_APP_ID).collection('dashboardTraffic'),
  events: () => db.collection('artifacts').doc(FIREBASE_APP_ID).collection('events'),
  vendorServices: () => db.collection('artifacts').doc(FIREBASE_APP_ID).collection('vendorServices'),
  adminSettings: () => db.collection('artifacts').doc(FIREBASE_APP_ID).collection('adminSettings'),
  payments: () => db.collection('artifacts').doc(FIREBASE_APP_ID).collection('payments'),
};

export class FirestoreStorage implements IStorage {
  
  constructor() {
    this.initializeDefaults();
  }

  private async initializeDefaults(): Promise<void> {
    const plansSnapshot = await collections.plans().get();
    if (plansSnapshot.empty) {
      const defaultPlans: any[] = [
        { id: 'free-user', name: 'Free', description: 'Basic access', price: '0', dailyCredits: 5, marketplaceListings: 0, features: ['AI Legal Help', 'Basic Civic Info'], type: 'free', userType: 'user' },
        { id: 'basic-user', name: 'Basic', description: 'Standard access', price: '2000', dailyCredits: 15, marketplaceListings: 3, features: ['AI Legal Help', 'Civic Info', 'Job Matches', 'Events'], type: 'basic', userType: 'user' },
        { id: 'pro-user', name: 'Pro', description: 'Full access', price: '5000', dailyCredits: 50, marketplaceListings: 10, features: ['All Features', 'Priority Support', 'Advanced AI'], type: 'pro', userType: 'user' },
        { id: 'free-vendor', name: 'Vendor Free', description: 'Basic vendor access', price: '0', dailyCredits: 10, marketplaceListings: 3, features: ['List 3 Services', 'Basic Analytics'], type: 'free', userType: 'vendor' },
        { id: 'pro-vendor', name: 'Vendor Pro', description: 'Full vendor access', price: '10000', dailyCredits: 100, marketplaceListings: null, features: ['Unlimited Services', 'Priority Listing', 'Full Analytics'], type: 'pro', userType: 'vendor' },
      ];
      
      const batch = db.batch();
      defaultPlans.forEach(plan => {
        batch.set(collections.plans().doc(plan.id), plan);
      });
      await batch.commit();
    }

    const settingsSnapshot = await collections.adminSettings().get();
    if (settingsSnapshot.empty) {
      const defaults = [
        { key: 'google_maps_api_key', value: '', category: 'api_keys', isSecret: true },
        { key: 'stripe_enabled', value: 'true', category: 'payments', isSecret: false },
        { key: 'paystack_enabled', value: 'true', category: 'payments', isSecret: false },
        { key: 'flutterwave_enabled', value: 'true', category: 'payments', isSecret: false },
        { key: 'payment_mode', value: 'automatic', category: 'payments', isSecret: false },
      ];
      
      const batch = db.batch();
      defaults.forEach(s => {
        batch.set(collections.adminSettings().doc(s.key), { ...s, updatedAt: new Date().toISOString() });
      });
      await batch.commit();
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const doc = await collections.users().doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } as User : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const snapshot = await collections.users().where('username', '==', username).limit(1).get();
    if (snapshot.empty) return undefined;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as User;
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = (user as any).id || crypto.randomUUID();
    const newUser = { ...user, id };
    await collections.users().doc(id).set(newUser);
    
    const profile = {
      userId: id,
      displayName: user.username,
      email: null,
      isVendor: false,
      kycStatus: 'pending',
      kycDocument: null,
      kycSubmittedAt: null,
      kycVerifiedAt: null,
      vendorMode: false,
      createdAt: new Date(),
    };
    await collections.profiles().doc(id).set(profile);
    
    const creditsData = {
      id: crypto.randomUUID(),
      userId: id,
      totalCredits: 10,
      usedCredits: 0,
      lastRefreshDate: new Date(),
      renewalDate: null,
    };
    await collections.credits().doc(id).set(creditsData);
    
    return newUser as User;
  }

  async getUserPlan(userId: string): Promise<(Plan & Subscription) | undefined> {
    const subSnapshot = await collections.subscriptions().where('userId', '==', userId).where('status', '==', 'active').limit(1).get();
    if (subSnapshot.empty) return undefined;
    
    const sub = subSnapshot.docs[0].data() as Subscription;
    const planDoc = await collections.plans().doc(sub.planId).get();
    if (!planDoc.exists) return undefined;
    
    return { ...planDoc.data(), ...sub, id: sub.id } as Plan & Subscription;
  }

  async createSubscription(subscription: any): Promise<Subscription> {
    const id = crypto.randomUUID();
    const newSub = { ...subscription, id, createdAt: new Date().toISOString() };
    await collections.subscriptions().doc(id).set(newSub);
    return newSub as Subscription;
  }

  async updateSubscriptionStatus(subscriptionId: string, status: string): Promise<void> {
    await collections.subscriptions().doc(subscriptionId).update({ status });
  }

  async getUserCredits(userId: string): Promise<Credits | undefined> {
    const doc = await collections.credits().doc(userId).get();
    return doc.exists ? doc.data() as Credits : undefined;
  }

  async createCredits(credits: any): Promise<Credits> {
    const id = credits.userId;
    await collections.credits().doc(id).set(credits);
    return credits as Credits;
  }

  async deductCredits(userId: string, amount: number, feature: string, description: string): Promise<boolean> {
    const creditsRef = collections.credits().doc(userId);
    const doc = await creditsRef.get();
    
    if (!doc.exists) return false;
    const current = doc.data() as Credits;
    const available = (current.totalCredits || 0) - (current.usedCredits || 0);
    if (available < amount) return false;
    
    await creditsRef.update({
      usedCredits: admin.firestore.FieldValue.increment(amount)
    });
    
    await collections.creditLogs().add({
      id: crypto.randomUUID(),
      userId,
      amount: -amount,
      action: 'used',
      feature,
      description,
      createdAt: new Date(),
    });
    
    return true;
  }

  async refundCredits(userId: string, amount: number, feature: string): Promise<void> {
    await collections.credits().doc(userId).update({
      usedCredits: admin.firestore.FieldValue.increment(-amount)
    });
    
    await collections.creditLogs().add({
      id: crypto.randomUUID(),
      userId,
      amount,
      action: 'refunded',
      feature,
      description: 'Credit refund',
      createdAt: new Date(),
    });
  }

  async refreshDailyCredits(userId: string, dailyAmount: number): Promise<void> {
    await collections.credits().doc(userId).update({
      totalCredits: admin.firestore.FieldValue.increment(dailyAmount),
      lastRefreshDate: new Date(),
    });
  }

  async setUserCredits(userId: string, totalCredits: number): Promise<void> {
    const creditsRef = collections.credits().doc(userId);
    const doc = await creditsRef.get();
    
    if (!doc.exists) {
      await creditsRef.set({
        id: crypto.randomUUID(),
        userId,
        totalCredits,
        usedCredits: 0,
        lastRefreshDate: new Date(),
        renewalDate: null,
      });
    } else {
      await creditsRef.update({ totalCredits });
    }
    
    await collections.creditLogs().add({
      id: crypto.randomUUID(),
      userId,
      amount: totalCredits,
      action: 'admin_set',
      feature: 'admin_adjustment',
      description: 'Admin set total credits',
      createdAt: new Date(),
    });
  }

  async getCreditLog(userId: string, limit: number = 50): Promise<CreditLog[]> {
    const snapshot = await collections.creditLogs()
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CreditLog));
  }

  async getAllPlans(): Promise<Plan[]> {
    const snapshot = await collections.plans().get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plan));
  }

  async getPlanById(planId: string): Promise<Plan | undefined> {
    const doc = await collections.plans().doc(planId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } as Plan : undefined;
  }

  async getPlansByType(type: 'free' | 'basic' | 'pro' | 'enterprise', userType: 'user' | 'vendor'): Promise<Plan[]> {
    const snapshot = await collections.plans()
      .where('type', '==', type)
      .where('userType', '==', userType)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plan));
  }

  async getUserRoutes(userId: string): Promise<CloakedRoute[]> {
    const snapshot = await collections.routes().where('userId', '==', userId).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CloakedRoute));
  }

  async createRoute(route: any): Promise<CloakedRoute> {
    const id = crypto.randomUUID();
    const newRoute = { ...route, id, createdAt: new Date().toISOString() };
    await collections.routes().doc(id).set(newRoute);
    return newRoute as CloakedRoute;
  }

  async updateRouteStatus(routeId: string, status: string): Promise<void> {
    await collections.routes().doc(routeId).update({ status });
  }

  async deleteRoute(routeId: string): Promise<void> {
    await collections.routes().doc(routeId).delete();
  }

  async getRouteAlerts(routeId: string, limit: number = 50): Promise<TrafficAlert[]> {
    const snapshot = await collections.alerts()
      .where('routeId', '==', routeId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrafficAlert));
  }

  async createAlert(alert: any): Promise<TrafficAlert> {
    const id = crypto.randomUUID();
    const newAlert = { ...alert, id, timestamp: new Date().toISOString() };
    await collections.alerts().doc(id).set(newAlert);
    return newAlert as TrafficAlert;
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    await collections.alerts().doc(alertId).update({ acknowledged: true });
  }

  async updateUserKYC(userId: string, kycStatus: string, kycDocument?: string): Promise<void> {
    const updateData: any = { kycStatus };
    if (kycDocument) updateData.kycDocument = kycDocument;
    await collections.profiles().doc(userId).update(updateData);
  }

  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const doc = await collections.profiles().doc(userId).get();
    if (!doc.exists) return undefined;
    return doc.data() as UserProfile;
  }

  async updateUserProfile(userId: string, profile: any): Promise<void> {
    await collections.profiles().doc(userId).set(profile, { merge: true });
  }

  async submitVendorApplication(userId: string, app: any): Promise<VendorApplication> {
    const id = crypto.randomUUID();
    const newApp = { ...app, id, userId, status: 'pending', createdAt: new Date().toISOString() };
    await collections.vendorApplications().doc(userId).set(newApp);
    return newApp as VendorApplication;
  }

  async getVendorApplication(userId: string): Promise<VendorApplication | undefined> {
    const doc = await collections.vendorApplications().doc(userId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } as VendorApplication : undefined;
  }

  async approveVendorApplication(userId: string): Promise<void> {
    await collections.vendorApplications().doc(userId).update({ status: 'approved' });
    await collections.profiles().doc(userId).update({ vendorMode: true });
  }

  async rejectVendorApplication(userId: string): Promise<void> {
    await collections.vendorApplications().doc(userId).update({ status: 'rejected' });
  }

  async switchVendorMode(userId: string, vendorMode: boolean): Promise<void> {
    await collections.profiles().doc(userId).update({ vendorMode });
  }

  async getDashboardTraffic(userId: string): Promise<DashboardTrafficCard | undefined> {
    const doc = await collections.dashboardTraffic().doc(userId).get();
    return doc.exists ? doc.data() as DashboardTrafficCard : undefined;
  }

  async updateDashboardTraffic(userId: string, location: string, status: string, description: string): Promise<void> {
    await collections.dashboardTraffic().doc(userId).set({
      userId,
      location,
      status,
      description,
      lastUpdate: new Date().toISOString(),
    });
  }

  async getEvents(): Promise<Event[]> {
    const snapshot = await collections.events().orderBy('date', 'asc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
  }

  async createEvent(event: any): Promise<Event> {
    const id = crypto.randomUUID();
    const newEvent = { ...event, id, createdAt: new Date().toISOString() };
    await collections.events().doc(id).set(newEvent);
    return newEvent as Event;
  }

  async updateEvent(eventId: string, event: any): Promise<void> {
    await collections.events().doc(eventId).update(event);
  }

  async deleteEvent(eventId: string): Promise<void> {
    await collections.events().doc(eventId).delete();
  }

  async registerForEvent(eventId: string, userId: string): Promise<void> {
    await collections.events().doc(eventId).update({
      registrations: admin.firestore.FieldValue.arrayUnion(userId)
    });
  }

  async getVendorServices(): Promise<VendorService[]> {
    const snapshot = await collections.vendorServices().get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VendorService));
  }

  async getVendorServiceById(serviceId: string): Promise<VendorService | undefined> {
    const doc = await collections.vendorServices().doc(serviceId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } as VendorService : undefined;
  }

  async createVendorService(service: any): Promise<VendorService> {
    const id = crypto.randomUUID();
    const newService = { ...service, id, createdAt: new Date().toISOString() };
    await collections.vendorServices().doc(id).set(newService);
    return newService as VendorService;
  }

  async updateVendorService(serviceId: string, service: any): Promise<void> {
    await collections.vendorServices().doc(serviceId).update(service);
  }

  async deleteVendorService(serviceId: string): Promise<void> {
    await collections.vendorServices().doc(serviceId).delete();
  }

  async getAdminSettings(category?: string): Promise<AdminSetting[]> {
    let query: admin.firestore.Query = collections.adminSettings();
    if (category) {
      query = query.where('category', '==', category);
    }
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ key: doc.id, ...doc.data() } as AdminSetting));
  }

  async getAdminSetting(key: string): Promise<AdminSetting | undefined> {
    const doc = await collections.adminSettings().doc(key).get();
    return doc.exists ? { key: doc.id, ...doc.data() } as AdminSetting : undefined;
  }

  async setAdminSetting(key: string, value: string, category: string, isSecret: boolean = false): Promise<void> {
    await collections.adminSettings().doc(key).set({
      key,
      value,
      category,
      isSecret,
      updatedAt: new Date().toISOString(),
    });
  }

  async getPayments(userId?: string): Promise<Payment[]> {
    let query: admin.firestore.Query = collections.payments();
    if (userId) {
      query = query.where('userId', '==', userId);
    }
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
  }

  async createPayment(payment: any): Promise<Payment> {
    const id = crypto.randomUUID();
    const newPayment = { ...payment, id, createdAt: new Date().toISOString() };
    await collections.payments().doc(id).set(newPayment);
    return newPayment as Payment;
  }

  async updatePaymentStatus(paymentId: string, status: string, providerRef?: string): Promise<void> {
    const update: any = { status };
    if (providerRef) update.providerRef = providerRef;
    await collections.payments().doc(paymentId).update(update);
  }

  async getAllUsers(): Promise<UserProfile[]> {
    const snapshot = await collections.profiles().get();
    return snapshot.docs.map(doc => doc.data() as UserProfile);
  }

  async getAllVendorApplications(): Promise<VendorApplication[]> {
    const snapshot = await collections.vendorApplications().get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VendorApplication));
  }
}

export const firestoreStorage = new FirestoreStorage();
