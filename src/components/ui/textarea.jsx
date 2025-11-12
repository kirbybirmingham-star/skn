import * as React from "react"
import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, label, ...props }, ref) => {
  const id = React.useId()
  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      {label && <label htmlFor={id}>{label}</label>}
      <textarea
        id={id}
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    </div>
  )
})

Textarea.displayName = "Textarea"

export { Textarea }
