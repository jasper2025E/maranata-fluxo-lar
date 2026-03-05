export function InstitucionalHero() {
  return (
    <section id="inicio" className="relative overflow-hidden py-16 lg:py-20" style={{ background: "linear-gradient(135deg, var(--inst-bg-cream) 0%, var(--inst-bg-warm) 100%)" }}>
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
              <span className="block w-[100px] h-1 mt-3 rounded" style={{ background: "var(--inst-secondary)" }} />
            </h2>

            <p className="text-lg mb-8 leading-relaxed max-w-[90%]" style={{ color: "var(--inst-text-light)" }}>
              Acompanhamento escolar personalizado em Barreirinhas&nbsp;–&nbsp;MA.
              Ajudamos seu filho a superar dificuldades, melhorar as notas
              e ganhar confiança nos estudos.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="https://wa.me/559898828634?text=Olá! Gostaria de saber mais sobre o Reforço Maranata."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-3.5 text-white font-semibold border-2 rounded-lg hover:bg-transparent transition-all text-center"
                style={{ background: "var(--inst-primary)", borderColor: "var(--inst-primary)" }}
              >
                Fale pelo WhatsApp
              </a>
              <a
                href="#servicos"
                className="inline-flex items-center justify-center px-8 py-3.5 font-semibold border-2 rounded-lg transition-all text-center"
                style={{ borderColor: "var(--inst-border)", color: "var(--inst-primary)" }}
              >
                Ver Serviços
              </a>
            </div>
          </div>

          {/* Logo Image */}
          <div className="relative flex justify-center">
            <img
              src="/escola-logo-clean.png"
              alt="Logo Reforço Escolar Maranata"
              className="w-full max-w-[380px] mx-auto h-auto inst-hero-img"
              loading="eager"
            />
            <div
              className="absolute -bottom-5 -left-5 bg-white p-5 shadow-lg rounded-lg"
              style={{ borderLeft: "4px solid var(--inst-secondary)" }}
            >
              <span className="text-5xl font-bold block leading-none" style={{ fontFamily: "'Crimson Text', serif", color: "var(--inst-primary)" }}>5+</span>
              <span className="text-sm uppercase tracking-wider" style={{ color: "var(--inst-text-light)" }}>Anos de<br/>Experiência</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
