import { motion } from "framer-motion";
import { 
  DollarSign, 
  Users, 
  BarChart3, 
  CreditCard, 
  LayoutDashboard, 
  GraduationCap,
  History,
} from "lucide-react";

const problems = [
  {
    emoji: "😩",
    title: "Falta de organização financeira",
    description: "Planilhas desatualizadas, dados espalhados e falta de visão clara do caixa.",
  },
  {
    emoji: "📋",
    title: "Controle manual de mensalidades",
    description: "Cobranças feitas manualmente geram erros, esquecimentos e retrabalho constante.",
  },
  {
    emoji: "📉",
    title: "Dificuldade com inadimplência",
    description: "Sem ferramentas adequadas, a inadimplência cresce e a receita fica comprometida.",
  },
  {
    emoji: "🤷",
    title: "Ausência de relatórios claros",
    description: "Sem dados confiáveis, tomar decisões estratégicas vira um jogo de adivinhação.",
  },
];

const solutions = [
  { icon: DollarSign, title: "Controle Financeiro Completo", description: "Receitas, despesas e fluxo de caixa em tempo real com dashboards intuitivos." },
  { icon: Users, title: "Gestão Centralizada de Alunos", description: "Matrículas, dados pessoais e histórico acadêmico em um só lugar." },
  { icon: BarChart3, title: "Relatórios Inteligentes", description: "Relatórios automatizados que facilitam a análise e a tomada de decisões." },
  { icon: CreditCard, title: "Mensalidades Automatizadas", description: "Geração automática de faturas, lembretes e integração com gateways de pagamento." },
  { icon: LayoutDashboard, title: "Painel Administrativo", description: "Visão 360° da escola: KPIs financeiros, alunos, turmas e muito mais." },
  { icon: GraduationCap, title: "Organização de Turmas", description: "Gerencie turmas, cursos e enturmações com facilidade." },
  { icon: History, title: "Histórico de Pagamentos", description: "Acompanhe cada pagamento, desconto, juros e multa com total rastreabilidade." },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export function InstitucionalModulos() {
  return (
    <>
      {/* PROBLEMA */}
      <section className="py-20 lg:py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-destructive font-medium text-sm mb-3 uppercase tracking-wider">O problema</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-4">
              Sua escola enfrenta esses desafios?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Se você se identificou com algum desses problemas, o Maranata foi feito para você.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {problems.map((p, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow"
              >
                <span className="text-3xl mb-4 block">{p.emoji}</span>
                <h3 className="text-base font-semibold text-foreground mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SOLUÇÃO */}
      <section id="funcionalidades" className="py-20 lg:py-28 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-primary font-medium text-sm mb-3 uppercase tracking-wider">A solução</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-4">
              Tudo que sua escola precisa
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              O Sistema Maranata reúne as ferramentas essenciais para uma gestão escolar eficiente e moderna.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {solutions.map((s, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="group relative bg-card border border-border/50 rounded-2xl p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
              >
                <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  );
}
