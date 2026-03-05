const stats = [
  { number: "5+", label: "Anos de Experiência" },
  { number: "200+", label: "Alunos Atendidos" },
  { number: "95%", label: "Melhora nas Notas" },
  { number: "4.9", label: "Avaliação dos Pais" },
];

export function InstitucionalStats() {
  return (
    <div className="max-w-[1100px] mx-auto px-8 -mt-8 relative z-10">
      <div className="bg-white rounded-xl shadow-lg border border-[#e3f2fd] py-6 px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`py-3 ${
                i < stats.length - 1 ? "lg:border-r lg:border-[#e3f2fd]" : ""
              }`}
            >
              <span className="block text-3xl lg:text-4xl font-extrabold text-[#1e88e5] leading-none mb-1 font-[Quicksand]">
                {stat.number}
              </span>
              <span className="text-sm text-[#607d8b] font-medium">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
