const services = [
  {
    emoji: "📖",
    title: "Reforço em Português",
    description: "Leitura, interpretação de texto, gramática e redação com exercícios práticos e acompanhamento contínuo.",
    meta: ["📚 Fundamental I e II", "⏰ Manhã ou tarde"],
  },
  {
    emoji: "🔢",
    title: "Reforço em Matemática",
    description: "Das operações básicas à matemática avançada, com metodologia visual e prática no ritmo do aluno.",
    meta: ["📚 Fundamental I e II", "⏰ Manhã ou tarde"],
  },
  {
    emoji: "🔬",
    title: "Reforço em Ciências",
    description: "Ciências naturais de forma acessível com explicações claras e experimentos simples para fixar o conteúdo.",
    meta: ["📚 Fundamental I e II", "⏰ Manhã ou tarde"],
  },
  {
    emoji: "📝",
    title: "Auxílio nas Tarefas",
    description: "Acompanhamento nas tarefas de casa e trabalhos escolares. Seu filho não fica mais perdido com os deveres.",
    meta: ["🎒 Todas as séries", "⏰ Tarde"],
  },
  {
    emoji: "🎨",
    title: "Alfabetização",
    description: "Método fônico para crianças em fase de alfabetização. Leitura e escrita com paciência e carinho.",
    meta: ["👶 Educação Infantil", "⏰ Manhã ou tarde"],
  },
  {
    emoji: "🎯",
    title: "Preparação para Provas",
    description: "Revisão e simulados antes das avaliações escolares. Seu filho vai para a prova com segurança.",
    meta: ["📝 Todas as séries", "⏰ Flexível"],
  },
];

export function InstitucionalModulos() {
  return (
    <section id="servicos" className="py-16 lg:py-24 bg-white">
      <div className="max-w-[1200px] mx-auto px-8">
        <div className="text-center mb-12 lg:mb-16">
          <h3
            className="text-2xl sm:text-3xl lg:text-[2.5rem] font-semibold mb-3"
            style={{ fontFamily: "'Crimson Text', serif", color: "var(--inst-primary)" }}
          >
            <span style={{ color: "var(--inst-secondary)" }}>•</span>{" "}
            Nossos Serviços{" "}
            <span style={{ color: "var(--inst-secondary)" }}>•</span>
          </h3>
          <p className="text-[#5a6c7d] text-lg max-w-[600px] mx-auto">
            Reforço escolar completo com atenção individualizada em Barreirinhas
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <div
              key={i}
              className="inst-course-card p-8 border border-[#e0d5c7]"
              style={{ background: "var(--inst-bg-warm)" }}
            >
              <div
                className="w-[60px] h-[60px] bg-white border-2 flex items-center justify-center mb-5 text-2xl"
                style={{ borderColor: "var(--inst-secondary)" }}
              >
                {service.emoji}
              </div>
              <h4
                className="text-xl font-semibold mb-3"
                style={{ fontFamily: "'Crimson Text', serif", color: "var(--inst-primary)" }}
              >
                {service.title}
              </h4>
              <p className="text-[#5a6c7d] leading-relaxed mb-5">
                {service.description}
              </p>
              <div className="flex justify-between pt-4 border-t border-[#e0d5c7] text-sm text-[#5a6c7d]">
                {service.meta.map((m, j) => (
                  <span key={j}>{m}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
