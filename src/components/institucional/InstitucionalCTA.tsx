import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export function InstitucionalCTA() {
  return (
    <section id="cta" className="py-20 lg:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl gradient-luz-mina p-10 lg:p-16 text-center"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 text-white/90 text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Comece gratuitamente
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">
              Pronto para modernizar sua escola?
            </h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
              Agende uma demonstração gratuita e descubra como o Maranata pode
              transformar a gestão da sua escola.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://wa.me/5500000000000?text=Olá! Gostaria de agendar uma demonstração do Sistema Maranata."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-white text-foreground font-semibold px-8 py-4 rounded-xl text-base hover:bg-white/90 transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                Agendar Demonstração Agora
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <p className="text-sm text-white/60 mt-6">
              Sem compromisso · Sem cartão de crédito · Demonstração personalizada
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
