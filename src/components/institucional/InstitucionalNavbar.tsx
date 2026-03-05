import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

const navLinks = [
  { label: "Serviços", href: "#servicos" },
  { label: "Método", href: "#metodo" },
  { label: "Depoimentos", href: "#depoimentos" },
  { label: "Contato", href: "#contato" },
];

export function InstitucionalNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 inst-nav-blur border-b transition-all duration-300 ${
        scrolled ? "border-white/[0.08]" : "border-transparent"
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-6">
        <nav className="flex items-center justify-between h-16">
          <a href="#inicio" className="flex items-center gap-3">
            <img src="/escola-logo.png" alt="Reforço Maranata" className="h-9 w-auto" />
            <span className="text-[15px] font-semibold text-white tracking-tight">
              Reforço Maranata
            </span>
          </a>

          <ul className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-[13px] text-[#888] hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="hidden md:flex items-center gap-3">
            <a
              href="https://wa.me/559898828634?text=Olá! Gostaria de saber mais sobre o Reforço Maranata."
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-[#888] hover:text-white transition-colors"
            >
              Contato
            </a>
            <Link
              to="/auth"
              className="inst-btn-shine text-[13px] font-medium text-black bg-white px-4 py-1.5 rounded-full hover:bg-gray-200 transition-colors"
            >
              Entrar
            </Link>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-white">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/[0.08] bg-black/95">
          <div className="px-6 py-4 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block py-2.5 text-sm text-[#888] hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 mt-2 border-t border-white/[0.08] flex gap-3">
              <Link
                to="/auth"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center text-sm font-medium text-black bg-white py-2 rounded-full"
              >
                Entrar
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
