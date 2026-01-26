import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "A gestão financeira ficou muito mais organizada. O controle de inadimplência com cobrança automática via PIX e boleto revolucionou nosso fluxo de caixa.",
    author: "Carla Mendes",
    role: "Diretora Administrativa",
    company: "Colégio Esperança",
    avatar: "CM",
  },
  {
    quote:
      "O módulo de RH e folha de pagamento integrados economizam horas por mês. O ponto eletrônico é simples e eficiente.",
    author: "Roberto Almeida",
    role: "Gestor de RH",
    company: "Instituto Educacional Futuro",
    avatar: "RA",
  },
  {
    quote:
      "Gerenciar 3 unidades com dados isolados mas relatórios consolidados era exatamente o que precisávamos. Sistema robusto e confiável.",
    author: "Fernanda Lima",
    role: "Diretora Geral",
    company: "Rede de Ensino Crescer",
    avatar: "FL",
  },
];

export function InstitucionalDepoimentos() {
  return (
    <section className="py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-primary font-medium mb-4">Depoimentos</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 tracking-tight mb-6">
            O que nossos clientes dizem
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Escolas de todo o Brasil já transformaram sua gestão.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative bg-slate-50 rounded-2xl p-8 border border-transparent hover:border-slate-200 hover:bg-white hover:shadow-lg transition-all"
            >
              {/* Quote icon */}
              <Quote className="w-10 h-10 text-primary/20 mb-4" />

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-amber-400 fill-amber-400"
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-slate-700 mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">
                    {testimonial.author}
                  </div>
                  <div className="text-sm text-slate-500">
                    {testimonial.role} • {testimonial.company}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Logos strip */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16 pt-16 border-t border-slate-200"
        >
          <p className="text-center text-sm text-slate-500 mb-8">
            Escolas de todo o Brasil confiam em nossa plataforma
          </p>
          <div className="flex flex-wrap justify-center gap-8 lg:gap-12 opacity-40">
            {[
              "Colégio Alpha",
              "Escola Beta",
              "Instituto Gamma",
              "Rede Delta",
              "Grupo Epsilon",
            ].map((name, index) => (
              <div
                key={index}
                className="text-lg font-bold text-slate-600"
              >
                {name}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
