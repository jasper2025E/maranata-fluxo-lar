import { PreMatriculaForm } from "../PreMatriculaForm";

interface PreMatriculaBlockProps {
  content: {
    title?: string;
    subtitle?: string;
  };
  settings: {
    fields?: string[];
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  tenantId: string;
}

export function PreMatriculaBlock({ content, settings, colors, tenantId }: PreMatriculaBlockProps) {
  const fields = settings.fields || ["nome_aluno", "nome_responsavel", "email", "telefone"];
  
  return (
    <section className="py-16 md:py-24 bg-muted/50">
      <div className="container max-w-xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 
            className="text-2xl md:text-4xl font-bold mb-4"
            style={{ color: `hsl(${colors.primary})` }}
          >
            {content.title || "Inscreva-se Agora"}
          </h2>
          {content.subtitle && (
            <p className="text-muted-foreground">{content.subtitle}</p>
          )}
        </div>
        
        <div className="bg-background p-6 md:p-8 rounded-xl shadow-sm border">
          <PreMatriculaForm
            tenantId={tenantId}
            primaryColor={`hsl(${colors.primary})`}
            fields={fields}
          />
        </div>
      </div>
    </section>
  );
}
