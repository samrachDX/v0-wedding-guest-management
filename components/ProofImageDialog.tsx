"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useLanguage } from "@/contexts/LanguageContext"

interface ProofImageDialogProps {
  src: string | null
  onOpenChange: (open: boolean) => void
}

export function ProofImageDialog({ src, onOpenChange }: ProofImageDialogProps) {
  const { t } = useLanguage()

  return (
    <Dialog open={!!src} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-3 sm:p-4">
        <DialogTitle className="px-1 pt-1 text-base">{t("gifts.proofImage")}</DialogTitle>
        {src && (
          // eslint-disable-next-line @next/next/no-img-element -- proof images are inline data URLs
          <img src={src} alt={t("gifts.proofImage")} className="max-h-[75vh] w-full rounded-xl object-contain" />
        )}
      </DialogContent>
    </Dialog>
  )
}
