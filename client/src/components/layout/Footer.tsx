import { ShieldCheck, Twitter, Instagram, Linkedin, Facebook, Youtube, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppStoreButtons } from "@/components/common/AppStoreButtons";

export function Footer() {
  const { data: settingsList = [] } = useQuery<any[]>({
    queryKey: ['/api/settings'],
  });

  // Convert settings list to a more usable object
  const settings: Record<string, any> = {};
  settingsList.forEach(s => {
    settings[s.key] = s.value;
  });

  const siteTitle = settings.site_title || "SabiRight";
  const siteLogo = settings.site_logo || "/assets/sabiright-icon.png";
  const footerText = settings.footer_text || `© ${new Date().getFullYear()} ${siteTitle}. All Rights Reserved.`;
  const footerDescription = settings.seo_description || "Empowering Nigerian citizens with AI-driven civic education, statutory legal scripts, and verified professional backup.";

  const socialIcons = [
    { key: 'social_facebook', icon: Facebook, label: 'Facebook' },
    { key: 'social_twitter', icon: Twitter, label: 'Twitter' },
    { key: 'social_instagram', icon: Instagram, label: 'Instagram' },
    { key: 'social_linkedin', icon: Linkedin, label: 'LinkedIn' },
    { key: 'social_youtube', icon: Youtube, label: 'YouTube' },
    { key: 'social_whatsapp', icon: MessageCircle, label: 'WhatsApp' },
  ];

  return (
    <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-12 gap-10 mb-14 text-left">
          
          {/* Brand & Description & App Store Downloads */}
          <div className="md:col-span-6 space-y-6">
            <div className="flex items-center gap-2.5">
              <img 
                src={siteLogo} 
                alt={siteTitle} 
                className="h-8 w-8 rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/assets/sabiright-icon.png";
                }}
              />
              <span className="text-white font-black text-xl tracking-tight">{siteTitle}</span>
            </div>
            
            <p className="text-sm max-w-md leading-relaxed text-slate-400">
              {footerDescription}
            </p>

            {/* Social Icons */}
            <div className="flex flex-wrap gap-3">
              {socialIcons.map((social) => {
                const href = settings[social.key];
                if (!href || href === '#' || href === '') return null;
                
                return (
                  <a 
                    key={social.key}
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-9 h-9 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center hover:bg-primary hover:text-white transition-all transform hover:scale-105"
                    title={social.label}
                  >
                    <social.icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>

            {/* App Store & Play Store Download Links (Managed in Admin) */}
            <div className="pt-2 space-y-2.5">
              <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Get SabiRight on Mobile &amp; Web
              </p>
              <AppStoreButtons size="sm" variant="glass" />
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="md:col-span-3">
            <h4 className="text-white font-bold mb-5 uppercase text-xs tracking-widest">Platform</h4>
            <ul className="space-y-3.5 text-sm">
              <li><a href="/about" className="hover:text-white transition">About Us</a></li>
              <li><a href="/pricing" className="hover:text-white transition">Pricing Plans</a></li>
              <li><a href="/app/forum" className="hover:text-white transition">Community Forum</a></li>
              <li><a href="/contact" className="hover:text-white transition">Contact Support</a></li>
              <li><a href="/app" className="hover:text-white transition text-primary font-semibold">Launch Web App</a></li>
            </ul>
          </div>
          
          {/* Legal Pages */}
          <div className="md:col-span-3">
            <h4 className="text-white font-bold mb-5 uppercase text-xs tracking-widest">Legal &amp; Compliance</h4>
            <ul className="space-y-3.5 text-sm">
              <li><a href="/privacy" className="hover:text-white transition">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-white transition">Terms of Service</a></li>
              <li><a href="/cookies" className="hover:text-white transition">Cookie Policy</a></li>
              <li><span className="text-xs text-slate-500">NDPC Audited &middot; ACJA 2015</span></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-xs text-slate-500 tracking-wide">
            {footerText}
          </p>
          <p className="text-[11px] text-slate-600">
            Anchored in the 1999 Constitution of Nigeria &amp; the Nigeria Police Act 2020.
          </p>
        </div>
      </div>
    </footer>
  );
}
