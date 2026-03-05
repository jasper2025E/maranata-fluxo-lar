const stats = [
  { number: "200+", label: "Alunos atendidos" },
  { number: "95%", label: "Melhora nas notas" },
  { number: "5+", label: "Anos de experiência" },
  { number: "4.9★", label: "Avaliação dos pais" },
];

export function InstitucionalStats() {
  return (
    <div className="border-y border-white/[0.08]">
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className={`text-center ${i < stats.length - 1 ? "inst-stat-divider" : ""}`}>
              <span className="block text-2xl lg:text-3xl font-bold tracking-tight" style={{ color: "#F5A623" }}>
                {stat.number}
              </span>
              <span className="text-xs text-[#666] mt-1 uppercase tracking-widest">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
