import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

// Define status badge variants
const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        draft: "bg-gray-100 text-gray-800",
        sent: "bg-blue-100 text-blue-800",
        accepted: "bg-green-100 text-green-800", 
        rejected: "bg-red-100 text-red-800",
        expired: "bg-yellow-100 text-yellow-800",
        pending: "bg-amber-100 text-amber-800",
        paid: "bg-emerald-100 text-emerald-800",
        overdue: "bg-rose-100 text-rose-800",
        cancelled: "bg-slate-100 text-slate-800",
        default: "bg-primary/10 text-primary",
      },
      size: {
        default: "h-6",
        sm: "h-5",
        lg: "h-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  label?: string;
  icon?: React.ReactNode;
}

export function StatusBadge({
  className,
  variant,
  size,
  label,
  icon,
  ...props
}: StatusBadgeProps) {
  return (
    <div className={cn(statusBadgeVariants({ variant, size }), className)} {...props}>
      {icon && <span className="mr-1">{icon}</span>}
      {label || variant}
    </div>
  );
}

export function getEstimateStatusBadge(status: string) {
  const statusMap: Record<string, { label: string, variant: string }> = {
    draft: { label: "Borrador", variant: "draft" },
    sent: { label: "Enviado", variant: "sent" },
    accepted: { label: "Aceptado", variant: "accepted" },
    rejected: { label: "Rechazado", variant: "rejected" },
    expired: { label: "Expirado", variant: "expired" },
  };

  const statusInfo = statusMap[status] || { label: status, variant: "default" };
  
  return (
    <StatusBadge 
      variant={statusInfo.variant as any} 
      label={statusInfo.label} 
    />
  );
}

export function getInvoiceStatusBadge(status: string) {
  const statusMap: Record<string, { label: string, variant: string }> = {
    pending: { label: "Pendiente", variant: "pending" },
    paid: { label: "Pagada", variant: "paid" },
    overdue: { label: "Vencida", variant: "overdue" },
    cancelled: { label: "Cancelada", variant: "cancelled" },
  };

  const statusInfo = statusMap[status] || { label: status, variant: "default" };
  
  return (
    <StatusBadge 
      variant={statusInfo.variant as any} 
      label={statusInfo.label} 
    />
  );
}