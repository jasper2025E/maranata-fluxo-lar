import { motion } from "framer-motion";

const depoimentos = [
  {
    initials: "CF",
    name: "Carla Ferreira",
    role: "Mãe do Pedro, 9 anos",
    text: "Meu filho odiava matemática e tirava notas baixas. Depois de 6 meses na Maranata, ele não apenas melhorou as notas, mas começou a gostar da matéria. A professora Ana tem um dom!",
  },
  {
    initials: "JS",
    name: "João Silva",
    role: "Aprovado em Medicina - USP",
    text: "O reforço para o ENEM foi decisivo para minha aprovação em Medicina. A metodologia de redação e a quantidade de simulados fizeram toda a diferença no dia da prova.",
  },
  {
    initials: "MO",
    name: "Marina Oliveira",
    role: "Mãe da Luísa, 11 anos",
    text: "Minha filha tem TDAH e sempre teve dificuldade de concentração. Na Maranata encontramos profissionais que entendem e adaptam o ensino. Hoje ela é uma aluna destacada.",
  },
  {
    initials: "RS",
    name: "Roberto Santos",
    role: "Pai de alunos do 3º e 7º ano",
    text: "O ambiente é extremamente acolhedor. Meus dois filhos frequentam e adoram. O diferencial é o carinho e a atenção individual que cada aluno recebe.",
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
            O que as famílias dizem sobre nós
          </h3>
          <p className="text-white/80 text-lg max-w-[600px] mx-auto">
            Histórias reais de transformação e conquistas dos nossos alunos
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
