const diferenciais = [
  {
    title: "Atenção Individualizada",
    description: "Turmas reduzidas para que cada aluno receba o acompanhamento que precisa, no seu próprio ritmo.",
  },
  {
    title: "Acompanhamento aos Pais",
    description: "Feedback constante sobre o progresso, conquistas e pontos a melhorar de cada aluno.",
  },
  {
    title: "Aprendizado Divertido",
    description: "Atividades lúdicas e jogos educativos para tornar o estudo prazeroso e eficiente.",
  },
  {
    title: "Ambiente Familiar",
    description: "Espaço acolhedor em Barreirinhas onde as crianças se sentem seguras e à vontade para aprender.",
  },
  {
    title: "Dedicação Comprovada",
    description: "Mais de 5 anos ajudando crianças e adolescentes a superarem dificuldades escolares com carinho.",
  },
];

export function InstitucionalBeneficios() {
  return (
    <section id="sobre" className="py-16 lg:py-24" style={{ background: "var(--inst-bg-cream)" }}>
      <div className="max-w-[1200px] mx-auto px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text */}
          <div>
            <h3
              className="text-2xl sm:text-3xl lg:text-[2.5rem] font-semibold mb-6 leading-snug"
              style={{ fontFamily: "'Crimson Text', serif", color: "var(--inst-primary)" }}
            >
              Por que as famílias confiam no Reforço Maranata?
            </h3>

            <ul className="space-y-0">
              {diferenciais.map((d, i) => (
                <li
                  key={i}
                  className="inst-diff-item py-4 border-b border-[#e0d5c7] flex items-start gap-3"
                >
                  <span className="text-[#c9a227] font-bold text-lg leading-none mt-0.5">—</span>
                  <div>
                    <strong className="text-[#2c3e50]">{d.title}:</strong>{" "}
                    <span className="text-[#5a6c7d]">{d.description}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Image */}
          <div className="inst-diff-image relative">
            <img
              src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=800&fit=crop"
              alt="Sala de aula do Reforço Maranata"
              className="w-full h-[500px] object-cover"
              style={{ filter: "sepia(20%)" }}
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
