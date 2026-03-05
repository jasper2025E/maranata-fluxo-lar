import { ArrowRight } from "lucide-react";

export function InstitucionalHero() {
  return (
    <section id="inicio" className="relative pt-32 pb-20 lg:pt-44 lg:pb-32 overflow-hidden inst-grid-bg">
      {/* Brand-colored glows */}
      <div className="inst-glow top-0 left-1/4" style={{ background: "#2196F3" }} />
      <div className="inst-glow top-20 right-1/4" style={{ background: "#F5A623" }} />

      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] mb-6">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#F5A623" }} />
            <span className="text-xs text-[#888]">Matrículas abertas 2026</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            Seu filho pode{" "}
            <span className="inst-gradient-text">aprender mais</span>{" "}
            com o Maranata
          </h1>

          <p className="text-base lg:text-lg text-[#888] leading-relaxed max-w-xl mx-auto mb-10">
            Acompanhamento escolar personalizado em Barreirinhas&nbsp;–&nbsp;MA. 
            Ajudamos crianças e adolescentes a superarem dificuldades 
            e ganharem confiança nos estudos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://wa.me/559898828634?text=Olá! Gostaria de saber mais sobre o Reforço Maranata."
              target="_blank"
              rel="noopener noreferrer"
              className="inst-btn-shine inline-flex items-center gap-2 font-medium px-6 py-3 rounded-full text-sm transition-all hover:opacity-90"
              style={{ background: "#2196F3", color: "white" }}
            >
              Fale pelo WhatsApp
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#servicos"
              className="inline-flex items-center gap-2 text-[#888] hover:text-white font-medium px-6 py-3 rounded-full text-sm border border-white/[0.08] hover:border-white/20 transition-all"
            >
              Ver serviços
            </a>
          </div>
        </div>

        {/* Logo */}
        <div className="mt-16 lg:mt-24 flex justify-center">
          <img
            src="/escola-logo.png"
            alt="Logo Reforço Escolar Maranata"
            className="w-48 lg:w-64 h-auto drop-shadow-2xl"
            loading="eager"
          />
        </div>
      </div>
    </section>
  );
}
