import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[oklch(0.7_0.13_40)] text-primary-foreground shadow-md shadow-primary/25",
        className,
      )}
    >
      <Heart className="size-[18px] fill-current" />
    </span>
  )
}
