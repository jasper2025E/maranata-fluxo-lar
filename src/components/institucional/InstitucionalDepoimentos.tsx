const depoimentos = [
  {
    initials: "AF",
    name: "Ana Ferreira",
    role: "Mãe do Lucas, 8 anos",
    text: "O Lucas estava com muita dificuldade em matemática e não queria nem abrir o caderno. Depois que começou no Maranata, ele melhorou muito as notas e hoje faz as tarefas sozinho!",
  },
  {
    initials: "MS",
    name: "Marcos Souza",
    role: "Pai da Beatriz, 10 anos",
    text: "A Beatriz sempre teve vergonha de perguntar na escola. No Maranata ela se sente à vontade para tirar dúvidas. O ambiente é muito acolhedor.",
  },
  {
    initials: "RS",
    name: "Rita Santos",
    role: "Mãe do Pedro e da Julia",
    text: "Meus dois filhos estudam no Maranata e a evolução foi impressionante. O Pedro melhorou em português e a Julia foi alfabetizada antes do esperado.",
  },
  {
    initials: "CL",
    name: "Carlos Lima",
    role: "Pai do Gabriel, 12 anos",
    text: "O Gabriel ia mal em quase todas as matérias. O acompanhamento individual fez toda a diferença. Hoje ele é um dos melhores da turma.",
  },
];

export function InstitucionalDepoimentos() {
  return (
    <section id="depoimentos" className="py-20 lg:py-28 border-t border-white/[0.08]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-xs text-[#666] uppercase tracking-widest mb-3">Depoimentos</p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
            O que as famílias dizem
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {depoimentos.map((d, i) => (
            <div key={i} className="inst-card inst-quote p-8">
              <p className="text-[15px] text-[#aaa] leading-relaxed mb-6">
                "{d.text}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                  {d.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{d.name}</p>
                  <p className="text-xs text-[#666]">{d.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
