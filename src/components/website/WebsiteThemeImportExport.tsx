import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, FileArchive, Check, AlertCircle } from "lucide-react";
import { useUpdateSchoolWebsite, SchoolWebsiteConfig } from "@/hooks/useSchoolWebsite";
import { toast } from "sonner";
import JSZip from "jszip";
import { saveAs } from "file-saver";

interface WebsiteThemeImportExportProps {
  config: SchoolWebsiteConfig;
}

interface ThemeManifest {
  name: string;
  version: string;
  author: string;
  description: string;
  created_at: string;
  format: "maranata-theme-v1";
}

interface ThemeData {
  manifest: ThemeManifest;
  colors: {
    primary_color: string;
    secondary_color: string;
    accent_color: string;
  };
  typography: {
    font_family: string;
  };
  content: {
    hero_title: string | null;
    hero_subtitle: string | null;
    hero_cta_primary: string;
    hero_cta_secondary: string;
    hero_badge_text: string;
    about_title: string;
    about_description: string | null;
    about_features: Array<{ icone: string; titulo: string; descricao: string }>;
    differentials: Array<{ icone: string; titulo: string; descricao: string }>;
    steps: Array<{ numero: number; titulo: string; descricao: string }>;
    contact_title: string;
    contact_subtitle: string | null;
    prematricula_title: string;
    prematricula_subtitle: string | null;
    footer_text: string | null;
  };
}

