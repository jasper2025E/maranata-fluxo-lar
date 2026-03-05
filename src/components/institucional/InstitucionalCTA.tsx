import { Phone, Mail, MapPin } from "lucide-react";

export function InstitucionalCTA() {
  return (
    <section id="contato" className="py-16 lg:py-20 bg-blue-900">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          Garanta a vaga do seu filho
        </h2>
        <p className="text-blue-200 mb-8">
          Entre em contato e agende uma visita ao nosso espaço.
        </p>

        <a
          href="https://wa.me/559898828634?text=Olá! Gostaria de saber mais sobre o Reforço Maranata e agendar uma visita."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-green-600 text-white font-medium px-8 py-3 rounded-md hover:bg-green-700 transition-colors"
        >
          Chamar no WhatsApp
        </a>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-blue-200">
          <span className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            (98) 98828-6034
          </span>
          <span className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            jn.ney@hotmail.com
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Barreirinhas – MA
          </span>
        </div>
      </div>
    </section>
  );
}
