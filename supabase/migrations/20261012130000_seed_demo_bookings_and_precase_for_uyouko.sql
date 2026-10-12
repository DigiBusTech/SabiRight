-- =========================================================================
-- SABIRIGHT MIGRATION: SEED 3 DEMO BOOKINGS & PRE-CASE FILES FOR UYOUKO EKPO
-- Target User: Uyouko Ekpo (ekpouyouko@gmail.com)
-- Migration: 20261012130000_seed_demo_bookings_and_precase_for_uyouko.sql
-- =========================================================================

DO $$
DECLARE
    v_user_id TEXT;
BEGIN
    -- 1. Locate Uyouko Ekpo's profile ID by email
    SELECT id INTO v_user_id FROM profiles WHERE LOWER(email) = 'ekpouyouko@gmail.com' LIMIT 1;
    
    -- Fallback to known Supabase profile ID if not found by query
    IF v_user_id IS NULL THEN
        v_user_id := 'd918c1fd-6ea1-4492-96c9-09dfdb6daef1';
        
        -- Ensure profile exists
        INSERT INTO profiles (id, email, display_name, phone_number, state, city, language, email_verified, email_verification_status)
        VALUES (v_user_id, 'ekpouyouko@gmail.com', 'Uyouko Ekpo', '+234 803 123 4567', 'Lagos', 'Lagos', 'English', true, 'verified')
        ON CONFLICT (id) DO UPDATE SET 
            display_name = 'Uyouko Ekpo',
            email = 'ekpouyouko@gmail.com';
    ELSE
        -- Update profile name if needed
        UPDATE profiles 
        SET display_name = 'Uyouko Ekpo'
        WHERE id = v_user_id;
    END IF;

    -- Ensure professionals exist for foreign key referencing
    INSERT INTO profiles (id, display_name, email, phone_number, state, city, language, is_vendor, vendor_mode, email_verified, email_verification_status)
    VALUES 
    ('pro-usr-adebayo', 'Barrister Femi Adebayo & Partners', 'adebayo.chambers@sabiright-legal.ng', '+234 701 234 5678', 'Lagos', 'Victoria Island, Lagos', 'English', true, true, true, 'verified'),
    ('pro-usr-amina', 'Hajiya Amina Bello & Partners Legal Consult', 'amina.bello@sabiright-legal.ng', '+234 803 456 7890', 'Abuja', 'Wuse II, Abuja', 'Hausa', true, true, true, 'verified'),
    ('pro-usr-caclagos', 'FirstLine CAC Corporate Filing Bureau', 'cac.filings@sabiright-corporate.ng', '+234 812 345 6789', 'Lagos', 'Ikeja, Lagos', 'English', true, true, true, 'verified')
    ON CONFLICT (id) DO NOTHING;

    -- -------------------------------------------------------------------------
    -- CASE 1: UNLAWFUL POLICE STOP & WARRANTLESS PHONE SEARCH
    -- -------------------------------------------------------------------------
    INSERT INTO pre_case_files (
        id, case_ref, user_id, channel, issue_summary, urgency_level,
        statutory_citations, facts, evidence_mentioned, desired_outcome,
        intake_notes, raw_chat_history, created_at
    ) VALUES (
        'cf-demo-uyouko-01',
        'CASE-849201',
        v_user_id,
        'web',
        'Client was intercepted at Lekki Phase 1 / Admiralty Way roundabout by tactical police officers demanding an involuntary, warrantless search of his mobile banking and WhatsApp applications under threat of detention at Maroko Police Station.',
        'High',
        '[
            "Section 37, Constitution of the Federal Republic of Nigeria 1999 (Fundamental Right to Privacy of Citizens)",
            "Section 49(1), Nigeria Police Act 2020 (Strict Statutory Conditions for Stop-and-Search Procedures)",
            "Section 8(2), Administration of Criminal Justice Act (ACJA 2015) (Prohibition of Arrest for Civil Matter/Warrantless Fishing Expeditions)",
            "Sections 30-32, ACJA 2015 (Right to Bail on Recognizance Free of Charge)"
        ]'::jsonb,
        '[
            "Incident occurred on October 10, 2026 at approximately 10:45 PM along Admiralty Way, Lekki, Lagos.",
            "Officers in unbadged tactical vests ordered client to step out of vehicle and surrender unlocked iPhone 15 Pro.",
            "Client politely cited Section 37 CFRN 1999; officers became aggressive and demanded ₦100,000 to avoid detention.",
            "Client recorded badge numbers and audio using SabiRight Legal First Aid script before officers released vehicle."
        ]'::jsonb,
        '[
            "Clear audio recording of the checkpoint conversation",
            "Officer identification badge numbers (AP/294812 and F/109482)",
            "Dashcam timestamped video showing vehicle interception"
        ]'::jsonb,
        'Formal petition to the Lagos State Police Command Complaint Response Unit (CRU) and Divisional Police Officer (DPO) Maroko, retrieval of retained vehicle particulars, and restraining undertaking against harassment.',
        'Synthesized via SabiRight Legal First Aid AI with N-ATLAS grounding. High urgency due to active harassment threat.',
        '[]'::jsonb,
        NOW() - INTERVAL '2 days'
    ) ON CONFLICT (id) DO UPDATE SET 
        user_id = EXCLUDED.user_id,
        issue_summary = EXCLUDED.issue_summary,
        urgency_level = EXCLUDED.urgency_level,
        statutory_citations = EXCLUDED.statutory_citations,
        facts = EXCLUDED.facts,
        evidence_mentioned = EXCLUDED.evidence_mentioned,
        desired_outcome = EXCLUDED.desired_outcome;

    INSERT INTO direct_bookings (
        id, user_id, vendor_id, service_id, case_file_id, status, title,
        description, channel, contact_phone, agreed_fee, notes, created_at, updated_at
    ) VALUES (
        'bk-demo-uyouko-01',
        v_user_id,
        'pro-usr-adebayo',
        'srv-adebayo-1',
        'cf-demo-uyouko-01',
        'in_progress',
        'Unlawful Police Stop & Warrantless Phone Search (Lekki Checkpoint)',
        'Emergency legal defense regarding arbitrary roadblock detention and unlawful mobile phone search at Admiralty Way roundabout. --- SabiRight Pre-Case Intake Brief (CASE-849201)',
        'web',
        '+234 803 123 4567',
        '₦50,000',
        'Barrister Femi Adebayo assigned to lead fundamental rights petition to Lagos State CRU.',
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '1 hour'
    ) ON CONFLICT (id) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        vendor_id = EXCLUDED.vendor_id,
        status = EXCLUDED.status,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        agreed_fee = EXCLUDED.agreed_fee;

    -- Messages for Case 1
    INSERT INTO direct_booking_messages (id, booking_id, sender_id, message, attachments, is_admin_message, created_at)
    VALUES
    (
        'msg-uyouko-01-1',
        'bk-demo-uyouko-01',
        v_user_id,
        'Hello Barrister Adebayo, I was stopped by tactical officers at Admiralty Way. They threatened me when I refused to unlock my phone. I have the badge numbers and an audio recording from my dashcam.',
        '[]'::jsonb,
        false,
        NOW() - INTERVAL '2 days' + INTERVAL '10 minutes'
    ),
    (
        'msg-uyouko-01-2',
        'bk-demo-uyouko-01',
        'pro-usr-adebayo',
        'Good day Mr. Uyouko Ekpo. I have reviewed your SabiRight Pre-Case File (CASE-849201). You handled the situation correctly by invoking Section 37 of the 1999 Constitution and Section 49(1) of the Police Act 2020. Please share the badge numbers and the audio file.',
        '[]'::jsonb,
        false,
        NOW() - INTERVAL '2 days' + INTERVAL '35 minutes'
    ),
    (
        'msg-uyouko-01-3',
        'bk-demo-uyouko-01',
        v_user_id,
        'The badge numbers are AP/294812 and F/109482. They claimed to be attached to the Maroko Police Division. I am uploading the audio recording transcript now.',
        '[]'::jsonb,
        false,
        NOW() - INTERVAL '1 day' + INTERVAL '2 hours'
    ),
    (
        'msg-uyouko-01-4',
        'bk-demo-uyouko-01',
        'pro-usr-adebayo',
        'Noted with thanks. Our chambers is drafting an urgent formal petition to the Lagos State Police Command Provost Marshal and the DPO Maroko Division today. We will seek immediate return of your vehicle particulars and a written guarantee against further harassment.',
        '[]'::jsonb,
        false,
        NOW() - INTERVAL '5 hours'
    ) ON CONFLICT (id) DO NOTHING;


    -- -------------------------------------------------------------------------
    -- CASE 2: ILLEGAL 7-DAY QUIT NOTICE & ARBITRARY 65% RENT ESCALATION
    -- -------------------------------------------------------------------------
    INSERT INTO pre_case_files (
        id, case_ref, user_id, channel, issue_summary, urgency_level,
        statutory_citations, facts, evidence_mentioned, desired_outcome,
        intake_notes, raw_chat_history, created_at
    ) VALUES (
        'cf-demo-uyouko-02',
        'CASE-723145',
        v_user_id,
        'web',
        'Landlord issued an unlawful 7-day "Notice of Ejection" to a yearly residential tenant whose lease remains active through December 31, 2026, paired with an extortionate 65% rent surge and threats of disconnecting essential borehole water utilities.',
        'Medium',
        '[
            "Lagos State Tenancy Law 2011 (Section 13 - Mandatory 6-Month Notice to Quit for Yearly Tenants)",
            "Recovery of Premises Act (Sections 8 & 9 - Proper Service of Statutory Notices)",
            "Section 16, Lagos State Tenancy Law 2011 (Strict Prohibition of Self-Help, Forceful Ejection, or Disconnection of Utilities)",
            "Section 44, 1999 Constitution (Right to Property and Protection from Unlawful Deprivation)"
        ]'::jsonb,
        '[
            "Client has resided in a 3-bedroom apartment in Lekki Phase 1 under a yearly tenancy agreement since January 2025.",
            "Current annual rent is ₦2,800,000, fully paid with valid receipt until December 31, 2026.",
            "On October 5, 2026, landlord slipped a handwritten 7-day quit notice citing arbitrary renovation plans.",
            "Landlord issued renewal invoice demanding ₦4,620,000 (+65%) and threatened to lock the gate and cut water supply."
        ]'::jsonb,
        '[
            "Executed 2-year Tenancy Agreement signed January 2025",
            "Bank statement showing rent payments made via transfer",
            "Photograph and scanned copy of the defective 7-day Notice to Quit",
            "WhatsApp text messages containing threats of water disconnection"
        ]'::jsonb,
        'Service of a formal Advocate Legal Letter of Statutory Rejection, restraining landlord from illegal lockout or utility disconnection, and mediation of a reasonable market-rate renewal.',
        'Handled under Lagos Tenancy Law 2011. Notice is defective on its face.',
        '[]'::jsonb,
        NOW() - INTERVAL '5 days'
    ) ON CONFLICT (id) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        issue_summary = EXCLUDED.issue_summary,
        urgency_level = EXCLUDED.urgency_level,
        statutory_citations = EXCLUDED.statutory_citations,
        facts = EXCLUDED.facts,
        evidence_mentioned = EXCLUDED.evidence_mentioned,
        desired_outcome = EXCLUDED.desired_outcome;

    INSERT INTO direct_bookings (
        id, user_id, vendor_id, service_id, case_file_id, status, title,
        description, channel, contact_phone, agreed_fee, notes, created_at, updated_at
    ) VALUES (
        'bk-demo-uyouko-02',
        v_user_id,
        'pro-usr-amina',
        'srv-amina-1',
        'cf-demo-uyouko-02',
        'confirmed',
        'Illegal 7-Day Quit Notice & Tenancy Dispute Defense',
        'Legal defense against defective 7-day eviction notice and unlawful 65% rent hike on residential apartment. --- SabiRight Pre-Case Intake Brief (CASE-723145)',
        'web',
        '+234 803 123 4567',
        '₦35,000',
        'Hajiya Amina Bello handling formal advocate letter of objection to landlord counsel.',
        NOW() - INTERVAL '5 days',
        NOW() - INTERVAL '1 day'
    ) ON CONFLICT (id) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        vendor_id = EXCLUDED.vendor_id,
        status = EXCLUDED.status,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        agreed_fee = EXCLUDED.agreed_fee;

    -- Messages for Case 2
    INSERT INTO direct_booking_messages (id, booking_id, sender_id, message, attachments, is_admin_message, created_at)
    VALUES
    (
        'msg-uyouko-02-1',
        'bk-demo-uyouko-02',
        v_user_id,
        'Hello Counsel Amina, my landlord gave me a 7-day quit notice today even though my yearly rent is paid up until December 31st! He is also threatening to lock the main compound gate.',
        '[]'::jsonb,
        false,
        NOW() - INTERVAL '5 days' + INTERVAL '1 hour'
    ),
    (
        'msg-uyouko-02-2',
        'bk-demo-uyouko-02',
        'pro-usr-amina',
        'Hello Mr. Uyouko. Under Section 13 of the Lagos State Tenancy Law 2011, a yearly tenant is entitled to a minimum of six (6) full calendar months notice to quit expiring at the eve of the anniversary of the tenancy. A 7-day notice is completely null, void, and of no legal consequence.',
        '[]'::jsonb,
        false,
        NOW() - INTERVAL '5 days' + INTERVAL '2 hours'
    ),
    (
        'msg-uyouko-02-3',
        'bk-demo-uyouko-02',
        'pro-usr-amina',
        'Furthermore, Section 16 strictly criminalizes self-help, locking tenants out, or tampering with water or electricity. Anyone attempting that commits an offense liable to fine and imprisonment. I have drafted a formal Statutory Rejection Letter to dispatch to your landlord.',
        '[]'::jsonb,
        false,
        NOW() - INTERVAL '4 days' + INTERVAL '3 hours'
    ),
    (
        'msg-uyouko-02-4',
        'bk-demo-uyouko-02',
        v_user_id,
        'Thank you so much Counsel. Please proceed with serving the letter. This gives me tremendous peace of mind.',
        '[]'::jsonb,
        false,
        NOW() - INTERVAL '3 days' + INTERVAL '4 hours'
    ) ON CONFLICT (id) DO NOTHING;


    -- -------------------------------------------------------------------------
    -- CASE 3: CAC FAST-TRACK INCORPORATION & TAX REGISTRATION (CAMA 2020)
    -- -------------------------------------------------------------------------
    INSERT INTO pre_case_files (
        id, case_ref, user_id, channel, issue_summary, urgency_level,
        statutory_citations, facts, evidence_mentioned, desired_outcome,
        intake_notes, raw_chat_history, created_at
    ) VALUES (
        'cf-demo-uyouko-03',
        'CASE-918024',
        v_user_id,
        'web',
        'Fast-track company incorporation for SabiTech Innovations Limited (Private Company Limited by Shares, ₦1,000,000 Authorized Share Capital) with automated Tax Identification Number (TIN) and CAC Status Report.',
        'Low',
        '[
            "Companies and Allied Matters Act (CAMA 2020 - Sections 18-22 on Incorporation of Companies)",
            "Corporate Affairs Commission (CAC) Regulations 2021",
            "Finance Act 2023 (Joint CAC-FIRS Integrated Tax Identification Protocol)"
        ]'::jsonb,
        '[
            "Promoter Uyouko Ekpo establishing a Nigerian civic tech & AI software engineering company.",
            "Two initial shareholders and directors with verified National Identity Numbers (NIN).",
            "Company registered office located in Ikeja, Lagos State.",
            "Primary object clauses: Artificial Intelligence Software Development, Civic Technology, and Legal Information Automation."
        ]'::jsonb,
        '[
            "Approved Name Availability Reservation Certificate (SabiTech Innovations Ltd)",
            "Director NIN identification slips and digital signatures",
            "Verified Lagos utility bill for corporate office"
        ]'::jsonb,
        'Issuance of official CAC Certificate of Incorporation (RC Number), Certified Memorandum and Articles of Association (MEMART), CAC Status Report, and FIRS Corporate Tax Identification Number.',
        'Standard incorporation retainer successfully concluded.',
        '[]'::jsonb,
        NOW() - INTERVAL '12 days'
    ) ON CONFLICT (id) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        issue_summary = EXCLUDED.issue_summary,
        urgency_level = EXCLUDED.urgency_level,
        statutory_citations = EXCLUDED.statutory_citations,
        facts = EXCLUDED.facts,
        evidence_mentioned = EXCLUDED.evidence_mentioned,
        desired_outcome = EXCLUDED.desired_outcome;

    INSERT INTO direct_bookings (
        id, user_id, vendor_id, service_id, case_file_id, status, title,
        description, channel, contact_phone, agreed_fee, notes, created_at, updated_at
    ) VALUES (
        'bk-demo-uyouko-03',
        v_user_id,
        'pro-usr-caclagos',
        'srv-caclagos-1',
        'cf-demo-uyouko-03',
        'completed',
        'CAC Company Incorporation: SabiTech Innovations Limited (RC-7182914)',
        'Private Limited Company (LTD) incorporation with 1M Share Capital, Certified MEMART, and FIRS TIN registration. --- SabiRight Pre-Case Intake Brief (CASE-918024)',
        'web',
        '+234 803 123 4567',
        '₦65,000',
        'Incorporation completed successfully. CAC Certificate and FIRS TIN delivered to client.',
        NOW() - INTERVAL '12 days',
        NOW() - INTERVAL '2 days'
    ) ON CONFLICT (id) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        vendor_id = EXCLUDED.vendor_id,
        status = EXCLUDED.status,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        agreed_fee = EXCLUDED.agreed_fee;

    -- Messages for Case 3
    INSERT INTO direct_booking_messages (id, booking_id, sender_id, message, attachments, is_admin_message, created_at)
    VALUES
    (
        'msg-uyouko-03-1',
        'bk-demo-uyouko-03',
        v_user_id,
        'Hello FirstLine Corporate Bureau, I want to incorporate a civic tech startup named SabiTech Innovations Limited. The name reservation has already been approved.',
        '[]'::jsonb,
        false,
        NOW() - INTERVAL '12 days' + INTERVAL '30 minutes'
    ),
    (
        'msg-uyouko-03-2',
        'bk-demo-uyouko-03',
        'pro-usr-caclagos',
        'Good day Mr. Uyouko Ekpo. Congratulations on your name reservation! We have accessed your Pre-Case intake details (CASE-918024). We will finalize the MEMART drafting and upload the directors details onto the CAC portal today.',
        '[]'::jsonb,
        false,
        NOW() - INTERVAL '12 days' + INTERVAL '2 hours'
    ),
    (
        'msg-uyouko-03-3',
        'bk-demo-uyouko-03',
        'pro-usr-caclagos',
        'Update: Filing submitted to the CAC registry. Standard turnaround time is 48 to 72 hours.',
        '[]'::jsonb,
        false,
        NOW() - INTERVAL '9 days'
    ),
    (
        'msg-uyouko-03-4',
        'bk-demo-uyouko-03',
        'pro-usr-caclagos',
        'Good news! SabiTech Innovations Limited is officially registered! Your Registration Number is RC-7182914 and your FIRS TIN has been automatically generated. You can now open your corporate bank account and SCUML application.',
        '[]'::jsonb,
        false,
        NOW() - INTERVAL '2 days'
    ),
    (
        'msg-uyouko-03-5',
        'bk-demo-uyouko-03',
        v_user_id,
        'Excellent service and lightning-fast delivery! Thank you Barrister Tunde and the FirstLine team.',
        '[]'::jsonb,
        false,
        NOW() - INTERVAL '2 days' + INTERVAL '1 hour'
    ) ON CONFLICT (id) DO NOTHING;

END $$;
