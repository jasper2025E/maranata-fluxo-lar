import { motion } from "framer-motion";
import { Building2, Lock, Users, BarChart3, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { INSTITUCIONAL_COLORS } from "./colors";

const features = [
  {
    icon: Building2,
    title: "Múltiplas unidades",
    description: "Gerencie todas as suas escolas em uma única plataforma.",
  },
  {
    icon: Lock,
    title: "Isolamento total",
    description: "Dados de cada escola completamente isolados e seguros.",
  },
  {
    icon: Users,
    title: "Permissões granulares",
    description: "Controle quem acessa o quê em cada unidade.",
  },
  {
    icon: BarChart3,
    title: "Visão consolidada",
    description: "Relatórios unificados de todas as unidades em um só lugar.",
  },
];

export function InstitucionalMultitenant() {
  return (
    <section className="py-24 lg:py-32 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Visual */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative order-2 lg:order-1"
          >
            <div className="relative">
              {/* Main card */}
              <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">
                      Grupo Educacional Alpha
                    </div>
                    <div className="text-sm text-muted-foreground">
                      4 unidades • 2.500 alunos
                    </div>
                  </div>
                </div>

                {/* Schools list */}
                <div className="space-y-3">
                  {[
                    { name: "Unidade Centro", students: 800, color: `bg-[hsl(${INSTITUCIONAL_COLORS.gradient.from})]` },
                    { name: "Unidade Norte", students: 650, color: `bg-[hsl(${INSTITUCIONAL_COLORS.gradient.via1})]` },
                    { name: "Unidade Sul", students: 580, color: `bg-[hsl(${INSTITUCIONAL_COLORS.gradient.via2})]` },
                    { name: "Unidade Oeste", students: 470, color: `bg-[hsl(${INSTITUCIONAL_COLORS.gradient.to})]` },
                  ].map((school, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${school.color}`} />
                        <span className="font-medium text-foreground">
                          {school.name}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {school.students} alunos
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Floating cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="absolute -right-4 -top-4 bg-card rounded-xl p-4 border border-border/50 shadow-lg"
              >
                <div className="text-2xl font-bold text-foreground">R$ 2.4M</div>
                <div className="text-sm text-muted-foreground">
                  Faturamento consolidado
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="absolute -left-4 -bottom-4 bg-card rounded-xl p-4 border border-border/50 shadow-lg"
              >
                <div className="text-2xl font-bold text-primary">97.2%</div>
                <div className="text-sm text-muted-foreground">
                  Taxa de adimplência
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right - Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="order-1 lg:order-2"
          >
            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
              Multi-escolas
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-6">
              Uma plataforma,{" "}
              <span className="text-primary">infinitas escolas</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Ideal para redes de ensino e grupos educacionais. 
              Gerencie todas as suas unidades com visão consolidada 
              e dados completamente isolados.
            </p>

            {/* Features */}
            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-3">
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
                </div>
              ))}
            </div>

            <Link to="/cadastro">
              <Button size="lg" className="gap-2 group">
                Falar com especialista
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
