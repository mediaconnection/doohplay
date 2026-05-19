import * as React from "react"

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900",
        "disabled:pointer-events-none disabled:opacity-50",
        "bg-white border border-slate-200 hover:bg-slate-50 text-slate-900",
        "h-9 px-4 py-2",
        className
      )}
      {...props}
    />
  )
)
Button.displayName = "Button"

export { Button }
