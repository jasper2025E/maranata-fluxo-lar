import { motion } from "framer-motion";
import {
  GraduationCap,
  CreditCard,
  Users,
  BarChart3,
  Building2,
  Globe,
  FileText,
  Bell,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const modules = [
  {
    icon: GraduationCap,
    title: "Gestão de Alunos",
    description:
      "Matrículas, turmas, enturmação, responsáveis e acompanhamento completo do histórico.",
    features: ["Matrícula digital", "Enturmação", "Histórico escolar"],
  },
  {
    icon: CreditCard,
    title: "Financeiro Completo",
    description:
      "Faturas, cobranças automáticas via PIX, boleto e cartão. Controle de inadimplência.",
    features: ["Asaas & Stripe", "Carnês", "Juros automáticos"],
  },
  {
    icon: Users,
    title: "RH e Folha",
    description:
      "Cadastro de funcionários, cargos, setores, contratos, ponto eletrônico e folha mensal.",
    features: ["Ponto digital", "Contratos CLT/PJ", "Folha integrada"],
  },
  {
    icon: BarChart3,
    title: "Relatórios e BI",
    description:
      "Dashboards em tempo real, análise de inadimplência, receitas por curso e exportações.",
    features: ["KPIs financeiros", "Exportar CSV", "Gráficos"],
  },
  {
    icon: Building2,
    title: "Multi-escolas",
    description:
      "Gerencie várias unidades com dados isolados e visão consolidada no plano Enterprise.",
    features: ["Isolamento RLS", "Consolidação", "Permissões"],
    premium: true,
  },
  {
    icon: Globe,
    title: "Site Escolar",
    description:
      "Crie o site da escola com editor de blocos. Capture leads e pré-matrículas online.",
    features: ["Editor visual", "SEO integrado", "Domínio próprio"],
  },
  {
    icon: FileText,
    title: "Contabilidade",
    description:
      "Plano de contas, lançamentos, DRE, balanço patrimonial e controle de patrimônio.",
    features: ["DRE automático", "Depreciação", "Auditoria"],
    premium: true,
  },
  {
    icon: Bell,
    title: "Despesas",
    description:
      "Controle todas as despesas da escola por categoria, com alertas de vencimento.",
    features: ["Categorização", "Recorrência", "Alertas"],
  },
];

export function InstitucionalModulos() {
  return (
    <section id="modulos" className="py-24 lg:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 lg:mb-20"
        >
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
            Módulos
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-6">
            Tudo que sua escola precisa
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Uma plataforma completa com módulos integrados. 
            Use todos ou apenas os que você precisa.
          </p>
        </motion.div>

        {/* Modules Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((module, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className={cn(
                "group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 relative",
                module.premium && "ring-1 ring-primary/20"
              )}
            >
              {/* Premium badge */}
              {module.premium && (
                <div className="absolute -top-2 -right-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                    <Crown className="w-3 h-3" />
                    Premium
                  </span>
                </div>
              )}

              {/* Icon */}
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <module.icon className="w-6 h-6" />
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {module.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                {module.description}
              </p>

              {/* Features */}
              <div className="flex flex-wrap gap-2">
                {module.features.map((feature, featureIndex) => (
                  <span
                    key={featureIndex}
                    className="px-2 py-1 text-xs font-medium bg-muted rounded-md text-muted-foreground"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
