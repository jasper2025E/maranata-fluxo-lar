import { CheckCircle2 } from "lucide-react";
import type { LandingConfig } from "@/pages/LandingPage";

interface LandingComoFuncionaProps {
  config: LandingConfig;
}

export function LandingComoFunciona({ config }: LandingComoFuncionaProps) {
  return (
    <section id="como-funciona" className="py-20 bg-background">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {config.como_funciona.titulo}
          </h2>
          <p className="text-lg text-muted-foreground">
            Processo simples e rápido para matricular seu filho
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Timeline line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-primary/20 -translate-x-1/2 hidden md:block" />

          <div className="space-y-8">
            {config.como_funciona.passos.map((passo, index) => (
              <div 
                key={index}
                className={`relative flex flex-col md:flex-row items-start gap-4 md:gap-8 ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Number circle */}
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 z-10 hidden md:flex">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-lg">
                    {passo.numero}
                  </div>
                </div>

                {/* Content card */}
                <div className={`flex-1 ${index % 2 === 0 ? 'md:pr-16 md:text-right' : 'md:pl-16 md:text-left'}`}>
                  <div className="bg-card rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold md:hidden">
                        {passo.numero}
                      </div>
                      <h3 className="text-xl font-semibold text-foreground">
                        {passo.titulo}
                      </h3>
                    </div>
                    <p className="text-muted-foreground">
                      {passo.descricao}
                    </p>
                  </div>
                </div>

                {/* Spacer for alternating layout */}
                <div className="flex-1 hidden md:block" />
              </div>
            ))}
          </div>

          {/* Final success indicator */}
          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-600 px-6 py-3 rounded-full">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Aluno matriculado com sucesso!</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
