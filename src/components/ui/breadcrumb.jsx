import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const Breadcrumb = ({
  items = [],
  separator = <ChevronRight className="w-4 h-4 text-muted-foreground" />,
  className,
  showHome = true,
  ...props
}) => {
  return (
    <nav
      className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}
      aria-label="Breadcrumb"
      {...props}
    >
      {showHome && (
        <>
          <Link
            to="/"
            className="flex items-center hover:text-foreground transition-colors"
            aria-label="Home"
          >
            <Home className="w-4 h-4" />
          </Link>
          <span className="mx-1">{separator}</span>
        </>
      )}

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isFirst = index === 0 && !showHome;

        return (
          <React.Fragment key={item.href || index}>
            {!isFirst && <span className="mx-1">{separator}</span>}
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="hover:text-foreground transition-colors"
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  isLast ? 'text-foreground font-medium' : 'text-muted-foreground'
                )}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

const BreadcrumbList = ({ children, className, ...props }) => (
  <ol
    className={cn("flex items-center space-x-1 text-sm", className)}
    {...props}
  >
    {children}
  </ol>
);

const BreadcrumbItem = ({ children, className, ...props }) => (
  <li className={cn("flex items-center", className)} {...props}>
    {children}
  </li>
);

const BreadcrumbLink = ({ children, href, className, ...props }) => (
  <Link
    to={href}
    className={cn("hover:text-foreground transition-colors", className)}
    {...props}
  >
    {children}
  </Link>
);

const BreadcrumbPage = ({ children, className, ...props }) => (
  <span
    className={cn("text-foreground font-medium", className)}
    aria-current="page"
    {...props}
  >
    {children}
  </span>
);

const BreadcrumbSeparator = ({ children, className, ...props }) => (
  <span
    className={cn("mx-1 text-muted-foreground", className)}
    {...props}
  >
    {children || <ChevronRight className="w-4 h-4" />}
  </span>
);

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator
};