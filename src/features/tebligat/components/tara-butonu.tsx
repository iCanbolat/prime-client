import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { MailReceive01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import { useTebligatTara } from "@/features/tebligat/queries"

/** Posta kutusunu hemen tarar (backend bunu zamanlanmış olarak da yapar) */
export function TaraButonu({ disabled }: { disabled?: boolean }) {
  const tara = useTebligatTara()
  return (
    <Button
      variant="outline"
      disabled={disabled || tara.isPending}
      onClick={() =>
        tara.mutate(undefined, {
          onSuccess: (s) =>
            s.yeni === 0
              ? toast.success("Yeni e-Tebligat yok")
              : toast.success(
                  `${s.yeni} yeni e-Tebligat${s.eslesmeyen ? `, ${s.eslesmeyen} tanesi mükellefle eşleşmedi` : ""}`
                ),
          onError: (error) => toast.error(error.message),
        })
      }
    >
      <HugeiconsIcon
        icon={MailReceive01Icon}
        strokeWidth={2}
        data-icon="inline-start"
      />
      {tara.isPending ? "Taranıyor…" : "Şimdi tara"}
    </Button>
  )
}
