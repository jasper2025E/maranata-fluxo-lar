const depoimentos = [
  {
    initials: "AF",
    name: "Ana Ferreira",
    role: "Mãe do Lucas, 8 anos",
    text: "O Lucas estava com muita dificuldade em matemática e não queria nem abrir o caderno. Depois que começou no Reforço Maranata, ele melhorou muito as notas e hoje faz as tarefas sozinho!",
  },
  {
    initials: "MS",
    name: "Marcos Souza",
    role: "Pai da Beatriz, 10 anos",
    text: "A Beatriz sempre teve vergonha de perguntar na escola. No Maranata ela se sente à vontade para tirar dúvidas. O ambiente é muito acolhedor e os professores são muito pacientes.",
  },
  {
    initials: "RS",
    name: "Rita Santos",
    role: "Mãe do Pedro e da Julia",
    text: "Meus dois filhos estudam no Maranata e a evolução foi impressionante. O Pedro melhorou em português e a Julia foi alfabetizada antes do esperado. Super recomendo!",
  },
  {
    initials: "CL",
    name: "Carlos Lima",
    role: "Pai do Gabriel, 12 anos",
    text: "O Gabriel ia mal em quase todas as matérias. O acompanhamento individual do Maranata fez toda a diferença. Hoje ele é um dos melhores da turma. Gratidão enorme!",
  },
];

export function InstitucionalDepoimentos() {
  return (
    <section id="depoimentos" className="py-16 lg:py-24 bg-white">
      <div className="max-w-[1200px] mx-auto px-8">
        <div className="text-center mb-12 lg:mb-16">
          <h3
            className="text-2xl sm:text-3xl lg:text-[2.5rem] font-semibold mb-3"
            style={{ fontFamily: "'Crimson Text', serif", color: "var(--inst-primary)" }}
          >
            <span style={{ color: "var(--inst-secondary)" }}>•</span>{" "}
            O que dizem as famílias{" "}
            <span style={{ color: "var(--inst-secondary)" }}>•</span>
          </h3>
          <p className="text-[#5a6c7d] text-lg max-w-[600px] mx-auto">
            Pais que viram seus filhos melhorarem de verdade
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {depoimentos.map((d, i) => (
            <div
              key={i}
              className="inst-testimonial p-8"
              style={{
                background: "var(--inst-bg-warm)",
                borderLeft: "4px solid var(--inst-secondary)",
              }}
            >
              <p
                className="text-xl italic mb-6 leading-relaxed"
                style={{ fontFamily: "'Crimson Text', serif", color: "var(--inst-text)" }}
              >
                "{d.text}"
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-[50px] h-[50px] rounded-full flex items-center justify-center text-white font-semibold text-sm"
                  style={{ background: "var(--inst-primary)" }}
                >
                  {d.initials}
                </div>
                <div>
                  <h5
                    className="text-base font-semibold"
                    style={{ fontFamily: "'Crimson Text', serif", color: "var(--inst-primary)" }}
                  >
                    {d.name}
                  </h5>
                  <span className="text-sm text-[#5a6c7d]">{d.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
