import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Luxury variants
        luxury: "btn-luxury",
        gold: "btn-gold",
        glass: "bg-glass hover:bg-white/20 dark:hover:bg-black/20 text-neutral-900 dark:text-neutral-100 border border-white/30 dark:border-white/10",
        premium: "bg-gradient-to-r from-secondary-400 via-secondary-500 to-secondary-600 text-white hover:from-secondary-500 hover:via-secondary-600 hover:to-secondary-700 shadow-luxury hover:shadow-luxury-lg transform-gpu hover:-translate-y-0.5",
        success: "bg-gradient-to-r from-success-500 to-success-600 text-white hover:from-success-600 hover:to-success-700 shadow-luxury hover:shadow-luxury-lg transform-gpu hover:-translate-y-0.5",
        warning: "bg-gradient-to-r from-warning-500 to-warning-600 text-white hover:from-warning-600 hover:to-warning-700 shadow-luxury hover:shadow-luxury-lg transform-gpu hover:-translate-y-0.5",
        error: "bg-gradient-to-r from-error-500 to-error-600 text-white hover:from-error-600 hover:to-error-700 shadow-luxury hover:shadow-luxury-lg transform-gpu hover:-translate-y-0.5",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
