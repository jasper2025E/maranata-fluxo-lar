import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Save, 
  Eye, 
  Palette, 
  Type, 
  Image, 
  Phone, 
  Mail, 
  MapPin,
  RotateCcw,
  Loader2,
  ExternalLink
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface LandingPageConfig {
  hero: {
    titulo: string;
    subtitulo: string;
    ctaPrimario: string;
    ctaSecundario: string;
    imagemUrl?: string;
  };
  sobre: {
    titulo: string;
    descricao: string;
    cards: Array<{
      icone: string;
      titulo: string;
      descricao: string;
    }>;
  };
  comoFunciona: {
    titulo: string;
    passos: Array<{
      numero: number;
      titulo: string;
      descricao: string;
    }>;
  };
  planos: {
    titulo: string;
    subtitulo: string;
  };
  inscricao: {
    titulo: string;
    subtitulo: string;
  };
  footer: {
    telefone: string;
    email: string;
    endereco: string;
  };
  cores: {
    primaria: string;
    secundaria: string;
    destaque: string;
  };
}

const defaultConfig: LandingPageConfig = {
  hero: {
    titulo: "Educação de Qualidade para o Futuro",
    subtitulo: "O Sistema Maranata oferece ensino completo com gestão moderna, acompanhamento pedagógico e comunicação eficiente entre escola e família.",
    ctaPrimario: "Inscrever Aluno",
    ctaSecundario: "Ver Planos",
  },
  sobre: {
    titulo: "Por que escolher o Maranata?",
    descricao: "Uma plataforma educacional completa que conecta alunos, responsáveis e educadores em um único ambiente.",
    cards: [
      { icone: "GraduationCap", titulo: "Ensino de Qualidade", descricao: "Metodologia moderna e professores qualificados para o melhor desenvolvimento do seu filho." },
      { icone: "Users", titulo: "Acompanhamento Familiar", descricao: "Portal exclusivo para responsáveis acompanharem o progresso acadêmico em tempo real." },
      { icone: "Shield", titulo: "Ambiente Seguro", descricao: "Instalações modernas com total segurança e monitoramento para tranquilidade da família." },
      { icone: "LineChart", titulo: "Gestão Transparente", descricao: "Faturas, pagamentos e comunicados acessíveis de forma clara e organizada." }
    ]
  },
  comoFunciona: {
    titulo: "Como Funciona a Matrícula",
    passos: [
      { numero: 1, titulo: "Faça sua Inscrição", descricao: "Preencha o formulário com seus dados de responsável." },
      { numero: 2, titulo: "Cadastre os Alunos", descricao: "Adicione as informações dos alunos que deseja matricular." },
      { numero: 3, titulo: "Escolha o Curso", descricao: "Selecione o curso adequado para cada aluno." },
      { numero: 4, titulo: "Realize o Pagamento", descricao: "Finalize com pagamento seguro via cartão ou PIX." },
      { numero: 5, titulo: "Matrícula Confirmada", descricao: "Receba a confirmação e acesse o portal do responsável." }
    ]
  },
  planos: {
    titulo: "Nossos Cursos",
    subtitulo: "Escolha o curso ideal para o desenvolvimento do seu filho"
  },
  inscricao: {
    titulo: "Faça sua Inscrição",
    subtitulo: "Preencha o formulário abaixo para iniciar a matrícula"
  },
  footer: {
    telefone: "(11) 99999-9999",
    email: "contato@maranata.edu.br",
    endereco: "Av. Principal, 1000 - Centro"
  },
  cores: {
    primaria: "hsl(222.2 47.4% 11.2%)",
    secundaria: "hsl(210 40% 96.1%)",
    destaque: "hsl(210 40% 96.1%)"
  }
};

