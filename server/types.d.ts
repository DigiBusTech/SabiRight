import { Request } from 'express';
import { UserRecord } from 'firebase-admin/auth';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      isAdmin?: boolean;
      user?: UserRecord | { uid: string; email?: string | undefined; displayName?: string | undefined; };
      booking?: any;
    }
  }
}

export interface UserProfile {
  userId: string;
  email: string | null;
  displayName: string | null;
  phoneNumber?: string | null;
  dob?: string | null;
  gender?: string | null;
  state?: string | null;
  city?: string | null;
  isAdmin: boolean;
  isVendor: boolean;
  emailVerified: boolean;
  emailVerificationStatus: 'pending' | 'verified' | 'rejected';
  emailVerifiedAt?: string | Date | null;
  vendorMode: boolean;
  createdAt: Date;
  chatStorageLimit: number;
  chatStorageUsed: number;
}

export interface ProfessionalCredentials {
  certificates: string[];
  idDocuments: string[];
  adminNotes?: string;
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
}

export interface ProfessionalLocation {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude: number;
  longitude: number;
  geohash: string;
}

export interface ProfessionalWallet {
  NGN: number;
  USD: number;
  credits: number;
  updatedAt: Date;
}

export interface Professional {
  id: string;
  userId: string;
  displayName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  role: 'lawyer' | 'accountant' | 'cac_agent' | 'tax_agent' | 'other';
  specializations: string[];
  status: 'pending' | 'active' | 'suspended';
  verified: boolean;
  credentials: ProfessionalCredentials;
  location: ProfessionalLocation;
  wallet: ProfessionalWallet;
  rating?: number;
  reviewCount?: number;
  publicProfile?: {
    bio?: string;
    servicesOffered?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfessionalApplication {
  id: string;
  userId: string;
  businessName: string;
  role: string;
  serviceType: string;
  credentials?: string[];
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewerId?: string;
  notes?: string;
}

export interface ProfessionalService {
  id: string;
  professionalId: string;
  name: string;
  type: string;
  specialization?: string;
  description?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  contactPhone?: string;
  contactEmail?: string;
  priceRange?: string;
  priceList?: any[];
  verified?: boolean;
  rating?: string;
  distance?: number;
  createdAt: Date;
}

export interface AdminSetting {
  key: string;
  value: any;
  category: string;
  isSecret: boolean;
}

export interface UserCredits {
  userId: string;
  totalCredits: number;
  usedCredits: number;
  renewalDate?: string;
  planCredits?: number;
}

export interface UserPlan {
  id: string;
  name: string;
  type: 'free' | 'basic' | 'pro' | 'enterprise';
  userType: 'user' | 'vendor';
  price: number;
  credits: number;
  billingCycle?: 'monthly' | 'yearly';
  features: string[];
  description?: string;
  monthlyCredits?: number;
  dailyCredits?: number;
  createdAt: Date;
}

export interface Route {
  id: string;
  userId: string;
  routeName: string;
  startLocation: string;
  endLocation: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  status: 'active' | 'cleared' | 'unknown';
  createdAt: Date;
}

export interface Alert {
  id: string;
  routeId: string;
  userId: string;
  alertType: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: Date;
  acknowledged: boolean;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  location: string;
  category: string;
  organizer: string;
  organizerId: string;
  maxAttendees?: number;
  capacity?: number;
  createdAt: Date;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  workMode: string;
  salary: string;
  description: string;
  contact: string;
  postedBy: string;
  source: string;
  isAiFetched: boolean;
  createdAt: Date;
}

export interface VendorService {
  id: string;
  vendorId: string;
  name: string;
  type: string;
  specialization?: string;
  description?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  contactPhone?: string;
  contactEmail?: string;
  priceRange?: string;
  priceList?: any[];
  verified?: boolean;
  rating?: string;
  distance?: number;
  createdAt: Date;
}

export interface MoatData {
  id: string;
  title: string;
  content: string;
  category: string;
  source: string;
  metadata?: any;
  createdAt: Date;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  createdAt: Date;
}

export interface Testimonial {
  id: string;
  author: string;
  content: string;
  rating: number;
  createdAt: Date;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  description?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  active: boolean;
  icon?: string;
  description?: string;
  instructions?: string;
  fields?: any[];
  publicKey?: string;
  secretKey?: string;
  webhookHash?: string;
  createdAt: Date;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  provider: string;
  paymentMethod?: string;
  reference?: string;
  type: string;
  description?: string;
  metadata?: any;
  status: 'pending' | 'completed' | 'failed';
  providerRef?: string;
  rejectionReason?: string;
  createdAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'pending';
  startDate: string;
  endDate?: string;
  createdAt: Date;
}

export interface VendorApplication {
  id: string;
  userId: string;
  businessName: string;
  serviceType: string;
  businessDocument?: string;
  taxId?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

export interface VendorLead {
  id: string;
  vendorId: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  serviceType: string;
  message?: string;
  metadata?: any;
  createdAt: Date;
}

export interface ForumPost {
  id: string;
  userId: string;
  content: string;
  city: string;
  author: string;
  upvotes: number;
  downvotes: number;
  comments: any[];
  flagged: boolean;
  flagCount: number;
  flaggedBy: string[];
  shadowedForReview: boolean;
  upvotedBy: string[];
  createdAt: Date;
  shadowedAt?: Date;
  reinstatedAt?: Date;
  reinstatedBy?: string;
}

export interface Survey {
  id: string;
  userId: string;
  feature: string;
  rating: number;
  feedback?: string;
  createdAt: Date;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SabiGuardMessage {
  id: string;
  chatId: string;
  userId: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResult {
  valid: boolean;
  userId?: string;
  isAdmin?: boolean;
  error?: string;
}

export interface IFirestoreStorage {
  // User Profile
  getUserProfile(userId: string): Promise<UserProfile | null>;
  toggleUserAdmin(userId: string, isAdmin: boolean): Promise<boolean>;
  updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null>;
  createUser(user: any): Promise<any>;
  deleteUser(userId: string): Promise<boolean>;
  getAllUsers(): Promise<UserProfile[]>;
  generateReferralCode(userId: string): Promise<string>;
  processReferral(referrerId: string, referralCode: string): Promise<void>;

  // Credits & Plans
  getUserCredits(userId: string): Promise<UserCredits | null>;
  deductCredits(userId: string, amount: number, feature: string, description: string): Promise<boolean>;
  addCredits(userId: string, credits: number, description: string): Promise<void>;
  refundCredits(userId: string, amount: number, feature: string): Promise<void>;
  getAllPlans(): Promise<UserPlan[]>;
  getPlansByType(type: string, userType: 'user' | 'vendor'): Promise<UserPlan[]>;
  getUserPlan(userId: string): Promise<UserPlan | null>;
  getUserSubscription(userId: string): Promise<Subscription | null>;
  assignDefaultPlan(userId: string, userType: 'user' | 'vendor'): Promise<UserPlan | null>;
  createPlan(plan: Omit<UserPlan, 'id' | 'createdAt'>): Promise<UserPlan>;
  updatePlan(planId: string, updates: Partial<UserPlan>): Promise<UserPlan | null>;
  deletePlan(planId: string): Promise<boolean>;
  getPlanById(planId: string): Promise<UserPlan | null>;
  refreshDailyCredits(userId: string, dailyCredits: number): Promise<void>;
  refreshMonthlyCredits(userId: string, monthlyCredits: number): Promise<void>;
  getCreditLog(userId: string): Promise<any[]>;
  setUserCredits(userId: string, totalCredits: number): Promise<void>;
  getCreditPackages(): Promise<CreditPackage[]>;
  createCreditPackage(data: Omit<CreditPackage, 'id'>): Promise<CreditPackage>;
  updateCreditPackage(packageId: string, updates: Partial<CreditPackage>): Promise<CreditPackage | null>;
  deleteCreditPackage(packageId: string): Promise<boolean>;
  updateSubscriptionStatus(subscriptionId: string, status: 'active' | 'cancelled' | 'pending'): Promise<void>;
  createSubscription(sub: Omit<Subscription, 'id' | 'createdAt'>): Promise<Subscription>;

  // Admin & Settings
  getAdminSetting(key: string): Promise<AdminSetting | null>;
  getAdminSettings(category?: string): Promise<AdminSetting[]>;
  setAdminSetting(key: string, value: any, category: string, isSecret: boolean): Promise<void>;
  getImpersonationToken(userId: string): Promise<string>;

  // SabiGuard & Moat Data
  getSabiGuardMessages(chatId: string): Promise<SabiGuardMessage[]>;
  addSabiGuardMessage(chatId: string, role: 'user' | 'ai', content: string): Promise<void>;
  updateChatStorageUsed(userId: string, bytes: number): Promise<void>;
  getMoatData(category?: string): Promise<MoatData[]>;
  createMoatData(data: Omit<MoatData, 'id' | 'createdAt'>): Promise<MoatData>;
  deleteMoatData(id: string): Promise<void>;

  // Professionals
  getProfessionals(filters?: { status?: string; role?: string; city?: string; verified?: boolean }): Promise<Professional[]>;
  getProfessionalById(professionalId: string): Promise<Professional | null>;
  createProfessional(data: Omit<Professional, 'id' | 'createdAt' | 'updatedAt'>): Promise<Professional>;
  updateProfessional(professionalId: string, updates: Partial<Professional>): Promise<void>;
  getProfessionalServices(filters: { professionalId?: string; type?: string; city?: string }): Promise<ProfessionalService[]>;
  createProfessionalService(service: Omit<ProfessionalService, 'id' | 'createdAt'>): Promise<ProfessionalService>;
  getProfessionalServiceById(serviceId: string): Promise<ProfessionalService | null>;
  updateProfessionalService(serviceId: string, updates: Partial<ProfessionalService>): Promise<void>;
  deleteProfessionalService(serviceId: string): Promise<void>;
  submitProfessionalApplication(userId: string, application: Omit<ProfessionalApplication, 'id' | 'createdAt' | 'status' | 'userId' | 'submittedAt'>): Promise<ProfessionalApplication>;
  getProfessionalApplication(userId: string): Promise<ProfessionalApplication | null>;
  getAllProfessionalApplications(): Promise<ProfessionalApplication[]>;
  approveProfessionalApplication(userId: string): Promise<void>;
  rejectProfessionalApplication(userId: string): Promise<void>;

  // Vendor & Services (deprecated, kept for compatibility)
  getVendorServices(filters: { type?: string; city?: string; lat?: number; lng?: number }): Promise<VendorService[]>;
  toggleUserVendor(userId: string, isVendor: boolean): Promise<boolean>;
  submitVendorApplication(userId: string, application: Omit<VendorApplication, 'id' | 'createdAt' | 'status' | 'userId'>): Promise<VendorApplication>;
  getVendorApplication(userId: string): Promise<VendorApplication | null>;
  getAllVendorApplications(): Promise<VendorApplication[]>;
  approveVendorApplication(userId: string): Promise<void>;
  rejectVendorApplication(userId: string): Promise<void>;
  switchVendorMode(userId: string, mode: boolean): Promise<void>;
  getAllVendors(): Promise<UserProfile[]>;
  createVendorService(service: Omit<VendorService, 'id' | 'createdAt'>): Promise<VendorService>;
  updateVendorService(serviceId: string, updates: Partial<VendorService>): Promise<void>;
  deleteVendorService(serviceId: string): Promise<void>;

  // Routes & Alerts
  getUserRoutes(userId: string): Promise<Route[]>;
  createRoute(route: Omit<Route, 'id' | 'createdAt'>): Promise<Route>;
  getRoute(routeId: string): Promise<Route | null>;
  updateRouteStatus(routeId: string, status: string, recommendation?: string, cloakedStreets?: string[]): Promise<void>;
  deleteRoute(routeId: string): Promise<void>;
  getRouteAlerts(routeId: string): Promise<Alert[]>;
  createAlert(alert: Omit<Alert, 'id' | 'createdAt' | 'acknowledged'>): Promise<Alert>;
  acknowledgeAlert(alertId: string): Promise<void>;
  updateDashboardTraffic(userId: string, location: string, status: string, description: string): Promise<void>;
  getDashboardTraffic(userId: string): Promise<any | null>;

  // Email & Notifications
  setEmailVerificationCode(userId: string, code: string, expires: Date): Promise<void>;
  clearEmailVerificationCode(userId: string): Promise<void>;
  sendEmailNotification(notification: any, profile: UserProfile | null): Promise<any>;
  sendNotification(notification: any): Promise<void>;
  createNotification(notification: any): Promise<void>;
  updateEmailVerificationStatus(userId: string, status: UserProfile['emailVerificationStatus']): Promise<void>;
  verifyEmailCode(userId: string, code: string): Promise<boolean>;

  // Events
  getEvents(): Promise<Event[]>;
  createEvent(event: Omit<Event, 'id' | 'createdAt'>): Promise<Event>;
  updateEvent(eventId: string, updates: Partial<Event>): Promise<void>;
  deleteEvent(eventId: string): Promise<void>;
  registerForEvent(eventId: string, userId: string): Promise<void>;
  saveEvent(userId: string, eventId: string): Promise<void>;
  unsaveEvent(userId: string, eventId: string): Promise<void>;
  getSavedEvents(userId: string): Promise<string[]>;

  // Jobs
  getJobs(limit?: number): Promise<Job[]>;
  createJob(job: Omit<Job, 'id' | 'createdAt'>): Promise<Job>;
  updateJob(jobId: string, updates: Partial<Job>): Promise<void>;
  deleteJob(jobId: string): Promise<void>;
  saveJob(userId: string, jobId: string): Promise<void>;
  unsaveJob(userId: string, jobId: string): Promise<void>;
  getSavedJobs(userId: string): Promise<Job[]>;
  getSavedJobIds(userId: string): Promise<string[]>;
  applyToJob(userId: string, jobId: string): Promise<any>;
  getAppliedJobs(userId: string): Promise<Job[]>;
  getAppliedJobIds(userId: string): Promise<string[]>;
  updateApplicationStatus(userId: string, jobId: string, status: string): Promise<void>;
  getGeneratedJobs(userId?: string): Promise<Job[]>;
  createGeneratedJob(userId: string, job: Omit<Job, 'id' | 'createdAt'>): Promise<Job>;
  deleteGeneratedJob(jobId: string): Promise<void>;

  // Payments & Wallet
  getPaymentMethods(): Promise<PaymentMethod[]>;
  getActivePaymentMethods(): Promise<PaymentMethod[]>;
  createPaymentMethod(data: Omit<PaymentMethod, 'id' | 'createdAt'>): Promise<PaymentMethod>;
  updatePaymentMethod(methodId: string, updates: Partial<PaymentMethod>): Promise<PaymentMethod | null>;
  deletePaymentMethod(methodId: string): Promise<boolean>;
  getPayments(userId?: string): Promise<Payment[]>;
  createPayment(payment: Omit<Payment, 'id' | 'createdAt' | 'status'>): Promise<Payment>;
  updatePayment(paymentId: string, updates: Partial<Payment>): Promise<void>;
  updatePaymentStatus(paymentId: string, status: Payment['status'], providerRef?: string): Promise<void>;
  getPayment(paymentId: string): Promise<Payment | null>;
  getWalletByUserId(userId: string): Promise<Wallet | null>;
  createWallet(userId: string, currency: string): Promise<Wallet>;
  topUpWallet(userId: string, amount: number, reference: string, description: string): Promise<void>;
  deductFromWallet(userId: string, amount: number, type: string, reference: string, description: string): Promise<void>;

  // Vendor Analytics & Leads
  getVendorStats(vendorId: string): Promise<any>;
  getVendorLeads(vendorId: string): Promise<VendorLead[]>;
  getBookingsByVendorId(vendorId: string): Promise<any[]>;
  createVendorBooking(booking: any): Promise<any>;
  updateVendorBooking(bookingId: string, updates: any): Promise<void>;
  getBookingById(bookingId: string): Promise<any | null>;
  createVendorLead(lead: Omit<VendorLead, 'id' | 'createdAt'>): Promise<VendorLead>;

  // Forum
  getForumPosts(): Promise<ForumPost[]>;
  getForumPost(postId: string): Promise<ForumPost | null>;
  createForumPost(post: Omit<ForumPost, 'id' | 'createdAt'>): Promise<ForumPost>;
  updateForumPost(postId: string, updates: Partial<ForumPost>): Promise<void>;
  deleteForumPost(postId: string): Promise<void>;
  addForumComment(postId: string, comment: any): Promise<any>;
  deleteForumComment(postId: string, commentId: string): Promise<void>;
  voteForumPost(postId: string, userId: string, type: 'up' | 'down'): Promise<void>;

  // Survey
  getSurveys(): Promise<Survey[]>;
  createSurvey(survey: Omit<Survey, 'id' | 'createdAt'>): Promise<Survey>;

  // FAQ
  getFaqs(): Promise<Faq[]>;
  createFaq(faq: Omit<Faq, 'id' | 'createdAt'>): Promise<Faq>;
  updateFaq(id: string, updates: Partial<Faq>): Promise<Faq | null>;
  deleteFaq(id: string): Promise<boolean>;

  // Testimonial
  getTestimonials(): Promise<Testimonial[]>;
  createTestimonial(testimonial: Omit<Testimonial, 'id' | 'createdAt'>): Promise<Testimonial>;
  updateTestimonial(id: string, updates: Partial<Testimonial>): Promise<Testimonial | null>;
  deleteTestimonial(id: string): Promise<boolean>;

  // Booking system fix
  createBooking(data: any): Promise<any>;
  createMilestone(data: { bookingId: string; title: string; description?: string; amountPercent: number; amount: string; order: number; dueDate?: string | null }): Promise<any>;
  createEscrowAccount(data: { bookingId: string; totalAmount: string }): Promise<any>;
  updateBookingStatus(id: string, status: string): Promise<void>;
  fundEscrow(bookingId: string, amount: number, userId: string): Promise<any>;
  updateMilestoneStatus(id: string, status: string): Promise<void>;

  // Extra Methods
  createBookingMessage(data: { bookingId: string; senderId: string; message: string; attachments?: any[]; isAdminMessage: boolean }): Promise<any>;
  getBookingMessages(bookingId: string, limit?: number): Promise<any[]>;
  getBookingsByUserId(userId: string): Promise<any[]>;
  getNotificationsByUserId(userId: string, limit?: number): Promise<any[]>;
  getSabiGuardChats(userId: string): Promise<any[]>;
  createSabiGuardChat(userId: string, title: string): Promise<any>;
  deleteSabiGuardChat(chatId: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  getDisputes(): Promise<any[]>;
  getTrainingTerms(): Promise<any[]>;
  getAllCrowdTranslations(): Promise<any[]>;
  getCrowdTranslationStats(): Promise<any>;
  getAllNotificationTemplates(): Promise<any[]>;
  getSmtpSettings(): Promise<any>;
  getPushSettings(): Promise<any>;
  getAllVendorServices(): Promise<any[]>;
  getAllCoupons(): Promise<any[]>;
  getCouponByCode(code: string): Promise<any | null>;
  createCoupon(data: any): Promise<any>;
  updateCoupon(id: string, updates: any): Promise<any>;
  deleteCoupon(id: string): Promise<boolean>;
  validateCoupon(code: string): Promise<any>;
  getWalletTransactions(userId: string, limit?: number): Promise<any[]>;
  getBookingDetails(id: string): Promise<any | null>;
  getMilestoneById(id: string): Promise<any | null>;
  voteForumComment(postId: string, commentId: string, userId: string): Promise<void>;
  cleanupOldGeneratedJobs(olderThanHours?: number): Promise<number>;
  getEscrowByBookingId(bookingId: string): Promise<any | null>;
  releaseEscrowMilestone(escrowId: string, milestoneId: string, vendorId: string, userId: string): Promise<any>;
  getContractByBookingId(bookingId: string): Promise<any | null>;
  createContract(data: any): Promise<any>;
  signContract(bookingId: string, signerType: 'user' | 'vendor'): Promise<any>;
  getDisputeByBookingId(bookingId: string): Promise<any | null>;
  getDisputeById(id: string): Promise<any | null>;
  createDispute(data: any): Promise<any>;
  resolveDispute(id: string, resolution: string, notes: string, adminId: string): Promise<any>;
  joinDispute(id: string, adminId: string): Promise<any>;
  getVendorServiceById(serviceId: string): Promise<VendorService | null>;
  approveVendorService(id: string): Promise<void>;
  rejectVendorService(id: string): Promise<void>;
  getNotificationById(id: string): Promise<any | null>;
  markNotificationAsRead(id: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<number>;
  getNotificationTemplateByName(name: string): Promise<any | null>;
  createNotificationTemplate(data: any): Promise<any>;
  updateNotificationTemplate(id: string, updates: any): Promise<any>;
  deleteNotificationTemplate(id: string): Promise<boolean>;
  updateSmtpSettings(settings: any): Promise<any>;
  updatePushSettings(settings: any): Promise<any>;
  submitTranslation(data: any): Promise<any>;
  getRandomTranslationForVerification(userId: string): Promise<any | null>;
  voteTranslation(id: string, vote: boolean): Promise<void>;
  getVerifiedTranslations(minVotes: number): Promise<any[]>;
  createTrainingTerm(data: any): Promise<any>;
  deleteTrainingTerm(id: string): Promise<void>;
  subscribeToPush(data: any): Promise<any>;
  unsubscribeFromPush(userId: string, endpoint: string): Promise<boolean>;
  getPushSubscriptions(userId: string): Promise<any[]>;
}
