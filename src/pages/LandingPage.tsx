import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingSobre } from "@/components/landing/LandingSobre";
import { LandingDiferenciais } from "@/components/landing/LandingDiferenciais";
import { LandingEstrutura } from "@/components/landing/LandingEstrutura";
import { LandingComoFunciona } from "@/components/landing/LandingComoFunciona";
import { LandingPlanos } from "@/components/landing/LandingPlanos";
import { LandingDepoimentos } from "@/components/landing/LandingDepoimentos";
import { LandingCTA } from "@/components/landing/LandingCTA";
import { LandingContato } from "@/components/landing/LandingContato";
import { LandingInscricao } from "@/components/landing/LandingInscricao";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingPixels } from "@/components/landing/LandingPixels";
import { useEscola } from "@/hooks/useEscola";
import { useCursos } from "@/hooks/useCursos";

export interface LandingConfig {
  escola: {
    nome: string;
    logo_url: string | null;
    telefone: string | null;
    email: string | null;
    endereco: string | null;
  };
  hero: {
    titulo: string;
    subtitulo: string;
    cta_primario: string;
    cta_secundario: string;
    imagem_fundo?: string;
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
  como_funciona: {
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
  cores: {
    primaria: string;
    secundaria: string;
    accent: string;
  };
}

const defaultConfig: LandingConfig = {
  escola: {
    nome: "Maranata",
    logo_url: null,
    telefone: null,
    email: null,
    endereco: null,
  },
  hero: {
    titulo: "Educação de qualidade para o futuro do seu filho",
    subtitulo: "Sistema educacional completo com acompanhamento personalizado, materiais didáticos modernos e infraestrutura de excelência.",
    cta_primario: "Inscrever Aluno",
    cta_secundario: "Ver Planos",
  },
  sobre: {
    titulo: "Sobre Nossa Instituição",
    descricao: "Somos uma instituição comprometida com a excelência educacional, oferecendo um ambiente de aprendizado inovador e acolhedor.",
    cards: [
      {
        icone: "GraduationCap",
        titulo: "Ensino de Qualidade",
        descricao: "Metodologia moderna com professores qualificados e materiais didáticos atualizados.",
      },
      {
        icone: "Users",
        titulo: "Acompanhamento Individual",
        descricao: "Cada aluno recebe atenção personalizada para desenvolver seu máximo potencial.",
      },
      {
        icone: "Shield",
        titulo: "Ambiente Seguro",
        descricao: "Infraestrutura completa com segurança e conforto para toda a família.",
      },
      {
        icone: "LineChart",
        titulo: "Resultados Comprovados",
        descricao: "Alto índice de aprovação e desenvolvimento integral dos nossos alunos.",
      },
    ],
  },
  como_funciona: {
    titulo: "Como Funciona",
    passos: [
      {
        numero: 1,
        titulo: "Faça sua Inscrição",
        descricao: "Preencha o formulário com seus dados de responsável.",
      },
      {
        numero: 2,
        titulo: "Cadastre seus Filhos",
        descricao: "Adicione as informações dos alunos que deseja matricular.",
      },
      {
        numero: 3,
        titulo: "Escolha o Plano",
        descricao: "Selecione o curso e forma de pagamento ideal para você.",
      },
      {
        numero: 4,
        titulo: "Realize o Pagamento",
        descricao: "Pague com cartão, PIX ou boleto de forma segura.",
      },
      {
        numero: 5,
        titulo: "Matrícula Ativada",
        descricao: "Pronto! O acesso é liberado automaticamente após confirmação.",
      },
    ],
  },
  planos: {
    titulo: "Nossos Planos",
    subtitulo: "Escolha o melhor plano para a educação do seu filho",
  },
  inscricao: {
    titulo: "Inscreva-se Agora",
    subtitulo: "Preencha o formulário abaixo para iniciar a matrícula",
  },
  cores: {
    primaria: "217 91% 60%",
    secundaria: "142 76% 36%",
    accent: "45 93% 47%",
  },
};

export default function LandingPage() {
  const [searchParams] = useSearchParams();
  const { data: escola } = useEscola();
  const { data: cursos } = useCursos();
  const [config, setConfig] = useState<LandingConfig>(defaultConfig);

  // UTM params for tracking
  const utmParams = {
    source: searchParams.get("utm_source"),
    medium: searchParams.get("utm_medium"),
    campaign: searchParams.get("utm_campaign"),
    term: searchParams.get("utm_term"),
    content: searchParams.get("utm_content"),
  };

  // Merge escola data
  useEffect(() => {
    if (escola) {
      setConfig(prev => ({
        ...prev,
        escola: {
          nome: escola.nome || prev.escola.nome,
          logo_url: escola.logo_url,
          telefone: escola.telefone,
          email: escola.email,
          endereco: escola.endereco,
        },
      }));
    }
  }, [escola]);

  // Filter active courses for plans
  const cursosAtivos = (cursos || []) as Array<{
    id: string;
    nome: string;
    nivel: string;
    mensalidade: number;
    duracao_meses: number;
    ativo: boolean;
  }>;

  const cursosPublicos = cursosAtivos.filter(c => c.ativo);

  return (
    <div className="min-h-screen bg-background">
      <LandingPixels utmParams={utmParams} />
      
      {/* Fixed Navbar */}
      <LandingNavbar config={config} />
      
      {/* Hero Section */}
      <div id="hero">
        <LandingHero config={config} />
      </div>
      
      {/* About Section */}
      <LandingSobre config={config} />
      
      {/* Differentials Section */}
      <LandingDiferenciais config={config} />
      
      {/* Infrastructure Section */}
      <LandingEstrutura config={config} />
      
      {/* How it Works */}
      <LandingComoFunciona config={config} />
      
      {/* Plans Section */}
      <LandingPlanos config={config} cursos={cursosPublicos} />
      
      {/* Testimonials */}
      <LandingDepoimentos config={config} />
      
      {/* CTA Banner */}
      <LandingCTA config={config} />
      
      {/* Contact Section */}
      <LandingContato config={config} />
      
      {/* Enrollment Form */}
      <LandingInscricao config={config} cursos={cursosPublicos} tenantId={cursos?.[0]?.tenant_id} utmParams={utmParams} />
      
      {/* Footer */}
      <LandingFooter config={config} />
    </div>
  );
}
