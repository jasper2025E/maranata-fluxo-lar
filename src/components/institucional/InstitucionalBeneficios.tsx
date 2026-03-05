import { motion } from "framer-motion";
import { Sparkles, Clock, BarChart3, School } from "lucide-react";

const diferenciais = [
  {
    icon: Sparkles,
    title: "Interface moderna e amigável",
    description: "Design premium pensado para facilitar o uso diário. Nada de interfaces confusas.",
  },
  {
    icon: Clock,
    title: "Organização que economiza tempo",
    description: "Processos automatizados que eliminam tarefas repetitivas e liberam sua equipe.",
  },
  {
    icon: BarChart3,
    title: "Relatórios para decisões estratégicas",
    description: "Dados claros e acionáveis para entender a saúde financeira e crescer com segurança.",
  },
  {
    icon: School,
    title: "Feito para escolas",
    description: "Desenvolvido especificamente para atender as necessidades reais de instituições de ensino.",
  },
];

export function InstitucionalBeneficios() {
  return (
    <section id="diferenciais" className="py-20 lg:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-primary font-medium text-sm mb-3 uppercase tracking-wider">Diferenciais</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-4">
            Por que escolher o Maranata?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Mais do que um sistema, uma parceria para o crescimento da sua escola.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {diferenciais.map((d, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center p-8 rounded-2xl bg-muted/30 border border-border/50 hover:bg-card hover:border-border hover:shadow-lg transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl gradient-luz-mina text-white mb-5">
                <d.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">{d.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{d.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-8 border-t border-border pt-12"
        >
          {[
            { value: "500+", label: "Escolas ativas" },
            { value: "50k+", label: "Alunos gerenciados" },
            { value: "99.9%", label: "Uptime garantido" },
            { value: "4.9/5", label: "Avaliação média" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl lg:text-4xl font-bold text-foreground mb-1">{stat.value}</p>
              <p className="text-muted-foreground text-sm">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
