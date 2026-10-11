# SabiRight Enterprise Platform

<div align="center">
  <img src="client/public/favicon.png" alt="SabiRight Logo" width="104" height="104" />
  <h2>⚖️ SabiRight — Civic Intellect & Justice Infrastructure</h2>
  <p><strong>Omnichannel AI legal first-aid, accredited practitioner directory, statutory de-escalation intelligence, and unified cross-channel civic infrastructure for Nigeria and Africa.</strong></p>

  <div>
    <img src="https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Node.js-20.x-green?logo=node.js" alt="Node.js" />
    <img src="https://img.shields.io/badge/React-19-61dafb?logo=react" alt="React 19" />
    <img src="https://img.shields.io/badge/Vite-7.1-646CFF?logo=vite" alt="Vite 7" />
    <img src="https://img.shields.io/badge/TailwindCSS-v4.1-38B2AC?logo=tailwind-css" alt="Tailwind CSS v4" />
    <img src="https://img.shields.io/badge/Expo-SDK_52-black?logo=expo" alt="Expo SDK 52" />
    <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase" alt="Supabase PostgreSQL" />
    <img src="https://img.shields.io/badge/Capacitor-v8.0-119EFF?logo=capacitor" alt="Capacitor 8" />
    <img src="https://img.shields.io/badge/AI_Engine-Gemini%202.0%20%7C%20Groq%20%7C%20GPT--4o%20%7C%20Claude-8A2BE2" alt="Multi-LLM" />
    <img src="https://img.shields.io/badge/Payments-Flutterwave%20%7C%20Bachs%20%7C%20Paystack-FF5A5F" alt="Payments" />
    <img src="https://img.shields.io/badge/Compliance-NDPC%20%7C%20NITDA-008751" alt="Compliance" />
  </div>
</div>

---

## 📑 Table of Contents

