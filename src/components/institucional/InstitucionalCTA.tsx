import { ArrowRight, Phone, Mail, MapPin } from "lucide-react";

export function InstitucionalCTA() {
  return (
    <section id="contato" className="py-20 bg-[#f8fafc]">
      <div className="max-w-[700px] mx-auto px-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#0d47a1] mb-3 font-[Quicksand]">
          Garanta a vaga do seu filho
        </h2>
        <p className="text-[#607d8b] text-lg mb-8">
          Entre em contato e agende uma visita. Conheça nosso espaço 
          e veja como podemos ajudar.
        </p>

        <a
          href="https://wa.me/559898828634?text=Olá! Gostaria de saber mais sobre o Reforço Maranata e agendar uma visita."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#25D366] text-white font-bold text-lg px-10 py-4 rounded-lg hover:bg-[#1ebe5d] transition-colors"
        >
          Chamar no WhatsApp
          <ArrowRight className="h-5 w-5" />
        </a>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-[#607d8b]">
          <span className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-[#1e88e5]" />
            (98) 98828-6034
          </span>
          <span className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-[#1e88e5]" />
            jn.ney@hotmail.com
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#1e88e5]" />
            Barreirinhas - MA
          </span>
        </div>
      </div>
    </section>
  );
}
