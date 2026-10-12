-- =========================================================================
-- SABIRIGHT MIGRATION: SEED LEGAL POLICIES & DEMO NIGERIAN PROFESSIONALS
-- Migration: 20261012120000_seed_legal_policies_and_demo_professionals.sql
-- Description:
-- 1. Seeds detailed, NDPA-compliant Privacy Policy, Terms & Conditions, and
--    Cookie Policy into admin_settings for live rendering on /privacy, /terms, /cookies.
-- 2. Seeds realistic demo Nigerian professionals across all marketplace categories:
--    - Lawyers & NBA Litigation Advocates (Lagos, Abuja)
--    - Accredited Mediators & ADR Specialists (Kano, Port Harcourt)
--    - CAC Corporate Filing Agents (Lagos, Abuja)
--    - Tax Experts & FIRS Consultants (Lagos)
--    - Chartered ICAN Accountants (Lagos)
-- =========================================================================

-- PART 1: SEED LEGAL POLICIES INTO admin_settings

INSERT INTO admin_settings ("key", value, category, is_secret)
VALUES
(
  'privacy_policy',
  '<div class="legal-doc-content space-y-6">
    <div class="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm leading-relaxed">
      <strong>Statutory Privacy Notice:</strong> This Privacy Policy is formulated in strict compliance with the <strong>Nigeria Data Protection Act 2023 (NDPA)</strong>, the <strong>Nigeria Data Protection Commission (NDPC)</strong> General Application and Implementation Directive, and Section 37 of the <strong>Constitution of the Federal Republic of Nigeria 1999 (as amended)</strong> guaranteeing the fundamental right to privacy of citizens.
    </div>

    <p class="text-xs text-slate-500 dark:text-slate-400">Effective Date: October 12, 2026 | Version 2.4 | Data Controller: Sabi AI Technologies Limited / DigiBusTech</p>

    <h2 class="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">1. Introduction & Identity of the Data Controller</h2>
    <p>Sabi AI Technologies Limited ("SabiRight", "we", "us", or "our") operates the SabiRight Civic Intelligence Platform across Web, Progressive Web App (PWA), iOS and Android native applications, WhatsApp Cloud API (+234 7026619186), and Telegram Bot (@SabiRightBot). We are committed to safeguarding your personal data and ensuring transparent processing under the Nigeria Data Protection Act 2023 (NDPA).</p>

    <h2 class="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">2. Categories of Information We Collect</h2>
    <p>To deliver real-time statutory protection, civic guidance, and professional matching, we collect the following categories of data:</p>
    <ul class="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
      <li><strong>Identity & Account Data:</strong> Name, email address, phone number, state, city, preferred dialect/language (English, Nigerian Pidgin, Yoruba, Hausa, Igbo), and cryptographic channel pairing codes.</li>
      <li><strong>Civic & Legal First Aid Inquiries:</strong> Plain-text questions and incident scenarios submitted to the SabiRight Legal First Aid engine, timestamped conversation histories, and selected civic topics.</li>
      <li><strong>Voice Notes & Vernacular Audio:</strong> Spoken audio submitted via messaging bots or web interfaces. Audio is converted to 16kHz mono PCM WAV and transcribed using domestic <strong>NCAIR1 Speech Recognition Models</strong> (Yoruba-ASR, Igbo-ASR, Hausa-ASR, and Nigerian Accented English). Audio files are processed transiently and are not retained beyond transcription validation.</li>
      <li><strong>Geolocation Data:</strong> Device coordinates (latitude and longitude) provided with your explicit permission, utilized strictly for calculating driving ETA and route directions to nearby accredited legal practitioners and displaying crowdsourced SabiMove™ checkpoint alerts.</li>
      <li><strong>Pre-Case Briefs & Consultation Details:</strong> Case summaries, incident chronologies, opposing party descriptions, and evidence attachments generated when you request connection to a verified lawyer or mediator.</li>
      <li><strong>Transactional Data:</strong> Payment references, plan subscriptions, and credit quota records processed via licensed PCI-DSS payment gateways (Flutterwave, Bachs Multi-Currency, Paystack). SabiRight never stores raw debit card numbers or bank security PINs.</li>
    </ul>

    <h2 class="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">3. Sovereign AI & Model Privacy Commitment</h2>
    <p>SabiRight is powered primarily by Nigeria''s sovereign foundational model <strong>N-ATLAS (NCAIR1/N-ATLaS)</strong>, developed under the National Centre for Artificial Intelligence and Robotics (NCAIR) and NITDA:</p>
    <ul class="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
      <li><strong>No Public AI Training on Citizen Inquiries:</strong> Your private legal scenarios, voice transcripts, and consultation chats are <em>never</em> sold, rented, or submitted to third-party commercial vendors to train generic public models.</li>
      <li><strong>Deterministic Statutory MOAT:</strong> Queries are evaluated against administrator-curated statutory texts (CFRN 1999, Police Act 2020, ACJA 2015, Cybercrimes Act) using the Anthropic Model Context Protocol (MCP) to prevent hallucinations.</li>
      <li><strong>Private Encrypted Cloud:</strong> All operational databases reside in secure PostgreSQL infrastructure enforcing PostgreSQL Row Level Security (RLS) and AES-256 encryption at rest.</li>
    </ul>

    <h2 class="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">4. Lawful Bases for Processing</h2>
    <p>Under Section 25 of the NDPA 2023, we process your personal data under the following legal bases:</p>
    <ul class="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
      <li><strong>Consent:</strong> You provide informed consent when opting in to voice recognition, sharing geolocation, or requesting directory referrals.</li>
      <li><strong>Contractual Necessity:</strong> To deliver credit quotas, account access, and direct booking consultation services requested by you.</li>
      <li><strong>Vital Interests & Emergency Defense:</strong> To deliver real-time statutory rights and de-escalation guidance when citizens face immediate threats of unlawful detention, extortion, or human rights violations.</li>
      <li><strong>Compliance with Legal Obligations:</strong> Retaining mandatory financial audit records as required by Nigerian revenue and tax authorities.</li>
    </ul>

    <h2 class="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">5. Professional Directory & Legal Privilege</h2>
    <p>When you choose to connect with an accredited legal practitioner or mediator, SabiRight securely transmits your synthesized Pre-Case File to the chosen professional. Communications within verified consultation rooms are confidential and subject to professional ethics and legal professional privilege governed by the Nigerian Bar Association (NBA) Rules of Professional Conduct 2007.</p>

    <h2 class="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">6. Data Subject Rights Under NDPA 2023</h2>
    <p>As a data subject in Nigeria, you possess unconditional statutory rights:</p>
    <ul class="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
      <li><strong>Right of Access:</strong> Request a full copy of all personal records and chat histories held on your profile.</li>
      <li><strong>Right to Rectification:</strong> Update inaccurate contact or identity information.</li>
      <li><strong>Right to Erasure (Right to be Forgotten):</strong> Request the permanent deletion of your profile, chats, and pre-case records.</li>
      <li><strong>Right to Restrict or Object to Processing:</strong> Revoke consent for geolocation or analytics at any time.</li>
      <li><strong>Right to Data Portability:</strong> Export your pre-case files in standardized PDF/JSON formats.</li>
      <li><strong>Right to Complain:</strong> Lodge a regulatory complaint directly with the Nigeria Data Protection Commission (NDPC).</li>
    </ul>

    <h2 class="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">7. Data Retention & Security Architecture</h2>
    <p>We implement technical and organizational measures including TLS 1.3 encryption in transit, HMAC-SHA256 signature verification for payment webhooks, and automatic session token expiry. User inquiry transcripts are retained only for as long as your account remains active or until you request account deletion.</p>

    <h2 class="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">8. Contact Our Data Protection Officer (DPO)</h2>
    <p>For questions regarding your privacy rights, data subject requests, or regulatory queries, please contact:</p>
    <div class="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm">
      <p><strong>Data Protection Officer:</strong> Sabi AI Technologies Limited</p>
      <p><strong>Email:</strong> dpo@sabiright.com | support@sabiright.com</p>
      <p><strong>Hotline:</strong> +234 7026619186</p>
      <p><strong>Address:</strong> Victoria Island & Ikeja, Lagos State, Nigeria</p>
    </div>
  </div>',
  'legal',
  false
),
(
  'terms_of_service',
  '<div class="legal-doc-content space-y-6">
    <div class="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-sm leading-relaxed">
      <strong>CRITICAL LEGAL FIRST AID DISCLAIMER:</strong> SabiRight is a civic intelligence technology platform and statutory educational resource. Interactions with the SabiRight AI agent, N-ATLAS outputs, and de-escalation scripts provide <strong>statutory legal information and civic guidance</strong>, NOT formal legal representation or judicial legal advice. No attorney-client relationship is created by chatting with the AI agent.
    </div>

    <p class="text-xs text-slate-500 dark:text-slate-400">Effective Date: October 12, 2026 | Version 2.4 | Sabi AI Technologies Limited</p>

    <h2 class="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">1. Acceptance of Terms</h2>
    <p>By accessing the SabiRight website, installing the mobile application, messaging our WhatsApp bot (+234 7026619186), interacting with our Telegram bot (@SabiRightBot), or utilizing our API, you agree to be bound by these Terms of Service and all applicable laws of the Federal Republic of Nigeria.</p>

    <h2 class="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">2. The SabiRight Dual-Engine Service Model</h2>
    <p>SabiRight operates two distinct functional engines:</p>
    <ol class="list-decimal pl-6 space-y-2 text-slate-700 dark:text-slate-300">
      <li><strong>Legal First Aid AI Engine:</strong> An automated, sovereign AI system powered by N-ATLAS and grounded via the Statutory MOAT with binding Nigerian legislation (Constitution of the Federal Republic of Nigeria 1999, Police Act 2020, ACJA 2015). This engine provides quick statutory education, rights awareness, and street de-escalation scripts in English, Nigerian Pidgin, Yoruba, Hausa, and Igbo.</li>
      <li><strong>Accredited Professional Directory:</strong> A verified marketplace connecting citizens with independent Nigerian Bar Association (NBA) accredited lawyers, accredited mediators (ADR), Corporate Affairs Commission (CAC) filing agents, tax consultants, and chartered accountants.</li>
    </ol>

    <h2 class="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">3. Formation of Attorney-Client Relationship</h2>
    <p>You explicitly acknowledge and agree that:</p>
    <ul class="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
      <li>Chatting with the AI, requesting de-escalation scripts, or generating an automated Pre-Case File does <em>not</em> constitute legal representation and does <em>not</em> form an attorney-client relationship.</li>
      <li>An attorney-client relationship is established solely when a citizen books a consultation with an accredited practitioner from the directory, both parties agree on terms of representation, and a formal written retainer or engagement agreement is executed in accordance with the Nigerian Bar Association Rules of Professional Conduct.</li>
      <li>In active physical confrontation or imminent danger, you must prioritize your personal physical safety above all else. SabiRight scripts are designed for peaceful de-escalation and statutory assertion, not physical resistance.</li>
    </ul>

    <h2 class="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">4. User Eligibility and Account Conduct</h2>
    <p>To use SabiRight, you must be at least 16 years of age or possess parental/guardian consent. You agree to use the platform only for lawful civic purposes. You expressly agree NOT to:</p>
    <ul class="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
      <li>Submit fictitious, malicious, or fabricated checkpoint reports on the SabiMove™ radar.</li>
      <li>Use the service to intimidate, harass, or defame law enforcement officers, judiciary personnel, or fellow citizens.</li>
      <li>Attempt to reverse-engineer, scrape, or exploit the N-ATLAS sovereign model endpoints or bypass credit quotas.</li>
      <li>Disseminate unlawful, fraudulent, or harmful materials on the SabiRight community forum.</li>
    </ul>

    <h2 class="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">5. Credit System, Subscriptions & Payment Terms</h2>
    <p>SabiRight provides a unified credit balance across Web, Mobile, WhatsApp, and Telegram:</p>
    <ul class="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
      <li><strong>Daily Free Quota:</strong> Every registered user receives a complimentary daily credit refresh (10 credits) for basic statutory inquiries.</li>
      <li><strong>Credit Packages:</strong> Users may purchase top-up credit packs that do not expire.</li>
      <li><strong>Monthly Subscriptions:</strong> Paid tier subscriptions provide enhanced quotas, priority N-ATLAS inference, and extended pre-case storage.</li>
      <li><strong>Payments:</strong> All transactions are billed in Nigerian Naira (NGN) or accepted foreign currencies through licensed payment processors (Flutterwave, Bachs, Paystack) or approved bank transfers. Credits are non-refundable once consumed.</li>
    </ul>

    <h2 class="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">6. Professional Directory Disclaimers</h2>
    <p>Accredited legal practitioners, mediators, CAC agents, and accountants listed on SabiRight are independent professionals and not employees, agents, or partners of SabiRight. While SabiRight verifies NBA enrolment numbers, CAC agent certificates, and professional credentials, SabiRight does not set individual professional legal fees and assumes no liability for the professional conduct, litigation outcomes, or advice provided by third-party professionals.</p>

    <h2 class="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">7. Limitation of Liability</h2>
    <p>To the fullest extent permitted under Nigerian law, SabiRight, its directors, employees, and technological partners shall not be liable for any indirect, incidental, punitive, or consequential damages arising from reliance on AI-generated guidance, delays in professional response times, or unilateral actions taken by third parties or law enforcement authorities.</p>

    <h2 class="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">8. Governing Law & Dispute Resolution</h2>
    <p>These Terms are governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any dispute arising under these Terms shall first be submitted to informal amicable resolution. If unresolved within thirty (30) days, the dispute shall be resolved through binding arbitration in Lagos State, Nigeria, in accordance with the <strong>Arbitration and Mediation Act 2023</strong>.</p>
  </div>',
  'legal',
  false
),
(
  'cookie_policy',
  '<div class="legal-doc-content space-y-6">
    <div class="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200 text-sm leading-relaxed">
      <strong>Transparent Cookie & Local Storage Disclosure:</strong> This Cookie Policy explains how SabiRight uses cookies, local browser storage, and related web technologies to deliver secure session management, dialect preferences, and offline statutory emergency guidance across our digital platforms.
    </div>

    <p class="text-xs text-slate-500 dark:text-slate-400">Effective Date: October 12, 2026 | Version 2.4 | Sabi AI Technologies Limited</p>

    <h2 class="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">1. What Are Cookies and Web Storage?</h2>
    <p>Cookies are small text files placed on your device by websites you visit. In addition to traditional HTTP cookies, modern web applications utilize <strong>Web Storage (localStorage and sessionStorage)</strong> and <strong>IndexedDB</strong> to store essential preference data locally on your device for enhanced performance and offline accessibility.</p>

    <h2 class="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">2. Why SabiRight Uses These Technologies</h2>
    <p>We use cookies and browser storage strictly to deliver core civic features, ensure account security, and enhance user experience:</p>
    <ul class="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
      <li><strong>Authentication & Security:</strong> Securely holding your session tokens (Supabase JWT), preventing cross-site request forgery, and maintaining your logged-in state across pages.</li>
      <li><strong>Offline Civic Rights Caching:</strong> Storing critical constitutional provisions (Section 35, 37 CFRN 1999) and emergency de-escalation guidance directly on your device so you can access legal first-aid even when cellular internet is unavailable.</li>
      <li><strong>User Preferences:</strong> Remembering your chosen theme (dark/light), selected reply language (Nigerian Pidgin, English, Yoruba, Hausa, Igbo), and sidebar display preferences.</li>
      <li><strong>Transit & Route Cache:</strong> Caching recent road traffic and checkpoint alerts for low-latency map navigation.</li>
    </ul>

    <h2 class="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">3. Categories of Storage We Use</h2>
    <div class="space-y-4">
      <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <h3 class="font-bold text-slate-900 dark:text-white text-base">A. Strictly Necessary (Essential) Storage</h3>
        <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">These items are indispensable for the operation of SabiRight. They include security tokens, authentication cookies, and cookie consent records. They cannot be turned off without disabling login and core legal services.</p>
      </div>

      <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <h3 class="font-bold text-slate-900 dark:text-white text-base">B. Functional & Preference Storage</h3>
        <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">These store your language selection, vernacular preference, collapsible sidebar state, and offline MOAT statutory cache for high-speed accessibility.</p>
      </div>

      <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <h3 class="font-bold text-slate-900 dark:text-white text-base">C. Anonymous Platform Analytics</h3>
        <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">We track aggregate, anonymized interaction metrics (such as page load speeds and API response latencies) under the National AI Innovation Challenge to improve platform reliability. We do not use third-party behavioral advertising cookies.</p>
      </div>
    </div>

    <h2 class="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">4. Managing Your Cookie Preferences</h2>
    <p>You can manage your cookie and storage preferences at any time using:</p>
    <ul class="list-disc pl-6 space-y-2 text-slate-700 dark:text-slate-300">
      <li><strong>Our Cookie Banner:</strong> Choose <strong>"Accept All"</strong> to enable full offline caching and rich preferences, or <strong>"Essential Only"</strong> to limit storage to strictly necessary security cookies.</li>
      <li><strong>Browser Controls:</strong> You can configure your browser (Google Chrome, Apple Safari, Mozilla Firefox, Microsoft Edge) to reject or delete cookies. Please note that clearing local storage will require you to log in again and may clear offline cached statutory guides.</li>
    </ul>

    <h2 class="text-xl font-bold text-slate-900 dark:text-white mt-8 mb-4">5. Contact Regarding Cookie Policies</h2>
    <p>If you have questions about our use of cookies or local web storage, please contact us at <a href="mailto:privacy@sabiright.com" class="text-primary underline">privacy@sabiright.com</a> or our Civic Support Desk at +234 7026619186.</p>
  </div>',
  'legal',
  false
)
ON CONFLICT ("key") 
DO UPDATE SET 
    value = EXCLUDED.value,
    category = EXCLUDED.category,
    updated_at = NOW();


