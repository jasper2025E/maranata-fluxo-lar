import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Palette, Eye } from "lucide-react";
import { useUpdateSchoolWebsite, SchoolWebsiteConfig } from "@/hooks/useSchoolWebsite";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WebsiteTheme {
  id: string;
  name: string;
  description: string;
  category: "infantil" | "fundamental" | "tecnico" | "geral";
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  font: string;
  content: {
    hero_title: string;
    hero_subtitle: string;
    hero_cta_primary: string;
    hero_cta_secondary: string;
    hero_badge_text: string;
    about_title: string;
    about_description: string;
    about_features: Array<{ icone: string; titulo: string; descricao: string }>;
    differentials: Array<{ icone: string; titulo: string; descricao: string }>;
    steps: Array<{ numero: number; titulo: string; descricao: string }>;
    contact_title: string;
    contact_subtitle: string;
    prematricula_title: string;
    prematricula_subtitle: string;
  };
}

const themes: WebsiteTheme[] = [
  {
    id: "infantil-alegre",
    name: "Educação Infantil",
    description: "Perfeito para creches e pré-escolas",
    category: "infantil",
    colors: {
      primary: "330 80% 60%",
      secondary: "330 40% 96%",
      accent: "45 93% 47%",
    },
    font: "Poppins",
    content: {
      hero_title: "Onde cada descoberta é uma aventura",
      hero_subtitle: "Educação infantil com amor, cuidado e diversão. Desenvolvemos o potencial único de cada criança em um ambiente seguro e estimulante.",
      hero_cta_primary: "Agendar Visita",
      hero_cta_secondary: "Conhecer a Escola",
      hero_badge_text: "Matrículas Abertas 2025",
      about_title: "Um mundo de descobertas",
      about_description: "Nossa escola oferece um ambiente acolhedor onde cada criança é única. Com metodologia lúdica e equipe especializada, desenvolvemos habilidades cognitivas, sociais e emocionais.",
      about_features: [
        { icone: "Heart", titulo: "Ambiente Acolhedor", descricao: "Espaços pensados para o conforto e segurança das crianças" },
        { icone: "Users", titulo: "Turmas Reduzidas", descricao: "Atenção individualizada para cada aluno" },
        { icone: "Palette", titulo: "Aprendizado Lúdico", descricao: "Brincadeiras educativas que estimulam o desenvolvimento" },
      ],
      differentials: [
        { icone: "Shield", titulo: "Segurança Total", descricao: "Monitoramento 24h e controle de acesso" },
        { icone: "Utensils", titulo: "Alimentação Saudável", descricao: "Cardápio balanceado com nutricionista" },
        { icone: "Clock", titulo: "Horário Flexível", descricao: "Integral, meio período ou horário estendido" },
        { icone: "Music", titulo: "Atividades Extras", descricao: "Música, ballet, judô e inglês" },
      ],
      steps: [
        { numero: 1, titulo: "Agende uma visita", descricao: "Conheça nossa estrutura e metodologia" },
        { numero: 2, titulo: "Converse conosco", descricao: "Tire todas as suas dúvidas" },
        { numero: 3, titulo: "Faça a matrícula", descricao: "Processo simples e rápido" },
      ],
      contact_title: "Venha nos conhecer",
      contact_subtitle: "Agende uma visita e descubra porque somos a escolha certa para seu filho",
      prematricula_title: "Garanta a vaga do seu filho",
      prematricula_subtitle: "Preencha o formulário e nossa equipe entrará em contato",
    },
  },
  {
    id: "fundamental-moderno",
    name: "Ensino Fundamental",
    description: "Ideal para escolas de ensino fundamental",
    category: "fundamental",
    colors: {
      primary: "217 91% 60%",
      secondary: "210 40% 96%",
      accent: "142 76% 36%",
    },
    font: "Inter",
    content: {
      hero_title: "Formando cidadãos para o futuro",
      hero_subtitle: "Ensino de qualidade com foco no desenvolvimento integral do aluno. Preparamos nossos estudantes para os desafios do século XXI.",
      hero_cta_primary: "Matricule-se Agora",
      hero_cta_secondary: "Conheça Nossa Proposta",
      hero_badge_text: "Aprovação Garantida",
      about_title: "Educação que transforma",
      about_description: "Com mais de uma década de experiência, oferecemos ensino fundamental completo com metodologias ativas e tecnologia educacional de ponta.",
      about_features: [
        { icone: "BookOpen", titulo: "Ensino Completo", descricao: "Fundamental I e II com grade curricular atualizada" },
        { icone: "Laptop", titulo: "Tecnologia", descricao: "Laboratório de informática e tablets em sala" },
        { icone: "Trophy", titulo: "Resultados", descricao: "Acima da média em avaliações nacionais" },
      ],
      differentials: [
        { icone: "GraduationCap", titulo: "Corpo Docente", descricao: "Professores especialistas e mestres" },
        { icone: "Target", titulo: "Reforço Escolar", descricao: "Acompanhamento para alunos com dificuldades" },
        { icone: "Globe", titulo: "Idiomas", descricao: "Inglês e espanhol desde o 1º ano" },
        { icone: "Dumbbell", titulo: "Esportes", descricao: "Quadra poliesportiva e diversas modalidades" },
      ],
      steps: [
        { numero: 1, titulo: "Conheça a escola", descricao: "Agende uma visita guiada" },
        { numero: 2, titulo: "Avaliação", descricao: "Processo seletivo simplificado" },
        { numero: 3, titulo: "Bem-vindo!", descricao: "Início das aulas" },
      ],
      contact_title: "Fale Conosco",
      contact_subtitle: "Nossa equipe está pronta para atendê-lo",
      prematricula_title: "Reserve sua vaga",
      prematricula_subtitle: "Vagas limitadas para o próximo ano letivo",
    },
  },
  {
    id: "tecnico-profissional",
    name: "Escola Técnica",
    description: "Para cursos técnicos e profissionalizantes",
    category: "tecnico",
    colors: {
      primary: "220 14% 35%",
      secondary: "220 14% 96%",
      accent: "217 91% 60%",
    },
    font: "Inter",
    content: {
      hero_title: "Sua carreira começa aqui",
      hero_subtitle: "Cursos técnicos reconhecidos pelo MEC com alta taxa de empregabilidade. Formamos profissionais preparados para o mercado de trabalho.",
      hero_cta_primary: "Ver Cursos",
      hero_cta_secondary: "Falar com Consultor",
      hero_badge_text: "95% de Empregabilidade",
      about_title: "Formação profissional de qualidade",
      about_description: "Há mais de 15 anos formando profissionais qualificados. Nossos cursos técnicos são referência na região com parcerias com grandes empresas.",
      about_features: [
        { icone: "Briefcase", titulo: "Mercado de Trabalho", descricao: "Parcerias com empresas para estágio e emprego" },
        { icone: "Award", titulo: "Certificação", descricao: "Diploma reconhecido pelo MEC" },
        { icone: "Wrench", titulo: "Prática", descricao: "Laboratórios equipados com tecnologia atual" },
      ],
      differentials: [
        { icone: "Building", titulo: "Infraestrutura", descricao: "Laboratórios modernos e equipados" },
        { icone: "Users", titulo: "Networking", descricao: "Conexão com profissionais da área" },
        { icone: "TrendingUp", titulo: "Carreira", descricao: "Orientação profissional personalizada" },
        { icone: "Clock", titulo: "Flexibilidade", descricao: "Aulas manhã, tarde ou noite" },
      ],
      steps: [
        { numero: 1, titulo: "Escolha seu curso", descricao: "Analise as opções disponíveis" },
        { numero: 2, titulo: "Faça sua inscrição", descricao: "Processo 100% online" },
        { numero: 3, titulo: "Comece a estudar", descricao: "Turmas com início imediato" },
      ],
      contact_title: "Dúvidas?",
      contact_subtitle: "Nossos consultores estão prontos para ajudar",
      prematricula_title: "Inscreva-se agora",
      prematricula_subtitle: "Processo seletivo simplificado - vagas limitadas",
    },
  },
  {
    id: "colegio-premium",
    name: "Colégio Premium",
    description: "Visual sofisticado para escolas de alto padrão",
    category: "geral",
    colors: {
      primary: "38 92% 40%",
      secondary: "38 40% 96%",
      accent: "222 47% 20%",
    },
    font: "Montserrat",
    content: {
      hero_title: "Excelência em educação",
      hero_subtitle: "Uma tradição de ensino de qualidade que forma líderes e cidadãos preparados para os desafios globais.",
      hero_cta_primary: "Agendar Visita",
      hero_cta_secondary: "Nossa História",
      hero_badge_text: "Tradição desde 1985",
      about_title: "Comprometidos com a excelência",
      about_description: "Oferecemos uma educação completa que desenvolve competências acadêmicas, socioemocionais e culturais em um ambiente de respeito e inovação.",
      about_features: [
        { icone: "Star", titulo: "Tradição", descricao: "Décadas de história formando gerações" },
        { icone: "BookOpen", titulo: "Currículo Completo", descricao: "Da educação infantil ao ensino médio" },
        { icone: "Globe", titulo: "Visão Global", descricao: "Intercâmbios e certificações internacionais" },
      ],
      differentials: [
        { icone: "School", titulo: "Campus Completo", descricao: "Infraestrutura de primeiro mundo" },
        { icone: "Languages", titulo: "Bilíngue", descricao: "Inglês integrado ao currículo" },
        { icone: "Palette", titulo: "Artes", descricao: "Teatro, música e artes visuais" },
        { icone: "Medal", titulo: "Olimpíadas", descricao: "Destaque em competições acadêmicas" },
      ],
      steps: [
        { numero: 1, titulo: "Visita Guiada", descricao: "Conheça nossa estrutura" },
        { numero: 2, titulo: "Entrevista", descricao: "Alinhamento de expectativas" },
        { numero: 3, titulo: "Matrícula", descricao: "Bem-vindo à família" },
      ],
      contact_title: "Entre em Contato",
      contact_subtitle: "Estamos à disposição para atendê-lo",
      prematricula_title: "Faça parte da nossa história",
      prematricula_subtitle: "Preencha o formulário de interesse",
    },
  },
  {
    id: "escola-verde",
    name: "Escola Sustentável",
    description: "Foco em educação ambiental e sustentabilidade",
    category: "geral",
    colors: {
      primary: "142 76% 36%",
      secondary: "142 40% 96%",
      accent: "38 92% 50%",
    },
    font: "Open Sans",
    content: {
      hero_title: "Educação para um futuro sustentável",
      hero_subtitle: "Formamos cidadãos conscientes e comprometidos com o meio ambiente. Aprendizado que conecta a sala de aula com a natureza.",
      hero_cta_primary: "Conhecer Proposta",
      hero_cta_secondary: "Nossos Projetos",
      hero_badge_text: "Escola Verde",
      about_title: "Aprender com a natureza",
      about_description: "Nossa proposta pedagógica integra educação ambiental em todas as disciplinas. Horta escolar, projetos de reciclagem e conexão com a natureza fazem parte do nosso dia a dia.",
      about_features: [
        { icone: "Leaf", titulo: "Educação Ambiental", descricao: "Sustentabilidade integrada ao currículo" },
        { icone: "Sprout", titulo: "Horta Escolar", descricao: "Aprendizado prático e alimentação saudável" },
        { icone: "Recycle", titulo: "Projetos Verdes", descricao: "Reciclagem e consciência ambiental" },
      ],
      differentials: [
        { icone: "Sun", titulo: "Energia Solar", descricao: "Escola 100% sustentável" },
        { icone: "TreePine", titulo: "Área Verde", descricao: "Amplo espaço ao ar livre" },
        { icone: "Apple", titulo: "Alimentação", descricao: "Cardápio orgânico e saudável" },
        { icone: "Bike", titulo: "Mobilidade", descricao: "Incentivo ao transporte sustentável" },
      ],
      steps: [
        { numero: 1, titulo: "Visite-nos", descricao: "Conheça nosso espaço verde" },
        { numero: 2, titulo: "Participe", descricao: "Acompanhe uma aula experimental" },
        { numero: 3, titulo: "Matricule", descricao: "Faça parte da mudança" },
      ],
      contact_title: "Vamos conversar?",
      contact_subtitle: "Venha conhecer nossa proposta pedagógica",
      prematricula_title: "Plante o futuro do seu filho",
      prematricula_subtitle: "Vagas abertas para o próximo semestre",
    },
  },
  {
    id: "escola-tech",
    name: "Escola Tech",
    description: "Tecnologia e inovação no ensino",
    category: "geral",
    colors: {
      primary: "262 83% 58%",
      secondary: "262 40% 96%",
      accent: "174 72% 40%",
    },
    font: "Inter",
    content: {
      hero_title: "Preparando para o futuro digital",
      hero_subtitle: "Metodologias ativas, programação, robótica e pensamento computacional. Formamos os profissionais e inovadores de amanhã.",
      hero_cta_primary: "Explorar Cursos",
      hero_cta_secondary: "Ver Laboratórios",
      hero_badge_text: "Escola do Futuro",
      about_title: "Inovação na educação",
      about_description: "Integramos tecnologia em todo o processo de aprendizagem. Nossos alunos desenvolvem habilidades do século XXI enquanto constroem projetos reais.",
      about_features: [
        { icone: "Code", titulo: "Programação", descricao: "Coding desde os primeiros anos" },
        { icone: "Cpu", titulo: "Robótica", descricao: "Laboratório com kits avançados" },
        { icone: "Gamepad", titulo: "Gamificação", descricao: "Aprendizado através de jogos" },
      ],
      differentials: [
        { icone: "Laptop", titulo: "1:1 Device", descricao: "Um dispositivo por aluno" },
        { icone: "Wifi", titulo: "Conectividade", descricao: "Internet de alta velocidade" },
        { icone: "Lightbulb", titulo: "Maker Space", descricao: "Espaço para criar e inventar" },
        { icone: "Rocket", titulo: "Projetos", descricao: "Aprendizado baseado em projetos" },
      ],
      steps: [
        { numero: 1, titulo: "Demo Day", descricao: "Participe de uma apresentação" },
        { numero: 2, titulo: "Teste", descricao: "Experimente nossas ferramentas" },
        { numero: 3, titulo: "Embarque", descricao: "Comece sua jornada tech" },
      ],
      contact_title: "Conecte-se conosco",
      contact_subtitle: "Fale com nossa equipe de tecnologia educacional",
      prematricula_title: "Inscrição para novos alunos",
      prematricula_subtitle: "Processo seletivo com teste de aptidão",
    },
  },
];

