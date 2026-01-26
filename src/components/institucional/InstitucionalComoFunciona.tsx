import { motion } from "framer-motion";
import { UserPlus, Settings, Rocket, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { INSTITUCIONAL_COLORS } from "./colors";

// Usando cores da paleta unificada
const stepColors = [
  `from-[hsl(${INSTITUCIONAL_COLORS.gradient.from})] to-[hsl(${INSTITUCIONAL_COLORS.gradient.via1})]`,
  `from-[hsl(${INSTITUCIONAL_COLORS.gradient.via2})] to-[hsl(${INSTITUCIONAL_COLORS.gradient.via3})]`,
  `from-[hsl(${INSTITUCIONAL_COLORS.gradient.via3})] to-[hsl(${INSTITUCIONAL_COLORS.gradient.to})]`,
];

const steps = [
  {
    icon: UserPlus,
    number: "01",
    title: "Crie sua conta",
    description:
      "Cadastre sua escola em menos de 2 minutos. Sem cartão de crédito, sem compromisso.",
  },
  {
    icon: Settings,
    number: "02",
    title: "Configure sua escola",
    description:
      "Personalize cursos, turmas, formas de pagamento e automatize processos. Nossa equipe ajuda você.",
  },
  {
    icon: Rocket,
    number: "03",
    title: "Comece a crescer",
    description:
      "Gerencie tudo em um só lugar. Matrículas, pagamentos, funcionários e relatórios.",
  },
];

export function InstitucionalComoFunciona() {
  return (
    <section
      id="como-funciona"
      className="py-24 lg:py-32 bg-slate-50 relative overflow-hidden"
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 lg:mb-20"
        >
          <p className="text-primary font-medium mb-4">Como funciona</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 tracking-tight mb-6">
            Simples de começar,{" "}
            <span className="text-primary">poderoso de usar</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
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
                <div className="hidden lg:block absolute top-20 left-full w-full h-px bg-slate-300 z-0" />
              )}

              <div className="relative bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
                {/* Step number */}
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary text-white font-bold text-lg mb-6">
                  {step.number}
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
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