export function WebsiteThemeImportExport({ config }: WebsiteThemeImportExportProps) {
  const updateWebsite = useUpdateSchoolWebsite();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importedTheme, setImportedTheme] = useState<ThemeData | null>(null);
  const [themeName, setThemeName] = useState("meu-tema");

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const zip = new JSZip();

      // Create theme data
      const themeData: ThemeData = {
        manifest: {
          name: themeName || "Tema Personalizado",
          version: "1.0.0",
          author: "Escola",
          description: "Tema exportado do Site Escolar",
          created_at: new Date().toISOString(),
          format: "maranata-theme-v1",
        },
        colors: {
          primary_color: config.primary_color,
          secondary_color: config.secondary_color,
          accent_color: config.accent_color,
        },
        typography: {
          font_family: config.font_family,
        },
        content: {
          hero_title: config.hero_title,
          hero_subtitle: config.hero_subtitle,
          hero_cta_primary: config.hero_cta_primary,
          hero_cta_secondary: config.hero_cta_secondary,
          hero_badge_text: config.hero_badge_text,
          about_title: config.about_title,
          about_description: config.about_description,
          about_features: config.about_features || [],
          differentials: config.differentials || [],
          steps: config.steps || [],
          contact_title: config.contact_title,
          contact_subtitle: config.contact_subtitle,
          prematricula_title: config.prematricula_title,
          prematricula_subtitle: config.prematricula_subtitle,
          footer_text: config.footer_text,
        },
      };

      // Add theme.json
      zip.file("theme.json", JSON.stringify(themeData, null, 2));

      // Add README
      const readme = `# ${themeData.manifest.name}

Tema para Site Escolar Maranata

## Versão
${themeData.manifest.version}

## Descrição
${themeData.manifest.description}

## Como usar
1. Acesse o editor do Site Escolar
2. Vá na aba "Temas"
3. Clique em "Importar Tema"
4. Selecione este arquivo .zip

## Formato
Este tema segue o formato Maranata Theme v1.

## Cores
- Primária: hsl(${themeData.colors.primary_color})
- Secundária: hsl(${themeData.colors.secondary_color})
- Destaque: hsl(${themeData.colors.accent_color})

## Fonte
${themeData.typography.font_family}

---
Exportado em: ${new Date().toLocaleDateString('pt-BR')}
`;
      zip.file("README.md", readme);

      // Generate and download
      const content = await zip.generateAsync({ type: "blob" });
      const fileName = `${themeName.toLowerCase().replace(/\s+/g, "-")}-theme.zip`;
      saveAs(content, fileName);

      toast.success("Tema exportado com sucesso!");
    } catch (error) {
      console.error("Error exporting theme:", error);
      toast.error("Erro ao exportar tema");
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".zip")) {
      toast.error("Selecione um arquivo .zip válido");
      return;
    }

    setIsImporting(true);
    try {
      const zip = await JSZip.loadAsync(file);
      const themeFile = zip.file("theme.json");

      if (!themeFile) {
        toast.error("Arquivo theme.json não encontrado no .zip");
        return;
      }

      const themeContent = await themeFile.async("string");
      const themeData = JSON.parse(themeContent) as ThemeData;

      // Validate format
      if (themeData.manifest?.format !== "maranata-theme-v1") {
        toast.error("Formato de tema não suportado");
        return;
      }

      setImportedTheme(themeData);
      toast.success(`Tema "${themeData.manifest.name}" carregado`);
    } catch (error) {
      console.error("Error importing theme:", error);
      toast.error("Erro ao ler arquivo do tema");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleApplyImportedTheme = () => {
    if (!importedTheme) return;

    updateWebsite.mutate({
      primary_color: importedTheme.colors.primary_color,
      secondary_color: importedTheme.colors.secondary_color,
      accent_color: importedTheme.colors.accent_color,
      font_family: importedTheme.typography.font_family,
      hero_title: importedTheme.content.hero_title,
      hero_subtitle: importedTheme.content.hero_subtitle,
      hero_cta_primary: importedTheme.content.hero_cta_primary,
      hero_cta_secondary: importedTheme.content.hero_cta_secondary,
      hero_badge_text: importedTheme.content.hero_badge_text,
      about_title: importedTheme.content.about_title,
      about_description: importedTheme.content.about_description,
      about_features: importedTheme.content.about_features,
      differentials: importedTheme.content.differentials,
      steps: importedTheme.content.steps,
      contact_title: importedTheme.content.contact_title,
      contact_subtitle: importedTheme.content.contact_subtitle,
      prematricula_title: importedTheme.content.prematricula_title,
      prematricula_subtitle: importedTheme.content.prematricula_subtitle,
      footer_text: importedTheme.content.footer_text,
    });

    setImportedTheme(null);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Export */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Download className="h-4 w-4" />
            Exportar Tema
          </CardTitle>
          <CardDescription className="text-sm">
            Baixe seu tema atual em formato .zip
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme-name">Nome do tema</Label>
            <Input
              id="theme-name"
              value={themeName}
              onChange={(e) => setThemeName(e.target.value)}
              placeholder="meu-tema"
            />
          </div>
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            className="w-full"
          >
            <FileArchive className="h-4 w-4 mr-2" />
            {isExporting ? "Exportando..." : "Exportar .zip"}
          </Button>
        </CardContent>
      </Card>

      {/* Import */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Upload className="h-4 w-4" />
            Importar Tema
          </CardTitle>
          <CardDescription className="text-sm">
            Importe um tema em formato .zip
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {!importedTheme ? (
            <Button 
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isImporting ? "Carregando..." : "Selecionar arquivo .zip"}
            </Button>
          ) : (
            <div className="space-y-4">
              {/* Theme Preview */}
              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{importedTheme.manifest.name}</p>
                    <p className="text-xs text-muted-foreground">
                      v{importedTheme.manifest.version} • {importedTheme.manifest.format}
                    </p>
                  </div>
                </div>
                
                {/* Colors preview */}
                <div className="flex gap-1 mt-3">
                  <div 
                    className="w-6 h-6 rounded-full border"
                    style={{ backgroundColor: `hsl(${importedTheme.colors.primary_color})` }}
                    title="Primária"
                  />
                  <div 
                    className="w-6 h-6 rounded-full border"
                    style={{ backgroundColor: `hsl(${importedTheme.colors.secondary_color})` }}
                    title="Secundária"
                  />
                  <div 
                    className="w-6 h-6 rounded-full border"
                    style={{ backgroundColor: `hsl(${importedTheme.colors.accent_color})` }}
                    title="Destaque"
                  />
                  <span className="text-xs text-muted-foreground ml-2 self-center">
                    {importedTheme.typography.font_family}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => setImportedTheme(null)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  size="sm"
                  onClick={handleApplyImportedTheme}
                  disabled={updateWebsite.isPending}
                  className="flex-1"
                >
                  Aplicar tema
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span>Aceita arquivos .zip no formato Maranata Theme v1</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
