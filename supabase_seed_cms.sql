-- =========================================================================
-- SABIRIGHT CMS CONTENT SEED SCRIPT
-- Run this in your Supabase SQL Editor to populate / refresh all CMS contents.
-- All values can also be edited anytime directly inside the Admin Dashboard.
-- =========================================================================

INSERT INTO admin_settings ("key", value, category, is_secret)
VALUES 
-- 1. General & SEO Settings
('site_title', 'SabiRight', 'general', false),
('seo_title', 'SabiRight - Sovereign AI Civic Shield for Nigerian Citizens', 'seo', false),
('seo_description', 'SabiRight empowers Nigerian citizens with instant statutory legal scripts, emergency first-aid, verified lawyer directory matching, and smart route shields in English, Pidgin, Yoruba, Hausa, and Igbo.', 'seo', false),
('seo_keywords', 'civic tech, nigeria police act, acja 2015, constitution 1999, human rights, verified lawyers nigeria, pidgin AI, legal first aid', 'seo', false),

-- 2. Homepage CMS Settings
('hero_title', 'Civic & Legal Shield for Nigerian Citizens', 'homepage', false),
('hero_subtitle', 'Instant law-backed guidance, emergency de-escalation scripts, and verified legal directory access in Nigerian Pidgin, Yoruba, Hausa, Igbo, and English.', 'homepage', false),
('platform_advantages_title', 'Comprehensive Civic Intelligence Suite', 'homepage', false),
('video_demo_url', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'homepage', false),
('app_store_url', '', 'homepage', false),
('play_store_url', '', 'homepage', false),

-- 3. Public Bot Channel Links
('whatsapp_bot_url', '+2347026619186', 'bots', false),
('telegram_bot_url', 'https://t.me/SabiRightBot', 'bots', false),

-- 4. About Us Page Rich CMS Content
('about_content', '<h2>Our Mission: Restoring Human Dignity on Nigerian Streets</h2><p>SabiRight was established to solve one of the most persistent civic challenges across Nigeria: <strong>the dangerous power and informational asymmetry between everyday citizens and authority figures</strong>. When stopped at roadblocks or facing landlord disputes, citizens are often vulnerable solely because they do not know their specific statutory rights under Nigerian law.</p><h3>United Nations SDG 10: Reduced Inequalities</h3><p>We directly align with <strong>SDG 10 (Reduced Inequalities)</strong>. In our society, justice and safety should not be luxury commodities reserved exclusively for the wealthy who can afford private counsel on speed dial. SabiRight democratizes legal protection by putting certified legal guidance into the hands of every Nigerian with a basic phone or messaging app.</p><h3>Sovereign AI & Vernacular Inclusivity</h3><p>Unlike generic overseas AI models that hallucinate US or UK laws, SabiRight is built upon indigenous statutory jurisprudence:</p><ul><li><strong>Section 37 of the 1999 Constitution:</strong> Right to privacy and protection against warrantless phone searches.</li><li><strong>Section 49(1) of the Nigeria Police Act 2020:</strong> Strict conditions and prohibitions on arbitrary search and seizure.</li><li><strong>Administration of Criminal Justice Act (ACJA 2015):</strong> Right to silence, access to legal representation, and humane treatment.</li></ul><p>Through our sovereign <strong>N-ATLAS multi-vernacular AI engine</strong>, guidance is delivered natively in <strong>Nigerian Pidgin, Hausa, Yoruba, Igbo, and English</strong>.</p>', 'frontend', false),

-- 5. Contact Us Page Rich CMS Content
('contact_content', '<p class="lead">Welcome to the <strong>SabiRight National Civic Support Desk</strong>. Our team provides continuous support, professional onboarding for Nigerian Bar Association (NBA) accredited lawyers, and rapid response coordination across all 36 States and the Federal Capital Territory.</p>', 'frontend', false),

-- 6. Footer & Contact Details
('footer_about', 'SabiRight is Nigeria''s sovereign civic technology platform. Closing the power and informational gap with statutory legal AI and verified professional backup.', 'footer', false),
('footer_phone', '+234 7026619186', 'footer', false),
('footer_address', 'Victoria Island & Ikeja, Lagos, Nigeria', 'footer', false),
('contact_email', 'support@sabiright.com', 'footer', false),

-- 7. Social Media Links
('social_facebook', 'https://facebook.com/sabiright', 'footer', false),
('social_twitter', 'https://x.com/sabiright', 'footer', false),
('social_instagram', 'https://instagram.com/sabiright', 'footer', false),
('social_linkedin', 'https://linkedin.com/company/sabiright', 'footer', false),
('social_whatsapp', 'https://wa.me/2347026619186', 'footer', false)

ON CONFLICT ("key") 
DO UPDATE SET 
    value = EXCLUDED.value,
    category = EXCLUDED.category,
    updated_at = NOW();

-- End of seed script

