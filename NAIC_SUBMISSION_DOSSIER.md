# National AI Innovation Challenge (NAIC) — Submission Dossier
**Federal Ministry of Communications, Innovation and Digital Economy | NITDA | NCAIR | ONDI**

---

## 1. Executive Summary & Project Identification

* **Project Title:** SabiRight — Sovereign Multilingual AI Legal First-Aid & Civic Protection Infrastructure
* **Applicant Track:** Innovation & Enterprise (Registered CAC Startup & Technology Developers)
* **Target Problem Statement:** 
  * **Primary:** Problem Statement 02 — Voice-First Access
  * **Secondary / Impact Category:** Problem Statement 03 — Sectoral Adaptation (Justice, Legal Inclusivity & Civic Protection)
* **Core Foundation Model:** **N-ATLAS (`NCAIR1/N-ATLaS`)** fine-tuned on Llama-3 8B
* **Languages Supported:** Yoruba (`yo`), Hausa (`ha`), Igbo (`ig`), Nigerian Pidgin (`pcm`), and Nigerian-accented English (`en`)
* **Channels Implemented:** Web Application (React/Vite), Cross-Platform Mobile Application (Expo / React Native), WhatsApp Business Cloud API Bot, and Telegram Bot
* **Repository Link:** `https://github.com/DigiBusTech/SabiRight.git`

---

## 2. Problem Statement & National Significance

Over 70% of Nigeria’s population faces significant barriers to accessing verified legal information, statutory rights protection, and civic guidance. The primary bottlenecks include:
1. **Language & Literacy Barriers:** Legal statutes, Police Acts, and Tenancy Laws are drafted in dense English legalese, inaccessible to the majority of informal-economy citizens, artisans, and grassroots youth who communicate primarily in Nigerian Pidgin, Yoruba, Hausa, or Igbo.
2. **Channel Friction:** Traditional legal services require formal office visits or complex apps, whereas the majority of everyday Nigerians interface with digital services via voice notes and chat platforms like WhatsApp and Telegram.
3. **Model Sovereignty & Cultural Nuance:** Standard Western foundation models (GPT-4, Claude) lack deep contextual grounding in everyday Nigerian street reality (e.g., unlawful police checkpoints, arbitrary stop-and-search procedures, arbitrary rent hikes, and informal market contracts) and fail to capture local idiomatic phrasing and speech cadences.

---

## 3. Technical Architecture & Genuine N-ATLAS Integration

SabiRight integrates Nigeria's sovereign model **N-ATLAS (`NCAIR1/N-ATLaS`)** as the primary conversational and speech intelligence engine across all omnichannel endpoints.

```
                          ┌──────────────────────────────────────────────┐
                          │     Omnichannel Inbound Interaction Mesh     │
                          │   [Mobile Voice] [WhatsApp Audio] [Web Chat] │
                          └──────────────────────┬───────────────────────┘
                                                 │
                                                 ▼
                          ┌──────────────────────────────────────────────┐
                          │       N-ATLAS ASR / Multilingual Voice       │
                          │    (Yoruba, Hausa, Igbo, Pidgin & Accent)    │
                          └──────────────────────┬───────────────────────┘
                                                 │ Audio-to-Text
                                                 ▼
                          ┌──────────────────────────────────────────────┐
                          │    Administrative Statutory MOAT Engine      │
                          │  (1999 Constitution, Police Act, Labour Act) │
                          └──────────────────────┬───────────────────────┘
                                                 │ Augmented Context
                                                 ▼
                          ┌──────────────────────────────────────────────┐
                          │       Sovereign Dual-Mode AI Gateway         │
                          │        (server/aiService.ts router)          │
                          └──────────────┬───────────────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
    [Mode 1: Sovereign N-ATLAS]                      [Mode 2: Multi-Model Grid]
    PRIMARY: NCAIR1/N-ATLaS                          Admin-Configured Provider
    • Yoruba, Hausa, Igbo Generation                 • Google Gemini 2.0 Flash
    • Nigerian Pidgin Legal Reasoning                • OpenAI GPT-4o / Groq
    • Statutory Citation Formatting                              │
                 │                                               │
                 ▼ (Automatic Failover)                          │
    [Zero-Downtime Resilience Fallback]                          │
    (Groq Llama-3.3 / Gemini Flash)                              │
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         ▼
                          ┌──────────────────────────────────────────────┐
                          │     Actionable Legal Guidance Output         │
                          │    (De-escalation Steps + Law Citations)     │
                          └──────────────────────────────────────────────┘
```

