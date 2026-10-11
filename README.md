# SabiRight Enterprise Platform

<div align="center">
  <img src="client/public/favicon.png" alt="SabiRight Logo" width="104" height="104" />
  <h2>⚖️ SabiRight — Civic Intellect & Justice Infrastructure</h2>
  <p><strong>Omnichannel AI legal first-aid, sovereign Nigerian multilingual intelligence, accredited practitioner directory, statutory de-escalation intelligence, and unified civic infrastructure for Nigeria and Africa.</strong></p>

  <div>
    <img src="https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Node.js-20.x-green?logo=node.js" alt="Node.js" />
    <img src="https://img.shields.io/badge/React-19-61dafb?logo=react" alt="React 19" />
    <img src="https://img.shields.io/badge/Vite-7.1-646CFF?logo=vite" alt="Vite 7" />
    <img src="https://img.shields.io/badge/TailwindCSS-v4.1-38B2AC?logo=tailwind-css" alt="Tailwind CSS v4" />
    <img src="https://img.shields.io/badge/Expo-SDK_52-black?logo=expo" alt="Expo SDK 52" />
    <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase" alt="Supabase PostgreSQL" />
    <img src="https://img.shields.io/badge/Primary_AI-Sovereign_N--ATLAS_(NCAIR1)-008751?logo=huggingface" alt="Sovereign N-ATLAS" />
    <img src="https://img.shields.io/badge/Grounding-Statutory_MOAT_%2B_MCP-0A66C2" alt="MOAT + MCP Grounding" />
    <img src="https://img.shields.io/badge/AI_Fallbacks-Gemini%202.5%20%7C%20Groq%20%7C%20Claude-8A2BE2" alt="Fallback Models" />
    <img src="https://img.shields.io/badge/Payments-Flutterwave%20%7C%20Bachs%20%7C%20Paystack-FF5A5F" alt="Payments" />
    <img src="https://img.shields.io/badge/Compliance-NDPC%20%7C%20NITDA%20%7C%20NCAIR-008751" alt="Compliance" />
  </div>
</div>

---

## 📑 Table of Contents

