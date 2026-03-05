import { motion } from "framer-motion";

export function InstitucionalCTA() {
  return (
    <section id="contato" className="py-20 bg-[#f8fafc]">
      <div className="max-w-[1200px] mx-auto px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-[30px] p-10 lg:p-16 max-w-[800px] mx-auto shadow-[0_20px_60px_rgba(30,136,229,0.15)] relative overflow-hidden text-center before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[5px] before:bg-gradient-to-r before:from-[#1e88e5] before:via-[#f57c00] before:to-[#ffc107]"
        >
          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0d47a1] mb-4 font-[Quicksand]">
            Garanta a vaga do seu filho no Reforço Maranata!
          </h3>
          <p className="text-[#607d8b] text-lg mb-8">
            Entre em contato pelo WhatsApp e agende uma visita. Conheça nosso espaço 
            em Barreirinhas e veja como podemos ajudar seu filho a ir melhor na escola.
          </p>
          <a
            href="https://wa.me/559898828634?text=Olá! Gostaria de saber mais sobre o Reforço Maranata e agendar uma visita."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-extrabold text-lg px-14 py-5 rounded-full shadow-[0_10px_30px_rgba(37,211,102,0.3)] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(37,211,102,0.4)] transition-all"
          >
            Chamar no WhatsApp 📱
          </a>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-[#607d8b]">
            <span>📞 (98) 98828-6034</span>
            <span className="hidden sm:inline">•</span>
            <span>✉️ jn.ney@hotmail.com</span>
            <span className="hidden sm:inline">•</span>
            <span>📍 Barreirinhas - MA</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
