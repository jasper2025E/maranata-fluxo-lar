const stats = [
  { number: "5+", label: "Anos de experiência" },
  { number: "200+", label: "Alunos atendidos" },
  { number: "95%", label: "Melhora nas notas" },
  { number: "4.9", label: "Avaliação dos pais" },
];

export function InstitucionalStats() {
  return (
    <div className="bg-gray-50 border-y border-gray-200">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {stats.map((stat, i) => (
            <div key={i}>
              <span className="block text-2xl lg:text-3xl font-bold text-blue-900">
                {stat.number}
              </span>
              <span className="text-sm text-gray-500 mt-1">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
