import { motion } from "framer-motion";

export function InstitucionalHero() {
  return (
    <section id="inicio" className="relative bg-gradient-to-br from-[#1e88e5] to-[#0d47a1] py-20 lg:py-24 overflow-hidden">
      {/* Blob shape */}
      <div className="absolute -top-[100px] -right-[100px] w-[500px] h-[500px] bg-white/5 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] animate-[morph_8s_ease-in-out_infinite] z-0" />

      <div className="max-w-[1200px] mx-auto px-8 relative z-[1]">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-16 items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-block bg-[#ffc107] text-[#0d47a1] px-6 py-2 rounded-full font-extrabold text-sm mb-6 shadow-md animate-pulse">
              ⭐ A melhor avaliação da região
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-[3.2rem] font-bold text-white mb-6 leading-[1.2] font-[Quicksand] tracking-tight">
              Aprendizado que{" "}
              <span className="relative inline-block text-[#ffc107]">
                transforma
                <span className="absolute bottom-[5px] left-0 w-full h-2 bg-[rgba(255,193,7,0.3)] rounded -z-[1]" />
              </span>{" "}
              resultados
            </h2>

            <p className="text-xl text-white/90 mb-10 leading-relaxed max-w-[90%]">
              Reforço escolar personalizado para alunos do Ensino Fundamental e Médio. 
              Metodologia lúdica, professores especializados e acompanhamento individual 
              que faz a diferença no desenvolvimento do seu filho.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#contato"
                className="inline-block bg-[#ffc107] text-[#0d47a1] px-10 py-4 font-extrabold rounded-full shadow-[0_6px_20px_rgba(0,0,0,0.2)] hover:bg-white hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-all text-center"
              >
                Começar Agora
              </a>
              <a
                href="#metodologia"
                className="inline-block bg-transparent text-white px-10 py-4 font-bold rounded-full border-[3px] border-white/50 hover:bg-white hover:text-[#0d47a1] hover:border-white hover:-translate-y-1 transition-all text-center"
              >
                Conhecer Metodologia
              </a>
            </div>
          </motion.div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex justify-center items-center"
          >
            {/* Rotating dashed circle */}
            <div className="w-[300px] h-[300px] lg:w-[450px] lg:h-[450px] bg-white/10 rounded-full border-4 border-dashed border-white/20 animate-[spin_20s_linear_infinite]" />

            {/* Center photo */}
            <div className="absolute w-[250px] h-[250px] lg:w-[380px] lg:h-[380px] bg-white rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.2)] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=600&fit=crop"
                alt="Criança estudando feliz"
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>

            {/* Floating icons */}
            <div className="absolute top-[10%] left-[10%] bg-white rounded-full w-[60px] h-[60px] flex items-center justify-center text-3xl shadow-[0_8px_20px_rgba(0,0,0,0.15)] animate-bounce">📚</div>
            <div className="absolute top-[20%] right-[5%] bg-white rounded-full w-[60px] h-[60px] flex items-center justify-center text-3xl shadow-[0_8px_20px_rgba(0,0,0,0.15)] animate-bounce [animation-delay:0.5s]">✏️</div>
            <div className="absolute bottom-[20%] left-[5%] bg-white rounded-full w-[60px] h-[60px] flex items-center justify-center text-3xl shadow-[0_8px_20px_rgba(0,0,0,0.15)] animate-bounce [animation-delay:1s]">🎨</div>
            <div className="absolute bottom-[10%] right-[15%] bg-white rounded-full w-[60px] h-[60px] flex items-center justify-center text-3xl shadow-[0_8px_20px_rgba(0,0,0,0.15)] animate-bounce [animation-delay:1.5s]">🧮</div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
