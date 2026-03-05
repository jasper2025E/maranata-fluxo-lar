export function InstitucionalHero() {
  return (
    <section id="inicio" className="relative overflow-hidden py-16 lg:py-20" style={{ background: "linear-gradient(135deg, #f5f1eb 0%, #faf8f5 100%)" }}>
      <div className="inst-hero-circle" />
      <div className="max-w-[1200px] mx-auto px-8 relative z-10">
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-16 items-center">
          {/* Text */}
          <div>
            <h2
              className="text-3xl sm:text-4xl lg:text-[3.5rem] font-semibold mb-6 leading-tight italic relative inline-block"
              style={{ fontFamily: "'Crimson Text', serif", color: "var(--inst-primary)" }}
            >
              Seu filho pode aprender mais com o Maranata
              <span className="block w-[100px] h-1 mt-3" style={{ background: "var(--inst-secondary)" }} />
            </h2>

            <p className="text-lg text-[#5a6c7d] mb-8 leading-relaxed max-w-[90%]">
              Acompanhamento escolar personalizado em Barreirinhas&nbsp;–&nbsp;MA.
              Ajudamos seu filho a superar dificuldades, melhorar as notas
              e ganhar confiança nos estudos.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="https://wa.me/559898828634?text=Olá! Gostaria de saber mais sobre o Reforço Maranata."
                target="_blank"
                rel="noopener noreferrer"
                style={{ background: "var(--inst-primary)", borderColor: "var(--inst-primary)" }}
                className="inline-flex items-center justify-center px-8 py-3.5 text-white font-semibold border-2 hover:bg-transparent hover:text-[#1a3a52] transition-all text-center"
              >
                Fale pelo WhatsApp
              </a>
              <a
                href="#servicos"
                className="inline-flex items-center justify-center px-8 py-3.5 font-semibold border-2 border-[#e0d5c7] text-[#1a3a52] hover:border-[#c9a227] hover:text-[#8b4513] transition-all text-center"
              >
                Ver Serviços
              </a>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <img
              src="/escola-logo.png"
              alt="Logo Reforço Escolar Maranata"
              className="w-full max-w-[400px] mx-auto h-auto inst-hero-img"
              loading="eager"
            />
            <div
              className="absolute -bottom-5 -left-5 bg-white p-5 shadow-lg"
              style={{ borderLeft: "4px solid var(--inst-secondary)" }}
            >
              <span style={{ fontFamily: "'Crimson Text', serif", color: "var(--inst-primary)" }} className="text-5xl font-bold block leading-none">5+</span>
              <span className="text-sm text-[#5a6c7d] uppercase tracking-wider">Anos de<br/>Experiência</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