-- PART 2: SEED REALISTIC DEMO NIGERIAN PROFESSIONALS COVERING ALL CATEGORIES
-- Profiles, Professionals, and Vendor Services across Lagos, Abuja, Kano, Port Harcourt

-- 1. Barrister Femi Adebayo & Partners (Lawyers / Law Firm - Lagos)
INSERT INTO profiles (id, display_name, email, phone_number, state, city, language, is_vendor, vendor_mode, email_verified, email_verification_status)
VALUES ('pro-usr-adebayo', 'Barrister Femi Adebayo & Partners', 'adebayo.chambers@sabiright-legal.ng', '+234 701 234 5678', 'Lagos', 'Victoria Island, Lagos', 'English', true, true, true, 'verified')
ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, email = EXCLUDED.email, phone_number = EXCLUDED.phone_number, city = EXCLUDED.city, is_vendor = true, vendor_mode = true;

INSERT INTO professionals (id, user_id, display_name, email, phone_number, role, specializations, status, verified, credentials, location, rating, review_count, public_profile)
VALUES (
  'pro-adebayo',
  'pro-usr-adebayo',
  'Barrister Femi Adebayo & Partners',
  'adebayo.chambers@sabiright-legal.ng',
  '+234 701 234 5678',
  'lawyer',
  '["Civil Rights & Constitutional Defense", "Police Act 2020 & Arbitrary Arrest Defense", "ACJA Bail Enforcement", "Commercial Litigation"]'::jsonb,
  'active',
  true,
  '{"accreditation": "Nigerian Bar Association (NBA)", "enrolment_number": "SCN/2012/044812", "branch": "Lagos Branch", "years_experience": 14}'::jsonb,
  '{"street": "Plot 12, Adeola Odeku Street", "city": "Victoria Island, Lagos", "state": "Lagos", "latitude": 6.4281, "longitude": 3.4344}'::jsonb,
  4.9,
  142,
  '{"firm_name": "Adebayo & Associates Legal Chambers", "lead_counsel": "Barrister Femi Adebayo (LL.M, BL)", "office_hours": "08:00 - 18:00 WAT", "bio": "Top-tier human rights and criminal defense litigation practice with extensive courtroom experience in ACJA enforcement, bail proceedings, and fundamental human rights litigation."}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET 
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role,
  specializations = EXCLUDED.specializations,
  status = 'active',
  verified = true,
  location = EXCLUDED.location,
  rating = EXCLUDED.rating,
  public_profile = EXCLUDED.public_profile;

INSERT INTO vendor_services (id, professional_id, name, type, specialization, description, location, latitude, longitude, contact_phone, contact_email, price_range, price_list, verified, rating)
VALUES (
  'srv-adebayo-1',
  'pro-adebayo',
  'Barrister Femi Adebayo Legal Chambers',
  'Lawyers',
  'Civil Rights & Criminal Defense',
  'Senior legal representation for police arrest de-escalation, Section 35/37 constitutional enforcement, ACJA bail hearings, and litigation across Lagos courts.',
  'VI, Lagos',
  6.4281,
  3.4344,
  '+234 701 234 5678',
  'adebayo.chambers@sabiright-legal.ng',
  '₦₦₦',
  '[{"item": "Emergency Police Station Bail & Release", "price": "₦50,000"}, {"item": "Fundamental Rights Enforcement Suit", "price": "₦150,000"}, {"item": "Pre-Case Consultation", "price": "₦25,000"}]'::jsonb,
  true,
  '4.9'
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, location = EXCLUDED.location, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, verified = true;


-- 2. Amina Bello & Partners Legal Consult (Lawyers / Law Firm - Abuja)
INSERT INTO profiles (id, display_name, email, phone_number, state, city, language, is_vendor, vendor_mode, email_verified, email_verification_status)
VALUES ('pro-usr-amina', 'Hajiya Amina Bello & Partners Legal Consult', 'amina.bello@sabiright-legal.ng', '+234 803 456 7890', 'Abuja', 'Wuse II, Abuja', 'Hausa', true, true, true, 'verified')
ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, email = EXCLUDED.email, phone_number = EXCLUDED.phone_number, city = EXCLUDED.city, is_vendor = true, vendor_mode = true;

INSERT INTO professionals (id, user_id, display_name, email, phone_number, role, specializations, status, verified, credentials, location, rating, review_count, public_profile)
VALUES (
  'pro-amina',
  'pro-usr-amina',
  'Hajiya Amina Bello & Partners Legal Consult',
  'amina.bello@sabiright-legal.ng',
  '+234 803 456 7890',
  'lawyer',
  '["Fundamental Human Rights Enforcement", "Corporate & Commercial Law", "Public Interest Advocacy", "Tenancy & Property Disputes"]'::jsonb,
  'active',
  true,
  '{"accreditation": "Nigerian Bar Association (NBA)", "enrolment_number": "SCN/2014/061298", "branch": "Abuja Branch", "years_experience": 12}'::jsonb,
  '{"street": "Aminu Kano Crescent, Wuse II", "city": "Wuse II, Abuja", "state": "Abuja", "latitude": 9.0765, "longitude": 7.4764}'::jsonb,
  4.95,
  98,
  '{"firm_name": "Amina Bello & Partners Legal Consult", "lead_counsel": "Amina Bello, Esq.", "office_hours": "08:30 - 17:30 WAT", "bio": "Abuja-based practice specializing in corporate compliance, federal agency administrative disputes, human rights protection, and high-stakes arbitration."}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET 
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role,
  specializations = EXCLUDED.specializations,
  status = 'active',
  verified = true,
  location = EXCLUDED.location,
  rating = EXCLUDED.rating,
  public_profile = EXCLUDED.public_profile;

INSERT INTO vendor_services (id, professional_id, name, type, specialization, description, location, latitude, longitude, contact_phone, contact_email, price_range, price_list, verified, rating)
VALUES (
  'srv-amina-1',
  'pro-amina',
  'Amina Bello Legal Consult',
  'Lawyers',
  'Constitutional Rights & Tenancy Disputes',
  'Comprehensive legal representation in Abuja courts, landlord eviction resolution, fundamental rights suits, and corporate advisory.',
  'Wuse II, Abuja',
  9.0765,
  7.4764,
  '+234 803 456 7890',
  'amina.bello@sabiright-legal.ng',
  '₦₦₦',
  '[{"item": "Tenancy Dispute Resolution & Court Filing", "price": "₦45,000"}, {"item": "Corporate Legal Advisory", "price": "₦75,000"}, {"item": "Pre-Case File Review", "price": "₦20,000"}]'::jsonb,
  true,
  '4.9'
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, location = EXCLUDED.location, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, verified = true;


-- 3. FirstLine CAC Corporate Filing & Incorporation Bureau (CAC Agents - Lagos)
INSERT INTO profiles (id, display_name, email, phone_number, state, city, language, is_vendor, vendor_mode, email_verified, email_verification_status)
VALUES ('pro-usr-caclagos', 'FirstLine CAC Corporate Filing Bureau', 'cac.filings@sabiright-corporate.ng', '+234 812 345 6789', 'Lagos', 'Ikeja, Lagos', 'English', true, true, true, 'verified')
ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, email = EXCLUDED.email, phone_number = EXCLUDED.phone_number, city = EXCLUDED.city, is_vendor = true, vendor_mode = true;

INSERT INTO professionals (id, user_id, display_name, email, phone_number, role, specializations, status, verified, credentials, location, rating, review_count, public_profile)
VALUES (
  'pro-caclagos',
  'pro-usr-caclagos',
  'FirstLine CAC Corporate Filing Bureau',
  'cac.filings@sabiright-corporate.ng',
  '+234 812 345 6789',
  'cac_agent',
  '["CAC Business Name Registration", "Limited Liability Company Incorporation (LTD)", "Incorporated Trustees & NGO Filing", "Annual Returns & Post-Incorporation"]'::jsonb,
  'active',
  true,
  '{"accreditation": "Corporate Affairs Commission (CAC Accredited Agent)", "license_number": "CAC/AGT/2018/009412", "years_experience": 9}'::jsonb,
  '{"street": "Allen Avenue", "city": "Ikeja, Lagos", "state": "Lagos", "latitude": 6.5954, "longitude": 3.3515}'::jsonb,
  4.9,
  215,
  '{"firm_name": "FirstLine Corporate Services", "lead_agent": "Barrister Tunde Adeleke (CAC Accredited)", "office_hours": "08:00 - 17:00 WAT", "bio": "Accredited CAC corporate registration bureau providing fast-track company incorporation, business name registrations, NGO trusteeship, and status report filings."}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET 
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role,
  specializations = EXCLUDED.specializations,
  status = 'active',
  verified = true,
  location = EXCLUDED.location,
  rating = EXCLUDED.rating,
  public_profile = EXCLUDED.public_profile;

INSERT INTO vendor_services (id, professional_id, name, type, specialization, description, location, latitude, longitude, contact_phone, contact_email, price_range, price_list, verified, rating)
VALUES (
  'srv-caclagos-1',
  'pro-caclagos',
  'FirstLine CAC Corporate Filings',
  'Company Registration',
  'CAC Incorporation & Business Name',
  'Fast-track registration of Business Names, Private Limited Companies (LTD), NGOs, and Annual Returns filing with official CAC certificates.',
  'Ikeja, Lagos',
  6.5954,
  3.3515,
  '+234 812 345 6789',
  'cac.filings@sabiright-corporate.ng',
  '₦₦',
  '[{"item": "Business Name Registration (Cert + Status)", "price": "₦25,000"}, {"item": "Private Limited Company (LTD 1M Share)", "price": "₦65,000"}, {"item": "Incorporated Trustees / NGO / Church", "price": "₦120,000"}, {"item": "Annual Returns Filing", "price": "₦20,000"}]'::jsonb,
  true,
  '4.9'
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, location = EXCLUDED.location, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, verified = true;


-- 4. Capital CAC Regulatory & Business Support Services (CAC Agents - Abuja)
INSERT INTO profiles (id, display_name, email, phone_number, state, city, language, is_vendor, vendor_mode, email_verified, email_verification_status)
VALUES ('pro-usr-cacabuja', 'Capital CAC Regulatory Services Ltd', 'capital.cac@sabiright-corporate.ng', '+234 818 901 2345', 'Abuja', 'Central Business District, Abuja', 'English', true, true, true, 'verified')
ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, email = EXCLUDED.email, phone_number = EXCLUDED.phone_number, city = EXCLUDED.city, is_vendor = true, vendor_mode = true;

INSERT INTO professionals (id, user_id, display_name, email, phone_number, role, specializations, status, verified, credentials, location, rating, review_count, public_profile)
VALUES (
  'pro-cacabuja',
  'pro-usr-cacabuja',
  'Capital CAC Regulatory Services Ltd',
  'capital.cac@sabiright-corporate.ng',
  '+234 818 901 2345',
  'cac_agent',
  '["Company Incorporation & CAC Fast-Track", "SCUML & EFCC Anti-Money Laundering Registration", "NIPC Foreign Investment Permits", "Trademark & Patent Registration"]'::jsonb,
  'active',
  true,
  '{"accreditation": "Corporate Affairs Commission (CAC)", "license_number": "CAC/AGT/2016/004523", "years_experience": 11}'::jsonb,
  '{"street": "Herbert Macaulay Way, CBD", "city": "CBD, Abuja", "state": "Abuja", "latitude": 9.0579, "longitude": 7.4951}'::jsonb,
  4.95,
  184,
  '{"firm_name": "Capital Corporate Bureau Abuja", "lead_agent": "Barrister Chidinma Nwosu (ICSAN, CAC)", "office_hours": "08:30 - 17:00 WAT", "bio": "Abuja corporate headquarters agency specializing in CAC post-incorporation, share capital increases, SCUML EFCC compliance certificates, and trademarks."}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET 
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role,
  specializations = EXCLUDED.specializations,
  status = 'active',
  verified = true,
  location = EXCLUDED.location,
  rating = EXCLUDED.rating,
  public_profile = EXCLUDED.public_profile;

INSERT INTO vendor_services (id, professional_id, name, type, specialization, description, location, latitude, longitude, contact_phone, contact_email, price_range, price_list, verified, rating)
VALUES (
  'srv-cacabuja-1',
  'pro-cacabuja',
  'Capital CAC & SCUML Compliance',
  'Company Registration',
  'CAC Corporate & Regulatory Permits',
  'Official CAC corporate filing, SCUML anti-money laundering registration for bank accounts, and federal business permit approvals.',
  'CBD, Abuja',
  9.0579,
  7.4951,
  '+234 818 901 2345',
  'capital.cac@sabiright-corporate.ng',
  '₦₦₦',
  '[{"item": "SCUML EFCC Compliance Certificate", "price": "₦45,000"}, {"item": "Full Company Incorporation + TIN", "price": "₦75,000"}, {"item": "Trademark Name Reservation", "price": "₦50,000"}]'::jsonb,
  true,
  '4.95'
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, location = EXCLUDED.location, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, verified = true;


-- 5. Ngozi & Partners Tax Consultants (Tax Experts / FIRS - Lagos)
INSERT INTO profiles (id, display_name, email, phone_number, state, city, language, is_vendor, vendor_mode, email_verified, email_verification_status)
VALUES ('pro-usr-taxngozi', 'Ngozi & Partners Tax Consultants', 'ngozi.tax@sabiright-finance.ng', '+234 909 876 5432', 'Lagos', 'Lekki Phase 1, Lagos', 'English', true, true, true, 'verified')
ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, email = EXCLUDED.email, phone_number = EXCLUDED.phone_number, city = EXCLUDED.city, is_vendor = true, vendor_mode = true;

INSERT INTO professionals (id, user_id, display_name, email, phone_number, role, specializations, status, verified, credentials, location, rating, review_count, public_profile)
VALUES (
  'pro-taxngozi',
  'pro-usr-taxngozi',
  'Ngozi & Partners Tax Consultants',
  'ngozi.tax@sabiright-finance.ng',
  '+234 909 876 5432',
  'tax_agent',
  '["FIRS Corporate Income Tax (CIT)", "LIRS Personal Income Tax & PAYE", "Withholding Tax (WHT) & VAT Filing", "Tax Clearance Certificate (TCC) Procurement"]'::jsonb,
  'active',
  true,
  '{"accreditation": "Chartered Institute of Taxation of Nigeria (CITN)", "license_number": "CITN/2015/0421", "firs_accredited": true, "years_experience": 10}'::jsonb,
  '{"street": "Admiralty Way, Lekki Phase 1", "city": "Lekki, Lagos", "state": "Lagos", "latitude": 6.4469, "longitude": 3.5753}'::jsonb,
  4.8,
  112,
  '{"firm_name": "Ngozi Finance & Tax Consulting", "lead_consultant": "Ngozi Ezechukwu (FCTI, ACA)", "office_hours": "09:00 - 17:00 WAT", "bio": "Specialized tax advisory firm handling FIRS tax audits, State Internal Revenue Service (LIRS) compliance, VAT returns, and Tax Clearance Certificates."}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET 
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role,
  specializations = EXCLUDED.specializations,
  status = 'active',
  verified = true,
  location = EXCLUDED.location,
  rating = EXCLUDED.rating,
  public_profile = EXCLUDED.public_profile;

INSERT INTO vendor_services (id, professional_id, name, type, specialization, description, location, latitude, longitude, contact_phone, contact_email, price_range, price_list, verified, rating)
VALUES (
  'srv-taxngozi-1',
  'pro-taxngozi',
  'Ngozi Finance & Tax Advisory',
  'Tax Experts',
  'FIRS & LIRS Tax Compliance',
  'Professional corporate tax computations, Tax Clearance Certificates (TCC), Value Added Tax (VAT) monthly filing, and audit resolution.',
  'Lekki, Lagos',
  6.4469,
  3.5753,
  '+234 909 876 5432',
  'ngozi.tax@sabiright-finance.ng',
  '₦₦',
  '[{"item": "Tax Clearance Certificate (TCC) Procurement", "price": "₦40,000"}, {"item": "Monthly VAT & WHT Filing", "price": "₦30,000"}, {"item": "FIRS Corporate Tax Assessment Audit", "price": "₦80,000"}]'::jsonb,
  true,
  '4.8'
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, location = EXCLUDED.location, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, verified = true;


-- 6. Chukwudi & Associates Chartered Accountants (Accountants / ICAN - Lagos)
INSERT INTO profiles (id, display_name, email, phone_number, state, city, language, is_vendor, vendor_mode, email_verified, email_verification_status)
VALUES ('pro-usr-chukwudi', 'Chukwudi & Associates Chartered Accountants', 'chukwudi.audit@sabiright-finance.ng', '+234 801 987 6543', 'Lagos', 'Ikoyi, Lagos', 'English', true, true, true, 'verified')
ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, email = EXCLUDED.email, phone_number = EXCLUDED.phone_number, city = EXCLUDED.city, is_vendor = true, vendor_mode = true;

INSERT INTO professionals (id, user_id, display_name, email, phone_number, role, specializations, status, verified, credentials, location, rating, review_count, public_profile)
VALUES (
  'pro-chukwudi',
  'pro-usr-chukwudi',
  'Chukwudi & Associates Chartered Accountants',
  'chukwudi.audit@sabiright-finance.ng',
  '+234 801 987 6543',
  'accountant',
  '["Corporate Accounting & Audit", "SME Financial Records & Bookkeeping", "Forensic Accounting", "Payroll Management"]'::jsonb,
  'active',
  true,
  '{"accreditation": "Institute of Chartered Accountants of Nigeria (ICAN)", "license_number": "ICAN/FCA/2010/1184", "years_experience": 16}'::jsonb,
  '{"street": "Kingsway Road, Ikoyi", "city": "Ikoyi, Lagos", "state": "Lagos", "latitude": 6.4513, "longitude": 3.4647}'::jsonb,
  4.85,
  89,
  '{"firm_name": "Chukwudi & Associates", "lead_partner": "Chukwudi Okonkwo (FCA, MBA)", "office_hours": "08:30 - 17:30 WAT", "bio": "Chartered accounting and auditing practice delivering certified annual financial statements, SME bookkeeping setups, and statutory accounting services."}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET 
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role,
  specializations = EXCLUDED.specializations,
  status = 'active',
  verified = true,
  location = EXCLUDED.location,
  rating = EXCLUDED.rating,
  public_profile = EXCLUDED.public_profile;

INSERT INTO vendor_services (id, professional_id, name, type, specialization, description, location, latitude, longitude, contact_phone, contact_email, price_range, price_list, verified, rating)
VALUES (
  'srv-chukwudi-1',
  'pro-chukwudi',
  'Chukwudi & Associates Accounting',
  'Accountants',
  'Auditing & SME Financial Records',
  'Certified corporate audit reports, statutory financial statements, payroll setup, and bookkeeping for businesses and civic organizations.',
  'Ikoyi, Lagos',
  6.4513,
  3.4647,
  '+234 801 987 6543',
  'chukwudi.audit@sabiright-finance.ng',
  '₦₦₦₦',
  '[{"item": "Annual Audited Financial Statement", "price": "₦120,000"}, {"item": "SME Monthly Bookkeeping Retainer", "price": "₦50,000"}, {"item": "Forensic Financial Investigation", "price": "₦200,000"}]'::jsonb,
  true,
  '4.85'
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, location = EXCLUDED.location, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, verified = true;


-- 7. Kano Civil Rights & Alternative Dispute Resolution (ADR) Chambers (Mediator / ADR - Kano)
INSERT INTO profiles (id, display_name, email, phone_number, state, city, language, is_vendor, vendor_mode, email_verified, email_verification_status)
VALUES ('pro-usr-kanoadr', 'Kano Civil Rights & Mediation Chambers', 'kano.adr@sabiright-legal.ng', '+234 802 789 1234', 'Kano', 'Nassarawa GRA, Kano', 'Hausa', true, true, true, 'verified')
ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, email = EXCLUDED.email, phone_number = EXCLUDED.phone_number, city = EXCLUDED.city, is_vendor = true, vendor_mode = true;

INSERT INTO professionals (id, user_id, display_name, email, phone_number, role, specializations, status, verified, credentials, location, rating, review_count, public_profile)
VALUES (
  'pro-kanoadr',
  'pro-usr-kanoadr',
  'Kano Civil Rights & Mediation Chambers',
  'kano.adr@sabiright-legal.ng',
  '+234 802 789 1234',
  'mediator',
  '["Community & Commercial Mediation", "Tenancy & Landlord Arbitration", "Civil Conciliation", "Police-Citizen De-escalation"]'::jsonb,
  'active',
  true,
  '{"accreditation": "Institute of Chartered Mediators and Conciliators (ICMC)", "branch": "Kano Branch", "years_experience": 11}'::jsonb,
  '{"street": "Bompai Road, Nassarawa GRA", "city": "Nassarawa, Kano", "state": "Kano", "latitude": 11.9964, "longitude": 8.5432}'::jsonb,
  4.9,
  76,
  '{"firm_name": "Kano Mediation & ADR Practice", "lead_mediator": "Alhaji Ibrahim Danladi (FICMC)", "office_hours": "08:00 - 16:30 WAT", "bio": "Accredited ADR mediation center providing neutral dispute settlement for commercial debt, tenancy conflicts, family disputes, and neighborhood issues in Hausa and English."}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET 
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role,
  specializations = EXCLUDED.specializations,
  status = 'active',
  verified = true,
  location = EXCLUDED.location,
  rating = EXCLUDED.rating,
  public_profile = EXCLUDED.public_profile;

INSERT INTO vendor_services (id, professional_id, name, type, specialization, description, location, latitude, longitude, contact_phone, contact_email, price_range, price_list, verified, rating)
VALUES (
  'srv-kanoadr-1',
  'pro-kanoadr',
  'Kano Mediation & Dispute Resolution',
  'Lawyers',
  'Alternative Dispute Resolution (ADR)',
  'Certified neutral mediation sessions for resolving tenancy, commercial debt, and community disputes without prolonged court litigation.',
  'Nassarawa, Kano',
  11.9964,
  8.5432,
  '+234 802 789 1234',
  'kano.adr@sabiright-legal.ng',
  '₦₦',
  '[{"item": "Full Day Mediation Session & Settlement Agreement", "price": "₦40,000"}, {"item": "Tenancy Eviction Conciliation", "price": "₦30,000"}, {"item": "Commercial Debt Mediation", "price": "₦50,000"}]'::jsonb,
  true,
  '4.9'
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, location = EXCLUDED.location, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, verified = true;


-- 8. Niger Delta Justice & ADR Practice (Mediator / Lawyer - Port Harcourt)
INSERT INTO profiles (id, display_name, email, phone_number, state, city, language, is_vendor, vendor_mode, email_verified, email_verification_status)
VALUES ('pro-usr-phjustice', 'Niger Delta Justice & ADR Practice', 'ph.justice@sabiright-legal.ng', '+234 805 678 9012', 'Rivers', 'GRA Phase 2, Port Harcourt', 'English', true, true, true, 'verified')
ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name, email = EXCLUDED.email, phone_number = EXCLUDED.phone_number, city = EXCLUDED.city, is_vendor = true, vendor_mode = true;

INSERT INTO professionals (id, user_id, display_name, email, phone_number, role, specializations, status, verified, credentials, location, rating, review_count, public_profile)
VALUES (
  'pro-phjustice',
  'pro-usr-phjustice',
  'Niger Delta Justice & ADR Practice',
  'ph.justice@sabiright-legal.ng',
  '+234 805 678 9012',
  'mediator',
  '["Community Land Disputes & Mediation", "Maritime & Oilfield Labor Conciliation", "Police Stop & Detainment Intervention", "Tenancy Agreements"]'::jsonb,
  'active',
  true,
  '{"accreditation": "NBA Port Harcourt Branch & Rivers State Multi-Door Courthouse", "enrolment_number": "SCN/2013/055419", "years_experience": 13}'::jsonb,
  '{"street": "Tombia Street, GRA Phase 2", "city": "Port Harcourt", "state": "Rivers", "latitude": 4.8156, "longitude": 7.0125}'::jsonb,
  4.85,
  67,
  '{"firm_name": "Niger Delta Justice Chambers", "lead_counsel": "Barrister Victor Briggs (Ch.MC)", "office_hours": "08:30 - 17:00 WAT", "bio": "Port Harcourt civic and commercial mediation practice specializing in landlord/tenant conflicts, contract enforcement, and rapid police detainment interventions."}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET 
  display_name = EXCLUDED.display_name,
  role = EXCLUDED.role,
  specializations = EXCLUDED.specializations,
  status = 'active',
  verified = true,
  location = EXCLUDED.location,
  rating = EXCLUDED.rating,
  public_profile = EXCLUDED.public_profile;

INSERT INTO vendor_services (id, professional_id, name, type, specialization, description, location, latitude, longitude, contact_phone, contact_email, price_range, price_list, verified, rating)
VALUES (
  'srv-phjustice-1',
  'pro-phjustice',
  'Niger Delta Justice & Mediation',
  'Lawyers',
  'ADR & Tenancy Rights Protection',
  'Legal defense and dispute mediation covering Port Harcourt and the Niger Delta corridor for tenancy, commercial contracts, and fundamental rights.',
  'Port Harcourt',
  4.8156,
  7.0125,
  '+234 805 678 9012',
  'ph.justice@sabiright-legal.ng',
  '₦₦₦',
  '[{"item": "Emergency Detainment & Bail Intervention", "price": "₦60,000"}, {"item": "Tenancy Dispute Resolution", "price": "₦35,000"}, {"item": "Commercial Arbitration Session", "price": "₦70,000"}]'::jsonb,
  true,
  '4.85'
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, location = EXCLUDED.location, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, verified = true;

-- End of migration
