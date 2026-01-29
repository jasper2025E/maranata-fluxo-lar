import { User, Mail, Phone, GraduationCap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PortalResponsavel, PortalAluno } from "@/hooks/usePortalResponsavel";

interface ResponsavelInfoProps {
  responsavel: PortalResponsavel;
  alunos: PortalAluno[];
  onVoltar: () => void;
  primaryColor?: string;
}

export function ResponsavelInfo({
  responsavel,
  alunos,
  onVoltar,
  primaryColor,
}: ResponsavelInfoProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-4 sm:p-6">
        {/* Header com botão voltar */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-semibold"
              style={{ backgroundColor: primaryColor || "hsl(var(--primary))" }}
            >
              {responsavel.nome.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold">Olá, {responsavel.nome.split(" ")[0]}!</h2>
              <p className="text-sm text-muted-foreground">
                Seus dados e faturas estão abaixo
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onVoltar} className="shrink-0">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Nova consulta
          </Button>
        </div>

        {/* Dados do responsável */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
          {responsavel.email_parcial && (
            <div className="flex items-center gap-1.5">
              <Mail className="h-4 w-4" />
              {responsavel.email_parcial}
            </div>
          )}
          {responsavel.telefone_parcial && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-4 w-4" />
              {responsavel.telefone_parcial}
            </div>
          )}
        </div>

        {/* Alunos vinculados */}
        {alunos.length > 0 && (
          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Alunos Vinculados
            </h3>
            <div className="flex flex-wrap gap-2">
              {alunos.map((aluno, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50"
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{aluno.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {aluno.curso}
                      {aluno.nivel && ` - ${aluno.nivel}`}
                    </p>
                  </div>
                  {aluno.status === "pendente" && (
                    <Badge variant="outline" className="text-xs">
                      Pré-matrícula
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