- [Executive Overview](#-executive-overview)
- [Key Enterprise Capabilities](#-key-enterprise-capabilities)
- [System Architecture](#-system-architecture)
- [Comprehensive Technology Stack](#-comprehensive-technology-stack)
- [End-to-End Operational Processes](#-end-to-end-operational-processes)
  - [1. Statutory Grounding & MOAT RAG Pipeline](#1-statutory-grounding--moat-rag-pipeline)
  - [2. Legal First Aid & Case Intake Referral Flow](#2-legal-first-aid--case-intake-referral-flow)
  - [3. Cross-Platform Channel Pairing & Account Linking](#3-cross-platform-channel-pairing--account-linking)
  - [4. Dynamic Payment Orchestration & Webhook Settlement](#4-dynamic-payment-orchestration--webhook-settlement)
  - [5. Offline Statutory MOAT Synchronization](#5-offline-statutory-moat-synchronization)
  - [6. Multi-Channel Notification Dispatch Pipeline](#6-multi-channel-notification-dispatch-pipeline)
- [Client Applications & Interfaces](#-client-applications--interfaces)
  - [Web Application (React 19 & Tailwind v4)](#web-application-react-19--tailwind-v4)
  - [Native Mobile Application (Expo SDK 52)](#native-mobile-application-expo-sdk-52)
  - [Omnichannel Bot Suite (WhatsApp Cloud & Telegram)](#omnichannel-bot-suite-whatsapp-cloud--telegram)
  - [Super Admin Control Plane & CMS](#super-admin-control-plane--cms)
- [Database Schema & Entity Relationship](#-database-schema--entity-relationship)
- [Directory Layout](#-directory-layout)
- [Installation & Quickstart Guide](#-installation--quickstart-guide)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Database Setup & Migrations](#database-setup--migrations)
  - [Running the Full-Stack Web & Backend](#running-the-full-stack-web--backend)
  - [Running the Native Mobile Client](#running-the-native-mobile-client)
- [API Gateway Reference](#-api-gateway-reference)
- [Bot Commands Reference](#-bot-commands-reference)
- [Security, Encryption & Regulatory Compliance](#-security-encryption--regulatory-compliance)
- [License & Maintainers](#-license--maintainers)

---

## 🏛 Executive Overview

**SabiRight** is an enterprise-grade civic intelligence and justice platform designed specifically for the Nigerian and greater African legal landscape. In environments where statutory knowledge is inaccessible, police checkpoints create arbitrary friction, and finding verified legal representation is cumbersome, SabiRight provides **accessible, real-time statutory protection** to citizens across every device and communication channel.

### The Dual-Engine Model
1. **Legal First Aid AI Engine:** Delivers instant, constitutionally grounded legal advice in plain English, Nigerian Pidgin, Yoruba, Hausa, and Igbo. Equips citizens with real-time de-escalation scripts citing relevant sections of the **Constitution of the Federal Republic of Nigeria (CFRN 1999 as amended)**, the **Administration of Criminal Justice Act (ACJA 2015)**, the **Police Act 2020**, and state-level tenancy statutes.
2. **Accredited Professional Directory:** A verified marketplace of Nigerian Bar Association (NBA) accredited lawyers, paralegals, and accredited consultants. When an inquiry exceeds initial guidance, the system synthesizes a standardized 5-part **Pre-Case File** and connects the citizen with nearby legal counsel through encrypted consultation rooms.

---

## 🚀 Key Enterprise Capabilities

- **Omnichannel Access:** Single unified experience across Responsive Web (Desktop/Mobile), Native iOS/Android (Expo), Progressive Web App (PWA), WhatsApp Cloud API, and Telegram Bot.
- **Gemini-Style Responsive Workspace:** Clean, minimalist navigation shell with compact icon rail, top toggle control (`PanelLeft`), "+ New Legal First Aid" quick-action pill, and floating hover tooltips when collapsed.
- **Statutory MOAT RAG:** Administrator-curated database of binding Nigerian jurisprudence that grounds every AI response in factual statutory law, eliminating legal hallucinations.
- **Multi-LLM Dynamic Routing:** Dynamic runtime fallback across **Google Gemini 2.0 Flash / Pro**, **Groq (Llama 3.3 70B)**, **OpenAI (GPT-4o)**, **Anthropic (Claude 3.5 Sonnet)**, **DeepSeek**, **Mistral**, and **Perplexity**.
- **Automated Pre-Case File Synthesis:** Converts multi-turn citizen chats into structured legal intake briefs complete with incident timelines, evidence logs, urgency scores, and recommended remedies.
- **SabiMove™ Transit & Checkpoint Radar:** Crowdsourced road intelligence allowing citizens to report and navigate around unauthorized roadblocks, checkpoints, and extortion zones across Nigerian transit corridors.
- **Dynamic Multi-Gateway Payments:** Seamless checkout via **Flutterwave Standard**, **Bachs Multi-Currency (Fiat & Crypto)**, **Paystack**, and **Manual Bank Transfers** with receipt OCR and admin approval.
- **Unified Credit Quota System:** Spendable credits shared across web, mobile, WhatsApp, and Telegram with daily free allowances, tiered monthly plans, and non-expiring top-up packs.
- **Consultation Rooms:** Secure in-app consultation portals with end-to-end messaging, image attachment compression, case milestones, and pre-case briefs.
- **Enterprise Notification Dispatcher:** Web Push (VAPID), Expo Push (EAS), and transactional SMTP emails with single-use hashed verification tokens and atomic anti-abuse limits.

---

## 📐 System Architecture

```text
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │                                   CLIENT SURFACES                                      │
  │                                                                                        │
  │  [ React 19 / Vite Web ]   [ Expo Native Mobile ]   [ WhatsApp Bot ]   [ Telegram Bot ]│
  │  (PWA & Desktop & Mobile)   (iOS & Android Native)   (Meta Cloud API)  (Telegram API)  │
  └──────────────┬────────────────────────┬─────────────────────┬─────────────────┬────────┘
                 │                        │                     │                 │
                 │ REST / SSE             │ REST / Offline Sync │ Webhook POST    │ Webhook POST
                 ▼                        ▼                     ▼                 ▼
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │                        EXPRESS.JS API GATEWAY (Node.js 20+ / TS)                       │
  │                                                                                        │
  │  ┌───────────────────────┐  ┌───────────────────────┐  ┌────────────────────────────┐  │
  │  │  Auth Guard & Session │  │ Credit & Plan Manager │  │ Bot Controller & Link Hub  │  │
  │  │  (Supabase JWT / RLS) │  │  (storage.deductCredits)│ │  (server/bots/botController)│ │
  │  └───────────┬───────────┘  └───────────┬───────────┘  └─────────────┬──────────────┘  │
  │              │                          │                            │                 │
  │  ┌───────────▼──────────────────────────▼────────────────────────────▼──────────────┐  │
  │  │                           AI ORCHESTRATION PIPELINE                              │  │
  │  │                                                                                  │  │
  │  │   [ Statutory MOAT Database ] ──> Keyword Grounding ──> [ Multi-LLM Router ]     │  │
  │  │     (moat_data in Supabase)      (getRelevantMoat)       (Gemini, Groq, OpenAI)  │  │
  │  │                                                                                  │  │
  │  │   [ Google ADK Legal Agent ]  ──> MCP Tools Server ───> Pre-Case File Synthesizer│  │
  │  └──────────────────────────────────────┬───────────────────────────────────────────┘  │
  │                                         │                                              │
  │  ┌──────────────────────────────────────▼───────────────────────────────────────────┐  │
  │  │                       PAYMENT & BILLING ORCHESTRATOR                             │  │
  │  │                                                                                  │  │
  │  │   Flutterwave Standard   │   Bachs Checkout (APIv1)   │   Paystack API Checkout      │  │
  │  │   (Hosted link + verify) │   (HMAC-SHA256 Webhook)    │   (Popup / Redirect Callback)│  │
  │  │                                                                                  │  │
  │  │   Manual Bank Transfers  │   Unified Fulfillment Pipeline (fulfillPayment)       │  │
  │  └──────────────────────────────────────┬───────────────────────────────────────────┘  │
  └─────────────────────────────────────────┼──────────────────────────────────────────────┘
                                            │
                                            ▼
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │                               SUPABASE POSTGRESQL ENGINE                               │
  │                                                                                        │
  │   • profiles & auth_id           • credits & credit_logs        • pre_case_files       │
  │   • payment_methods (dynamic)    • subscriptions & plans        • direct_bookings      │
  │   • moat_data (statutory DB)     • traffic_alerts (SabiMove)    • channel_links        │
  │   • notifications & queue        • email_verifications (hashed) • channel_link_codes   │
  └────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 💻 Comprehensive Technology Stack

### Frontend Web & PWA
- **Core Framework:** React 19 (`react`, `react-dom`) with TypeScript 5.6.
- **Build Tooling:** Vite 7.1 with `@vitejs/plugin-react` and `@tailwindcss/vite`.
- **CSS & Design System:** Tailwind CSS v4.1 with canonical theme variables, `@theme` directives, and responsive layouts.
- **UI Component Library:** shadcn/ui primitives built on Radix UI (`@radix-ui/react-*`), Lucide React icons, and `class-variance-authority`.
- **Animations:** Framer Motion 12 for hardware-accelerated gestures, cross-fades, and sliding docks.
- **Client Routing:** Wouter 3.3 for lightweight, zero-overhead browser routing.
- **Data Fetching & Cache:** TanStack Query v5 (`@tanstack/react-query`) with automatic background refetching and cache invalidation.
- **PWA & Hybrid Mobile:** Native manifest (`manifest.json`), service worker caching, and Capacitor 8 (`@capacitor/core`, `@capacitor/android`, `@capacitor/splash-screen`).
- **Exporting & PDF:** jsPDF 4.2 and jsPDF-Autotable 5.0 for client-side downloadable legal transcripts.

### Native Mobile (iOS & Android)
- **Framework:** React Native 0.76 with Expo SDK 52.
- **Navigation:** Expo Router (file-based navigation with native header transitions).
- **Styling:** NativeWind (Tailwind CSS for React Native).
- **Offline Storage:** `@react-native-async-storage/async-storage` for local statutory caching.
- **Push Services:** Expo Notifications (`expo-notifications`) backed by EAS (Expo Application Services).

### Backend Server & API Gateway
- **Runtime:** Node.js 20+ with Express 4.21.
- **Type Safety:** Full-stack TypeScript executed via `tsx` with strict compiler checks.
- **Database ORM & Driver:** Drizzle ORM (`drizzle-orm`, `drizzle-zod`) and native PostgreSQL client (`pg`).
- **Authentication:** Supabase Auth JWT verification with Express session fallback (`connect-pg-simple`, `passport`).
- **Agentic AI & Tooling:** `@google/adk` (Google Agent Development Kit) and `@modelcontextprotocol/sdk` (Anthropic MCP).
- **Email Delivery:** Nodemailer with authenticated SMTP transport and responsive HTML email templates.
- **Web Push:** `web-push` using VAPID key pairs.

### Third-Party Gateways & APIs
- **AI Models:** Google Generative AI (Gemini 2.0 Flash / Pro), Groq Cloud API, OpenAI API, Anthropic Claude API.
- **Payments:** Flutterwave API v3, Bachs API v1, Paystack API, and verified Bank Transfer receipts.
- **Messaging:** Meta WhatsApp Cloud API / Twilio WhatsApp Sandbox, Telegram Bot API.

---

## 🔄 End-to-End Operational Processes

### 1. Statutory Grounding & MOAT RAG Pipeline
```mermaid
sequenceDiagram
    autonumber
    actor Citizen as Citizen (Web/Mobile/Bot)
    participant Server as Express API Gateway
    participant DB as Supabase PostgreSQL (moat_data)
    participant LLM as Multi-LLM Router (Gemini/Groq)

    Citizen->>Server: POST /api/ai/chat (Prompt: "Police wants to search my phone without warrant")
    Server->>DB: Query moat_data where keywords match (getRelevantMoatContext)
    DB-->>Server: Returns Section 37 CFRN (Privacy) & Section 49 Police Act
    Server->>Server: Inject statutory citations into system prompt & de-escalation guardrails
    Server->>LLM: Generate response with statutory grounding
    LLM-->>Server: Structured response with exact legal citations & de-escalation script
    Server->>Server: Deduct credits & log in credit_logs
    Server-->>Citizen: Render legal guidance with copyable de-escalation script
```

### 2. Legal First Aid & Case Intake Referral Flow
When a citizen's situation requires formal court intervention, criminal defense, or property litigation:
1. **Intake Diagnosis:** The citizen chats with the Legal First Aid AI Assistant.
2. **Pre-Case Synthesis:** The citizen or system triggers `/api/cases/summarize`. The Google ADK Legal Agent parses the dialogue history into a 5-part Pre-Case File:
   - Case Reference ID & Timestamp
   - Executive Summary (Issue & Urgency: `Low`, `Medium`, `High`, `Critical`)
   - Fact Sheet (Statutes cited, timeline of events, available recordings/receipts)
   - Citizen's Desired Outcome (Bail, compensation, injunction)
   - Procedural Assessment (Jurisdiction, applicable courts)
3. **Directory Matching:** The citizen browses the Legal Directory (`/app/marketplace`). Providers are sorted by distance proximity and practice area.
4. **Direct Booking:** The citizen selects an accredited lawyer. The Pre-Case File is automatically attached to the new booking (`direct_bookings`).
5. **Consultation Room:** A private room (`/app/bookings/:id`) is established with real-time messaging and document exchange.

### 3. Cross-Platform Channel Pairing & Account Linking
```mermaid
sequenceDiagram
    autonumber
    actor User as Citizen on Web/Mobile
    actor BotUser as Same Citizen on WhatsApp/Telegram
    participant Server as SabiRight Bot Hub
    participant DB as Supabase (channel_links)

    User->>Server: POST /api/channels/link-code (Authenticated)
    Server->>DB: Insert into channel_link_codes (8-char code, 10 min TTL)
    Server-->>User: Displays "LINK-7X9K" in Settings
    BotUser->>Server: Sends message: "/link LINK-7X9K"
    Server->>DB: Validate code and verify expiration
    Server->>DB: Upsert into channel_links (channel, channel_id, user_id)
    Server-->>BotUser: "✅ Account linked! 550 Credits & subscription shared."
```

### 4. Dynamic Payment Orchestration & Webhook Settlement
SabiRight supports multi-currency and zero-downtime payment processing:
1. **Initiation:** Client calls `POST /api/payments/initiate` with `amount`, `packageId` or `planId`, and `paymentType`.
2. **Gateway Resolution:** The system queries active gateways in `payment_methods`:
   - **Flutterwave:** Generates a hosted payment link using `POST /v3/payments`.
   - **Bachs:** Generates an instant fiat or crypto checkout session (`POST /v1/checkout/sessions`).
   - **Paystack:** Initializes a transaction and returns the authorization URL.
   - **Manual Transfer:** Displays verified bank account details and accepts receipt file uploads.
3. **Cryptographic Webhook Verification:**
   - Flutterwave validates the `verif-hash` header against the admin secret.
   - Bachs verifies the HMAC-SHA256 signature against the raw request payload.
   - Paystack validates `x-paystack-signature` HMAC-SHA512.
4. **Atomic Fulfillment:** Upon verification, `fulfillPayment()` credits the user's account, updates `credit_logs`, updates active plan status, and dispatches an instant receipt notification.

### 5. Offline Statutory MOAT Synchronization
To safeguard citizens during internet disruptions or in remote areas:
1. On app boot, the mobile client or PWA calls `GET /api/moat/public`.
2. The server returns essential statutory rights, emergency telephone directories, and de-escalation protocols.
3. The client stores this payload in local `AsyncStorage` (Mobile) or `CacheStorage` (PWA).
4. If network connectivity drops, the client automatically falls back to offline guidance cards.

### 6. Multi-Channel Notification Dispatch Pipeline
The Notification Dispatcher (`server/notificationDispatcher.ts`) guarantees reliable delivery:
1. **Event Trigger:** An alert, credit purchase, booking update, or security event occurs.
2. **Channel Evaluation:** Based on user settings, the system fans out to:
   - **Push (Web & Mobile):** Generic push payload delivered via VAPID Web Push or Expo EAS. To protect privacy, notifications contain no sensitive case text.
   - **In-App Dispatch Center:** Persisted to `notifications` table for real-time viewing in the user dashboard.
   - **Transactional Email:** Rendered with responsive HTML templates, escaped user input, and dispatched via authenticated SMTP.

---

## 🖥 Client Applications & Interfaces

### Web Application (React 19 & Tailwind v4)
- **Landing Pages:** Modern hero with live interactive omnichannel terminal, dynamic channel switcher (WhatsApp, Telegram, Web), and compliant trust badges.
- **Google Gemini-Style Navigation:**
  - Sidebar toggles smoothly between full (`w-64`) and compact rail (`w-18`) with `PanelLeft`.
  - Prominent "+ New Legal First Aid" inquiry pill button.
  - Floating Radix UI tooltips appear on hover when collapsed, displaying feature names and live counters (e.g., `550 Credits`, `AI`, `Live`, `Pro`).
  - Native-feeling mobile bottom dock with 5 key destinations (`Home`, `Legal AI`, `Directory`, `Bookings`, `Settings`).
- **Dashboard Workspace:** Bento capability grid with dynamic greeting, active Nigerian state/city jurisdiction selector, live credit gauge, transit checkpoint alerts, and statutory trigger chips (§37, §35, Tenancy).

### Native Mobile Application (Expo SDK 52)
- Located in `mobile/`.
- Native bottom tab navigation, dark/light theme awareness, instant biometric login, native camera access for document scanning, and background push notifications.

### Omnichannel Bot Suite (WhatsApp Cloud & Telegram)
- Located in `server/bots/`.
- Enables low-bandwidth access without installing native applications.
- Supports Pidgin and local language queries, statutory de-escalation scripts, account linking (`/link`), in-chat balance checks (`/balance`), and one-click payment checkouts (`/buy`).

### Super Admin Control Plane & CMS
- Located at `/admin` (`client/src/pages/admin/AdminDashboard.tsx`).
- **Full CMS Management:** Live editing of landing page copy, channel bot URLs, and organization credentials.
- **Provider Switching:** Change active AI models on the fly without server restarts.
- **Payment Gateway Config:** Manage Flutterwave, Bachs, and Paystack keys, secrets, and test/live modes.
- **Statutory Database:** Add, update, and categorize legal provisions in the MOAT.
- **Manual Receipt Verification:** One-click review and credit crediting for manual bank transfers.

---

## 🗄 Database Schema & Entity Relationship

The database is built on **Supabase PostgreSQL** with strict Row Level Security (RLS) policies:

| Table | Purpose | Key Attributes |
|---|---|---|
| `profiles` | Master user records and channel personas | `id, auth_id, email, displayName, city, state, is_admin, is_vendor, channel, channel_id` |
| `credits` | Spendable credit balances & renewal cycles | `user_id, total_credits, used_credits, plan_credits, renewal_date` |
| `credit_logs` | Immutable audit trail of every credit adjustment | `id, user_id, amount, description, feature, created_at` |
| `plans` | Subscription plan definitions | `id, name, user_type, price, credits, monthly_credits, billing_cycle, storage_mb` |
| `subscriptions` | Active citizen & pro subscription contracts | `id, user_id, plan_id, status, start_date, end_date` |
| `payment_methods` | Dynamically configured payment providers | `id, name, type, active, public_key, secret_key, webhook_hash, metadata, instructions` |
| `payments` | Central financial transaction ledger | `id, user_id, amount, currency, provider, status, provider_ref, metadata` |
| `moat_data` | Binding statutory jurisprudence knowledge base | `id, title, content, category, source, metadata` |
| `pre_case_files` | AI-generated structured legal intake briefs | `id, case_ref, user_id, issue_summary, urgency_level, facts, desired_outcome` |
| `direct_bookings` | Citizen-to-lawyer retainers & consultations | `id, user_id, vendor_id, service_id, case_file_id, status, agreed_fee` |
| `direct_booking_messages` | Consultation room chat history & attachments | `id, booking_id, sender_id, message, attachments, created_at` |
| `routes` / `alerts` | Commute routes & real-time traffic warnings | `routes: id, user_id, route_name`; `alerts: id, route_id, alert_type, acknowledged` |
| `notifications` | In-app notification inbox records | `id, user_id, type, title, message, read, metadata, created_at` |
| `email_verifications` | Atomic, single-use email verification tokens | `id, user_id, email, token_hash, expires_at, verified_at, attempts` |
| `channel_links` | WhatsApp / Telegram linked account mappings | `channel, channel_user_id, user_id, linked_at` |
| `channel_link_codes` | Ephemeral 8-character channel linking codes | `code, user_id, expires_at, used_at` |

---

## 📂 Directory Layout

```text
sabiright/
├── client/                      # React 19 + Vite 7 Frontend Web Application
│   ├── public/                  # Static brand assets, PWA icons, manifest.json
│   ├── src/
│   │   ├── components/          # Reusable UI primitives, PWA modal, layout widgets
│   │   ├── context/             # AuthContext, ThemeContext
│   │   ├── hooks/               # use-toast, useMobile, useDebounce
│   │   ├── lib/                 # queryClient, utils, API client
│   │   ├── pages/
│   │   │   ├── admin/           # Super Admin Dashboard & CMS controls
│   │   │   ├── app/             # Authenticated user pages (Dashboard, Civic, Marketplace, etc.)
│   │   │   ├── auth/            # Login, registration, password recovery
│   │   │   ├── Home.tsx         # Modern landing page with interactive omnichannel terminal
│   │   │   ├── About.tsx        # About us overview
│   │   │   ├── PricingNew.tsx   # Tiered plan pricing
│   │   │   └── Contact.tsx      # Contact and support portal
│   │   ├── App.tsx              # Application root router & provider trees
│   │   └── main.tsx             # DOM mount point
│   ├── index.html
│   └── vite.config.ts           # Vite configuration with Tailwind CSS v4 plugin
│
├── mobile/                      # Expo SDK 52 Native Mobile Application
│   ├── app/                     # File-based navigation routes
│   │   ├── (auth)/              # Onboarding and login screens
│   │   ├── (tabs)/              # Primary navigation docks (Civic, Market, Traffic, Profile)
│   │   ├── booking/[id].tsx     # Native consultation portal
│   │   └── case-file/[id].tsx   # Pre-case brief viewer
│   ├── components/              # Native UI cards and dials
│   ├── lib/                     # Mobile API client & offline AsyncStorage MOAT cache
│   └── app.json                 # Expo native manifest and EAS configuration
│
├── server/                      # Node.js Express.js API Gateway & Bot Hub
│   ├── agent/                   # Google ADK legal agent and MCP tools
│   │   ├── legalAgent.ts        # Agentic synthesis & pre-case summarization
│   │   ├── legalMcpServer.ts    # Model Context Protocol tools server
│   │   └── legalTools.ts        # Statutory lookup utilities
│   ├── bots/                    # WhatsApp Cloud API & Telegram Bot engines
│   │   ├── botController.ts     # Unified routing, linking, and in-chat checkout
│   │   ├── whatsapp/            # WhatsApp webhook handler
│   │   └── telegram/            # Telegram webhook handler
│   ├── aiService.ts             # Multi-LLM provider router & MOAT keyword matching
│   ├── notificationDispatcher.ts# Web Push, Expo Push & SMTP email dispatcher
│   ├── paystackService.ts       # Paystack payment helper
│   ├── supabaseStorage.ts       # Database abstraction layer for Supabase PostgreSQL
│   ├── routes.ts                # Express REST endpoints, webhooks, and callbacks
│   └── index.ts                 # Server bootstrap on port 5000
│
├── supabase/                    # Incremental database migrations
│   └── migrations/              # Versioned SQL migration files
├── supabase_schema.sql          # Complete Supabase PostgreSQL baseline schema
├── package.json                 # Root dependencies and build scripts
└── README.md                    # Enterprise platform documentation
```

---

## 🛠 Installation & Quickstart Guide

### Prerequisites
- **Node.js**: v20.10.0 or higher
- **npm**: v10.0.0 or higher
- **Supabase Account**: A PostgreSQL project with credentials
- **Expo Go App**: (Optional) For testing native mobile flows on physical devices

### Environment Variables

Create a `.env` file in the project root:

```env
# Server & Runtime Configuration
PORT=5000
NODE_ENV=development

# Database Connection (Supabase PostgreSQL Pooler)
DATABASE_URL=postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres

# Supabase API Credentials
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# Vite Public Environment (Web Client)
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# Primary AI Provider Keys (Can also be managed live in Super Admin)
GEMINI_API_KEY=AIzaSy...
GROQ_API_KEY=gsk_...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Bot Configuration (Optional for messaging channels)
TELEGRAM_BOT_TOKEN=123456789:ABC...
WHATSAPP_TOKEN=EAAG...
WHATSAPP_VERIFY_TOKEN=sabiright_verify_secret

# Security & Cron
CRON_SECRET=your_long_random_cron_secret
```

For the native mobile app, configure `mobile/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
EXPO_PUBLIC_API_URL=https://www.sabiright.ng
EXPO_PUBLIC_EAS_PROJECT_ID=YOUR_EAS_PROJECT_UUID
```

### Database Setup & Migrations
1. Open your **Supabase Dashboard → SQL Editor**.
2. For a **new database**, execute `supabase_schema.sql` once, then apply all migration files in `supabase/migrations/` in chronological order.
3. For an **existing database**, run only the unapplied migration files in `supabase/migrations/`.

### Running the Full-Stack Web & Backend

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Verify TypeScript type safety:**
   ```bash
   npm run check
   ```

3. **Build the production bundle:**
   ```bash
   npm run build
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   - Web application is available at: `http://localhost:5000` (or configured port).
   - API Gateway operates on: `http://localhost:5000/api`.

### Running the Native Mobile Client

1. **Navigate to the mobile directory and install dependencies:**
   ```bash
   cd mobile
   npm install
   ```

2. **Start the Expo Metro bundler:**
   ```bash
   npx expo start
   ```

3. **Run on emulator or device:**
   - Press `a` for Android Emulator.
   - Press `i` for iOS Simulator.
   - Scan the QR code using the **Expo Go** app on your physical iOS/Android device.

---

## 📡 API Gateway Reference

### Authentication & Channel Pairing
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/profile` | Fetches authenticated profile, credit allowance, and roles |
| `PATCH` | `/api/profile/:userId` | Updates citizen location (city, state) and preferences |
| `POST` | `/api/channels/link-code` | Generates an ephemeral 8-character channel linking code |
| `GET` | `/api/channels/links` | Lists currently linked messaging channels |
| `DELETE` | `/api/channels/links/:channel` | Unlinks a messaging channel identity |

### Legal First Aid & AI Intelligence
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/chat` | Main AI legal consultation endpoint with statutory grounding |
| `GET` | `/api/moat/public` | Public statutory MOAT endpoint for mobile offline caching |
| `POST` | `/api/cases/summarize` | Generates a 5-part Pre-Case File from conversation history |

### Credits & Plans
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/credits/:userId/available` | Real-time available, total, and used credit balances |
| `GET` | `/api/plans` | Lists active subscription tiers |
| `GET` | `/api/credit-packages` | Lists available pay-as-you-go credit packages |

### Payments & Webhook Callbacks
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/payment-methods` | Returns active payment gateways with sanitized public keys |
| `POST` | `/api/payments/initiate` | Initiates payment session (Flutterwave, Bachs, Paystack) |
| `GET` | `/api/payments/flutterwave/callback` | Handles Flutterwave payment redirect and verifies settlement |
| `POST` | `/api/payments/flutterwave/webhook` | Verified Flutterwave webhook listener (`verif-hash`) |
| `POST` | `/api/payments/bachs/webhook` | Verified Bachs HMAC-SHA256 webhook listener |
| `POST` | `/api/payments/bachs/verify` | Verification endpoint for Bachs checkout sessions |
| `POST` | `/api/payments/manual/upload` | Uploads proof receipt for manual bank transfers |

### Directory & Consultations
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/services` | Lists accredited practitioners with proximity calculation |
| `POST` | `/api/bookings` | Creates a consultation retainer and attaches pre-case brief |
| `GET` | `/api/bookings/user/:userId` | Retrieves consultation history for citizen |
| `GET` | `/api/bookings/:id/messages` | Consultation room chat history |
| `POST` | `/api/bookings/:id/messages` | Dispatches message/image within consultation room |

---

## 💬 Bot Commands Reference

When messaging SabiRight via **WhatsApp** or **Telegram**:

| Command | Arguments | Action |
|---|---|---|
| `/start` | None | Introduces SabiRight civic features and starts session |
| `/help` | None | Lists available commands and support instructions |
| `/link` | `<code>` | Pairs the messaging identity to a web account using an unexpired code |
| `/balance` | None | Displays current credit balance and quick top-up options |
| `/topup` or `/packages`| None | Lists available credit packages with NGN pricing |
| `/buy` | `<pkgId>` | Generates an instant hosted payment checkout link |
| `/plans` | None | Displays monthly subscription tiers |
| `/subscribe` | `<planId>` | Generates a hosted subscription payment link |
| `/lawyer` | None | Initiates structured case intake and generates a Pre-Case File |
| `/traffic` | None | Displays crowdsourced road checkpoint and traffic alerts |

---

## 🔒 Security, Encryption & Regulatory Compliance

- **Data Protection Compliance (NDPC & NITDA):** Designed in alignment with the Nigeria Data Protection Act (NDPA) and NITDA guidelines. Citizen inquiry transcripts and consultation records are stored in encrypted Supabase storage with restricted access.
- **Row Level Security (RLS):** Every PostgreSQL table enforces RLS; citizens can only access their own records, and administrative endpoints require verified admin tokens.
- **HMAC Webhook Signatures:**
  - **Flutterwave:** Validates the `verif-hash` secret header.
  - **Bachs:** Verifies the cryptographic HMAC-SHA256 signature against the raw body.
  - **Paystack:** Validates `x-paystack-signature` HMAC-SHA512.
- **Credential Masking:** Public endpoints (`/api/payment-methods`, `/api/settings`) strip private API keys, webhook hashes, and secrets before serving responses.
- **Fail-Safe Offline Mode:** Emergency constitutional rights guidance is cached locally on devices to ensure accessibility during cellular outages or emergencies.

---

## 📄 License & Maintainers

SabiRight is engineered for high-impact social and legal protection.

- **Organization:** DigiBusTech / SabiRight Engineering Team
- **Repository:** [https://github.com/DigiBusTech/SabiRight](https://github.com/DigiBusTech/SabiRight)
- **License:** Proprietary / All Rights Reserved. Commercial licensing and civic integration inquiries should be directed to the repository maintainers.
