import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { PlatformBranding } from "@/hooks/usePlatformBranding";
import { cn } from "@/lib/utils";

interface InstitucionalNavbarProps {
  branding?: PlatformBranding | null;
}

const navLinks = [
  { href: "#beneficios", label: "Benefícios" },
  { href: "#modulos", label: "Módulos" },
  { href: "#seguranca", label: "Segurança" },
  { href: "#precos", label: "Preços" },
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
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            {branding?.platformLogo ? (
              <img
                src={branding.platformLogo}
                alt={branding.platformName}
                className={cn(
                  "h-8 w-auto object-contain transition-all",
                  !scrolled && "brightness-0 invert"
                )}
              />
            ) : (
              <span
                className={cn(
                  "text-xl font-bold transition-colors",
                  scrolled ? "text-foreground" : "text-white"
                )}
              >
                {branding?.platformName || "Maranata"}
              </span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                  scrolled
                    ? "text-muted-foreground hover:text-foreground hover:bg-muted"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                )}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link to="/auth">
              <Button
                variant="ghost"
                className={cn(
                  "font-medium",
                  scrolled
                    ? "text-foreground hover:bg-muted"
                    : "text-white hover:bg-white/10"
                )}
              >
                Entrar
              </Button>
            </Link>
            <Link to="/cadastro">
              <Button
                className={cn(
                  "font-medium gap-2 group",
                  !scrolled &&
                    "bg-white text-foreground hover:bg-white/90"
                )}
              >
                Começar agora
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "lg:hidden p-2 rounded-lg transition-colors",
              scrolled
                ? "text-foreground hover:bg-muted"
                : "text-white hover:bg-white/10"
            )}
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
              className="lg:hidden overflow-hidden"
            >
              <div className="py-4 space-y-1 border-t border-border/50">
                {navLinks.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => scrollToSection(link.href)}
                    className="block w-full text-left px-4 py-3 text-base font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    {link.label}
                  </button>
                ))}
                <div className="pt-4 space-y-2 border-t border-border/50 mt-4">
                  <Link to="/auth" className="block">
                    <Button variant="outline" className="w-full">
                      Entrar
                    </Button>
                  </Link>
                  <Link to="/cadastro" className="block">
                    <Button className="w-full gap-2">
                      Começar agora
                      <ArrowRight className="h-4 w-4" />
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
