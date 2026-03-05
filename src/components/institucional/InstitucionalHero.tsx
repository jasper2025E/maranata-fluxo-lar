import { ArrowRight } from "lucide-react";

export function InstitucionalHero() {
  return (
    <section id="inicio" className="bg-[#0d47a1] py-16 lg:py-20">
      <div className="max-w-[1200px] mx-auto px-8">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          {/* Text */}
          <div>
            <span className="inline-block bg-[#ffc107] text-[#0d47a1] px-5 py-1.5 rounded-md font-bold text-sm mb-5">
              Matrículas Abertas 2026
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight font-[Quicksand]">
              Seu filho pode aprender mais com o{" "}
              <span className="text-[#ffc107]">Reforço Maranata</span>
            </h1>

            <p className="text-lg text-white/85 mb-8 leading-relaxed max-w-[540px]">
              Acompanhamento escolar personalizado em Barreirinhas - MA. 
              Ajudamos seu filho a superar dificuldades, melhorar as notas 
              e ganhar confiança nos estudos.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="https://wa.me/559898828634?text=Olá! Gostaria de saber mais sobre o Reforço Maranata."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#ffc107] text-[#0d47a1] px-8 py-3.5 font-bold rounded-lg hover:bg-[#ffca28] transition-colors text-center"
              >
                Fale pelo WhatsApp
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#servicos"
                className="inline-flex items-center justify-center bg-white/10 text-white px-8 py-3.5 font-semibold rounded-lg border border-white/20 hover:bg-white/20 transition-colors text-center"
              >
                Ver Serviços
              </a>
            </div>
          </div>

          {/* Logo destaque */}
          <div className="flex justify-center">
            <img
              src="/escola-logo.png"
              alt="Logo Reforço Escolar Maranata"
              className="w-[280px] lg:w-[380px] h-auto drop-shadow-2xl"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
