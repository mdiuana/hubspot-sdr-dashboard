import { cn } from "@/lib/utils"

type Variant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning"

const variants: Record<Variant, string> = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  destructive: "bg-red-100 text-red-700",
  outline: "border border-input bg-background",
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
}

export function Badge({ children, variant = "default", className }: {
  children: React.ReactNode
  variant?: Variant
  className?: string
}) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}
