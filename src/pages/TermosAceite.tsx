import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLegalDocuments, useAcceptLegalDocument } from "@/hooks/useLegalDocuments";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, FileText, Download, ShieldCheck, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

function formatCpfCnpj(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function isValidCpfCnpj(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length === 11 || digits.length === 14;
}

export default function TermosAceite() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { documents, pendingDocuments, termsLoading } = useLegalDocuments();
  const acceptMutation = useAcceptLegalDocument();

  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const docsToShow = pendingDocuments.length > 0 ? pendingDocuments : documents;

  const allChecked = useMemo(
    () => docsToShow.length > 0 && docsToShow.every((d) => checkedDocs[d.id]),
    [docsToShow, checkedDocs]
  );

  const canSubmit =
    allChecked &&
    nomeCompleto.trim().length >= 3 &&
    isValidCpfCnpj(cpfCnpj) &&
    !submitting;

  useEffect(() => {
    if (!termsLoading && docsToShow.length === 0) {
      navigate("/dashboard", { replace: true });
    }
  }, [termsLoading, docsToShow.length, navigate]);

  async function handleAcceptAll() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      for (const doc of docsToShow) {
        await acceptMutation.mutateAsync({
          documentId: doc.id,
          documentVersion: doc.version,
          documentHash: doc.content_hash,
          userName: nomeCompleto.trim(),
          userCpfCnpj: cpfCnpj.replace(/\D/g, ""),
        });
      }
      toast({
        title: "Termos aceitos com sucesso",
        description: "Seus aceites foram registrados. Você já pode acessar o sistema.",
      });
      // Small delay to ensure query cache is updated before navigation
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    } catch (err: any) {
      toast({
        title: "Erro ao registrar aceite",
        description: err.message || "Tente novamente.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  }

  function handleDownloadPdf() {
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    let y = 20;

    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("Comprovante de Aceite de Termos Legais", pageW / 2, y, { align: "center" });
    y += 12;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    const now = new Date().toLocaleString("pt-BR");
    const info = [
      `Nome: ${nomeCompleto || "—"}`,
      `E-mail: ${user?.email || "—"}`,
      `CPF/CNPJ: ${cpfCnpj || "—"}`,
      `Data/Hora: ${now}`,
    ];
    info.forEach((line) => {
      pdf.text(line, 15, y);
      y += 6;
    });
    y += 4;

    pdf.setDrawColor(200);
    pdf.line(15, y, pageW - 15, y);
    y += 8;

    for (const doc of docsToShow) {
      if (y > 260) { pdf.addPage(); y = 20; }
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text(`${doc.title} (${doc.version})`, 15, y);
      y += 6;
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Hash: ${doc.content_hash}`, 15, y);
      y += 5;
      pdf.text(`Vigência: ${new Date(doc.effective_date).toLocaleDateString("pt-BR")}`, 15, y);
      y += 8;

      pdf.setFontSize(9);
      const plainText = doc.content.replace(/[#*|]/g, "").replace(/\n{2,}/g, "\n");
      const lines = pdf.splitTextToSize(plainText, pageW - 30);
      for (const line of lines) {
        if (y > 280) { pdf.addPage(); y = 20; }
        pdf.text(line, 15, y);
        y += 4;
      }
      y += 6;
    }

    pdf.save(`aceite-termos-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  if (termsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (docsToShow.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <header className="border-b bg-background px-4 py-4 sm:px-8">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <ShieldCheck className="h-7 w-7 text-primary shrink-0" />
          <div>
            <h1 className="text-lg font-bold text-foreground">Aceite de Termos e Políticas</h1>
            <p className="text-sm text-muted-foreground">
              Leia e aceite os documentos abaixo para continuar usando o sistema.
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-6 sm:px-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Documents */}
          <Accordion type="multiple" className="space-y-3">
            {docsToShow.map((doc) => (
              <AccordionItem
                key={doc.id}
                value={doc.id}
                className="border rounded-xl bg-background shadow-sm overflow-hidden"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <span className="font-semibold text-sm">{doc.title}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({doc.version} — {new Date(doc.effective_date).toLocaleDateString("pt-BR")})
                      </span>
                    </div>
                    {checkedDocs[doc.id] && (
                      <CheckCircle2 className="h-4 w-4 text-primary ml-auto mr-2 shrink-0" />
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-0 pb-0">
                  <ScrollArea className="h-64 border-t">
                    <div className="px-5 py-4 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed font-mono">
                      {doc.content}
                    </div>
                  </ScrollArea>
                  <div className="px-4 py-3 border-t bg-muted/20 flex items-center gap-3">
                    <Checkbox
                      id={`check-${doc.id}`}
                      checked={!!checkedDocs[doc.id]}
                      onCheckedChange={(v) =>
                        setCheckedDocs((prev) => ({ ...prev, [doc.id]: !!v }))
                      }
                    />
                    <Label htmlFor={`check-${doc.id}`} className="text-sm cursor-pointer select-none">
                      Li e concordo com o <strong>{doc.title}</strong> ({doc.version})
                    </Label>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Identification */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Identificação para Registro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nome">Nome completo *</Label>
                  <Input
                    id="nome"
                    placeholder="Seu nome completo"
                    value={nomeCompleto}
                    onChange={(e) => setNomeCompleto(e.target.value)}
                    maxLength={200}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cpfcnpj">CPF ou CNPJ *</Label>
                  <Input
                    id="cpfcnpj"
                    placeholder="000.000.000-00"
                    value={cpfCnpj}
                    onChange={(e) => setCpfCnpj(formatCpfCnpj(e.target.value))}
                    maxLength={18}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                E-mail registrado: <strong>{user?.email}</strong>
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleAcceptAll}
              disabled={!canSubmit}
              className="flex-1"
              size="lg"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ShieldCheck className="h-4 w-4 mr-2" />
              )}
              Aceitar Todos os Termos
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadPdf}
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Cópia (PDF)
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground pb-8">
            Ao aceitar, seus dados (nome, e-mail, CPF/CNPJ, IP, data/hora e versão do documento)
            serão registrados para fins de auditoria conforme a LGPD.
          </p>
        </div>
      </main>
    </div>
  );
}
