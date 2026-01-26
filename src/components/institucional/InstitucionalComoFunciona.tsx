import { motion } from "framer-motion";
import { UserPlus, Settings, Rocket, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const steps = [
  {
    icon: UserPlus,
    number: "01",
    title: "Crie sua conta",
    description:
      "Cadastre sua escola em menos de 2 minutos. Sem cartão de crédito, sem compromisso.",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: Settings,
    number: "02",
    title: "Configure sua escola",
    description:
      "Personalize cursos, turmas, formas de pagamento e automatize processos. Nossa equipe ajuda você.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Rocket,
    number: "03",
    title: "Comece a crescer",
    description:
      "Gerencie tudo em um só lugar. Matrículas, pagamentos, funcionários e relatórios.",
    color: "from-emerald-500 to-teal-500",
  },
];

export function InstitucionalComoFunciona() {
  return (
    <section
      id="como-funciona"
      className="py-24 lg:py-32 bg-muted/30 relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 lg:mb-20"
        >
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
            Como funciona
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-6">
            Simples de começar,{" "}
            <span className="text-primary">poderoso de usar</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Em apenas 3 passos sua escola está pronta para uma gestão 
            moderna e eficiente.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 mb-16">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="relative"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-20 left-full w-full h-0.5 bg-gradient-to-r from-border to-transparent z-0" />
              )}

              <div className="relative bg-card rounded-2xl p-8 border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                {/* Step number */}
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} text-white font-bold text-lg mb-6 shadow-lg`}
                >
                  {step.number}
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <Link to="/cadastro">
            <Button size="lg" className="h-14 px-8 text-base font-semibold gap-2 group">
              Criar conta gratuita
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">
            Configuração em menos de 5 minutos • Sem cartão de crédito
          </p>
        </motion.div>
      </div>
    </section>
  );
}
