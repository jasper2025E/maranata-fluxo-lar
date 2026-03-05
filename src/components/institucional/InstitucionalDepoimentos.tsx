import { motion } from "framer-motion";

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
    <section id="depoimentos" className="py-24 bg-gradient-to-br from-[#0d47a1] to-[#1e88e5] relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-white/20 text-white px-5 py-1.5 rounded-full font-bold text-sm uppercase tracking-wider mb-4">
            Depoimentos
          </span>
          <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-[Quicksand]">
            O que as famílias de Barreirinhas dizem
          </h3>
          <p className="text-white/80 text-lg max-w-[600px] mx-auto">
            Histórias reais de pais que viram seus filhos transformarem os resultados escolares
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-10">
          {depoimentos.map((d, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/95 backdrop-blur-sm rounded-3xl p-10 relative hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] transition-all"
            >
              <span className="absolute top-5 right-6 text-7xl text-[#64b5f6] opacity-30 font-serif leading-none select-none">
                "
              </span>
              <p className="text-lg text-[#2c3e50] leading-relaxed mb-6 italic">
                {d.text}
              </p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#f57c00] to-[#ffc107] flex items-center justify-center text-white font-extrabold text-lg border-[3px] border-white shadow-md">
                  {d.initials}
                </div>
                <div>
                  <h5 className="text-lg font-bold text-[#0d47a1]">{d.name}</h5>
                  <span className="text-[#607d8b] text-sm font-semibold">{d.role}</span>
                  <div className="text-[#ffc107] text-lg mt-0.5">★★★★★</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
