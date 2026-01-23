import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumb?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Breadcrumb */}
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="flex items-center gap-2 text-sm">
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
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
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
    </div>
  );
}

// Shopify-style card component
interface ShopifyCardProps {
  title?: string;
  description?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  footer?: React.ReactNode;
}

export function ShopifyCard({
  title,
  description,
  headerActions,
  children,
  className,
  noPadding = false,
  footer,
}: ShopifyCardProps) {
  return (
    <div
      className={cn(
        "bg-background rounded-xl border border-border shadow-sm overflow-hidden",
        className
      )}
    >
      {(title || headerActions) && (
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            {title && (
              <h2 className="text-base font-semibold text-foreground">{title}</h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          {headerActions && <div className="shrink-0">{headerActions}</div>}
        </div>
      )}
      <div className={noPadding ? "" : "p-5"}>{children}</div>
      {footer && (
        <div className="p-5 border-t border-border bg-muted/30">{footer}</div>
      )}
    </div>
  );
}

// Shopify-style section title
interface SectionTitleProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function SectionTitle({ title, description, actions, className }: SectionTitleProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}

// Shopify-style stat item
interface StatItemProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatItem({ label, value, icon, trend, className }: StatItemProps) {
  return (
    <div className={cn("flex items-center justify-between py-3", className)}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="h-9 w-9 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground">
            {icon}
          </div>
        )}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground">{value}</span>
        {trend && (
          <span className={cn(
            "text-xs font-medium",
            trend.isPositive ? "text-emerald-600" : "text-rose-600"
          )}>
            {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </div>
  );
}

// List item for Shopify-style lists
interface ListItemProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function ListItem({ icon, title, subtitle, trailing, onClick, className }: ListItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {icon && (
        <div className="p-2 bg-muted/50 rounded-lg shrink-0">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{title}</p>
        {subtitle && (
          <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  );
}
