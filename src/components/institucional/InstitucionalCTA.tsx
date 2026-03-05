import { ArrowRight } from "lucide-react";

export function InstitucionalCTA() {
  return (
    <section id="contato" className="py-20 lg:py-28 border-t border-white/[0.08] relative overflow-hidden">
      <div className="inst-glow -top-40 left-1/3" style={{ background: "#2196F3" }} />
      <div className="inst-glow -bottom-40 right-1/3" style={{ background: "#F5A623" }} />

      <div className="max-w-xl mx-auto px-6 text-center relative z-10">
        <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "#F5A623" }}>Contato</p>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight mb-4">
          Garanta a vaga do seu filho
        </h2>
        <p className="text-[#666] mb-8 leading-relaxed">
          Entre em contato e agende uma visita. Conheça nosso espaço e veja como podemos ajudar.
        </p>

        <a
          href="https://wa.me/559898828634?text=Olá! Gostaria de saber mais sobre o Reforço Maranata e agendar uma visita."
          target="_blank"
          rel="noopener noreferrer"
          className="inst-btn-shine inline-flex items-center gap-2 font-medium px-8 py-3.5 rounded-full text-sm transition-all hover:opacity-90"
          style={{ background: "#2196F3", color: "white" }}
        >
          Chamar no WhatsApp
          <ArrowRight className="h-4 w-4" />
        </a>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6 text-xs text-[#666]">
          <span>📞 (98) 98828-6034</span>
          <span>✉️ jn.ney@hotmail.com</span>
          <span>📍 Barreirinhas – MA</span>
        </div>
      </div>
    </section>
  );
}
