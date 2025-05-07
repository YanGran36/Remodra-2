import { cn } from "@/lib/utils";

interface InfoCardProps {
  title: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function InfoCard({ title, content, icon, className }: InfoCardProps) {
  return (
    <div className={cn("rounded-lg border bg-card shadow-sm", className)}>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        </div>
        <div>{content}</div>
      </div>
    </div>
  );
}