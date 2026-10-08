# SabiRight Enterprise Platform

<div align="center">
  <img src="client/public/favicon.png" alt="SabiRight Logo" width="96" height="96" />
  <h2>⚖️ SabiRight — Civic Intellect & Justice Infrastructure</h2>
  <p><strong>Empowering citizens, residents, and immigrants with verified, statutory-grounded civic guidance, seamless legal first aid, and proximity-matched professional directories across Web, Native Mobile, WhatsApp, and Telegram.</strong></p>

  <div>
    <img src="https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Node.js-20.x-green?logo=node.js" alt="Node.js" />
    <img src="https://img.shields.io/badge/React-18-61dafb?logo=react" alt="React" />
    <img src="https://img.shields.io/badge/Expo-SDK_52-black?logo=expo" alt="Expo" />
    <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase" alt="Supabase" />
    <img src="https://img.shields.io/badge/AI_Engine-Gemini%20%7C%20Groq%20%7C%20OpenAI%20%7C%20Claude-8A2BE2" alt="Multi-LLM" />
    <img src="https://img.shields.io/badge/Payments-Flutterwave%20%7C%20Bachs%20%7C%20Paystack-FF5A5F" alt="Payments" />
  </div>
</div>

---

## 📑 Table of Contents

- [Executive Summary](#-executive-summary)
- [Key Enterprise Features](#-key-enterprise-features)
- [Omnichannel System Architecture](#-omnichannel-system-architecture)
- [Core Engines & Business Logic](#-core-engines--business-logic)
  - [1. Civic Guidance Engine & Statutory MOAT](#1-civic-guidance-engine--statutory-moat)
  - [2. Pre-Case File & Diagnostic Intake Synthesis](#2-pre-case-file--diagnostic-intake-synthesis)
  - [3. Verified Professional Marketplace & Proximity Matching](#3-verified-professional-marketplace--proximity-matching)
  - [4. Unified Cross-Channel Credit Engine](#4-unified-cross-channel-credit-engine)
  - [5. Dynamic Multi-Gateway Payment Orchestrator](#5-dynamic-multi-gateway-payment-orchestrator)
  - [6. Real-Time Consultation Rooms & Direct Bookings](#6-real-time-consultation-rooms--direct-bookings)
  - [7. Traffic, Checkpoint & Civil Unrest Crowdsourcing](#7-traffic-checkpoint--civil-unrest-crowdsourcing)
  - [8. Super Admin Control Plane](#8-super-admin-control-plane)
- [Omnichannel Bot Suite (WhatsApp & Telegram)](#-omnichannel-bot-suite-whatsapp--telegram)
- [Native Mobile Application (Expo / React Native)](#-native-mobile-application-expo--react-native)
- [Database Schema & Entity Relationship](#-database-schema--entity-relationship)
- [Directory Layout](#-directory-layout)
- [Installation & Quickstart Guide](#-installation--quickstart-guide)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Starting the Full-Stack Web & Server](#starting-the-full-stack-web--server)
  - [Starting the Native Mobile App](#starting-the-native-mobile-app)
- [API Gateway Reference](#-api-gateway-reference)
- [Bot Commands Reference](#-bot-commands-reference)
- [Security, Webhooks & Compliance](#-security-webhooks--compliance)
- [License & Contribution](#-license--contribution)

---

## 🏛 Executive Summary

**SabiRight** is an enterprise-grade civic technology and legal-aid marketplace platform engineered for the Nigerian and African socioeconomic ecosystem.

In developing regions, citizens, small business owners, and immigrants routinely encounter constitutional infringements, unlawful detentions, landlord-tenant extortion, police checkpoint abuses, and opaque regulatory hurdles. At the same time, verified lawyers, accountants, real estate advisors, and immigration practitioners waste up to 40% of their billable hours vetting unorganized, fragmented client claims.

SabiRight bridges this divide through an integrated **Dual-Engine Model**:
1. **Civic Intellect Engine:** Delivers immediate, de-escalating, zero-hallucination legal guidance backed by codified national statutes (such as the 1999 Constitution of Nigeria, the Police Act 2020, and tenancy laws).
2. **Professional Proximity Directory:** Connects users directly to certified local professionals with pre-synthesized **Pre-Case Files (Intake Briefs)**, eliminating initial discovery overhead and accelerating access to justice.

All platform features are synchronized across **Web (React/Vite)**, **Native Mobile (Expo/React Native)**, **WhatsApp (Meta Cloud API / Twilio)**, and **Telegram (Bot API)** via a single unified backend.

---

## 🚀 Key Enterprise Features

- **Omnichannel Access:** Instant parity across Web browser, iOS & Android native apps, WhatsApp, and Telegram.
- **Administrative Statutory MOAT:** Custom statutory knowledge base curated by legal administrators and injected dynamically into AI context for absolute grounding.
- **Multi-Provider AI Fallback:** Seamless routing across Google Gemini 2.0 Flash, Groq (Llama 3), OpenAI (GPT-4o), Anthropic (Claude 3.5 Sonnet), DeepSeek, OpenRouter, Perplexity, and Mistral.
- **Automated Pre-Case File Generation:** Synthesizes multi-turn conversations into formatted 5-section legal intake documents with citation tracking and urgency scores.
- **Dynamic Multi-Gateway Payments:** Supports Flutterwave Standard (primary), Bachs multi-currency checkout (cryptocurrency & fiat), Paystack, and Manual Bank Transfers with receipt verification.
- **Unified Credit & Allowance System:** Daily renewal quotas, monthly plan allowances, pay-as-you-go credit packages, and full audit logging (`credit_logs`).
- **Real-Time Consultation Chat:** Private, encrypted in-app consultation rooms for citizens and verified service providers.
- **Emergency De-Escalation Protocols:** Step-by-step physical encounter guides (e.g., police stops, landlord lockouts) to prevent conflict escalation.
- **Crowdsourced Civic Alerts:** Community-driven traffic, road safety, checkpoint, and civil unrest monitoring with upvoting and severity verification.
- **Cross-Platform Identity Sync:** 6-digit channel link codes allow users on WhatsApp and Telegram to connect their chat identities to their primary web and mobile accounts.

---

## 📐 Omnichannel System Architecture

```text
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │                                CLIENT INTERFACES                                │
  │                                                                                 │
  │   [ React / Vite Web ]     [ Expo Native Mobile ]     [ WhatsApp ]  [ Telegram ]│
  │   (Desktop & Responsive)    (iOS & Android Native)     (Cloud API)   (Bot API)  │
  └─────────────┬──────────────────────────┬───────────────────┬──────────────┬─────┘
                │                          │                   │              │
                │ REST / WebSocket         │ REST / Offline    │ Webhook      │ Webhook
                ▼                          ▼                   ▼              ▼
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │                     EXPRESS / NODE.JS API GATEWAY (Port 5000)                   │
  │                                                                                 │
  │  ┌──────────────────────┐  ┌───────────────────────┐  ┌──────────────────────┐  │
  │  │  Auth & Token Guard  │  │ Credit & Plan Manager │  │ Omnichannel Bot Hub  │  │
  │  │  (Supabase / Custom) │  │ (Allowances & Quotas) │  │  (botController.ts)  │  │
  │  └──────────┬───────────┘  └───────────┬───────────┘  └──────────┬───────────┘  │
  │             │                          │                         │              │
  │  ┌──────────▼──────────────────────────▼─────────────────────────▼───────────┐  │
  │  │                         AI ORCHESTRATION PIPELINE                         │  │
  │  │                                                                           │  │
  │  │   [ Admin Statutory MOAT ] ──> Keyword Grounding ──> [ Unified LLM Core ] │  │
  │  │   (Administrative Rules)       (getRelevantMoat)    (Gemini, Groq, OpenAI)│  │
  │  │                                                                           │  │
  │  │   [ Google ADK Legal Agent ] ──> MCP Tools ──> Pre-Case File Synthesizer  │  │
  │  └─────────────────────────────────────┬─────────────────────────────────────┘  │
  │                                        │                                        │
  │  ┌─────────────────────────────────────▼─────────────────────────────────────┐  │
  │  │                        PAYMENT & BILLING ORCHESTRATOR                     │  │
  │  │                                                                           │  │
  │  │   Flutterwave Standard   │   Bachs Checkout (APIv1)   │   Paystack API    │  │
  │  │   (Hosted link + verify) │   (HMAC Webhook + Verify)  │   (Card / Transfer│  │
  │  │                                                                           │  │
  │  │   Manual Bank Transfers  │   Unified Fulfillment Pipeline (fulfillPayment)│  │
  │  └─────────────────────────────────────┬─────────────────────────────────────┘  │
  └────────────────────────────────────────┼────────────────────────────────────────┘
                                           │
                                           ▼
  ┌─────────────────────────────────────────────────────────────────────────────────┐
  │                          SUPABASE POSTGRESQL ENGINE                             │
  │                                                                                 │
  │  • profiles & auth             • credits & credit_logs      • pre_case_files    │
  │  • payment_methods (dynamic)   • subscriptions & plans      • direct_bookings   │
  │  • moat_data (statutory DB)    • traffic_alerts (civic)     • channel_links     │
  └─────────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Core Engines & Business Logic

### 1. Civic Guidance Engine & Statutory MOAT

The AI Civic Engine answers user queries with legally accurate, verified information. Hallucinations are actively prevented through a multi-tier defense:

1. **Statutory MOAT Grounding (`moat_data`):**
   - Managed directly by administrators in the Super Admin Dashboard.
   - Incoming prompts are analyzed by `getRelevantMoatContext(userPrompt)` in `server/aiService.ts`.
   - Matching statutory articles (Nigerian Constitution, Police Act, Tenancy Laws, Labour Acts) are selected and prepended as an authoritative `[ADMINISTRATIVE STATUTORY MOAT]` context block.
2. **Provider-Agnostic AI Adapter:**
   - Automatically prioritizes the admin's active provider (`ai_provider` setting).
   - Compatible with Google Gemini (`gemini-2.0-flash`), OpenAI (`gpt-4o`), Anthropic (`claude-3-5-sonnet`), Groq (`llama3-70b-8192`), DeepSeek, OpenRouter, Perplexity, and Mistral.
3. **Mandatory Citation Policy:**
   - AI responses must cite explicit legal provisions (e.g., *Section 35(1) Constitution of the Federal Republic of Nigeria 1999*, *Section 32 Police Act 2020*).
4. **De-Escalation & Urgent Mode:**
   - When encountering hostile situations (e.g., checkpoint interrogations), the AI provides non-confrontational, actionable steps to safeguard life and liberty.

### 2. Pre-Case File & Diagnostic Intake Synthesis

When a user's inquiry requires formal representation, the system generates a standardized **Pre-Case File**:

```text
[SabiRight Pre-Case File / Intake Summary]
1. Case Reference:
   - Case ID: UUIDv4
   - Timestamp: ISO 8601
   - User Alias: Verified ID or Bot Session ID

2. Executive Summary:
   - The Issue: Concise single-sentence summary
   - Urgency Level: Low | Medium | High | Critical

3. Fact Sheet (Key Details):
   - Statutory References Cited (e.g., Section 34, 35 CFRN 1999)
   - Chronological Timeline & Specific Events
   - Evidence Identified (Documents, recordings, receipts)

4. Goal / Desired Outcome:
   - Primary Objective (e.g., Bail application, eviction defense, compensation)

5. Agentic Assessment (Counselor Notes):
   - Preliminary procedural assessment and jurisdiction notes
```

- **Implementation:** `summarizeCaseForProfessional(chatHistory, userId)` in `server/agent/legalAgent.ts`.
- **Resilience:** Attempts direct high-speed Gemini processing first, falling back to `generateAIResponse()` on any provider failure.

### 3. Verified Professional Marketplace & Proximity Matching

Citizens can search and book certified practitioners:
- **Categories:** Legal Advocates / Lawyers, Real Estate Agents, Certified Accountants, Immigration & Visa Consultants.
- **Verification Workflow:** Professionals submit credentials, license numbers, and jurisdiction details via `vendor_applications`. Once verified by an admin, their profiles display the blue verified badge.
- **Proximity Filtering:** Matches practitioners based on geographical coordinates, city, and state.
- **Direct Intake Dispatch:** The pre-case file is attached directly to the booking request, allowing professionals to review the full facts before accepting consultations.

### 4. Unified Cross-Channel Credit Engine

To prevent abuse and support commercial sustainability, all requests consume credits:

- **Daily Allowance:** Free tier users receive a daily quota of credits that resets every 24 hours.
- **Subscription Allowances:** Paid plans (Pro Citizen, Business, Enterprise) grant monthly allowances with priority AI reasoning and expanded storage limits.
- **Pay-As-You-Go Packs:** Users can purchase non-expiring credit packages (e.g., Starter 50, Power 250, Enterprise 1000).
- **Single Source of Truth:** `storage.getAvailableCredits(userId)` calculates spendable balance:
  $$\text{Available} = \max(0, \text{Total Credits} - \text{Used Credits})$$
- **Graceful Degradation:** When credits reach 0, all channels (Web, Mobile, WhatsApp, Telegram) present payment options with one-click hosted checkout links.
- **Audit Logging:** Every deduction, top-up, admin adjustment, and plan change is recorded in `credit_logs` with timestamps and operational reasons.

### 5. Dynamic Multi-Gateway Payment Orchestrator

Admins can configure and toggle payment gateways on the fly without server redeployment:

| Gateway | Type | Capabilities & Security |
|---|---|---|
| **Flutterwave** *(Primary)* | Automatic Hosted Checkout | Standard API integration (`POST /v3/payments`). Card, USSD, Bank Transfer. Callback verification & `verif-hash` webhook authentication. |
| **Bachs** | Automatic Crypto & Fiat Checkout | Hosted checkout sessions via `https://api.bachs.io/v1/checkout/sessions`. Automatic sandbox detection (`sk_sandbox_` prefix). HMAC-SHA256 webhook signatures and `/api/payments/bachs/verify` endpoint. |
| **Paystack** | Automatic Redirect / Popup | Standard Paystack transaction initialize. Webhook HMAC verification. |
| **Manual Bank Transfer** | Direct Bank Account Transfer | Displays dynamic admin bank instructions. Citizen uploads receipt image. Admin reviews and approves/rejects with one click in Super Admin. |

### 6. Real-Time Consultation Rooms & Direct Bookings

- Citizens and matched professionals communicate through dedicated consultation rooms (`/booking/:id` on Web, `app/booking/[id].tsx` on Mobile).
- Status Lifecycle: `pending` $\rightarrow$ `confirmed` $\rightarrow$ `completed` (or `cancelled`).
- Case files, statutory evidence, and chat history are securely stored in Supabase with Row Level Security.

### 7. Traffic, Checkpoint & Civil Unrest Crowdsourcing

- Citizens broadcast real-time alerts about roadblocks, police harassment hotspots, extortion points, and traffic gridlocks.
- Alerts include category, severity level (`low`, `medium`, `high`, `critical`), description, and spatial coordinates.
- Community verification allows citizens to upvote or confirm active status.

### 8. Super Admin Control Plane

The Super Admin Dashboard (`client/src/pages/admin/AdminDashboard.tsx`) provides complete operational management:
- **Analytics Overview:** Registered users, credit consumption rates, revenue across gateways, active bookings.
- **AI Configuration:** Live selection of active LLM provider, API key storage, model temperature, and token limits.
- **Statutory MOAT Manager:** Real-time editing and publishing of statutory data records.
- **Payment Gateway Settings:** Configure API keys, secrets, webhooks, and sandbox modes for Flutterwave, Bachs, and Paystack.
- **Manual Payment Approvals:** Review user-uploaded payment receipts with one-click credit crediting.
- **Plan & Package Management:** Create and edit subscription plans and one-time credit top-up packages.
- **User & Balance Administration:** Override balances, add bonus credits, remove plans (reverts to Free plan with preserved purchased credits), and view transaction audit logs.

---

## 🤖 Omnichannel Bot Suite (WhatsApp & Telegram)

Citizens can interact with SabiRight directly on messaging platforms:

### Channel Link Logic
1. A citizen opens **Settings $\rightarrow$ Linked Channels** on the Web or Mobile app and clicks **"Generate 6-Digit Link Code"**.
2. The user sends `/link 123456` in the WhatsApp or Telegram chat.
3. The bot controller links the channel profile (`wa_...` or `tg_...`) to their registered account.
4. From that moment, credit balances, plan tiers, and active bookings are shared across all devices.

### In-Bot Monetization & Billing
When a bot user runs out of credits or wishes to top up:
- The bot detects zero balance and presents quick-action buttons.
- The user can type `/topup` or `/packages` to view available packages.
- Typing `/buy <packageId>` or `/subscribe <planId>` generates a secure hosted checkout link using the primary active payment gateway (Flutterwave $\rightarrow$ Bachs $\rightarrow$ Paystack).
- Upon completing payment, the webhook credits their account immediately, and the bot resumes the conversation.

---

## 📱 Native Mobile Application (Expo / React Native)

Located in `mobile/`, the native application provides:

- **Expo SDK 52 & Expo Router:** File-based native routing with smooth stack and modal transitions.
- **Offline Statutory MOAT (`mobile/lib/offlineStorage.ts`):**
  - Essential emergency rights cards and de-escalation protocols are bundled locally.
  - On app startup, `syncRemoteMoatData(apiBaseUrl)` fetches the latest administrative MOAT data and caches it in `AsyncStorage`.
  - In low-connectivity areas or during network blockades, citizens can still access emergency rights guidance.
- **Native Screens:**
  - `(tabs)/index.tsx`: Emergency Quick Dial, Recent Incidents, Balance Snapshot.
  - `(tabs)/civic.tsx`: Real-time legal consultation with audio/text input.
  - `(tabs)/marketplace.tsx`: Location-based directory of verified advocates.
  - `(tabs)/traffic.tsx`: Incident feed with one-tap report submission.
  - `(tabs)/profile.tsx`: Channel link code management and theme preferences.
  - `bookings.tsx` & `booking/[id].tsx`: Native Consultation Rooms.
  - `case-file/[id].tsx`: Formatted Pre-Case File viewer.

---

## 🗄 Database Schema & Entity Relationship

The database runs on **Supabase PostgreSQL** with Row Level Security (RLS) enabled. Core tables include:

| Table | Purpose | Key Columns |
|---|---|---|
| `profiles` | User accounts and channel identities | `id, auth_id, channel, channel_id, email, is_admin, is_vendor` |
| `credits` | Credit balance and billing-cycle allowance | `user_id, total_credits, used_credits, plan_credits, renewal_date` |
| `credit_logs` | Audit trail of credit movements | `id, user_id, amount, description, feature, created_at` |
| `plans` | Subscription plan definitions and chat quotas | `id, name, user_type, price, credits, monthly_credits, billing_cycle, storage_mb` |
| `subscriptions` | User plan subscriptions | `id, user_id, plan_id, status, start_date, end_date` |
| `admin_settings` | Admin-managed provider, SMTP, push, and site settings | `key, value, category, is_secret, updated_at` |
| `payment_methods` | Configured payment gateways | `id, name, type, active, public_key, secret_key, webhook_hash, metadata, instructions, fields` |
| `payments` | Transaction ledger | `id, user_id, amount, currency, provider, status, provider_ref, metadata` |
| `moat_data` | Statutory/legal grounding knowledge | `id, title, content, category, source, metadata` |
| `pre_case_files` | AI-generated case intake documents | `id, case_ref, user_id, issue_summary, urgency_level, facts, desired_outcome` |
| `direct_bookings` | Appointments between citizens and pros | `id, user_id, vendor_id, service_id, case_file_id, status, agreed_fee` |
| `direct_booking_messages` | Consultation room chat history | `id, booking_id, sender_id, message, attachments, created_at` |
| `routes` / `alerts` | Saved commute routes and route alerts | `routes: id, user_id, route_name`; `alerts: id, route_id, user_id, alert_type, acknowledged` |
| `channel_links` | WhatsApp/Telegram identity mappings | `channel, channel_user_id, user_id, linked_at` |
| `channel_link_codes` | Ephemeral account-linking codes | `code, user_id, expires_at, used_at` |

---

## 📂 Directory Layout

```text
sabiright/
├── client/                      # Vite + React Frontend Web Application
│   ├── public/                  # Static assets & favicons
│   ├── src/
│   │   ├── components/          # Reusable UI components & shadcn primitives
│   │   │   ├── CreditDisplay.tsx# Credit balance chip & upgrade triggers
│   │   │   ├── VerifiedServices.tsx # Professional directory cards
│   │   │   └── ...
│   │   ├── context/             # AuthContext, ThemeContext
│   │   ├── pages/
│   │   │   ├── admin/           # Super Admin Dashboard & configuration tabs
│   │   │   ├── app/             # Citizen & Professional app screens
│   │   │   └── Home.tsx         # Landing page
│   │   └── main.tsx             # React DOM entry point
│   └── index.html
│
├── mobile/                      # Expo React Native Native Application
│   ├── app/                     # Expo Router navigation
│   │   ├── (auth)/              # Native login / onboarding
│   │   ├── (tabs)/              # Tab bar screens (Civic, Market, Traffic, Profile)
│   │   ├── booking/[id].tsx     # Native Consultation Room
│   │   ├── case-file/[id].tsx   # Native Pre-Case File Viewer
│   │   └── _layout.tsx          # Root provider layout & startup MOAT sync
│   ├── components/              # Native UI widgets
│   ├── lib/
│   │   ├── api.ts               # Mobile API client
│   │   └── offlineStorage.ts    # Offline MOAT caching & sync
│   ├── app.json                 # Expo configuration
│   └── tailwind.config.js       # NativeWind Tailwind config
│
├── server/                      # Express.js Backend API & Bot Gateway
│   ├── agent/                   # Google ADK Legal Agent & MCP tools
│   │   ├── legalAgent.ts        # Agentic loop & Pre-Case File summarizer
│   │   ├── legalMcpServer.ts    # Model Context Protocol server
│   │   └── legalTools.ts        # Statutory lookup tools
│   ├── bots/                    # Omnichannel Messaging Handlers
│   │   ├── botController.ts     # Shared routing, checkout generator & link logic
│   │   ├── whatsapp/            # WhatsApp Cloud API / Twilio webhooks
│   │   └── telegram/            # Telegram Bot API polling / webhooks
│   ├── aiService.ts             # Multi-provider LLM gateway & MOAT scoring
│   ├── paystackService.ts       # Paystack gateway helper
│   ├── supabaseStorage.ts       # Supabase database abstraction layer
│   ├── routes.ts                # REST API endpoints, callbacks & webhooks
│   └── index.ts                 # Express server bootstrap (Port 5000)
│
├── scripts/                     # Operational scripts & utilities
├── supabase_schema.sql          # Complete Supabase PostgreSQL schema & RLS
├── supabase/migrations/         # Incremental, rerunnable schema migrations
├── package.json                 # Root dependencies and build scripts
└── README.md                    # Enterprise platform documentation
```

---

## 🛠 Installation & Quickstart Guide

### Prerequisites
- **Node.js**: v20.x or higher (recommended)
- **npm**: v10.x or higher
- **Supabase Account**: With a running PostgreSQL project
- **Expo Go App**: (Optional) For testing the mobile client on physical iOS/Android devices

### Environment Variables

Create a `.env` file in the project root:

```env
# Server & Runtime Configuration
PORT=5000
NODE_ENV=development

# Database Connection (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres

# Supabase API Credentials
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# Vite Public Environment (Web Client)
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# Primary AI Keys (Can also be managed via Admin Dashboard)
GEMINI_API_KEY=AIzaSy...
GROQ_API_KEY=gsk_...
OPENAI_API_KEY=sk-...

# Bot Configuration (Optional for messaging channels)
TELEGRAM_BOT_TOKEN=123456789:ABC...
WHATSAPP_TOKEN=EAAG...
WHATSAPP_VERIFY_TOKEN=sabiright_verify_secret
```

For the native mobile app, configure `mobile/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5000
```

### Starting the Full-Stack Web & Server

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Initialize or update the database schema:**
   - Open your Supabase SQL Editor.
   - For a **new project**, run the entire `supabase_schema.sql` baseline once.
   - For an **existing project**, run the newest unapplied SQL file in `supabase/migrations/` instead of rerunning the baseline. Apply migrations in filename order and track which ones have been run.
   - The current repair migration is `supabase/migrations/20261008114000_repair_feature_schema.sql`; it creates missing settings/route-alert tables and adds the plan/payment columns used by the server.

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   - Web application runs at: `http://localhost:5000` (or Vite dev port with proxy).
   - Backend API gateway operates on: `http://localhost:5000/api`.

4. **Verify TypeScript compilation:**
   ```bash
   npx tsc --noEmit
   ```

### Starting the Native Mobile App

1. **Navigate to the mobile directory and install dependencies:**
   ```bash
   cd mobile
   npm install
   ```

2. **Start the Expo Metro bundler:**
   ```bash
   npx expo start
   ```

3. **Run on a device or emulator:**
   - Press `a` for Android Emulator.
   - Press `i` for iOS Simulator.
   - Scan the QR code using the **Expo Go** app on your physical device.

---

## 📡 API Gateway Reference

### Authentication & Profiles
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/profile` | Fetches authenticated user profile & roles |
| `POST` | `/api/channel-links/code` | Generates 6-digit code for WhatsApp/Telegram linking |
| `POST` | `/api/channel-links/verify`| Verifies 6-digit code and links channel account |

### Civic Guidance & MOAT
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ai/chat` | Main AI civic consultation endpoint with statutory grounding |
| `GET` | `/api/moat/public` | Public statutory MOAT endpoint for mobile offline sync |
| `POST` | `/api/cases/summarize` | Generates a 5-section Pre-Case File from conversation history |

### Credits & Plans
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/credits/:userId/available` | Real-time available, total, and used credit counts |
| `GET` | `/api/plans` | Lists all active subscription plans |
| `GET` | `/api/credit-packages` | Lists active pay-as-you-go credit packages |

### Payments & Webhooks
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/payment-methods` | Returns active payment gateways (sanitized public keys) |
| `POST` | `/api/payments/initiate` | Initiates payment session (Flutterwave hosted link, Bachs session, Paystack) |
| `GET` | `/api/payments/flutterwave/callback` | Handles Flutterwave payment redirect and verifies settlement |
| `POST` | `/api/payments/flutterwave/webhook` | Verified Flutterwave webhook listener (`verif-hash`) |
| `POST` | `/api/payments/bachs/webhook` | Verified Bachs HMAC-SHA256 webhook listener |
| `POST` | `/api/payments/bachs/verify` | User/server verification endpoint for Bachs checkout sessions |
| `POST` | `/api/payments/manual/upload` | Uploads payment receipt proof for manual bank transfer |

### Marketplace & Consultations
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/professionals` | Lists verified practitioners with category and proximity filters |
| `POST` | `/api/bookings` | Creates a direct booking and attaches pre-case file |
| `GET` | `/api/bookings/:id/messages` | Consultation room chat history |
| `POST` | `/api/bookings/:id/messages` | Sends a message in the consultation room |

---

## 💬 Bot Commands Reference

When messaging SabiRight via **WhatsApp** or **Telegram**:

| Command | Arguments | Action |
|---|---|---|
| `/start` | None | Welcomes user, introduces SabiRight civic capabilities |
| `/help` | None | Displays full command list and support instructions |
| `/link` | `<code>` | Links the chat session to a web/mobile user account via 6-digit code |
| `/balance` | None | Shows current credit balance, plan tier, and top-up quick actions |
| `/topup` or `/packages`| None | Lists all available credit top-up packages with prices |
| `/buy` | `<pkgId>` | Generates an instant hosted payment link for the selected package |
| `/plans` | None | Lists available monthly subscription plans |
| `/subscribe` | `<planId>` | Generates a hosted subscription payment link for the selected plan |
| `/lawyer` | None | Initiates structured case intake and generates a Pre-Case File |
| `/traffic` | None | Displays recent community traffic and checkpoint alerts |

---

## 🔒 Security, Webhooks & Compliance

- **Row Level Security (RLS):** All Supabase tables enforce granular access policies; users can only read/write their own records, and admin endpoints verify the user's role on every request.
- **Webhook Signature Verification:**
  - **Flutterwave:** Validates the `verif-hash` header against the stored admin webhook secret.
  - **Bachs:** Verifies the cryptographic HMAC-SHA256 signature against the raw request body.
  - **Paystack:** Verifies the `x-paystack-signature` HMAC-SHA512 against the secret key.
- **Key Masking & Sanitization:** Public endpoints like `GET /api/payment-methods` sanitize sensitive data, stripping secret keys, encryption keys, and internal webhook tokens before transmitting to clients.
- **Fail-Safe Offline Storage:** The native mobile client caches statutory guidelines securely using `AsyncStorage`, ensuring vital civic guidance remains accessible without network coverage.

---

## 📄 License & Contribution

SabiRight is engineered for high-impact social and legal protection. Contributions from developers, legal advocates, and civic organizations are welcome.

For corporate inquiries, custom integrations, or partnerships, please contact:
- **Organization:** DigiBusTech / SabiRight Engineering Team
- **Repository:** [https://github.com/DigiBusTech/SabiRight](https://github.com/DigiBusTech/SabiRight)
