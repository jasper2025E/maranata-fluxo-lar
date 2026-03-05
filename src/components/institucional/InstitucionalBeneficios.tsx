import { Users, MessageCircle, Gamepad2, Home } from "lucide-react";

const items = [
  { icon: Users, title: "Turmas reduzidas", description: "Cada aluno recebe atenção individualizada no seu próprio ritmo." },
  { icon: MessageCircle, title: "Feedback aos pais", description: "Acompanhamento constante sobre progresso e pontos a melhorar." },
  { icon: Gamepad2, title: "Aprendizado lúdico", description: "Jogos e atividades educativas que tornam o estudo prazeroso." },
  { icon: Home, title: "Ambiente acolhedor", description: "Espaço familiar onde as crianças se sentem seguras para aprender." },
];

export function InstitucionalBeneficios() {
  return (
    <section id="metodo" className="py-20 lg:py-28 border-t border-white/[0.08]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: "#F5A623" }}>Metodologia</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight mb-4">
              Por que as famílias{" "}
              <span className="inst-gradient-text">confiam</span> no Maranata?
            </h2>
            <p className="text-[#666] mb-10 leading-relaxed">
              Uma metodologia que realmente funciona, com resultados comprovados em Barreirinhas.
            </p>

            <div className="space-y-5">
              {items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex gap-4">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.15)" }}>
                      <Icon className="h-4 w-4" style={{ color: "#F5A623" }} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-0.5">{item.title}</h4>
                      <p className="text-sm text-[#666] leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden border border-white/[0.08]">
            <img
              src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=700&fit=crop"
              alt="Sala de aula"
              className="w-full h-80 lg:h-[460px] object-cover opacity-80"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6">
              <span className="text-3xl font-bold" style={{ color: "#F5A623" }}>100%</span>
              <span className="block text-xs text-white/60 uppercase tracking-wider">Dedicação</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
