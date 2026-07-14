import admin from "firebase-admin";
import fs from "fs";
import path from "path";

const serviceAccountPath = path.join(process.cwd(), 'legal-13d13-firebase-adminsdk-fbsvc-e736182a52.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error("Error: legal-13d13-firebase-adminsdk-fbsvc-e736182a52.json service account key not found in root.");
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'legal-13d13'
});

const db = admin.firestore();
const appId = process.env.FIREBASE_APP_ID || "legal-13d13";
const docRef = db.collection('artifacts').doc(appId);

async function seed() {
  console.log("Initializing Firebase collections for appId:", appId);

  // 1. Seed Plans
  const plans = [
    {
      id: "plan-free",
      name: "Citizen Free",
      type: "free",
      userType: "user",
      price: 0,
      credits: 10,
      billingCycle: "monthly",
      description: "Perfect for everyday civic awareness",
      features: ["10 Free Daily Credits", "Basic AI Legal Guidance", "Community Forum Access", "Real-time Traffic Alerts", "Public Marketplace View"]
    },
    {
      id: "plan-pro",
      name: "Sabi Pro",
      type: "pro",
      userType: "user",
      price: 2500,
      credits: 500,
      billingCycle: "monthly",
      description: "Enhanced features for frequent users",
      features: ["500 Monthly Credits", "Priority AI Support", "Advanced Route Optimization", "Verified Pro Matching", "Job Board Early Access", "Ad-free Experience"]
    },
    {
      id: "plan-vendor",
      name: "Vendor Elite",
      type: "pro",
      userType: "vendor",
      price: 10000,
      credits: 1000,
      billingCycle: "monthly",
      description: "For professionals offering services",
      features: ["Unlimited Marketplace Listings", "Verified Professional Badge", "Featured Service Placement", "Client Lead Analytics", "Custom Business Profile", "Direct Messaging Access"]
    },
    {
      id: "plan-vendor-enterprise",
      name: "Vendor Enterprise",
      type: "enterprise",
      userType: "vendor",
      price: 25000,
      credits: 10000,
      billingCycle: "yearly",
      description: "Best value for large vendors and service ecosystems",
      features: ["Unlimited Marketplace Listings", "Dedicated Account Support", "Advanced Analytics & Reporting", "Priority Lead Matching", "Custom Business Growth Plan", "Enterprise Workflow Automation"]
    }
  ];

  console.log("Seeding plans...");
  for (const plan of plans) {
    await docRef.collection('plans').doc(plan.id).set({
      ...plan,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  // 2. Seed Default Admin Settings
  const settings = [
    { key: "site_title", value: "SabiRight", category: "general" },
    { key: "seo_title", value: "SabiRight - AI Civic Super-App", category: "general" },
    { key: "seo_description", value: "SabiRight is an AI-powered Civic Super-App for emerging markets. Legal First Aid, Smart Traffic routing, AI-powered Jobs, and a Verified Marketplace.", category: "general" },
    { key: "ai_provider", value: "google", category: "ai" },
    { key: "google_gemini_api_key", value: process.env.GEMINI_API_KEY || "", category: "ai" },
    { key: "tavily_api_key", value: process.env.TAVILY_API_KEY || "", category: "ai" },
    { key: "active_languages", value: '["English", "Nigerian Pidgin", "Hausa", "Yoruba", "Igbo"]', category: "general" },
    { key: "flag_shadow_threshold", value: "5", category: "moderation" },
    { key: "video_demo_url", value: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", category: "general" }
  ];

  console.log("Seeding admin settings...");
  for (const setting of settings) {
    // Seed both 'settings' and 'adminSettings' collections for full compatibility
    await docRef.collection('settings').doc(setting.key).set({
      ...setting,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    await docRef.collection('adminSettings').doc(setting.key).set({
      ...setting,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  // 3. Seed Default Testimonials
  const testimonials = [
    {
      id: "testi-1",
      name: "Chidi O.",
      role: "Business Owner",
      content: "SabiRight helped me understand my rights during a police stop in Lagos. The AI guidance was calm and accurate.",
      rating: 5,
      isActive: true
    },
    {
      id: "testi-2",
      name: "Amaka E.",
      role: "Law Student",
      content: "The Legal First Aid feature is revolutionary. It breaks down complex Nigerian laws into simple, actionable steps.",
      rating: 5,
      isActive: true
    },
    {
      id: "testi-3",
      name: "Tunde W.",
      role: "Daily Commuter",
      content: "I use SabiRight every day for traffic alerts. It has saved me hours of frustration on the road.",
      rating: 5,
      isActive: true
    }
  ];

  console.log("Seeding testimonials...");
  for (const t of testimonials) {
    await docRef.collection('testimonials').doc(t.id).set(t);
  }

  // 4. Seed FAQs
  const faqs = [
    {
      id: "faq-1",
      question: "How accurate is the SabiRight AI Agent?",
      answer: "SabiRight uses Retrieval-Augmented Generation (RAG) referencing the 1999 Constitution and Police Act 2020 to minimize hallucinations.",
      isActive: true,
      order: 1
    },
    {
      id: "faq-2",
      question: "Is the platform free to use?",
      answer: "Yes! Core features like basic AI legal guidance, community forums, and traffic updates are completely free with daily credit topups.",
      isActive: true,
      order: 2
    }
  ];

  console.log("Seeding FAQs...");
  for (const faq of faqs) {
    await docRef.collection('faqs').doc(faq.id).set(faq);
  }

  console.log("Firebase initialized and seeded successfully!");
}

seed().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
