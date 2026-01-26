import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { PlatformBranding } from "@/hooks/usePlatformBranding";
import { cn } from "@/lib/utils";

interface InstitucionalNavbarProps {
  branding?: PlatformBranding | null;
}

const navLinks = [
  { 
    label: "Módulos", 
    href: "#modulos",
    hasDropdown: true 
  },
  { 
    label: "Soluções", 
    href: "#beneficios",
    hasDropdown: true 
  },
  { 
    label: "Recursos", 
    href: "#seguranca",
    hasDropdown: true 
  },
  { 
    label: "Preços", 
    href: "#precos",
    hasDropdown: false 
  },
];

export function InstitucionalNavbar({ branding }: InstitucionalNavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (href: string) => {
    const id = href.replace("#", "");
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setIsOpen(false);
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            {branding?.platformLogo ? (
              <img
                src={branding.platformLogo}
                alt={branding.platformName}
                className="h-7 w-auto object-contain"
              />
            ) : (
              <span className="text-xl font-bold text-slate-900 tracking-tight">
                {branding?.platformName || "maranata"}
              </span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="flex items-center gap-1 px-4 py-2 text-[15px] font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                {link.label}
                {link.hasDropdown && (
                  <ChevronDown className="h-4 w-4 opacity-50" />
                )}
              </button>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-4">
            <Link to="/auth">
              <button className="text-[15px] font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1">
                Entrar
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <Link to="/cadastro">
              <Button
                variant="outline"
                className="h-10 px-4 text-[15px] font-medium border-primary text-primary hover:bg-primary hover:text-white transition-all"
              >
                Fale com nossa equipe
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden overflow-hidden bg-white border-t border-slate-100"
            >
              <div className="py-4 space-y-1">
                {navLinks.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => scrollToSection(link.href)}
                    className="block w-full text-left px-4 py-3 text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  >
                    {link.label}
                  </button>
                ))}
                <div className="pt-4 px-4 space-y-3 border-t border-slate-100">
                  <Link to="/auth" className="block">
                    <Button variant="outline" className="w-full">
                      Entrar
                    </Button>
                  </Link>
                  <Link to="/cadastro" className="block">
                    <Button className="w-full">
                      Fale com nossa equipe
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