- [Executive Overview](#-executive-overview)
  - [Primary AI: Nigeria's Sovereign N-ATLAS Core](#primary-ai-nigerias-sovereign-n-atlas-core)
  - [Indigenous Dialect & Vernacular Support (NCAIR1)](#indigenous-dialect--vernacular-support-ncair1)
  - [Anti-Hallucination: Statutory MOAT & Model Context Protocol (MCP)](#anti-hallucination-statutory-moat--model-context-protocol-mcp)
  - [Resilient Multi-Model Fallback Architecture](#resilient-multi-model-fallback-architecture)
  - [The Dual-Engine Model](#the-dual-engine-model)
- [Key Enterprise Capabilities](#-key-enterprise-capabilities)
- [System Architecture](#-system-architecture)
- [Comprehensive Technology Stack](#-comprehensive-technology-stack)
  - [Primary AI, Indigenous NLP & Anti-Hallucination Stack](#primary-ai-indigenous-nlp--anti-hallucination-stack)
  - [Frontend Web & PWA](#frontend-web--pwa)
  - [Native Mobile (iOS & Android)](#native-mobile-ios--android)
  - [Backend Server & API Gateway](#backend-server--api-gateway)
  - [Third-Party Gateways & Integrations](#third-party-gateways--integrations)
- [End-to-End Operational Processes](#-end-to-end-operational-processes)
  - [1. Statutory Grounding, MCP Normalization & N-ATLAS Pipeline](#1-statutory-grounding-mcp-normalization--n-atlas-pipeline)
  - [2. Legal First Aid & Case Intake Referral Flow](#2-legal-first-aid--case-intake-referral-flow)
  - [3. Cross-Platform Channel Pairing & Account Linking](#3-cross-platform-channel-pairing--account-linking)
  - [4. Dynamic Payment Orchestration & Webhook Settlement](#4-dynamic-payment-orchestration--webhook-settlement)
  - [5. Offline Statutory MOAT Synchronization](#5-offline-statutory-moat-synchronization)
  - [6. Multi-Channel Notification Dispatch Pipeline](#6-multi-channel-notification-dispatch-pipeline)
- [Client Applications & Interfaces](#-client-applications--interfaces)
- [Database Schema & Entity Relationship](#-database-schema--entity-relationship)
- [Directory Layout](#-directory-layout)
- [Installation & Quickstart Guide](#-installation--quickstart-guide)
- [API Gateway Reference](#-api-gateway-reference)
- [Bot Commands Reference](#-bot-commands-reference)
- [Security, Encryption & Regulatory Compliance](#-security-encryption--regulatory-compliance)
- [License & Maintainers](#-license--maintainers)

---

## 🏛 Executive Overview

**SabiRight** is an enterprise-grade civic intelligence and justice platform designed specifically for the Nigerian and greater African legal landscape. In environments where statutory knowledge is inaccessible, police checkpoints create arbitrary friction, and finding verified legal representation is cumbersome, SabiRight provides **accessible, real-time statutory protection** to citizens across every device and communication channel.

### Primary AI: Nigeria's Sovereign N-ATLAS Core

Unlike generic overseas AI solutions that lack African cultural grounding and frequently hallucinate foreign statutes (such as US or UK legislation), SabiRight is powered **primarily by N-ATLAS (`NCAIR1/N-ATLaS`)**, Nigeria's Sovereign Multilingual Large Language Model developed under the **National Centre for Artificial Intelligence and Robotics (NCAIR / NITDA)**:

- **Hugging Face Model Repository:** [https://huggingface.co/NCAIR1/N-ATLaS](https://huggingface.co/NCAIR1/N-ATLaS)
- **NCAIR1 Organization Hub:** [https://huggingface.co/NCAIR1](https://huggingface.co/NCAIR1)
- **Sovereign Foundation:** Fine-tuned on Llama-3 8B with extensive Nigerian jurisprudence, cultural idioms, and local civic conflict data as part of the **National AI Innovation Challenge (NAIC)**.

### Indigenous Dialect & Vernacular Support (NCAIR1)

SabiRight delivers native speech recognition (ASR) and conversational legal guidance across all major Nigerian dialects and languages through the official **NCAIR1** model suite:

| Language / Dialect | ASR Speech Recognition Model | Text Generation & Legal Guidance |
|---|---|---|
| **Yoruba** | [`NCAIR1/Yoruba-ASR`](https://huggingface.co/NCAIR1/Yoruba-ASR) | Native N-ATLAS Multilingual Generation |
| **Igbo** | [`NCAIR1/Igbo-ASR`](https://huggingface.co/NCAIR1/Igbo-ASR) | Native N-ATLAS Multilingual Generation |
| **Hausa** | [`NCAIR1/Hausa-ASR`](https://huggingface.co/NCAIR1/Hausa-ASR) | Native N-ATLAS Multilingual Generation |
| **Nigerian Pidgin (Naija)** | [`NCAIR1/NigerianAccentedEnglish`](https://huggingface.co/NCAIR1/NigerianAccentedEnglish) | Native N-ATLAS Vernacular Pidgin |
| **Nigerian Accented English**| [`NCAIR1/NigerianAccentedEnglish`](https://huggingface.co/NCAIR1/NigerianAccentedEnglish) | Native N-ATLAS English Generation |

All audio inputs from voice notes (WhatsApp, Telegram, Web, and Mobile) are dynamically transcoded via an internal FFmpeg pipeline to 16kHz mono PCM WAV and routed to the corresponding language-specific NCAIR1 ASR engine.

### Anti-Hallucination: Statutory MOAT & Model Context Protocol (MCP)

To achieve **zero legal hallucinations**, SabiRight does not rely solely on raw LLM generation. Instead, it enforces a strict two-layer factual grounding architecture:

1. **Deterministic Statutory MOAT (`moat_data`):** An administrator-curated legal knowledge base within Supabase PostgreSQL holding authoritative sections of the **Constitution of the Federal Republic of Nigeria (CFRN 1999 as amended)**, the **Police Act 2020**, the **Administration of Criminal Justice Act (ACJA 2015)**, the **Cybercrimes (Prohibition, Prevention, etc.) Act 2015**, and state tenancy statutes. Every user query triggers a high-speed tokenized relevance search (`getRelevantMoatContext`) that binds the LLM prompt to exact statutory excerpts.
2. **Anthropic Model Context Protocol (MCP) Server (`legalMcpServer.ts`):** Implements an RFC-compliant MCP server (`@modelcontextprotocol/sdk`) paired with the Google Agent Development Kit (`@google/adk`). The MCP server exposes deterministic tools:
   - `search_legal_faqs`: Structured FAQ resolution.
   - `search_verified_legal_data`: Authoritative statutory verification with strict non-extrapolation rules.
   - `search_legal_professionals`: Proximity-based accredited NBA practitioner lookup.
   - **Colloquial Query Normalization:** Automatically maps Nigerian street slang to statutory legal concepts:
     - *"search my phone"* $\rightarrow$ Section 37 CFRN 1999 (Right to Privacy & Warrantless Search Protections)
     - *"egunje"* / *"roger"* $\rightarrow$ Police Act 2020 & Criminal Code Extortion / Misconduct Provisions
     - *"house wahala"* / *"quit notice"* $\rightarrow$ State Tenancy Laws & Recovery of Premises Act
     - *"police stop"* / *"checkpoint"* $\rightarrow$ Police Act 2020 Powers of Arrest & Stop-and-Search Procedures
     - *"bail"* $\rightarrow$ ACJA 2015 Sections 30–32 (Constitutional Right to Bail Free of Charge)

### Resilient Multi-Model Fallback Architecture

To ensure 99.99% uptime during model cold-starts, high-latency spikes, or external Hugging Face inference rate limits, SabiRight implements an automated, cascading fallback mechanism:
- **Primary AI (Default Mode):** **N-ATLAS (`NCAIR1/N-ATLaS`)** is always invoked first for every legal query and speech transcription.
- **Secondary Fallback:** **Google Gemini 2.5 / 2.0 Flash** is utilized strictly as a resilient fallback engine when N-ATLAS is cold-starting or unreachable.
- **Tertiary Fallback:** **Groq (Llama 3.3 70B Versatile)**, **Anthropic (Claude 3.5 Sonnet)**, or **OpenAI (GPT-4o)** can be dynamically designated by administrators via the Super Admin Control Plane.

### The Dual-Engine Model
1. **Legal First Aid AI Engine:** Delivers instant, constitutionally grounded legal advice in plain English, Nigerian Pidgin, Yoruba, Hausa, and Igbo. Equips citizens with real-time de-escalation scripts citing relevant sections of the Constitution, ACJA 2015, Police Act 2020, and tenancy laws.
2. **Accredited Professional Directory:** A verified marketplace of Nigerian Bar Association (NBA) accredited lawyers, paralegals, and accredited consultants. When an inquiry exceeds initial guidance, the system synthesizes a standardized 5-part **Pre-Case File** and connects the citizen with nearby legal counsel through encrypted consultation rooms.

---

## 🚀 Key Enterprise Capabilities

- **Sovereign N-ATLAS Multilingual Core:** Powered primarily by Nigeria's national foundation model (`NCAIR1/N-ATLaS`) with native multi-dialect support across Nigerian Pidgin, Yoruba, Hausa, Igbo, and English.
- **Statutory MOAT & MCP Anti-Hallucination MOAT:** Zero statutory hallucinations through continuous prompt grounding with verified Nigerian statutes and Anthropic MCP tool execution.
- **Omnichannel Access:** Single unified experience across Responsive Web (Desktop/Mobile), Native iOS/Android (Expo), Progressive Web App (PWA), WhatsApp Cloud API, and Telegram Bot.
- **Gemini-Style Responsive Workspace:** Clean, minimalist navigation shell with compact icon rail, top toggle control (`PanelLeft`), "+ New Legal First Aid" quick-action pill, and floating hover tooltips when collapsed.
- **Multi-LLM Dynamic Resilient Routing:** Automated fail-safe switching from N-ATLAS to **Google Gemini 2.5 / 2.0 Flash** or **Groq (Llama 3.3 70B)** during network timeouts or model warmup periods.
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
  │  │                  SOVEREIGN AI & ANTI-HALLUCINATION PIPELINE                      │  │
  │  │                                                                                  │  │
  │  │   ┌────────────────────────────────┐       ┌────────────────────────────────┐    │  │
  │  │   │  Statutory MOAT Database (RAG) │       │  Anthropic MCP Legal Server    │    │  │
  │  │   │   (moat_data in Supabase)      │       │   (legalMcpServer.ts / SDK)    │    │  │
  │  │   └───────────────┬────────────────┘       └───────────────┬────────────────┘    │  │
  │  │                   │                                        │                     │  │
  │  │                   ▼                                        ▼                     │  │
  │  │       [ Colloquial Slang Normalizer & Statutory Grounding Context Injector ]      │  │
  │  │                                        │                                         │  │
  │  │                 ┌──────────────────────┴──────────────────────┐                  │  │
  │  │                 │                                             │                  │  │
  │  │                 ▼                                             ▼                  │  │
  │  │   [ 🇳🇬 PRIMARY SOVEREIGN CORE ]                 [ 🛡 RESILIENT FALLBACK ]        │  │
  │  │      N-ATLAS (NCAIR1/N-ATLaS)                     Google Gemini 2.5 Flash        │  │
  │  │      Fine-tuned Nigerian LLM                      Groq (Llama 3.3 70B) / Claude  │  │
  │  │      + NCAIR1 ASR Dialect Suite                   (Invoked only on cold-start)   │  │
  │  │                 │                                             │                  │  │
  │  │                 └──────────────────────┬──────────────────────┘                  │  │
  │  │                                        ▼                                         │  │
  │  │                         [ Pre-Case File Synthesizer ]                            │  │
  │  └────────────────────────────────────────┬─────────────────────────────────────────┘  │
  │                                           │                                            │
  │  ┌────────────────────────────────────────▼─────────────────────────────────────────┐  │
  │  │                       PAYMENT & BILLING ORCHESTRATOR                             │  │
  │  │                                                                                  │  │
  │  │   Flutterwave Standard   │   Bachs Checkout (APIv1)   │   Paystack API Checkout      │  │
  │  │   (Hosted link + verify) │   (HMAC-SHA256 Webhook)    │   (Popup / Redirect Callback)│  │
  │  │                                                                                  │  │
  │  │   Manual Bank Transfers  │   Unified Fulfillment Pipeline (fulfillPayment)       │  │
  │  └────────────────────────────────────────┬─────────────────────────────────────────┘  │
  └───────────────────────────────────────────┼────────────────────────────────────────────┘
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

### Primary AI, Indigenous NLP & Anti-Hallucination Stack
- **Primary Sovereign Foundation Model:** **N-ATLAS (`NCAIR1/N-ATLaS`)** fine-tuned on Llama-3 8B. Developed by the **National Centre for AI and Robotics (NCAIR / NITDA)** for Nigerian constitutional law, civic dispute de-escalation, and multi-vernacular comprehension. Hosted on Hugging Face Hub: [NCAIR1/N-ATLaS](https://huggingface.co/NCAIR1/N-ATLaS).
- **Multi-Dialect ASR (Speech-to-Text):** Direct integration with the full suite of NCAIR1 African speech models:
  - `NCAIR1/Yoruba-ASR` (Yoruba)
  - `NCAIR1/Igbo-ASR` (Igbo)
  - `NCAIR1/Hausa-ASR` (Hausa)
  - `NCAIR1/NigerianAccentedEnglish` (Nigerian Pidgin / Naija & Nigerian-accented English)
- **Audio Processing Pipeline:** Node.js native `child_process` with static FFmpeg (`ffmpeg-static`) transcoding incoming WhatsApp/Telegram voice notes into 16kHz 16-bit mono PCM WAV for accurate ASR parsing.
- **Anti-Hallucination Grounding MOAT:** Supabase PostgreSQL `moat_data` table storing binding statutory excerpts (CFRN 1999, Police Act 2020, ACJA 2015, Cybercrimes Act, Tenancy Laws). Evaluated per query via tokenized score ranking.
- **Model Context Protocol (MCP) Server:** `@modelcontextprotocol/sdk` exposing deterministic tools (`search_legal_faqs`, `search_verified_legal_data`, `search_legal_professionals`) with local slang query normalization ("house wahala", "egunje", "search my phone", "quit notice").
- **Agentic Orchestration:** `@google/adk` (Google Agent Development Kit) bridging MCP tools and structured Pre-Case File synthesis.
- **Resilient Fallback Engines:** Dynamic secondary fail-safe switching to **Google Gemini 2.5 Flash / 2.0 Flash**, **Groq (Llama 3.3 70B Versatile)**, **Anthropic Claude 3.5 Sonnet**, and **OpenAI GPT-4o-mini** if N-ATLAS encounters a cold start or latency budget expiration.

---

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

### Third-Party Gateways & Integrations
- **Primary Sovereign AI:** N-ATLAS (`NCAIR1/N-ATLaS`), Hugging Face Router & Inference Endpoints, NCAIR1 ASR dialect models (`Yoruba-ASR`, `Igbo-ASR`, `Hausa-ASR`, `NigerianAccentedEnglish`).
- **Resilient Fallback AI:** Google Generative AI (Gemini 2.5 Flash / 2.0 Flash — secondary fallback), Groq Cloud API (Llama 3.3 70B), Anthropic Claude API, OpenAI API.
- **Payments:** Flutterwave API v3, Bachs API v1 (Crypto/Fiat), Paystack API, and verified Bank Transfer receipts.
- **Messaging:** Meta WhatsApp Cloud API / Twilio WhatsApp Sandbox, Telegram Bot API.

---

## 🔄 End-to-End Operational Processes

### 1. Statutory Grounding, MCP Normalization & N-ATLAS Pipeline
```mermaid
sequenceDiagram
    autonumber
    actor Citizen as Citizen (Web/Mobile/WhatsApp/Telegram)
    participant Server as Express API Gateway
    participant MCP as Anthropic MCP Server (legalMcpServer)
    participant DB as Supabase PostgreSQL (moat_data)
    participant NATLAS as Primary: N-ATLAS (NCAIR1/N-ATLaS)
    participant Fallback as Secondary: Gemini 2.5 Flash

    Citizen->>Server: POST /api/ai/chat (Vernacular prompt: "Police stop me, they want search my phone without warrant")
    Server->>MCP: Normalize colloquial phrasing & evaluate legal tools
    MCP-->>Server: Normalized query: "Section 37 CFRN 1999 privacy warrantless search police act 2020"
    Server->>DB: Query moat_data where keywords match (getRelevantMoatContext)
    DB-->>Server: Returns exact excerpts of Section 37 CFRN (Privacy) & Section 49 Police Act 2020
    Server->>Server: Inject statutory citations into system prompt with strict non-hallucination rules
    
    alt N-ATLAS Available (Primary Sovereign Core)
        Server->>NATLAS: Dispatch prompt to NCAIR1/N-ATLaS (Pidgin / Yoruba / Hausa / Igbo / English)
        NATLAS-->>Server: Constitutionally grounded vernacular guidance + statutory de-escalation script
    else N-ATLAS Cold-Start / Latency Timeout (Resilient Fail-Safe)
        Server->>Fallback: Seamlessly route to Google Gemini 2.5 Flash with identical MOAT grounding
        Fallback-->>Server: Grounded legal guidance with statutory citations
    end

    Server->>Server: Deduct user credit balance & log in credit_logs
    Server-->>Citizen: Deliver instant vernacular legal protection & de-escalation script
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

# Sovereign N-ATLAS Primary AI Configuration (NCAIR1/N-ATLaS)
NATLAS_API_TOKEN=hf_...                         # Hugging Face User Access Token (read permissions)
NATLAS_MODEL_ID=NCAIR1/N-ATLaS                  # Model repository on Hugging Face Hub (default: NCAIR1/N-ATLaS)
NATLAS_API_ENDPOINT=https://router.huggingface.co/v1/chat/completions # Router or custom inference endpoint
NATLAS_ASR_ENDPOINT=https://router.huggingface.co/hf-inference/models/{model} # ASR endpoint override

# Resilient Secondary Fallback Provider Keys (Invoked only on N-ATLAS cold-start or timeout)
GEMINI_API_KEY=AIzaSy...                        # Google Gemini 2.5/2.0 Flash (Secondary Fallback)
GROQ_API_KEY=gsk_...                            # Groq Llama 3.3 70B Versatile (Tertiary Fallback)
OPENAI_API_KEY=sk-...                           # OpenAI GPT-4o-mini
ANTHROPIC_API_KEY=sk-ant-...                    # Anthropic Claude 3.5 Sonnet

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

- **Sovereign AI & Linguistic Compliance (NCAIR / NITDA NAIC):** Developed in alignment with the **National Artificial Intelligence Policy** and the **NITDA National AI Innovation Challenge (NAIC)**. SabiRight prioritizes domestic legal intelligence via Nigeria's sovereign model **N-ATLAS ([NCAIR1/N-ATLaS](https://huggingface.co/NCAIR1/N-ATLaS))** and vernacular speech recognition engines ([NCAIR1 Organization](https://huggingface.co/NCAIR1)), preventing informational leakage and ensuring localized civic data remains under indigenous governance.
- **Anti-Hallucination Guarantee (Statutory MOAT + Anthropic MCP):** The Model Context Protocol (`@modelcontextprotocol/sdk`) server enforces strict non-extrapolation guardrails. If a statutory query is not substantiated by the binding provisions of the 1999 Constitution, the Police Act 2020, or the ACJA 2015 in `moat_data`, the AI refuses to invent legal citations, explicitly admits uncertainty, and refers the citizen to verified NBA legal practitioners.
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
