import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface SignatureDisplayProps {
  signature?: string;
  title: string;
  date?: Date;
  className?: string;
}

export function SignatureDisplay({ signature, title, date, className }: SignatureDisplayProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="text-sm font-medium mb-2">{title}</div>
      <div className="border-b border-dashed border-gray-300 min-h-[60px] flex items-end justify-center pb-1">
        {signature ? (
          <p className="font-signature text-xl">{signature}</p>
        ) : (
          <p className="text-xs text-muted-foreground">Sin firma</p>
        )}
      </div>
      {date && (
        <div className="mt-1 text-xs text-muted-foreground text-center">
          {format(date, "dd MMMM, yyyy")}
        </div>
      )}
    </div>
  );
}