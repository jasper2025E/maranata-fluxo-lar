export function InstitucionalCTA() {
  return (
    <section id="contato" className="inst-cta-pattern py-16 lg:py-20 text-center" style={{ background: "var(--inst-primary)" }}>
      <div className="max-w-[600px] mx-auto px-8 relative z-10">
        <h3
          className="text-2xl sm:text-3xl lg:text-[2.5rem] font-semibold text-white mb-4"
          style={{ fontFamily: "'Crimson Text', serif" }}
        >
          Garanta a vaga do seu filho
        </h3>
        <p className="text-white/80 text-lg mb-8">
          Entre em contato e agende uma visita. Conheça nosso espaço e veja como podemos ajudar.
        </p>
        <a
          href="https://wa.me/559898828634?text=Olá! Gostaria de saber mais sobre o Reforço Maranata e agendar uma visita."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-10 py-4 font-bold uppercase tracking-wider border-2 rounded-lg transition-all hover:bg-transparent hover:shadow-lg"
          style={{
            background: "var(--inst-secondary)",
            color: "var(--inst-primary-dark)",
            borderColor: "var(--inst-secondary)",
          }}
        >
          Chamar no WhatsApp
        </a>
      </div>
    </section>
  );
}
