import { Star } from "lucide-react";

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
    <section id="depoimentos" className="py-20 bg-[#0d47a1]">
      <div className="max-w-[1200px] mx-auto px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 font-[Quicksand]">
            O que as famílias dizem
          </h2>
          <p className="text-white/70 text-lg max-w-[500px] mx-auto">
            Pais que viram seus filhos melhorarem de verdade
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {depoimentos.map((d, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-8"
            >
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-4 w-4 fill-[#ffc107] text-[#ffc107]" />
                ))}
              </div>
              <p className="text-[#2c3e50] leading-relaxed mb-6">
                "{d.text}"
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-[#e3f2fd]">
                <div className="w-10 h-10 rounded-full bg-[#f57c00] flex items-center justify-center text-white font-bold text-sm">
                  {d.initials}
                </div>
                <div>
                  <p className="font-bold text-[#0d47a1] text-sm">{d.name}</p>
                  <p className="text-[#607d8b] text-xs">{d.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