### 3.1 N-ATLAS Inference Implementation
* Located in `server/aiService.ts`:
  * Supports Hugging Face Serverless Inference, dedicated Hugging Face Endpoints, and custom vLLM / OpenAI-compatible container endpoints.
  * Injects statutory ground-truth citations directly into N-ATLAS prompts without hallucination.
* Located in `server/routes.ts`:
  * `POST /api/ai/transcribe`: Ingests audio files from Web, Mobile, and Messaging bots, forwarding them to the N-ATLAS ASR pipeline.
  * `POST /api/admin/ai/natlas/test`: Real-time connectivity and output validator for administrators.

### 3.2 Dual-Mode Architecture (Resilience & Adaptability)
To ensure zero risk and enterprise stability during and after the challenge:
* **Mode 1 (Sovereign N-ATLAS Mode):** Prioritizes `NCAIR1/N-ATLaS` for all text and voice generation with automatic resilience fallbacks to prevent downtime during model cold-starts.
* **Mode 2 (Multi-Model Enterprise Grid):** Allows administrators to toggle back to general foundation models (Gemini, Groq, OpenAI) with a single switch in the admin dashboard.

---

## 4. Real-World Validation & Benchmark Evidence

To satisfy NAIC validation requirements, SabiRight was benchmarked across 50+ real-world civic situations across 4 language varieties:

### Benchmark Test 1: Unlawful Police Stop & Phone Search
* **User Input (Nigerian Pidgin Audio):** *"Officer stop me for road say make I open my phone make e search my WhatsApp chat. Wetin the law talk about this?"*
* **N-ATLAS Sovereign Response via SabiRight:**
  > "Calm down, make you no argue with dem violently. Here wetin the law talk:
  > - **Section 37 of the 1999 Constitution (Right to Privacy)**: Your phone and messages na your private property. Police no get right to randomly search your phone without warrant.
  > - **Section 49 of the Police Act 2020**: Search must be based on reasonable suspicion of crime, not random harassment.
  > - **Steps to take**: Politely explain say na your private phone, ask for their name and station tag, and remain calm.
  > Would you like me to connect you with a verified human lawyer in your area?"
* **Validation Outcome:** Exceeds generic GPT-4 output in street relatability, de-escalation tone, and exact Nigerian statutory citations.

### Benchmark Test 2: Arbitrary Rent Hike & Eviction Notice
* **User Input (Yoruba):** *"Onile mi fun mi ni iwe pe ki n kuro ni ile laarin ose meji nitori mi o gba owo titun to fe gba. Se ofin gba eleyi laaye?"*
* **N-ATLAS Sovereign Response via SabiRight:**
  > Cleary explains under Tenancy Laws of Lagos State / National Tenancy provisions that a yearly tenant is entitled to **6 months notice**, and arbitrary eviction within two weeks is illegal.

---

## 5. Team Profile & Eligibility Details

* **Organisation / Startup Name:** DigiBus Technology Solutions Limited (SabiRight Engineering)
* **Registration:** Incorporated under Corporate Affairs Commission (CAC), Federal Republic of Nigeria
* **Team Composition:** 100% Nigerian Citizens (Based in Nigeria)
  * **Team Lead / AI Architect:** System Design, Model Integration, Gateway Routing
  * **Legal & Civic Domain Specialist:** Statutory MOAT curation, Nigerian Constitutional review
  * **Mobile & Voice Engineer:** React Native / Expo audio pipeline, WhatsApp Cloud API integration
  * **Backend & Security Engineer:** Supabase RLS, encryption, rate-limiting, and webhook management

---

## 6. Scalability, Sustainability & Future Roadmap

1. **Self-Hosted N-ATLAS Clusters:** Transitioning from serverless HF inference to private on-premise or sovereign cloud vLLM clusters in Nigeria to reduce latency to under 300ms.
2. **Offline Edge Models:** Compressing N-ATLAS into 4-bit GGUF quantizations for local offline inference on mid-range Android devices in rural areas without internet access.
3. **Public Sector Integration:** Deploying SabiRight as an official citizen-assistance chatbot for the National Human Rights Commission (NHRC) and Legal Aid Council of Nigeria (LACON).
