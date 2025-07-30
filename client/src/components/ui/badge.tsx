import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from '../../lib/utils'

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 hover:from-amber-500 hover:to-yellow-600",
        secondary:
          "border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700",
        destructive:
          "border-transparent bg-red-500 text-white hover:bg-red-600",
        outline: "border-amber-400 bg-transparent text-amber-400 hover:bg-amber-400 hover:text-slate-900",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
