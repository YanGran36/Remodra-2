import { cn } from "@/lib/utils";

interface PremiumHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function PremiumHeader({ title, subtitle, className }: PremiumHeaderProps) {
  return (
    <div className={cn("flex flex-col items-center text-center py-8 px-4", className)}>
      <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-muted-foreground max-w-2xl">
          {subtitle}
        </p>
      )}
      <div className="mt-4 w-24 h-1 bg-gradient-to-r from-primary to-indigo-600 rounded-full" />
    </div>
  );
}