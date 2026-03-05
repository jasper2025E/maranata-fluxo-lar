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
            Pronto para transformar a vida escolar do seu filho?
          </h3>
          <p className="text-[#607d8b] text-lg mb-8">
            Agende uma aula experimental gratuita e conheça nossa metodologia sem compromisso. 
            Vamos juntos construir um futuro de sucesso!
          </p>
          <a
            href="https://www.instagram.com/reforcomaranatabhs/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-gradient-to-r from-[#f57c00] to-[#ff9800] text-white font-extrabold text-lg px-14 py-5 rounded-full shadow-[0_10px_30px_rgba(245,124,0,0.3)] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(245,124,0,0.4)] transition-all"
          >
            Quero Agendar Minha Aula Grátis 🚀
          </a>
          <p className="mt-6 text-sm text-[#607d8b]">
            📞 Ou ligue agora: (31) 99999-9999
          </p>
        </motion.div>
      </div>
    </section>
  );
}
