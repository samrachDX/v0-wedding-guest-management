import { Loader2 } from "lucide-react"

export function PageLoader({ label }: { label?: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="size-6 animate-spin text-primary" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  )
}
