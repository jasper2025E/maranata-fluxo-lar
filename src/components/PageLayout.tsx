import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageLayoutProps {
  title: string;
  description?: string;
  breadcrumb?: BreadcrumbItem[];
  actions?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "4xl" | "5xl" | "6xl" | "7xl" | "full";
  className?: string;
}

const maxWidthClasses = {
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  "full": "max-w-full",
};

export function PageLayout({
  title,
  description,
  breadcrumb,
  actions,
  children,
  maxWidth = "6xl",
  className,
}: PageLayoutProps) {
  return (
    <div className={cn(maxWidthClasses[maxWidth], "mx-auto", className)}>
      {/* Breadcrumb */}
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="flex items-center gap-2 text-sm mb-6">
          {breadcrumb.map((item, index) => (
            <span key={index} className="flex items-center gap-2">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              {index === breadcrumb.length - 1 ? (
                <span className="font-medium text-foreground">{item.label}</span>
              ) : (
                <span className="text-muted-foreground">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </motion.div>

      {/* Content */}
      <div className="space-y-6">{children}</div>
    </div>
  );
}

// Card component that matches the subscription page style
interface PageCardProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function PageCard({
  title,
  description,
  actions,
  children,
  className,
  noPadding = false,
}: PageCardProps) {
  return (
    <div
      className={cn(
        "bg-background rounded-xl border border-border shadow-sm",
        className
      )}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            {title && (
              <h2 className="text-base font-semibold text-foreground">{title}</h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      <div className={noPadding ? "" : "p-5"}>{children}</div>
    </div>
  );
}
