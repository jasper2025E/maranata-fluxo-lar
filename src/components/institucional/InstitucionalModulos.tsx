import { motion } from "framer-motion";
import { Heart, Users, Target, Clock } from "lucide-react";

const values = [
  {
    icon: Heart,
    title: "Compromisso com o Aluno",
    description: "Cada aluno é único. Trabalhamos com dedicação para entender suas necessidades e oferecer o suporte certo para o seu desenvolvimento.",
  },
  {
    icon: Users,
    title: "Turmas Reduzidas",
    description: "Com turmas menores, garantimos atenção individualizada, permitindo que cada aluno tire suas dúvidas e avance no seu ritmo.",
  },
  {
    icon: Target,
    title: "Foco em Resultados",
    description: "Nosso método é direcionado para a melhoria concreta das notas e do desempenho escolar, com acompanhamento contínuo.",
  },
  {
    icon: Clock,
    title: "Horários Flexíveis",
    description: "Entendemos a rotina das famílias. Oferecemos horários adaptáveis para facilitar o dia a dia de pais e alunos.",
  },
];

const fadeIn = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

export function InstitucionalModulos() {
  return (
    <section id="sobre" className="py-24 lg:py-32 bg-[hsl(40,30%,97%)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-amber-600 font-semibold text-sm mb-3 uppercase tracking-[0.15em]">
            Sobre a Escola
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[hsl(220,25%,12%)] tracking-tight mb-5">
            Por que escolher a Maranata?
          </h2>
          <p className="text-[hsl(220,10%,45%)] text-lg max-w-2xl mx-auto leading-relaxed">
            Somos mais do que um reforço escolar. Somos parceiros na jornada educacional 
            do seu filho, oferecendo estrutura, método e acolhimento.
          </p>
        </motion.div>

        {/* Values grid */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {values.map((v, i) => (
            <motion.div
              key={i}
              variants={fadeIn}
              className="group bg-white rounded-2xl p-7 border border-[hsl(40,20%,90%)] hover:border-amber-200 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300"
            >
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 flex items-center justify-center mb-5 group-hover:from-amber-100 group-hover:to-orange-100 transition-colors">
                <v.icon className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-[hsl(220,25%,12%)] mb-2">{v.title}</h3>
              <p className="text-sm text-[hsl(220,10%,50%)] leading-relaxed">{v.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* About text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-20 max-w-3xl mx-auto text-center"
        >
          <p className="text-[hsl(220,10%,40%)] text-base leading-relaxed">
            A <strong className="text-[hsl(220,25%,12%)]">Escola Maranata</strong> nasceu 
            da vontade de fazer a diferença na educação. Com uma equipe dedicada de 
            professores e um ambiente acolhedor, ajudamos crianças e adolescentes a 
            superar suas dificuldades escolares e alcançar todo o seu potencial 
            acadêmico. Acreditamos que cada aluno pode brilhar quando recebe o 
            apoio certo.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
