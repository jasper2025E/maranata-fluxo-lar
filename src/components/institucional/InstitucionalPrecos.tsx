import { motion } from "framer-motion";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Básico",
    description: "Para escolas de pequeno porte iniciando a digitalização",
    price: "99,99",
    period: "/mês",
    featured: false,
    features: [
      "Até 100 alunos",
      "Até 3 usuários",
      "500 MB de armazenamento",
      "Gestão de matrículas e turmas",
      "Financeiro básico (boletos)",
      "Relatórios essenciais",
      "Suporte por email",
    ],
    cta: "Começar teste grátis",
  },
  {
    name: "Profissional",
    description: "Para escolas em crescimento que precisam de mais recursos",
    price: "170,99",
    period: "/mês",
    featured: true,
    features: [
      "Até 500 alunos",
      "Até 10 usuários",
      "2 GB de armazenamento",
      "Todos os módulos básicos",
      "Multi-gateway (PIX, Boleto, Cartão)",
      "Integração Asaas e Stripe",
      "RH e Folha de Pagamento",
      "Relatórios avançados",
      "Site escolar personalizado",
      "Suporte prioritário",
    ],
    cta: "Começar teste grátis",
  },
  {
    name: "Enterprise",
    description: "Para redes de ensino e grandes instituições",
    price: "499,99",
    period: "/mês",
    featured: false,
    features: [
      "Alunos ilimitados",
      "Usuários ilimitados",
      "10 GB de armazenamento",
      "Multi-escolas (multi-tenant)",
      "Contabilidade completa (DRE, Balanço)",
      "Projeção e Saúde Financeira",
      "API personalizada",
      "SLA 99.9% garantido",
      "Gerente de conta dedicado",
      "Treinamento e onboarding VIP",
    ],
    cta: "Falar com vendas",
  },
];

export function InstitucionalPrecos() {
  return (
    <section id="precos" className="py-24 lg:py-32 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-primary font-medium mb-4">Preços</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 tracking-tight mb-6">
            Planos que crescem com você
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Sem surpresas, sem taxas escondidas. Teste grátis por 14 dias.
          </p>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={cn(
                "relative rounded-2xl p-8 border transition-all",
                plan.featured
                  ? "bg-foreground text-background border-foreground shadow-2xl scale-105 lg:scale-110"
                  : "bg-card border-border/50 hover:border-primary/30 hover:shadow-lg"
              )}
            >
              {/* Featured badge */}
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-full shadow-lg">
                    <Sparkles className="w-4 h-4" />
                    Mais popular
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-6">
                <h3
                  className={cn(
                    "text-xl font-bold mb-2",
                    plan.featured ? "text-background" : "text-foreground"
                  )}
                >
                  {plan.name}
                </h3>
                <p
                  className={cn(
                    "text-sm",
                    plan.featured ? "text-background/70" : "text-muted-foreground"
                  )}
                >
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  {plan.price !== "Sob consulta" && (
                    <span
                      className={cn(
                        "text-sm",
                        plan.featured ? "text-background/70" : "text-muted-foreground"
                      )}
                    >
                      R$
                    </span>
                  )}
                  <span
                    className={cn(
                      "text-4xl font-bold",
                      plan.featured ? "text-background" : "text-foreground"
                    )}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={cn(
                      "text-sm",
                      plan.featured ? "text-background/70" : "text-muted-foreground"
                    )}
                  >
                    {plan.period}
                  </span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check
                      className={cn(
                        "w-5 h-5 flex-shrink-0 mt-0.5",
                        plan.featured ? "text-primary" : "text-primary"
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm",
                        plan.featured ? "text-background/90" : "text-muted-foreground"
                      )}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link to="/cadastro" className="block">
                <Button
                  className={cn(
                    "w-full gap-2 group",
                    plan.featured
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : ""
                  )}
                  variant={plan.featured ? "default" : "outline"}
                  size="lg"
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center text-muted-foreground mt-12"
        >
          Todos os planos incluem SSL gratuito, backups automáticos e atualizações sem custo.
        </motion.p>
      </div>
    </section>
  );
}
