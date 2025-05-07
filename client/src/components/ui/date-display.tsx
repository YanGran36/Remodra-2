import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CalendarIcon, Clock } from "lucide-react";

interface DateDisplayProps {
  label: string;
  date: Date | string;
  showTime?: boolean;
  isPast?: boolean;
  isFuture?: boolean;
  daysRemaining?: number;
  className?: string;
}

export function DateDisplay({
  label,
  date,
  showTime = false,
  isPast,
  isFuture,
  daysRemaining,
  className,
}: DateDisplayProps) {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-sm">
        <span className="text-muted-foreground">{label}:</span>{" "}
        <span className={cn(
          "font-medium",
          isPast && "text-red-600",
          isFuture && "text-green-600"
        )}>
          {format(dateObj, showTime ? "d MMM, yyyy - HH:mm" : "d MMM, yyyy", { locale: es })}
        </span>
        
        {daysRemaining !== undefined && (
          <span className={cn(
            "ml-1.5 text-xs px-1.5 py-0.5 rounded-full inline-flex items-center",
            daysRemaining < 0 ? "bg-red-100 text-red-800" : 
            daysRemaining === 0 ? "bg-amber-100 text-amber-800" :
            daysRemaining <= 3 ? "bg-yellow-100 text-yellow-800" :
            "bg-green-100 text-green-800"
          )}>
            <Clock className="h-3 w-3 mr-0.5" />
            {daysRemaining < 0 
              ? `Vencido hace ${Math.abs(daysRemaining)} días` 
              : daysRemaining === 0 
                ? "Vence hoy"
                : `${daysRemaining} días restantes`}
          </span>
        )}
      </span>
    </div>
  );
}