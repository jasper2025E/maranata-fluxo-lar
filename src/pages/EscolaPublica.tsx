import { useParams } from "react-router-dom";
import { useSchoolWebsiteBySlug } from "@/hooks/useSchoolWebsite";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  Building2, Phone, Facebook, Instagram, Youtube, Linkedin, Twitter, 
  User, ChevronLeft, ChevronRight, Heart, Users, Palette, Shield, 
  Utensils, Clock, Music, BookOpen, Laptop, Trophy, GraduationCap,
  Target, Globe, Dumbbell, Star, School, Medal, Briefcase, Award,
  Wrench, TrendingUp, Leaf, Sprout, Recycle, Sun, TreePine, Apple,
  Bike, Code, Cpu, Gamepad, Wifi, Lightbulb, Rocket, MessageCircle
} from "lucide-react";
import { useState } from "react";
import NotFound from "./NotFound";
import { PreMatriculaForm } from "@/components/website/PreMatriculaForm";

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Heart, Users, Palette, Shield, Utensils, Clock, Music, BookOpen,
  Laptop, Trophy, GraduationCap, Target, Globe, Dumbbell, Star, School,
  Medal, Briefcase, Award, Wrench, TrendingUp, Leaf, Sprout, Recycle,
  Sun, TreePine, Apple, Bike, Code, Cpu, Gamepad, Wifi, Lightbulb, Rocket,
  MessageCircle, Building2, Phone
};

