import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  icon?: React.ReactNode;
  description?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
  valueClassName?: string;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  icon,
  description,
  trend,
  trendValue,
  className,
  valueClassName,
  onClick,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md",
        onClick && "cursor-pointer hover:border-primary",
        className
      )}
      onClick={onClick}
    >
      <div className="p-6 flex flex-col h-full">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        <div className="mt-2.5">
          <div className={cn("text-2xl font-bold", valueClassName)}>
            {value}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {trend && trendValue && (
          <div className="mt-auto pt-4">
            <div
              className={cn(
                "text-xs font-medium inline-flex items-center rounded-full px-2.5 py-0.5",
                trend === "up" && "bg-green-100 text-green-800",
                trend === "down" && "bg-red-100 text-red-800",
                trend === "neutral" && "bg-gray-100 text-gray-800"
              )}
            >
              {trend === "up" && (
                <svg
                  className="w-3 h-3 mr-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 11l5-5m0 0l5 5m-5-5v12"
                  />
                </svg>
              )}
              {trend === "down" && (
                <svg
                  className="w-3 h-3 mr-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 13l-5 5m0 0l-5-5m5 5V6"
                  />
                </svg>
              )}
              {trend === "neutral" && (
                <svg
                  className="w-3 h-3 mr-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 12h14"
                  />
                </svg>
              )}
              {trendValue}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}