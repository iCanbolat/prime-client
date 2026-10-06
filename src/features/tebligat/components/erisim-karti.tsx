import { useState } from "react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { ErrorState, LoadingState } from "@/components/shared/query-states"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ErisimDialog } from "@/features/tebligat/components/erisim-dialog"
import { ErisimDurumBadge } from "@/features/tebligat/components/tebligat-rozetleri"
import {
  useTebligatErisim,
  useTebligatErisimKaldir,
  useTebligatMukellefTara,
} from "@/features/tebligat/queries"
import { formatDateTime } from "@/lib/format"

/** Mükellef kartında GİB e-Tebligat erişimi: durum, son tarama, tanımla / güncelle / şimdi tara */
export function ErisimKarti({ mukellefId }: { mukellefId: string }) {
  const erisim = useTebligatErisim(mukellefId)
  const tara = useTebligatMukellefTara()
  const kaldir = useTebligatErisimKaldir()
  const [duzenle, setDuzenle] = useState(false)
  const [kaldirilacak, setKaldirilacak] = useState(false)

  if (erisim.isError)
    return <ErrorState error={erisim.error} onRetry={() => erisim.refetch()} />
  if (!erisim.data) return <LoadingState />
  const s = erisim.data
  const e = s.erisim

  const aciklama = !e
    ? "Tanımlanınca mükellefin GİB e-Tebligat kutusu her gece taranır; tanımlanana kadar tebligatlar yalnızca elle girilebilir."
    : e.durum === "HATA"
      ? `${e.hataMesaji ?? "GİB'e giriş yapılamadı"}. Şifre güncellenene kadar gece taramasında atlanır.`
      : "Her gece taranır; yeni tebligatlar sabah listede olur."

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          GİB e-Tebligat kutusu
          <ErisimDurumBadge durum={s.durum} />
        </CardTitle>
        <CardDescription
          className={e?.durum === "HATA" ? "text-destructive" : undefined}
        >
          {aciklama}
          {e && (
            <span className="block text-muted-foreground">
              Kullanıcı {e.kullaniciKodu} · şifre ••••{e.sifreIpucu}
              {e.sonTarama &&
                ` · son başarılı tarama ${formatDateTime(e.sonTarama)}`}
            </span>
          )}
        </CardDescription>
        <CardAction className="flex flex-wrap gap-2">
          {e && (
            <Button
              size="sm"
              variant="outline"
              disabled={tara.isPending}
              onClick={() =>
                tara.mutate(mukellefId, {
                  onSuccess: (r) =>
                    toast.success(
                      r.yeni === 0
                        ? "Yeni e-Tebligat yok"
                        : `${r.yeni} yeni e-Tebligat`
                    ),
                  onError: (error) => toast.error(error.message),
                })
              }
            >
              {tara.isPending
                ? "Taranıyor…"
                : e.durum === "HATA"
                  ? "Yeniden dene"
                  : "Şimdi tara"}
            </Button>
          )}
          <Button
            size="sm"
            variant={e ? "ghost" : "default"}
            onClick={() => setDuzenle(true)}
          >
            {e ? "Şifreyi güncelle" : "Erişim tanımla"}
          </Button>
          {e && (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => setKaldirilacak(true)}
            >
              Kaldır
            </Button>
          )}
        </CardAction>
      </CardHeader>
      <ErisimDialog
        satir={duzenle ? s : null}
        onClose={() => setDuzenle(false)}
      />
      <ConfirmDialog
        open={kaldirilacak}
        onOpenChange={setKaldirilacak}
        title="GİB erişimi kaldırılsın mı?"
        description="Bu mükellefin e-Tebligat kutusu artık gece taranmaz. Kayıtlı tebligatlar silinmez."
        confirmLabel="Kaldır"
        destructive
        pending={kaldir.isPending}
        onConfirm={() =>
          kaldir.mutate(mukellefId, {
            onSuccess: () => {
              toast.success("GİB erişimi kaldırıldı")
              setKaldirilacak(false)
            },
            onError: (error) => toast.error(error.message),
          })
        }
      />
    </Card>
  )
}