export function LandingPageEditor() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("hero");

  // Fetch config from database
  const { data: configData, isLoading } = useQuery({
    queryKey: ["landing-page-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_config")
        .select("*")
        .eq("chave", "landing_page_config")
        .maybeSingle();
      
      if (error) throw error;
      return data?.valor as unknown as LandingPageConfig | null;
    },
  });

  const [config, setConfig] = useState<LandingPageConfig>(defaultConfig);

  // Update local state when data loads
  useState(() => {
    if (configData) {
      setConfig(configData);
    }
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (newConfig: LandingPageConfig) => {
      const { data: existing } = await supabase
        .from("marketing_config")
        .select("id")
        .eq("chave", "landing_page_config")
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("marketing_config")
          .update({ valor: JSON.parse(JSON.stringify(newConfig)) })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("marketing_config")
          .insert({
            chave: "landing_page_config",
            valor: newConfig as unknown as Record<string, unknown>,
            descricao: "Configurações da Landing Page",
          } as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["landing-page-config"] });
      toast.success("Landing page salva com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao salvar: " + error.message);
    },
  });

  // Update config when data loads
  if (configData && JSON.stringify(configData) !== JSON.stringify(config)) {
    setConfig(configData);
  }

  const handleSave = () => {
    saveMutation.mutate(config);
  };

  const handleReset = () => {
    setConfig(defaultConfig);
    toast.info("Configurações restauradas para o padrão");
  };

  const updateHero = (field: keyof LandingPageConfig["hero"], value: string) => {
    setConfig(prev => ({
      ...prev,
      hero: { ...prev.hero, [field]: value }
    }));
  };

  const updateSobre = (field: keyof LandingPageConfig["sobre"], value: string) => {
    setConfig(prev => ({
      ...prev,
      sobre: { ...prev.sobre, [field]: value }
    }));
  };

  const updateSobreCard = (index: number, field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      sobre: {
        ...prev.sobre,
        cards: prev.sobre.cards.map((card, i) => 
          i === index ? { ...card, [field]: value } : card
        )
      }
    }));
  };

  const updateComoFunciona = (field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      comoFunciona: { ...prev.comoFunciona, [field]: value }
    }));
  };

  const updatePasso = (index: number, field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      comoFunciona: {
        ...prev.comoFunciona,
        passos: prev.comoFunciona.passos.map((passo, i) => 
          i === index ? { ...passo, [field]: value } : passo
        )
      }
    }));
  };

  const updatePlanos = (field: keyof LandingPageConfig["planos"], value: string) => {
    setConfig(prev => ({
      ...prev,
      planos: { ...prev.planos, [field]: value }
    }));
  };

  const updateInscricao = (field: keyof LandingPageConfig["inscricao"], value: string) => {
    setConfig(prev => ({
      ...prev,
      inscricao: { ...prev.inscricao, [field]: value }
    }));
  };

  const updateFooter = (field: keyof LandingPageConfig["footer"], value: string) => {
    setConfig(prev => ({
      ...prev,
      footer: { ...prev.footer, [field]: value }
    }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Editor da Landing Page
            </CardTitle>
            <CardDescription>
              Personalize textos, cores e conteúdo da página de inscrição
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/inscricao" target="_blank" rel="noopener noreferrer">
                <Eye className="h-4 w-4 mr-2" />
                Visualizar
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="sobre">Sobre</TabsTrigger>
            <TabsTrigger value="passos">Passos</TabsTrigger>
            <TabsTrigger value="planos">Planos</TabsTrigger>
            <TabsTrigger value="inscricao">Inscrição</TabsTrigger>
            <TabsTrigger value="footer">Rodapé</TabsTrigger>
          </TabsList>

          {/* Hero Section */}
          <TabsContent value="hero" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="hero-titulo">
                <Type className="h-4 w-4 inline mr-2" />
                Título Principal
              </Label>
              <Input
                id="hero-titulo"
                value={config.hero.titulo}
                onChange={(e) => updateHero("titulo", e.target.value)}
                placeholder="Título principal da landing page"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hero-subtitulo">Subtítulo</Label>
              <Textarea
                id="hero-subtitulo"
                value={config.hero.subtitulo}
                onChange={(e) => updateHero("subtitulo", e.target.value)}
                placeholder="Descrição do sistema"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hero-cta1">Botão Primário</Label>
                <Input
                  id="hero-cta1"
                  value={config.hero.ctaPrimario}
                  onChange={(e) => updateHero("ctaPrimario", e.target.value)}
                  placeholder="Texto do botão principal"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hero-cta2">Botão Secundário</Label>
                <Input
                  id="hero-cta2"
                  value={config.hero.ctaSecundario}
                  onChange={(e) => updateHero("ctaSecundario", e.target.value)}
                  placeholder="Texto do botão secundário"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hero-imagem">
                <Image className="h-4 w-4 inline mr-2" />
                URL da Imagem (opcional)
              </Label>
              <Input
                id="hero-imagem"
                value={config.hero.imagemUrl || ""}
                onChange={(e) => updateHero("imagemUrl", e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>
          </TabsContent>

          {/* Sobre Section */}
          <TabsContent value="sobre" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="sobre-titulo">Título da Seção</Label>
              <Input
                id="sobre-titulo"
                value={config.sobre.titulo}
                onChange={(e) => updateSobre("titulo", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sobre-descricao">Descrição</Label>
              <Textarea
                id="sobre-descricao"
                value={config.sobre.descricao}
                onChange={(e) => updateSobre("descricao", e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-4">
              <Label>Cards de Benefícios</Label>
              {config.sobre.cards.map((card, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Card {index + 1}
                      </span>
                    </div>
                    <Input
                      value={card.titulo}
                      onChange={(e) => updateSobreCard(index, "titulo", e.target.value)}
                      placeholder="Título do card"
                    />
                    <Textarea
                      value={card.descricao}
                      onChange={(e) => updateSobreCard(index, "descricao", e.target.value)}
                      placeholder="Descrição do card"
                      rows={2}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Passos Section */}
          <TabsContent value="passos" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="passos-titulo">Título da Seção</Label>
              <Input
                id="passos-titulo"
                value={config.comoFunciona.titulo}
                onChange={(e) => updateComoFunciona("titulo", e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <Label>Passos do Processo</Label>
              {config.comoFunciona.passos.map((passo, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        {passo.numero}
                      </div>
                      <span className="text-sm font-medium">Passo {passo.numero}</span>
                    </div>
                    <Input
                      value={passo.titulo}
                      onChange={(e) => updatePasso(index, "titulo", e.target.value)}
                      placeholder="Título do passo"
                    />
                    <Textarea
                      value={passo.descricao}
                      onChange={(e) => updatePasso(index, "descricao", e.target.value)}
                      placeholder="Descrição do passo"
                      rows={2}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Planos Section */}
          <TabsContent value="planos" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="planos-titulo">Título da Seção</Label>
              <Input
                id="planos-titulo"
                value={config.planos.titulo}
                onChange={(e) => updatePlanos("titulo", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="planos-subtitulo">Subtítulo</Label>
              <Input
                id="planos-subtitulo"
                value={config.planos.subtitulo}
                onChange={(e) => updatePlanos("subtitulo", e.target.value)}
              />
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Os cursos e valores são carregados automaticamente do cadastro de cursos.
                Para editar, acesse a página de Cursos.
              </p>
            </div>
          </TabsContent>

          {/* Inscrição Section */}
          <TabsContent value="inscricao" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="inscricao-titulo">Título da Seção</Label>
              <Input
                id="inscricao-titulo"
                value={config.inscricao.titulo}
                onChange={(e) => updateInscricao("titulo", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inscricao-subtitulo">Subtítulo</Label>
              <Input
                id="inscricao-subtitulo"
                value={config.inscricao.subtitulo}
                onChange={(e) => updateInscricao("subtitulo", e.target.value)}
              />
            </div>
          </TabsContent>

          {/* Footer Section */}
          <TabsContent value="footer" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="footer-telefone">
                <Phone className="h-4 w-4 inline mr-2" />
                Telefone
              </Label>
              <Input
                id="footer-telefone"
                value={config.footer.telefone}
                onChange={(e) => updateFooter("telefone", e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="footer-email">
                <Mail className="h-4 w-4 inline mr-2" />
                E-mail
              </Label>
              <Input
                id="footer-email"
                value={config.footer.email}
                onChange={(e) => updateFooter("email", e.target.value)}
                placeholder="contato@escola.com.br"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="footer-endereco">
                <MapPin className="h-4 w-4 inline mr-2" />
                Endereço
              </Label>
              <Input
                id="footer-endereco"
                value={config.footer.endereco}
                onChange={(e) => updateFooter("endereco", e.target.value)}
                placeholder="Rua, número - Bairro"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
