import { useState } from "react"
import { Link, useSearchParams } from "react-router"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"

import { PageHeader } from "@/components/shared/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { TaraButonu } from "@/features/tebligat/components/tara-butonu"
import { TebligatEkleDialog } from "@/features/tebligat/components/tebligat-ekle-dialog"
import { TebligatListesi } from "@/features/tebligat/components/tebligat-listesi"
import { useTebligatOzet } from "@/features/tebligat/queries"

export function TebligatPage() {
  const ozet = useTebligatOzet()
  const [ekle, setEkle] = useState(false)
  const [, setSearchParams] = useSearchParams()
  const kutu = ozet.data?.postaKutusu
  const bagli = kutu?.durum === "BAGLI"

  return (
    <>
      <PageHeader
        title="e-Tebligat"
        description={
          <>
            GİB ve SGK bildirim e-postalarından tebligat ve süre takibi
            {kutu?.sonTarama && (
              <>
                {" · "}Son tarama{" "}
                {formatDistanceToNow(new Date(kutu.sonTarama), {
                  addSuffix: true,
                  locale: tr,
                })}
              </>
            )}
          </>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setEkle(true)}>
              Elle ekle
            </Button>
            <TaraButonu disabled={ozet.isSuccess && !bagli} />
          </div>
        }
      />

      {ozet.isSuccess && !bagli && (
        <Alert variant="destructive">
          <AlertTitle>
            {kutu?.durum === "HATA"
              ? "Tebligat posta kutusuna bağlanılamıyor"
              : "Tebligat posta kutusu bağlı değil"}
          </AlertTitle>
          <AlertDescription>
            {kutu?.hataMesaji ??
              "Yeni tebligatlar otomatik gelmez. GİB/İVD'de mükelleflerin bildirim e-posta adresi olarak büronun kutusunu tanımlayıp kutuyu bağlayın."}{" "}
            <Link to="/ayarlar/kanallar" className="underline">
              Ayarlar → Kanallar
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {ozet.data && (ozet.data.acil > 0 || ozet.data.geciken > 0) && (
        <Alert variant="destructive">
          <AlertTitle>
            {ozet.data.geciken > 0
              ? `${ozet.data.geciken} tebligatın süresi geçti, ${ozet.data.acil} tebligatın süresi 3 gün içinde doluyor`
              : `${ozet.data.acil} tebligatın süresi 3 gün içinde doluyor`}
          </AlertTitle>
          <AlertDescription>
            <button
              type="button"
              className="underline"
              onClick={() =>
                setSearchParams({ kapsam: "acil" }, { replace: true })
              }
            >
              Acil tebligatları göster
            </button>
          </AlertDescription>
        </Alert>
      )}

      <TebligatListesi />

      <TebligatEkleDialog
        open={ekle}
        onClose={() => setEkle(false)}
        onEklendi={(t) =>
          setSearchParams({ tebligat: t.id }, { replace: true })
        }
      />
    </>
  )
}
