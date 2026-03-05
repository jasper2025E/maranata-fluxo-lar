import { motion } from "framer-motion";

const services = [
  {
    icon: "📖",
    title: "Reforço Escolar",
    description: "Acompanhamento pedagógico nas disciplinas do currículo escolar com foco nas dificuldades específicas de cada aluno.",
    meta: "Fundamental I e II",
  },
  {
    icon: "🎯",
    title: "Preparatório ENEM",
    description: "Método focado em resultados para o vestibular mais importante do país. Simulados e correção personalizada.",
    meta: "Ensino Médio",
  },
  {
    icon: "🔢",
    title: "Matemática Aplicada",
    description: "Descomplicamos os números com metodologia visual e prática. Do básico à matemática avançada.",
    meta: "Todas as idades",
  },
  {
    icon: "🌍",
    title: "Inglês Kids",
    description: "Aprendizado de idiomas através de jogos, músicas e atividades lúdicas. Professores nativos disponíveis.",
    meta: "A partir de 4 anos",
  },
  {
    icon: "✍️",
    title: "Redação e Literatura",
    description: "Desenvolvimento da escrita criativa e interpretação de texto. Preparação para competições de redação.",
    meta: "Todos os níveis",
  },
  {
    icon: "🧠",
    title: "Alfabetização",
    description: "Método fônico atualizado para crianças em fase de alfabetização. Leitura e escrita com prazer.",
    meta: "Educação Infantil",
  },
];

export function InstitucionalModulos() {
  return (
    <section id="servicos" className="py-24 bg-[#f8fafc]">
      <div className="max-w-[1200px] mx-auto px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block bg-[#64b5f6] text-[#0d47a1] px-5 py-1.5 rounded-full font-bold text-sm uppercase tracking-wider mb-4">
            Nossos Serviços
          </span>
          <h3 className="text-3xl sm:text-4xl font-bold text-[#0d47a1] mb-4 font-[Quicksand]">
            Como podemos ajudar seu filho?
          </h3>
          <p className="text-[#607d8b] text-lg max-w-[600px] mx-auto">
            Oferecemos diferentes modalidades de ensino para atender às necessidades específicas de cada aluno
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group bg-white rounded-3xl p-10 text-center border-[3px] border-transparent hover:-translate-y-2.5 hover:border-[#64b5f6] hover:shadow-[0_20px_40px_rgba(30,136,229,0.15)] transition-all duration-400 relative overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-[5px] before:bg-gradient-to-r before:from-[#1e88e5] before:to-[#f57c00] before:scale-x-0 before:transition-transform hover:before:scale-x-100"
            >
              <div className="w-[90px] h-[90px] bg-gradient-to-br from-[#64b5f6] to-[#1e88e5] rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-[0_10px_25px_rgba(30,136,229,0.3)] group-hover:rotate-[10deg] group-hover:scale-110 group-hover:from-[#f57c00] group-hover:to-[#ff9800] transition-all">
                {service.icon}
              </div>
              <h4 className="text-xl font-bold text-[#0d47a1] mb-3 font-[Quicksand]">{service.title}</h4>
              <p className="text-[#607d8b] leading-relaxed mb-6">{service.description}</p>
              <span className="inline-block bg-[#f8fafc] px-4 py-2 rounded-full text-sm font-bold text-[#1e88e5]">
                {service.meta}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