const categories = [
  { id: "todos", label: "Todos" },
  { id: "infantil", label: "Infantil" },
  { id: "fundamental", label: "Fundamental" },
  { id: "tecnico", label: "Técnico" },
  { id: "geral", label: "Geral" },
];

interface WebsiteThemeSelectorProps {
  config: SchoolWebsiteConfig;
}

export function WebsiteThemeSelector({ config }: WebsiteThemeSelectorProps) {
  const updateWebsite = useUpdateSchoolWebsite();
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [previewTheme, setPreviewTheme] = useState<WebsiteTheme | null>(null);

  const filteredThemes = selectedCategory === "todos" 
    ? themes 
    : themes.filter(t => t.category === selectedCategory);

  const getCurrentThemeId = () => {
    const currentPrimary = config.primary_color;
    const match = themes.find(t => t.colors.primary === currentPrimary);
    return match?.id || null;
  };

  const handleApplyTheme = (theme: WebsiteTheme) => {
    updateWebsite.mutate({
      primary_color: theme.colors.primary,
      secondary_color: theme.colors.secondary,
      accent_color: theme.colors.accent,
      font_family: theme.font,
      hero_title: theme.content.hero_title,
      hero_subtitle: theme.content.hero_subtitle,
      hero_cta_primary: theme.content.hero_cta_primary,
      hero_cta_secondary: theme.content.hero_cta_secondary,
      hero_badge_text: theme.content.hero_badge_text,
      about_title: theme.content.about_title,
      about_description: theme.content.about_description,
      about_features: theme.content.about_features,
      differentials: theme.content.differentials,
      steps: theme.content.steps,
      contact_title: theme.content.contact_title,
      contact_subtitle: theme.content.contact_subtitle,
      prematricula_title: theme.content.prematricula_title,
      prematricula_subtitle: theme.content.prematricula_subtitle,
    });
    setPreviewTheme(null);
  };

  const currentThemeId = getCurrentThemeId();

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Palette className="h-4 w-4" />
            Temas Prontos
          </CardTitle>
          <CardDescription className="text-sm">
            Sites completos com cores, textos e estrutura. Personalize depois se desejar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Category Filter */}
          <div className="flex gap-1 border-b">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-3 py-2 text-sm font-medium transition-colors relative",
                  selectedCategory === cat.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {cat.label}
                {selectedCategory === cat.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
                )}
              </button>
            ))}
          </div>

          {/* Themes Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredThemes.map((theme) => {
              const isActive = currentThemeId === theme.id;
              
              return (
                <div
                  key={theme.id}
                  className={cn(
                    "group relative rounded-lg border bg-card overflow-hidden transition-all hover:shadow-md",
                    isActive && "ring-2 ring-primary"
                  )}
                >
                  {/* Theme Preview */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {/* Header bar */}
                    <div 
                      className="h-8 flex items-center justify-between px-3"
                      style={{ backgroundColor: `hsl(${theme.colors.primary})` }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-white/20" />
                        <div className="h-1.5 w-10 rounded-full bg-white/40" />
                      </div>
                      <div className="flex gap-1">
                        <div className="h-1.5 w-6 rounded-full bg-white/30" />
                        <div className="h-1.5 w-6 rounded-full bg-white/30" />
                      </div>
                    </div>
                    
                    {/* Hero section */}
                    <div 
                      className="h-14 flex flex-col items-center justify-center px-3"
                      style={{ backgroundColor: `hsl(${theme.colors.secondary})` }}
                    >
                      <div 
                        className="h-2 w-20 rounded-full mb-1"
                        style={{ backgroundColor: `hsl(${theme.colors.primary})` }}
                      />
                      <div className="h-1 w-28 rounded-full bg-muted-foreground/20" />
                    </div>
                    
                    {/* Content cards */}
                    <div className="h-10 bg-background flex items-center justify-center gap-1.5 px-2">
                      {[1, 2, 3].map((i) => (
                        <div 
                          key={i}
                          className="flex-1 h-6 rounded border"
                          style={{ 
                            backgroundColor: `hsl(${theme.colors.secondary})`,
                            borderColor: `hsl(${theme.colors.primary} / 0.2)`
                          }}
                        />
                      ))}
                    </div>

                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute top-1.5 right-1.5">
                        <div className="flex items-center gap-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                          <Check className="h-2.5 w-2.5" />
                          Ativo
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Theme Info */}
                  <div className="p-3 space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{theme.name}</span>
                        <div className="flex -space-x-1">
                          <div 
                            className="w-3.5 h-3.5 rounded-full border-2 border-background"
                            style={{ backgroundColor: `hsl(${theme.colors.primary})` }}
                          />
                          <div 
                            className="w-3.5 h-3.5 rounded-full border-2 border-background"
                            style={{ backgroundColor: `hsl(${theme.colors.secondary})` }}
                          />
                          <div 
                            className="w-3.5 h-3.5 rounded-full border-2 border-background"
                            style={{ backgroundColor: `hsl(${theme.colors.accent})` }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {theme.description}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => setPreviewTheme(theme)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver conteúdo
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => handleApplyTheme(theme)}
                        disabled={updateWebsite.isPending || isActive}
                      >
                        {isActive ? "Aplicado" : "Aplicar"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {updateWebsite.isPending && (
            <p className="text-center text-sm text-muted-foreground">
              Aplicando tema...
            </p>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewTheme} onOpenChange={() => setPreviewTheme(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewTheme?.name}</DialogTitle>
            <DialogDescription>
              Conteúdo que será aplicado ao seu site
            </DialogDescription>
          </DialogHeader>

          {previewTheme && (
            <div className="space-y-6 py-4">
              {/* Colors */}
              <div>
                <h4 className="text-sm font-medium mb-2">Paleta de cores</h4>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-lg border"
                      style={{ backgroundColor: `hsl(${previewTheme.colors.primary})` }}
                    />
                    <span className="text-xs text-muted-foreground">Primária</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-lg border"
                      style={{ backgroundColor: `hsl(${previewTheme.colors.secondary})` }}
                    />
                    <span className="text-xs text-muted-foreground">Secundária</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-lg border"
                      style={{ backgroundColor: `hsl(${previewTheme.colors.accent})` }}
                    />
                    <span className="text-xs text-muted-foreground">Destaque</span>
                  </div>
                </div>
              </div>

              {/* Hero */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Seção Hero</h4>
                <div className="rounded-lg border p-4 bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Badge</p>
                  <p className="text-sm mb-3">{previewTheme.content.hero_badge_text}</p>
                  <p className="text-xs text-muted-foreground mb-1">Título</p>
                  <p className="font-semibold mb-3">{previewTheme.content.hero_title}</p>
                  <p className="text-xs text-muted-foreground mb-1">Subtítulo</p>
                  <p className="text-sm text-muted-foreground">{previewTheme.content.hero_subtitle}</p>
                </div>
              </div>

              {/* About */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Seção Sobre</h4>
                <div className="rounded-lg border p-4 bg-muted/50">
                  <p className="font-medium mb-2">{previewTheme.content.about_title}</p>
                  <p className="text-sm text-muted-foreground mb-3">{previewTheme.content.about_description}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {previewTheme.content.about_features.map((f, i) => (
                      <div key={i} className="text-xs p-2 rounded bg-background">
                        <p className="font-medium">{f.titulo}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Differentials */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Diferenciais ({previewTheme.content.differentials.length})</h4>
                <div className="grid grid-cols-2 gap-2">
                  {previewTheme.content.differentials.map((d, i) => (
                    <div key={i} className="text-xs p-2 rounded border bg-background">
                      <p className="font-medium">{d.titulo}</p>
                      <p className="text-muted-foreground">{d.descricao}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewTheme(null)}>
              Fechar
            </Button>
            <Button 
              onClick={() => previewTheme && handleApplyTheme(previewTheme)}
              disabled={updateWebsite.isPending}
            >
              Aplicar este tema
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
