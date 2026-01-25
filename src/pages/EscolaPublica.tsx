 import { useParams } from "react-router-dom";
 import { useSchoolWebsiteBySlug } from "@/hooks/useSchoolWebsite";
 import { Skeleton } from "@/components/ui/skeleton";
 import { Button } from "@/components/ui/button";
 import { Building2, Phone, Mail, MapPin, Facebook, Instagram, Youtube, Linkedin, Twitter } from "lucide-react";
 import { motion } from "framer-motion";
 import NotFound from "./NotFound";
 
 export default function EscolaPublica() {
   const { slug } = useParams<{ slug: string }>();
   const { data: website, isLoading, error } = useSchoolWebsiteBySlug(slug || "");
 
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
 
   return (
     <div className="min-h-screen" style={{
       backgroundColor: 'hsl(var(--background))',
       color: 'hsl(var(--foreground))',
       fontFamily: website.font_family || 'inherit',
     }}>
       {/* Hero Section */}
       <section 
         className="relative min-h-[600px] flex items-center justify-center text-white"
         style={{
           backgroundImage: website.hero_background_url 
             ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${website.hero_background_url})`
             : `linear-gradient(135deg, ${website.primary_color}, ${website.secondary_color})`,
           backgroundSize: 'cover',
           backgroundPosition: 'center',
         }}
       >
         <div className="container max-w-6xl mx-auto px-4 text-center relative z-10">
           {website.hero_badge_text && (
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="inline-block mb-4 px-4 py-2 rounded-full text-sm font-medium"
               style={{ backgroundColor: website.accent_color, color: 'white' }}
             >
               {website.hero_badge_text}
             </motion.div>
           )}
           <motion.h1
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
             className="text-4xl md:text-6xl font-bold mb-4"
           >
             {website.hero_title}
           </motion.h1>
           {website.hero_subtitle && (
             <motion.p
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="text-xl md:text-2xl mb-8 opacity-90"
             >
               {website.hero_subtitle}
             </motion.p>
           )}
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.3 }}
             className="flex flex-col sm:flex-row gap-4 justify-center"
           >
             {website.prematricula_enabled && (
               <Button 
                 size="lg" 
                 className="text-lg px-8"
                 style={{ backgroundColor: website.primary_color }}
                 onClick={() => document.getElementById('prematricula')?.scrollIntoView({ behavior: 'smooth' })}
               >
                 {website.hero_cta_primary}
               </Button>
             )}
             <Button 
               size="lg" 
               variant="outline" 
               className="text-lg px-8 border-white text-white hover:bg-white/10"
               onClick={() => document.getElementById('sobre')?.scrollIntoView({ behavior: 'smooth' })}
             >
               {website.hero_cta_secondary}
             </Button>
           </motion.div>
         </div>
       </section>
 
       {/* About Section */}
       {website.about_description && (
         <section id="sobre" className="py-20" style={{ backgroundColor: 'hsl(var(--muted))' }}>
           <div className="container max-w-6xl mx-auto px-4">
             <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ color: website.primary_color }}>
               {website.about_title}
             </h2>
             <p className="text-lg text-center max-w-3xl mx-auto" style={{ color: 'hsl(var(--foreground))' }}>
               {website.about_description}
             </p>
           </div>
         </section>
       )}
 
       {/* Contact Section */}
       <section id="contato" className="py-20">
         <div className="container max-w-6xl mx-auto px-4">
           <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: website.primary_color }}>
             {website.contact_title}
           </h2>
           {website.contact_subtitle && (
             <p className="text-lg text-center mb-12 text-muted-foreground">{website.contact_subtitle}</p>
           )}
           
           <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
             {website.whatsapp_number && (
               <div className="flex items-center gap-4 p-6 rounded-xl" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                 <Phone className="h-6 w-6" style={{ color: website.primary_color }} />
                 <div>
                   <p className="font-semibold">WhatsApp</p>
                   <p className="text-muted-foreground">{website.whatsapp_number}</p>
                 </div>
               </div>
             )}
           </div>
         </div>
       </section>
 
       {/* Pre-Registration Section */}
       {website.prematricula_enabled && (
         <section id="prematricula" className="py-20" style={{ backgroundColor: 'hsl(var(--muted))' }}>
           <div className="container max-w-2xl mx-auto px-4">
             <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: website.primary_color }}>
               {website.prematricula_title}
             </h2>
             {website.prematricula_subtitle && (
               <p className="text-lg text-center mb-8 text-muted-foreground">{website.prematricula_subtitle}</p>
             )}
             <div className="bg-card p-8 rounded-xl shadow-lg">
               <p className="text-center text-muted-foreground">
                 Formulário de pré-matrícula em desenvolvimento
               </p>
             </div>
           </div>
         </section>
       )}
 
       {/* Footer */}
       <footer className="py-12 border-t">
         <div className="container max-w-6xl mx-auto px-4">
           <div className="flex flex-col md:flex-row justify-between items-center gap-6">
             <div className="flex items-center gap-3">
               <Building2 className="h-6 w-6" style={{ color: website.primary_color }} />
               <p className="text-muted-foreground">{website.footer_text || "Instituição de Ensino"}</p>
             </div>
             
             {website.social_links && Object.keys(website.social_links).length > 0 && (
               <div className="flex gap-4">
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
                       className="h-10 w-10 rounded-full flex items-center justify-center transition-colors"
                       style={{ 
                         backgroundColor: 'hsl(var(--muted))',
                         color: website.primary_color 
                       }}
                     >
                       <Icon className="h-5 w-5" />
                     </a>
                   );
                 })}
               </div>
             )}
           </div>
           {website.show_powered_by && (
             <p className="text-center text-sm text-muted-foreground mt-6">
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