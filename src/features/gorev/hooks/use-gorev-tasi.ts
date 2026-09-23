import { useCallback } from "react"
import { toast } from "sonner"

import { useAuthStore } from "@/features/auth/store"
import { tamamaTasiyabilirMi } from "@/features/gorev/kurallar"
import { useGorevTasi } from "@/features/gorev/queries"
import { GOREV_DURUM_ETIKET } from "@/features/gorev/sabitler"
import type { GorevView } from "@/types/api"
import type { GorevDurum } from "@/types/domain"

/** Kanban ve kart menüsü için: yetkiyi istemcide de denetler, sonucu toast ile bildirir. */
export function useGorevTasiIslemi() {
  const user = useAuthStore((s) => s.user)
  const tasi = useGorevTasi()

  const tamamlayabilirMi = useCallback(
    (g: GorevView) => tamamaTasiyabilirMi(user, g),
    [user]
  )

  const onTasi = useCallback(
    (g: GorevView, durum: GorevDurum) => {
      if (durum === "TAMAM" && !tamamaTasiyabilirMi(user, g)) {
        toast.error("Bu görevi tamamlayamazsınız", {
          description:
            "Başkasına atanmış bir görevi yalnızca yönetici “Tamam”a taşıyabilir.",
        })
        return
      }
      tasi.mutate(
        { id: g.id, durum },
        {
          onSuccess: () =>
            toast.success(
              `“${g.baslik}” ${GOREV_DURUM_ETIKET[durum]} sütununa taşındı`
            ),
          onError: (error) => toast.error(error.message),
        }
      )
    },
    [tasi, user]
  )

  return { onTasi, tamamlayabilirMi }
}
