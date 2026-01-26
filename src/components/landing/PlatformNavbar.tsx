import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlatformBranding } from "@/hooks/usePlatformBranding";

interface NavItem {
  label: string;
  hasDropdown?: boolean;
  href?: string;
}

const navItems: NavItem[] = [
  { label: "Produtos", hasDropdown: true },
  { label: "Soluções", hasDropdown: true },
  { label: "Desenvolvedores", hasDropdown: true },
  { label: "Recursos", hasDropdown: true },
  { label: "Preços", href: "#planos" },
];

export function PlatformNavbar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { data: branding } = usePlatformBranding();

  return (
    <header className="relative z-50">
      {/* Gradient bar matching Stripe style */}
      <div
        className="w-full"
        style={{
          background: `linear-gradient(90deg, 
            hsl(24, 95%, 53%) 0%, 
            hsl(340, 75%, 55%) 35%, 
            hsl(280, 70%, 55%) 65%, 
            hsl(262, 83%, 58%) 100%
          )`,
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              {branding?.platformLogo ? (
                <img
                  src={branding.platformLogo}
                  alt={branding.platformName}
                  className="h-7 w-auto brightness-0 invert"
                />
              ) : (
                <span className="text-xl font-bold text-white tracking-tight">
                  {branding?.platformName || "Sistema"}
                </span>
              )}
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  className="flex items-center gap-1 px-3 py-2 text-[15px] font-medium text-white/90 hover:text-white transition-colors"
                >
                  {item.label}
                  {item.hasDropdown && (
                    <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                  )}
                </button>
              ))}
            </nav>

            {/* Right side actions */}
            <div className="hidden lg:flex items-center gap-4">
              <Link
                to="/auth"
                className="flex items-center gap-1 text-[15px] font-medium text-white/90 hover:text-white transition-colors"
              >
                Entrar
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link to="/contato">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white rounded-full px-4 text-[14px] font-medium"
                >
                  Fale com nossa equipe
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 text-white"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
              {isMobileOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t">
          <nav className="container mx-auto px-4 py-4">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  className="flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  {item.label}
                  {item.hasDropdown && (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              ))}
              <div className="border-t my-2" />
              <Link
                to="/auth"
                className="px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                onClick={() => setIsMobileOpen(false)}
              >
                Entrar
              </Link>
              <Link to="/contato" onClick={() => setIsMobileOpen(false)}>
                <Button className="w-full mt-2">
                  Fale com nossa equipe
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
