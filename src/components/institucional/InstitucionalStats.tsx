import { motion } from "framer-motion";

const stats = [
  { number: "5+", label: "Anos de Experiência" },
  { number: "200+", label: "Alunos Atendidos" },
  { number: "95%", label: "Melhora nas Notas" },
  { number: "4.9", label: "Avaliação dos Pais" },
];

export function InstitucionalStats() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative z-10 -mt-12 max-w-[1160px] mx-auto bg-white rounded-[20px] shadow-[0_10px_40px_rgba(30,136,229,0.1)] py-8 px-8"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`py-4 relative ${
              i < stats.length - 1
                ? "lg:after:content-[''] lg:after:absolute lg:after:right-0 lg:after:top-1/2 lg:after:-translate-y-1/2 lg:after:h-10 lg:after:w-[2px] lg:after:bg-[#e3f2fd]"
                : ""
            }`}
          >
            <span className="block text-4xl lg:text-5xl font-extrabold text-[#1e88e5] leading-none mb-1 font-[Quicksand]">
              {stat.number}
            </span>
            <span className="text-sm text-[#607d8b] font-semibold">{stat.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
