import { MessageCircle, Mail, MapPin, Phone } from "lucide-react";

interface ContactBlockProps {
  content: {
    title?: string;
    subtitle?: string;
    whatsapp?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  settings: {
    show_map?: boolean;
    layout?: "vertical" | "horizontal";
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export function ContactBlock({ content, settings, colors }: ContactBlockProps) {
  const items = [
    content.whatsapp && {
      icon: MessageCircle,
      label: "WhatsApp",
      value: content.whatsapp,
      href: `https://wa.me/${content.whatsapp.replace(/\D/g, '')}`,
    },
    content.phone && {
      icon: Phone,
      label: "Telefone",
      value: content.phone,
      href: `tel:${content.phone.replace(/\D/g, '')}`,
    },
    content.email && {
      icon: Mail,
      label: "E-mail",
      value: content.email,
      href: `mailto:${content.email}`,
    },
    content.address && {
      icon: MapPin,
      label: "Endereço",
      value: content.address,
      href: undefined,
    },
  ].filter(Boolean) as Array<{
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    href?: string;
  }>;
  
  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 
            className="text-2xl md:text-4xl font-bold mb-4"
            style={{ color: `hsl(${colors.primary})` }}
          >
            {content.title || "Entre em Contato"}
          </h2>
          {content.subtitle && (
            <p className="text-muted-foreground text-lg">{content.subtitle}</p>
          )}
        </div>
        
        <div className="max-w-2xl mx-auto grid sm:grid-cols-2 gap-4">
          {items.map((item, index) => {
            const Icon = item.icon;
            const isExternal = item.href?.startsWith('http');
            
            const content = (
              <>
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `hsl(${colors.primary} / 0.1)` }}
                >
                  <Icon 
                    className="h-6 w-6"
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="font-medium text-sm">{item.value}</p>
                </div>
              </>
            );
            
            if (item.href) {
              return (
                <a
                  key={index}
                  href={item.href}
                  target={isExternal ? '_blank' : undefined}
                  rel={isExternal ? 'noopener noreferrer' : undefined}
                  className="flex items-center gap-4 p-4 rounded-xl border bg-background hover:shadow-md transition-shadow"
                  style={{ color: `hsl(${colors.primary})` }}
                >
                  {content}
                </a>
              );
            }
            
            return (
              <div
                key={index}
                className="flex items-center gap-4 p-4 rounded-xl border bg-background"
              >
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