export default function EscolaPublica() {
  const { slug } = useParams<{ slug: string }>();
  const { data: website, isLoading, error } = useSchoolWebsiteBySlug(slug || "");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <Skeleton className="h-64 w-full mb-6" />
          <Skeleton className="h-48 w-full mb-6" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error || !website || !website.enabled) {
    return <NotFound />;
  }

  const socialIcons = {
    facebook: Facebook,
    instagram: Instagram,
    youtube: Youtube,
    linkedin: Linkedin,
    twitter: Twitter,
  };

  const galleryImages = website.gallery_images || [];
  const testimonials = website.testimonials || [];
  const aboutFeatures = website.about_features || [];
  const differentials = website.differentials || [];
  const steps = website.steps || [];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || Star;
  };

  return (
    <div 
      className="min-h-screen"
      style={{ fontFamily: website.font_family || 'Inter, system-ui, sans-serif' }}
    >
      {/* Navigation */}
      <nav 
        className="sticky top-0 z-50 border-b backdrop-blur-sm"
        style={{ backgroundColor: `hsl(${website.primary_color} / 0.95)` }}
      >
        <div className="container max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="font-semibold text-white">{website.hero_title?.split(' ').slice(0, 3).join(' ') || 'Escola'}</span>
          <div className="hidden md:flex items-center gap-6">
            <a href="#sobre" className="text-sm text-white/80 hover:text-white transition">Sobre</a>
            {differentials.length > 0 && (
              <a href="#diferenciais" className="text-sm text-white/80 hover:text-white transition">Diferenciais</a>
            )}
            {galleryImages.length > 0 && (
              <a href="#galeria" className="text-sm text-white/80 hover:text-white transition">Galeria</a>
            )}
            <a href="#contato" className="text-sm text-white/80 hover:text-white transition">Contato</a>
            {website.prematricula_enabled && (
              <Button 
                size="sm"
                variant="secondary"
                onClick={() => document.getElementById('prematricula')?.scrollIntoView({ behavior: 'smooth' })}
              >
                {website.hero_cta_primary}
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        className="relative min-h-[500px] md:min-h-[600px] flex items-center justify-center text-white"
        style={{
          background: website.hero_background_url 
            ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${website.hero_background_url})`
            : `linear-gradient(135deg, hsl(${website.primary_color}) 0%, hsl(${website.secondary_color}) 100%)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="container max-w-4xl mx-auto px-4 text-center relative z-10">
          {website.hero_badge_text && (
            <div 
              className="inline-block mb-6 px-4 py-1.5 rounded-full text-sm font-medium"
              style={{ backgroundColor: `hsl(${website.accent_color})` }}
            >
              {website.hero_badge_text}
            </div>
          )}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            {website.hero_title}
          </h1>
          {website.hero_subtitle && (
            <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              {website.hero_subtitle}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {website.prematricula_enabled && (
              <Button 
                size="lg" 
                className="text-base px-8"
                onClick={() => document.getElementById('prematricula')?.scrollIntoView({ behavior: 'smooth' })}
              >
                {website.hero_cta_primary}
              </Button>
            )}
            <Button 
              size="lg" 
              variant="outline" 
              className="text-base px-8 border-white text-white hover:bg-white/10 hover:text-white"
              onClick={() => document.getElementById('sobre')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {website.hero_cta_secondary}
            </Button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="sobre" className="py-16 md:py-24 bg-muted/50">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 
              className="text-2xl md:text-4xl font-bold mb-4"
              style={{ color: `hsl(${website.primary_color})` }}
            >
              {website.about_title}
            </h2>
            {website.about_description && (
              <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
                {website.about_description}
              </p>
            )}
          </div>

          {/* About Features */}
          {aboutFeatures.length > 0 && (
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              {aboutFeatures.map((feature, index) => {
                const Icon = getIcon(feature.icone);
                return (
                  <div 
                    key={index}
                    className="bg-background rounded-xl p-6 text-center shadow-sm border"
                  >
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
                      style={{ backgroundColor: `hsl(${website.primary_color} / 0.1)` }}
                    >
                      <Icon 
                        className="h-7 w-7" 
                        style={{ color: `hsl(${website.primary_color})` }}
                      />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.titulo}</h3>
                    <p className="text-muted-foreground text-sm">{feature.descricao}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Differentials Section */}
      {differentials.length > 0 && (
        <section id="diferenciais" className="py-16 md:py-24">
          <div className="container max-w-6xl mx-auto px-4">
            <h2 
              className="text-2xl md:text-4xl font-bold text-center mb-12"
              style={{ color: `hsl(${website.primary_color})` }}
            >
              Nossos Diferenciais
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {differentials.map((diff, index) => {
                const Icon = getIcon(diff.icone);
                return (
                  <div 
                    key={index}
                    className="group p-6 rounded-xl border bg-background hover:shadow-md transition-shadow"
                  >
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                      style={{ backgroundColor: `hsl(${website.primary_color} / 0.1)` }}
                    >
                      <Icon 
                        className="h-6 w-6" 
                        style={{ color: `hsl(${website.primary_color})` }}
                      />
                    </div>
                    <h3 className="font-semibold mb-2">{diff.titulo}</h3>
                    <p className="text-sm text-muted-foreground">{diff.descricao}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Steps Section */}
      {steps.length > 0 && (
        <section className="py-16 md:py-24 bg-muted/50">
          <div className="container max-w-4xl mx-auto px-4">
            <h2 
              className="text-2xl md:text-4xl font-bold text-center mb-12"
              style={{ color: `hsl(${website.primary_color})` }}
            >
              Como Funciona
            </h2>
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div 
                  key={index}
                  className="flex gap-4 items-start"
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold"
                    style={{ backgroundColor: `hsl(${website.primary_color})` }}
                  >
                    {step.numero}
                  </div>
                  <div className="pt-1">
                    <h3 className="font-semibold mb-1">{step.titulo}</h3>
                    <p className="text-muted-foreground">{step.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Gallery Section */}
      {galleryImages.length > 0 && (
        <section id="galeria" className="py-16 md:py-24">
          <div className="container max-w-6xl mx-auto px-4">
            <h2 
              className="text-2xl md:text-4xl font-bold text-center mb-12"
              style={{ color: `hsl(${website.primary_color})` }}
            >
              Nossa Estrutura
            </h2>
            <div className="relative max-w-4xl mx-auto">
              <div className="aspect-video rounded-xl overflow-hidden bg-muted">
                <img
                  src={galleryImages[currentImageIndex]?.url}
                  alt={galleryImages[currentImageIndex]?.caption || ""}
                  className="w-full h-full object-cover"
                />
              </div>
              {galleryImages[currentImageIndex]?.caption && (
                <p className="text-center mt-4 text-muted-foreground">
                  {galleryImages[currentImageIndex].caption}
                </p>
              )}
              {galleryImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-background transition"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-background transition"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="flex justify-center gap-2 mt-4">
                    {galleryImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className="h-2 w-2 rounded-full transition"
                        style={{ 
                          backgroundColor: index === currentImageIndex 
                            ? `hsl(${website.primary_color})` 
                            : 'hsl(var(--muted-foreground) / 0.3)'
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
        <section id="depoimentos" className="py-16 md:py-24 bg-muted/50">
          <div className="container max-w-6xl mx-auto px-4">
            <h2 
              className="text-2xl md:text-4xl font-bold text-center mb-12"
              style={{ color: `hsl(${website.primary_color})` }}
            >
              O que dizem sobre nós
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="bg-background p-6 rounded-xl shadow-sm border"
                >
                  <p className="text-muted-foreground mb-4 italic leading-relaxed">
                    "{testimonial.texto}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
                      {testimonial.foto_url ? (
                        <img
                          src={testimonial.foto_url}
                          alt={testimonial.nome}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{testimonial.nome}</p>
                      {testimonial.cargo && (
                        <p className="text-xs text-muted-foreground">{testimonial.cargo}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      <section id="contato" className="py-16 md:py-24">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 
              className="text-2xl md:text-4xl font-bold mb-4"
              style={{ color: `hsl(${website.primary_color})` }}
            >
              {website.contact_title}
            </h2>
            {website.contact_subtitle && (
              <p className="text-muted-foreground text-lg">{website.contact_subtitle}</p>
            )}
          </div>
          
          {website.whatsapp_number && (
            <div className="max-w-md mx-auto">
              <a 
                href={`https://wa.me/${website.whatsapp_number.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-6 rounded-xl border bg-background hover:shadow-md transition-shadow"
              >
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `hsl(${website.primary_color} / 0.1)` }}
                >
                  <MessageCircle 
                    className="h-6 w-6" 
                    style={{ color: `hsl(${website.primary_color})` }}
                  />
                </div>
                <div>
                  <p className="font-semibold">WhatsApp</p>
                  <p className="text-sm text-muted-foreground">Clique para conversar</p>
                </div>
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Pre-Registration Section */}
      {website.prematricula_enabled && (
        <section id="prematricula" className="py-16 md:py-24 bg-muted/50">
          <div className="container max-w-xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 
                className="text-2xl md:text-4xl font-bold mb-4"
                style={{ color: `hsl(${website.primary_color})` }}
              >
                {website.prematricula_title}
              </h2>
              {website.prematricula_subtitle && (
                <p className="text-muted-foreground">{website.prematricula_subtitle}</p>
              )}
            </div>
            <div className="bg-background p-6 md:p-8 rounded-xl shadow-sm border">
              <PreMatriculaForm 
                tenantId={website.tenant_id}
                primaryColor={website.primary_color}
                fields={website.prematricula_fields || ["nome_aluno", "nome_responsavel", "email", "telefone"]}
              />
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer 
        className="py-8 text-white"
        style={{ backgroundColor: `hsl(${website.primary_color})` }}
      >
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5" />
              <span className="text-sm opacity-90">{website.footer_text || "Instituição de Ensino"}</span>
            </div>
            
            {website.social_links && Object.keys(website.social_links).length > 0 && (
              <div className="flex gap-3">
                {Object.entries(website.social_links).map(([platform, url]) => {
                  if (!url) return null;
                  const Icon = socialIcons[platform as keyof typeof socialIcons];
                  if (!Icon) return null;
                  return (
                    <a 
                      key={platform}
                      href={url as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 w-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
          {website.show_powered_by && (
            <p className="text-center text-xs opacity-60 mt-6">
              Powered by Maranata Sistema de Gestão Escolar
            </p>
          )}
        </div>
      </footer>

      {/* Tracking Scripts */}
      {website.facebook_pixel_id && (
        <script dangerouslySetInnerHTML={{ __html: `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${website.facebook_pixel_id}');
          fbq('track', 'PageView');
        `}} />
      )}
    </div>
  );
}
