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
} from "lucide-react";

const modules = [
  {
    icon: GraduationCap,
    title: "Gestão de Alunos",
    description:
      "Matrículas, turmas, enturmação e acompanhamento completo do histórico escolar.",
    features: ["Matrícula online", "Histórico completo", "Documentos digitais"],
  },
  {
    icon: CreditCard,
    title: "Financeiro Integrado",
    description:
      "Cobrança automática com PIX, boleto e cartão. Controle total de inadimplência.",
    features: ["Multi-gateway", "Cobrança automática", "Relatórios fiscais"],
  },
  {
    icon: Users,
    title: "RH e Folha",
    description:
      "Cadastro de funcionários, contratos, ponto eletrônico e geração de folha.",
    features: ["Ponto digital", "Contratos", "Folha de pagamento"],
  },
  {
    icon: BarChart3,
    title: "Relatórios e BI",
    description:
      "Dashboards em tempo real, projeções financeiras e indicadores de desempenho.",
    features: ["Tempo real", "Exportação", "Gráficos avançados"],
  },
  {
    icon: Building2,
    title: "Multi-escolas",
    description:
      "Gerencie várias unidades em uma única plataforma com dados consolidados.",
    features: ["Dados isolados", "Consolidação", "Permissões por unidade"],
  },
  {
    icon: Globe,
    title: "Site Escolar",
    description:
      "Crie o site da sua escola com editor visual. Capte leads e matrículas online.",
    features: ["Editor drag-drop", "SEO otimizado", "Formulários"],
  },
  {
    icon: FileText,
    title: "Contabilidade",
    description:
      "Plano de contas, lançamentos, DRE e balanço patrimonial integrados.",
    features: ["Plano de contas", "DRE automático", "Auditoria"],
  },
  {
    icon: Bell,
    title: "Comunicação",
    description:
      "Envie avisos, boletos e comunicados por email e WhatsApp automaticamente.",
    features: ["Email", "WhatsApp", "Agendamento"],
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
              className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
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
