import { useState, useEffect } from "react";
import { Menu, X, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const navLinks = [
  { label: "Início", href: "#inicio" },
  { label: "Serviços", href: "#servicos" },
  { label: "Sobre", href: "#metodologia" },
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
    <header
      className={`sticky top-0 z-50 bg-white border-b transition-shadow duration-300 ${
        scrolled ? "shadow-sm border-gray-200" : "border-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6">
        <nav className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <a href="#inicio" className="flex items-center gap-3">
            <img
              src="/escola-logo.png"
              alt="Reforço Maranata"
              className="h-12 lg:h-14 w-auto"
            />
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-lg font-bold text-gray-900">
                Reforço Maranata
              </span>
              <span className="text-xs text-orange-600 font-semibold tracking-wide">
                Barreirinhas – MA
              </span>
            </div>
          </a>

          {/* Desktop Nav */}
          <ul className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="hidden lg:flex items-center gap-4">
            <a
              href="tel:+559898828634"
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1.5"
            >
              <Phone className="h-3.5 w-3.5" />
              (98) 98828-6034
            </a>
            <Link
              to="/auth"
              className="bg-blue-800 text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-blue-900 transition-colors"
            >
              Área do Aluno
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-gray-700"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100">
          <div className="px-6 py-4 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 mt-2 border-t border-gray-100 space-y-2">
              <a
                href="tel:+559898828634"
                className="block px-3 py-2.5 text-sm text-gray-600"
              >
                📞 (98) 98828-6034
              </a>
              <Link
                to="/auth"
                onClick={() => setMobileOpen(false)}
                className="block text-center px-3 py-2.5 text-sm font-medium text-white bg-blue-800 rounded-md"
              >
                Área do Aluno
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
