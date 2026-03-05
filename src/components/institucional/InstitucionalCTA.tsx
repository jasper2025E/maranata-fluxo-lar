import { motion } from "framer-motion";
import { ArrowRight, GraduationCap } from "lucide-react";

export function InstitucionalCTA() {
  return (
    <section id="contato" className="py-20 lg:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[hsl(220,25%,12%)] via-[hsl(220,30%,18%)] to-[hsl(220,25%,12%)] p-10 lg:p-16 text-center"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

          <div className="relative">
            <img
              src="/escola-logo.png"
              alt="Logo Maranata"
              className="h-16 w-16 rounded-full object-cover border-2 border-white/20 mx-auto mb-6"
            />

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white/90 text-sm font-medium mb-6">
              <GraduationCap className="h-4 w-4" />
              Vagas Limitadas
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">
              Garanta a vaga do seu filho!
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto mb-8">
              Entre em contato pelo nosso Instagram e saiba mais sobre turmas, 
              horários e valores. Turmas reduzidas com acompanhamento individualizado.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://www.instagram.com/reforcomaranatabhs/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold px-8 py-4 rounded-xl text-base hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25"
              >
                Fale Conosco no Instagram
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <p className="text-sm text-white/50 mt-6">
              Atendimento de segunda a sexta · Resposta rápida
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
