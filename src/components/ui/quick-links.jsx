import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const QuickLinks = ({
  links = [],
  title = "Quick Links",
  className,
  linkClassName = "flex items-center gap-2 p-3 rounded-lg border border-border hover:bg-accent hover:border-accent-foreground/20 transition-all duration-200 group",
  iconClassName = "text-lg group-hover:scale-110 transition-transform duration-200",
  ...props
}) => {
  if (!links || links.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)} {...props}>
      {title && (
        <h3 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wide">
          {title}
        </h3>
      )}
      <div className="grid gap-2">
        {links.map((link, index) => (
          <Link
            key={link.href || index}
            to={link.href}
            className={cn(linkClassName, "text-sm")}
            aria-label={link.label}
          >
            {link.icon && (
              <span
                className={cn(iconClassName, "flex-shrink-0")}
                role="img"
                aria-hidden="true"
              >
                {link.icon}
              </span>
            )}
            <span className="flex-1 leading-tight">{link.label}</span>
            {link.badge && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                {link.badge}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

const QuickLinkCard = ({
  link,
  className,
  compact = false,
  ...props
}) => {
  if (!link) return null;

  const cardClasses = compact
    ? "p-2 rounded-md hover:bg-accent/50 transition-colors"
    : "p-4 rounded-lg border border-border hover:shadow-md hover:border-accent-foreground/20 transition-all duration-200";

  return (
    <Link
      to={link.href}
      className={cn("block bg-card", cardClasses, className)}
      aria-label={link.label}
      {...props}
    >
      <div className="flex items-center gap-3">
        {link.icon && (
          <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-primary text-sm" role="img" aria-hidden="true">
              {link.icon}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-foreground truncate">
            {link.label}
          </div>
          {link.description && (
            <div className="text-xs text-muted-foreground truncate">
              {link.description}
            </div>
          )}
        </div>
        {link.badge && (
          <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium flex-shrink-0">
            {link.badge}
          </span>
        )}
      </div>
    </Link>
  );
};

const QuickLinksGrid = ({
  links = [],
  title,
  columns = 2,
  className,
  ...props
}) => {
  if (!links || links.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)} {...props}>
      {title && (
        <h3 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wide">
          {title}
        </h3>
      )}
      <div className={`grid gap-3 grid-cols-${columns}`}>
        {links.map((link, index) => (
          <QuickLinkCard key={link.href || index} link={link} compact />
        ))}
      </div>
    </div>
  );
};

export { QuickLinks, QuickLinkCard, QuickLinksGrid };