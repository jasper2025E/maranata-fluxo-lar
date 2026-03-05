import { motion } from "framer-motion";

const diferenciais = [
  {
    icon: "👨‍🏫",
    title: "Professores Especializados",
    description: "Equipe formada em pedagogia com pós-graduação e constante atualização em novas metodologias.",
  },
  {
    icon: "📊",
    title: "Acompanhamento Individual",
    description: "Relatórios mensais detalhados sobre o progresso do aluno e reuniões periódicas com os pais.",
  },
  {
    icon: "🎮",
    title: "Aprendizado Lúdico",
    description: "Utilizamos jogos educativos, tecnologia e atividades práticas para tornar o estudo prazeroso.",
  },
  {
    icon: "🏠",
    title: "Ambiente Acolhedor",
    description: "Salas climatizadas, material didático completo e espaço projetado para o bem-estar das crianças.",
  },
];

export function InstitucionalBeneficios() {
  return (
    <section id="metodologia" className="py-24 bg-white relative overflow-hidden">
      {/* Blob decorativo */}
      <div className="absolute -bottom-[100px] -left-[100px] w-[400px] h-[400px] bg-[rgba(30,136,229,0.05)] rounded-[60%_40%_30%_70%/60%_30%_70%_40%] animate-[morph_8s_ease-in-out_infinite]" />

      <div className="max-w-[1200px] mx-auto px-8 relative z-[1]">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="rounded-[30px] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.15)]">
              <img
                src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=800&fit=crop"
                alt="Sala de aula Maranata"
                className="w-full h-[500px] object-cover block"
                loading="lazy"
              />
            </div>
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -bottom-5 -right-5 bg-[#f57c00] text-white p-6 rounded-[20px] text-center shadow-[0_10px_30px_rgba(245,124,0,0.3)]"
            >
              <span className="block text-4xl font-extrabold leading-none">100%</span>
              <span className="text-sm font-semibold">Avaliações<br />Positivas</span>
            </motion.div>
          </motion.div>

          {/* Text + items */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block bg-[#64b5f6] text-[#0d47a1] px-5 py-1.5 rounded-full font-bold text-sm uppercase tracking-wider mb-4">
              Por que escolher a Maranata?
            </span>
            <h3 className="text-3xl sm:text-4xl font-bold text-[#0d47a1] mb-8 leading-[1.3] font-[Quicksand]">
              Uma metodologia que realmente funciona
            </h3>

            <div className="space-y-4">
              {diferenciais.map((d, i) => (
                <div
                  key={i}
                  className="flex items-start gap-5 p-6 bg-[#f8fafc] rounded-2xl border-l-4 border-transparent hover:bg-white hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:border-l-[#f57c00] hover:translate-x-2.5 transition-all cursor-default"
                >
                  <div className="w-[50px] h-[50px] bg-gradient-to-br from-[#1e88e5] to-[#0d47a1] rounded-xl flex items-center justify-center text-2xl flex-shrink-0 text-white">
                    {d.icon}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#0d47a1] mb-1 font-[Quicksand]">{d.title}</h4>
                    <p className="text-[#607d8b] text-[0.95rem] leading-relaxed">{d.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
