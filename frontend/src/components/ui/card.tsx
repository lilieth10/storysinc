import React from "react";

// ═══════════════════════════════════════════════════════════════
// 🎨 CARD COMPONENT TYPES
// ═══════════════════════════════════════════════════════════════

type CardProps = React.HTMLAttributes<HTMLDivElement>;

// ═══════════════════════════════════════════════════════════════
// 🎯 CARD COMPONENTS
// ═══════════════════════════════════════════════════════════════

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", ...props }, ref) => {
    const baseClasses = [
      "rounded-lg",
      "border",
      "border-gray-200",
      "bg-white",
      "text-gray-900",
      "shadow-sm",
      "transition-shadow",
      "hover:shadow-md",
    ].join(" ");

    const combinedClasses = [baseClasses, className].filter(Boolean).join(" ");

    return <div ref={ref} className={combinedClasses} {...props} />;
  },
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", ...props }, ref) => {
    const baseClasses = "flex flex-col space-y-1.5 p-6";
    const combinedClasses = [baseClasses, className].filter(Boolean).join(" ");

    return <div ref={ref} className={combinedClasses} {...props} />;
  },
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", ...props }, ref) => {
    const baseClasses = "text-2xl font-semibold leading-none tracking-tight";
    const combinedClasses = [baseClasses, className].filter(Boolean).join(" ");

    return <h3 ref={ref} className={combinedClasses} {...props} />;
  },
);
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", ...props }, ref) => {
    const baseClasses = "text-sm text-gray-600";
    const combinedClasses = [baseClasses, className].filter(Boolean).join(" ");

    return <p ref={ref} className={combinedClasses} {...props} />;
  },
);
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", ...props }, ref) => {
    const baseClasses = "p-6 pt-0";
    const combinedClasses = [baseClasses, className].filter(Boolean).join(" ");

    return <div ref={ref} className={combinedClasses} {...props} />;
  },
);
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", ...props }, ref) => {
    const baseClasses = "flex items-center p-6 pt-0";
    const combinedClasses = [baseClasses, className].filter(Boolean).join(" ");

    return <div ref={ref} className={combinedClasses} {...props} />;
  },
);
CardFooter.displayName = "CardFooter";
