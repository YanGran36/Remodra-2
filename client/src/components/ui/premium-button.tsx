import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const premiumButtonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary to-indigo-600 text-white shadow hover:shadow-lg hover:scale-[1.03] active:scale-[0.97]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        success:
          "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow hover:shadow-lg hover:scale-[1.03] active:scale-[0.97]",
        destructive:
          "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow hover:shadow-lg hover:scale-[1.03] active:scale-[0.97]",
        warning:
          "bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow hover:shadow-lg hover:scale-[1.03] active:scale-[0.97]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface PremiumButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof premiumButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ className, variant, size, asChild = false, loading, icon, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(premiumButtonVariants({ variant, size, className }))}
        ref={ref}
        disabled={props.disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {children}
          </>
        ) : (
          <>
            {icon && <span className="mr-2">{icon}</span>}
            {children}
          </>
        )}
        <span className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
      </Comp>
    );
  }
);
PremiumButton.displayName = "PremiumButton";

export { PremiumButton, premiumButtonVariants };