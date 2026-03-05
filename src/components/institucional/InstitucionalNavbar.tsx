import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogIn, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const navLinks = [
  { label: "Serviços", href: "#servicos" },
  { label: "Metodologia", href: "#metodologia" },
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
      <div className="bg-[#0d47a1] text-white py-2 text-sm font-semibold">
        <div className="max-w-[1200px] mx-auto px-8 flex justify-between items-center">
          <div className="hidden sm:flex items-center gap-4">
            <span className="inline-flex items-center gap-2 bg-white/15 px-4 py-1 rounded-full hover:bg-[#f57c00] transition-all cursor-pointer">
              <Phone className="h-3.5 w-3.5" /> (31) 99999-9999
            </span>
            <span className="inline-flex items-center gap-2 bg-white/15 px-4 py-1 rounded-full hover:bg-[#f57c00] transition-all cursor-pointer">
              <Mail className="h-3.5 w-3.5" /> contato@maranata.com.br
            </span>
          </div>
          <div className="font-bold text-center sm:text-right w-full sm:w-auto">
            🎉 Matrículas 2026 abertas!
          </div>
        </div>
      </div>

      {/* Header */}
      <header
        className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${
          scrolled ? "shadow-[0_4px_20px_rgba(30,136,229,0.1)]" : ""
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-8">
          <nav className="flex items-center justify-between py-4">
            {/* Logo */}
            <a href="#inicio" className="flex items-center gap-4 group">
              <img
                src="/escola-logo.png"
                alt="Reforço Escolar Maranata"
                className="h-[70px] w-auto drop-shadow-md group-hover:scale-105 group-hover:-rotate-2 transition-transform"
              />
              <div className="flex flex-col">
                <span className="text-[1.8rem] font-bold text-[#0d47a1] leading-tight tracking-tight font-[Quicksand]">
                  Reforço Escolar
                </span>
                <span className="text-[0.85rem] text-[#f57c00] font-bold uppercase tracking-[2px]">
                  Maranata
                </span>
              </div>
            </a>

            {/* Desktop Nav */}
            <ul className="hidden lg:flex items-center gap-10">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="relative text-base font-bold text-[#2c3e50] hover:text-[#1e88e5] transition-colors py-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[3px] after:bg-[#f57c00] after:rounded after:transition-all hover:after:w-full"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <Link
                  to="/auth"
                  className="bg-gradient-to-r from-[#f57c00] to-[#ff9800] text-white font-bold px-8 py-3 rounded-full shadow-[0_4px_15px_rgba(245,124,0,0.3)] hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(245,124,0,0.4)] transition-all"
                >
                  Área do Aluno
                </Link>
              </li>
            </ul>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-[#2c3e50]"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </nav>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-t border-[#e3f2fd]"
            >
              <div className="px-8 py-4 space-y-1">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 text-base font-bold text-[#2c3e50] hover:text-[#1e88e5] hover:bg-[#f8fafc] rounded-lg transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
                <div className="pt-3 border-t border-[#e3f2fd]">
                  <Link
                    to="/auth"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 px-4 py-3 text-base font-bold text-white bg-gradient-to-r from-[#f57c00] to-[#ff9800] rounded-full"
                  >
                    <LogIn className="h-4 w-4" />
                    Área do Aluno
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
