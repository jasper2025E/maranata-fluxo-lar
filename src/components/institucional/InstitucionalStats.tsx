const stats = [
  { number: "200+", label: "Alunos Atendidos" },
  { number: "95%", label: "Melhora nas Notas" },
  { number: "5+", label: "Anos de Experiência" },
  { number: "4.9", label: "Avaliação dos Pais" },
];

export function InstitucionalStats() {
  return (
    <section className="text-white py-12 lg:py-16" style={{ background: "var(--inst-primary)" }}>
      <div className="max-w-[1200px] mx-auto px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`py-4 relative ${i < stats.length - 1 ? "inst-stat-divider" : ""}`}
            >
              <span
                className="block text-3xl lg:text-[3rem] font-bold mb-2 leading-none"
                style={{ fontFamily: "'Crimson Text', serif", color: "var(--inst-secondary)" }}
              >
                {stat.number}
              </span>
              <span className="text-sm opacity-90 uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
