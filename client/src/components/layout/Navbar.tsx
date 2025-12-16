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
        <Link href="/">
          <a className="flex items-center gap-2 group cursor-pointer">
            <div className="bg-primary text-white w-9 h-9 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Digital Citizen
            </span>
          </a>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8 font-semibold text-slate-600">
          <button onClick={() => scrollToSection("problem")} className="hover:text-primary transition">
            Solutions
          </button>
          <button onClick={() => scrollToSection("marketplace")} className="hover:text-primary transition">
            Marketplace
          </button>
          <button onClick={() => scrollToSection("ai-agent")} className="hover:text-primary transition">
            AI Guard
          </button>
          <button onClick={() => scrollToSection("features")} className="hover:text-primary transition">
            Pillars
          </button>
        </div>

        <div className="hidden md:flex items-center gap-4">
            <Link href="/app">
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
          <button onClick={() => scrollToSection("problem")} className="text-left font-semibold py-2">
            Solutions
          </button>
          <button onClick={() => scrollToSection("marketplace")} className="text-left font-semibold py-2">
            Marketplace
          </button>
          <button onClick={() => scrollToSection("ai-agent")} className="text-left font-semibold py-2">
            AI Guard
          </button>
          <Link href="/app">
            <Button className="w-full rounded-xl font-bold mt-2">Launch App</Button>
          </Link>
        </div>
      )}
    </nav>
  );
}
