import { motion } from "framer-motion";
import { School, Users, Zap } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: School,
    title: "Cadastre sua escola",
    description: "Crie sua conta em minutos. Configure os dados da sua instituição, cursos e turmas.",
  },
  {
    number: "02",
    icon: Users,
    title: "Organize alunos e turmas",
    description: "Importe ou cadastre alunos, responsáveis e defina as regras de cobrança.",
  },
  {
    number: "03",
    icon: Zap,
    title: "Controle financeiro automatizado",
    description: "Faturas geradas automaticamente, cobranças integradas e relatórios em tempo real.",
  },
];

export function InstitucionalComoFunciona() {
  return (
    <section id="como-funciona" className="py-20 lg:py-28 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-primary font-medium text-sm mb-3 uppercase tracking-wider">Como funciona</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-4">
            3 passos para transformar sua escola
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Comece a usar o Maranata em poucos minutos. Simples, rápido e eficiente.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 relative">
          <div className="hidden lg:block absolute top-24 left-[20%] right-[20%] h-px bg-border" />

          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative text-center"
            >
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl gradient-luz-mina text-white text-xl font-bold mb-6 relative z-10 shadow-lg shadow-primary/20">
                {step.number}
              </div>
              
              <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 text-primary mb-4">
                  <step.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
