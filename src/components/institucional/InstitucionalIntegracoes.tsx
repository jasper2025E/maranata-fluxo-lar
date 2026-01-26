import { motion } from "framer-motion";
import { Plug, ArrowRight } from "lucide-react";

const integrations = [
  {
    name: "Asaas",
    category: "Pagamentos",
    logo: "💳",
    description: "Boleto, PIX e Cartão",
  },
  {
    name: "Stripe",
    category: "Pagamentos",
    logo: "💰",
    description: "Cartão internacional",
  },
  {
    name: "Email SMTP",
    category: "Comunicação",
    logo: "📧",
    description: "Envio de cobranças",
  },
  {
    name: "WhatsApp",
    category: "Comunicação",
    logo: "📱",
    description: "Notificações (em breve)",
  },
  {
    name: "eSocial",
    category: "Governo",
    logo: "🏛️",
    description: "Folha de pagamento",
  },
  {
    name: "Contador",
    category: "Contabilidade",
    logo: "📊",
    description: "Exportação DRE",
  },
  {
    name: "Zapier",
    category: "Automação",
    logo: "⚡",
    description: "Conecte +5000 apps",
  },
  {
    name: "API REST",
    category: "Desenvolvimento",
    logo: "🔌",
    description: "Integração customizada",
  },
];

export function InstitucionalIntegracoes() {
  return (
    <section className="py-24 lg:py-32 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-primary font-medium mb-4">Integrações</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground tracking-tight mb-6">
            Conecte suas ferramentas
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Integre com gateways de pagamento, comunicação e contabilidade.
          </p>
        </motion.div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6 mb-12">
          {integrations.map((integration, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 text-center"
            >
              <div className="text-4xl mb-3">{integration.logo}</div>
              <h4 className="font-semibold text-foreground mb-1">
                {integration.name}
              </h4>
              <p className="text-xs text-muted-foreground mb-1">
                {integration.category}
              </p>
              <p className="text-xs text-primary">
                {integration.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* API CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-card rounded-full border border-border shadow-sm">
            <Plug className="w-5 h-5 text-primary" />
            <span className="text-foreground font-medium">
              API REST completa para desenvolvedores
            </span>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
