import { motion } from "framer-motion";
import {
  Shield,
  Lock,
  Server,
  Eye,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { INSTITUCIONAL_COLORS } from "./colors";

const securityFeatures = [
  {
    icon: Lock,
    title: "Criptografia AES-256",
    description: "Todos os dados são criptografados em trânsito e em repouso.",
  },
  {
    icon: Server,
    title: "Infraestrutura Redundante",
    description: "Servidores distribuídos com failover automático.",
  },
  {
    icon: Eye,
    title: "Conformidade LGPD",
    description: "Processos e políticas em total conformidade com a LGPD.",
  },
  {
    icon: RefreshCw,
    title: "Backups Automáticos",
    description: "Backups diários com retenção de 30 dias. Restauração rápida.",
  },
];

const certifications = [
  "ISO 27001",
  "SOC 2 Type II",
  "LGPD Compliant",
  "PCI DSS",
];

export function InstitucionalSeguranca() {
  return (
    <section id="seguranca" className="py-24 lg:py-32 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
              Segurança
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-6">
              Seus dados protegidos{" "}
              <span className="text-primary">24/7</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Segurança não é opcional. Investimos constantemente em 
              infraestrutura e processos para garantir que os dados da 
              sua escola estejam sempre seguros.
            </p>

            {/* Security Features */}
            <div className="grid sm:grid-cols-2 gap-6">
              {securityFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex gap-4"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Content - Visual */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative bg-card rounded-3xl p-8 lg:p-12 border border-border/50 shadow-xl">
              {/* Shield Icon */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl" />
                  <div 
                    className="relative w-24 h-24 rounded-full flex items-center justify-center shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, hsl(${INSTITUCIONAL_COLORS.gradient.from}) 0%, hsl(${INSTITUCIONAL_COLORS.gradient.via2}) 100%)`
                    }}
                  >
                    <Shield className="w-12 h-12 text-white" />
                  </div>
                </div>
              </div>

              {/* Uptime */}
              <div className="text-center mb-8">
                <div className="text-5xl font-bold text-foreground mb-2">
                  99.9%
                </div>
                <div className="text-muted-foreground">
                  Uptime garantido por SLA
                </div>
              </div>

              {/* Certifications */}
              <div className="space-y-3">
                {certifications.map((cert, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-lg"
                  >
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span className="font-medium text-foreground">{cert}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-2xl -z-10 rotate-12" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-secondary/10 rounded-2xl -z-10 -rotate-12" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
