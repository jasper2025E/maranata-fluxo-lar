import { Star } from "lucide-react";

const depoimentos = [
  {
    name: "Ana Ferreira",
    role: "Mãe do Lucas, 8 anos",
    text: "O Lucas estava com muita dificuldade em matemática. Depois que começou no Maranata, melhorou muito as notas e hoje faz as tarefas sozinho!",
  },
  {
    name: "Marcos Souza",
    role: "Pai da Beatriz, 10 anos",
    text: "A Beatriz sempre teve vergonha de perguntar na escola. No Maranata ela se sente à vontade. O ambiente é muito acolhedor.",
  },
  {
    name: "Rita Santos",
    role: "Mãe do Pedro e da Julia",
    text: "Meus dois filhos estudam no Maranata. O Pedro melhorou em português e a Julia foi alfabetizada antes do esperado. Super recomendo!",
  },
  {
    name: "Carlos Lima",
    role: "Pai do Gabriel, 12 anos",
    text: "O Gabriel ia mal em quase todas as matérias. O acompanhamento individual fez toda a diferença. Hoje ele é um dos melhores da turma.",
  },
];

export function InstitucionalDepoimentos() {
  return (
    <section id="depoimentos" className="py-16 lg:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            O que as famílias dizem
          </h2>
          <p className="text-gray-500">
            Pais que viram seus filhos melhorarem de verdade.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {depoimentos.map((d, i) => (
            <div
              key={i}
              className="border border-gray-200 rounded-lg p-6"
            >
              <div className="flex gap-0.5 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                "{d.text}"
              </p>
              <div className="pt-3 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-900">{d.name}</p>
                <p className="text-xs text-gray-400">{d.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
