import { ShieldCheck, Twitter, Instagram, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-16 text-center">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="bg-primary text-white p-1.5 rounded">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <span className="text-white font-bold text-lg">Digital Citizen</span>
        </div>
        <p className="mb-10 text-sm max-w-sm mx-auto italic">
          Empowering Nigerian citizens with verified AI data.
        </p>
        <div className="flex justify-center gap-8 mb-12">
          <a href="#" className="hover:text-white transition transform hover:scale-110">
            <Twitter className="h-6 w-6" />
          </a>
          <a href="#" className="hover:text-white transition transform hover:scale-110">
            <Instagram className="h-6 w-6" />
          </a>
          <a href="#" className="hover:text-white transition transform hover:scale-110">
            <Linkedin className="h-6 w-6" />
          </a>
        </div>
        <p className="text-xs opacity-50 uppercase tracking-widest">
          © 2025 Digital Citizen. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
