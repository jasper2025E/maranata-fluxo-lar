export function InstitucionalHero() {
  return (
    <section id="inicio" className="bg-blue-900 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Text */}
          <div>
            <p className="text-blue-200 text-sm font-medium mb-4 tracking-wide uppercase">
              Matrículas Abertas 2026
            </p>

            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-white leading-snug mb-5">
              Reforço escolar que transforma o aprendizado do seu filho
            </h1>

            <p className="text-blue-100/80 text-base lg:text-lg leading-relaxed mb-8 max-w-lg">
              Acompanhamento personalizado em Barreirinhas&nbsp;–&nbsp;MA. 
              Ajudamos crianças e adolescentes a superarem dificuldades, 
              melhorarem as notas e ganharem confiança nos estudos.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="https://wa.me/559898828634?text=Olá! Gostaria de saber mais sobre o Reforço Maranata."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
              >
                Fale pelo WhatsApp
              </a>
              <a
                href="#servicos"
                className="inline-flex items-center justify-center bg-white/10 text-white px-6 py-3 text-sm font-medium rounded-md border border-white/20 hover:bg-white/15 transition-colors"
              >
                Nossos Serviços
              </a>
            </div>
          </div>

          {/* Logo */}
          <div className="flex justify-center">
            <img
              src="/escola-logo.png"
              alt="Logo Reforço Escolar Maranata"
              className="w-56 lg:w-72 h-auto opacity-95"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
