import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Quote } from "lucide-react";
import type { LandingConfig } from "@/pages/LandingPage";

interface LandingDepoimentosProps {
  config: LandingConfig;
}

const depoimentos = [
  {
    nome: "Maria Silva",
    cargo: "Mãe do João, 8 anos",
    avatar: "",
    depoimento: "A evolução do meu filho foi incrível. A equipe é muito atenciosa e o método de ensino realmente funciona. Recomendo a todos os pais!",
    rating: 5,
  },
  {
    nome: "Carlos Santos",
    cargo: "Pai da Ana, 10 anos",
    avatar: "",
    depoimento: "A escola oferece uma educação completa. Minha filha desenvolveu não só academicamente, mas também suas habilidades sociais e emocionais.",
    rating: 5,
  },
  {
    nome: "Patrícia Oliveira",
    cargo: "Mãe do Pedro, 6 anos",
    avatar: "",
    depoimento: "O carinho e profissionalismo da equipe fazem toda a diferença. Meu filho ama ir para a escola todos os dias!",
    rating: 5,
  },
  {
    nome: "Roberto Ferreira",
    cargo: "Pai da Laura, 12 anos",
    avatar: "",
    depoimento: "A preparação para o futuro é excelente. Minha filha está muito bem preparada para os desafios que virão.",
    rating: 5,
  },
];

export function LandingDepoimentos({ config }: LandingDepoimentosProps) {
  return (
    <section id="depoimentos" className="py-20 bg-background">
      <div className="container px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
            Depoimentos
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            O que dizem sobre nós
          </h2>
          <p className="text-lg text-muted-foreground">
            A satisfação das famílias é nosso maior reconhecimento
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {depoimentos.map((item, index) => (
            <Card
              key={index}
              className="border bg-card hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={item.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {item.nome.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                      <Quote className="h-3 w-3 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: item.rating }).map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      "{item.depoimento}"
                    </p>
                    <div>
                      <p className="font-semibold text-foreground text-sm">
                        {item.nome}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.cargo}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
