import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Menu, X, Bell } from "lucide-react";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      className={cn(
        "fixed w-full z-50 h-20 transition-all duration-300",
        isScrolled ? "glass-nav" : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 h-full flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <img 
            src="/assets/sabiright-icon.png" 
            alt="SabiRight" 
            className="w-9 h-9 rounded-lg group-hover:scale-110 transition-transform"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <span className="text-xl font-bold tracking-tight text-slate-900">
            SabiRight
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8 font-semibold text-slate-600">
          <button onClick={() => scrollToSection("features")} className="hover:text-primary transition">
            SabiGuard
          </button>
          <button onClick={() => scrollToSection("ai-agent")} className="hover:text-primary transition">
            SabiMove
          </button>
          <button onClick={() => scrollToSection("marketplace")} className="hover:text-primary transition">
            SabiMarket
          </button>
          <button onClick={() => scrollToSection("problem")} className="hover:text-primary transition">
            SabiSquare
          </button>
        </div>

        <div className="hidden md:flex items-center gap-4">
            <Link href="/app" className="inline-flex">
              <Button className="rounded-xl font-bold shadow-lg hover:shadow-primary/20 transition-all">
                Launch App
              </Button>
            </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-slate-900"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-20 left-0 w-full bg-white border-b shadow-lg p-6 flex flex-col gap-4 md:hidden">
          <button onClick={() => scrollToSection("features")} className="text-left font-semibold py-2">
            SabiGuard
          </button>
          <button onClick={() => scrollToSection("ai-agent")} className="text-left font-semibold py-2">
            SabiMove
          </button>
          <button onClick={() => scrollToSection("marketplace")} className="text-left font-semibold py-2">
            SabiMarket
          </button>
          <button onClick={() => scrollToSection("problem")} className="text-left font-semibold py-2">
            SabiSquare
          </button>
          <Link href="/app" className="inline-flex w-full">
            <Button className="w-full rounded-xl font-bold mt-2">Launch App</Button>
          </Link>
        </div>
      )}
    </nav>
  );
}
