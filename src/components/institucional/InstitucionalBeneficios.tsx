import { motion } from "framer-motion";
import {
  Clock,
  TrendingUp,
  Shield,
  Zap,
  HeartHandshake,
  BarChart3,
} from "lucide-react";

const benefits = [
  {
    icon: Clock,
    title: "Economize 10+ horas por semana",
    description:
      "Automatize tarefas repetitivas como cobranças, relatórios e comunicações. Foque no que realmente importa: a educação.",
  },
  {
    icon: TrendingUp,
    title: "Reduza inadimplência em até 40%",
    description:
      "Sistema inteligente de cobrança com múltiplos gateways, lembretes automáticos e negociação facilitada.",
  },
  {
    icon: Shield,
    title: "Dados sempre protegidos",
    description:
      "Criptografia de ponta, backups automáticos e conformidade com LGPD. Sua escola sempre segura.",
  },
  {
    icon: Zap,
    title: "Implantação em minutos",
    description:
      "Sem instalação, sem servidores. Comece a usar agora mesmo. Migração de dados assistida e gratuita.",
  },
  {
    icon: HeartHandshake,
    title: "Suporte humanizado",
    description:
      "Equipe brasileira pronta para ajudar via chat, email ou telefone. Treinamento incluído.",
  },
  {
    icon: BarChart3,
    title: "Decisões baseadas em dados",
    description:
      "Dashboards em tempo real, relatórios detalhados e projeções financeiras para crescer com segurança.",
  },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export function InstitucionalBeneficios() {
  return (
    <section id="beneficios" className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 lg:mb-20"
        >
          <p className="text-primary font-medium mb-4">Por que escolher</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 tracking-tight mb-6">
            Resultados reais para sua escola
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Instituições de ensino de todos os tamanhos já transformaram sua gestão.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="group relative p-6 lg:p-8 rounded-2xl bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-lg transition-all duration-300"
            >
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-5 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <benefit.icon className="w-6 h-6" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                {benefit.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 border-t border-slate-200 pt-16"
        >
          {[
            { value: "500+", label: "Escolas ativas" },
            { value: "50k+", label: "Alunos gerenciados" },
            { value: "99.9%", label: "Uptime garantido" },
            { value: "4.9/5", label: "Avaliação média" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
                {stat.value}
              </div>
              <div className="text-slate-500">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
