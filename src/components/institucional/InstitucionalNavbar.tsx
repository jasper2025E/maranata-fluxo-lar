import { useState, useEffect } from "react";
import { Menu, X, Phone, Mail, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const navLinks = [
  { label: "Serviços", href: "#servicos" },
  { label: "Sobre", href: "#sobre" },
  { label: "Depoimentos", href: "#depoimentos" },
  { label: "Contato", href: "#contato" },
];

export function InstitucionalNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Top Bar */}
      <div className="text-white py-2 text-sm" style={{ background: "var(--inst-primary-dark)", borderBottom: "3px solid var(--inst-secondary)" }}>
        <div className="max-w-[1200px] mx-auto px-8">
          <div className="flex justify-between items-center">
            <div className="hidden sm:flex items-center gap-6 opacity-90">
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> (98) 98828-6034
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> jn.ney@hotmail.com
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Barreirinhas – MA
              </span>
            </div>
            <a
              href="https://www.instagram.com/reforcomaranatabhs/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-[#f9a825] transition-colors text-sm"
            >
              Instagram
            </a>
          </div>
        </div>
      </div>

      {/* Header */}
      <header
        className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${
          scrolled ? "shadow-md" : ""
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-8">
          <nav className="flex items-center justify-between py-3">
            {/* Logo */}
            <a href="#inicio" className="flex items-center gap-3">
              <img
                src="/escola-logo-transparent-real.png?v=2"
                alt="Reforço Maranata"
                className="h-[55px] w-auto"
              />
              <div>
                <h1 style={{ fontFamily: "'Crimson Text', serif", color: "var(--inst-primary)" }} className="text-2xl font-semibold leading-tight">
                  Reforço Maranata
                </h1>
                <span className="text-xs uppercase tracking-[2px] font-medium" style={{ color: "var(--inst-text-light)" }}>
                  Reforço Escolar
                </span>
              </div>
            </a>

            {/* Desktop Nav */}
            <ul className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="inst-nav-link text-[0.95rem] font-medium transition-colors"
                    style={{ color: "var(--inst-text)" }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <Link
                  to="/auth"
                  className="text-white font-semibold px-6 py-2.5 text-sm rounded-lg hover:opacity-90 transition-opacity"
                  style={{ background: "var(--inst-primary)" }}
                >
                  Área do Aluno
                </Link>
              </li>
            </ul>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2"
              style={{ color: "var(--inst-text)" }}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </nav>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t" style={{ borderColor: "var(--inst-border)" }}>
            <div className="px-8 py-4 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-4 py-3 text-sm font-medium rounded transition-colors"
                  style={{ color: "var(--inst-text)" }}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 border-t" style={{ borderColor: "var(--inst-border)" }}>
                <Link
                  to="/auth"
                  onClick={() => setMobileOpen(false)}
                  className="block text-center px-4 py-3 text-sm font-semibold text-white rounded-lg"
                  style={{ background: "var(--inst-primary)" }}
                >
                  Área do Aluno
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
