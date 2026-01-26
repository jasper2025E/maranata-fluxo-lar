import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "Reduzimos a inadimplência em 35% no primeiro trimestre. O sistema de cobrança automática é excelente.",
    author: "Maria Silva",
    role: "Diretora Financeira",
    company: "Colégio São Paulo",
    avatar: "MS",
  },
  {
    quote:
      "A migração foi muito tranquila. A equipe de suporte nos ajudou em cada etapa. Altamente recomendado.",
    author: "João Santos",
    role: "Coordenador Administrativo",
    company: "Escola Nova Geração",
    avatar: "JS",
  },
  {
    quote:
      "Gerenciar 4 unidades ficou muito mais simples. Os relatórios consolidados economizam horas do meu dia.",
    author: "Ana Oliveira",
    role: "CEO",
    company: "Grupo Educacional Alfa",
    avatar: "AO",
  },
];

export function InstitucionalDepoimentos() {
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
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
            Depoimentos
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-6">
            O que nossos clientes dizem
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Centenas de escolas já transformaram sua gestão. 
            Veja o que elas têm a dizer.
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
              className="relative bg-card rounded-2xl p-8 border border-border/50 shadow-sm"
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
              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-foreground">
                    {testimonial.author}
                  </div>
                  <div className="text-sm text-muted-foreground">
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
          className="mt-16 pt-16 border-t border-border"
        >
          <p className="text-center text-sm text-muted-foreground mb-8">
            Mais de 500 escolas confiam em nossa plataforma
          </p>
          <div className="flex flex-wrap justify-center gap-8 lg:gap-12 opacity-50">
            {[
              "Colégio Alpha",
              "Escola Beta",
              "Instituto Gamma",
              "Rede Delta",
              "Grupo Epsilon",
            ].map((name, index) => (
              <div
                key={index}
                className="text-lg font-bold text-muted-foreground"
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
