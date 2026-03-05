import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const depoimentos = [
  {
    name: "Maria Santos",
    role: "Diretora",
    school: "Escola Vida Nova",
    text: "O Maranata transformou a gestão financeira da nossa escola. Antes, perdíamos horas com planilhas. Agora, tudo é automático e transparente.",
    rating: 5,
  },
  {
    name: "Carlos Oliveira",
    role: "Coordenador Financeiro",
    school: "Colégio Esperança",
    text: "Reduzimos a inadimplência em 35% nos primeiros 3 meses. Os relatórios são claros e nos ajudam a tomar decisões melhores.",
    rating: 5,
  },
  {
    name: "Ana Ferreira",
    role: "Proprietária",
    school: "Centro Educacional Futuro",
    text: "Interface linda e fácil de usar. Minha equipe adotou o sistema rapidamente. O suporte é excelente, sempre prontos a ajudar.",
    rating: 5,
  },
];

export function InstitucionalDepoimentos() {
  return (
    <section id="depoimentos" className="py-20 lg:py-28 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-primary font-medium text-sm mb-3 uppercase tracking-wider">Depoimentos</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight mb-4">
            O que dizem nossos clientes
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Escolas de todo o Brasil já confiam no Maranata para gerenciar suas operações.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {depoimentos.map((d, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-shadow relative"
            >
              <Quote className="h-8 w-8 text-primary/20 absolute top-6 right-6" />
              
              <div className="flex gap-1 mb-4">
                {Array.from({ length: d.rating }).map((_, s) => (
                  <Star key={s} className="h-4 w-4 fill-warning text-warning" />
                ))}
              </div>

              <p className="text-foreground leading-relaxed mb-6 italic">"{d.text}"</p>
              
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="h-10 w-10 rounded-full gradient-luz-mina flex items-center justify-center text-white font-bold text-sm">
                  {d.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.role} — {d.school}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
