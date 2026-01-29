import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Menu, X, GraduationCap, User, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PortalHeaderProps {
  escolaNome: string;
  escolaLogo?: string | null;
  primaryColor?: string;
}

export function PortalHeader({ escolaNome, escolaLogo, primaryColor }: PortalHeaderProps) {
  const { slug } = useParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: "Início", href: `/escola/${slug}` },
    { label: "Área do Responsável", href: `/escola/${slug}/portal`, icon: User },
    { label: "Matricule-se", href: `/escola/${slug}/matricula`, icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to={`/escola/${slug}`} className="flex items-center gap-3">
          {escolaLogo ? (
            <img
              src={escolaLogo}
              alt={escolaNome}
              className="h-10 w-auto object-contain"
            />
          ) : (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: primaryColor || "hsl(var(--primary))" }}
            >
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
          )}
          <span className="hidden font-semibold sm:inline-block">
            {escolaNome}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.href} to={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "gap-2",
                  item.icon && "text-sm"
                )}
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container py-4 flex flex-col gap-2">
            {navItems.map((item) => (
              <Link key={item.href} to={item.href} onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  {item.icon && <item.icon className="h-4 w-4" />}
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
