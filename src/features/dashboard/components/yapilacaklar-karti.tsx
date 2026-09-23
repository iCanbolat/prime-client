import { useState } from "react"

import { ButtonLink } from "@/components/shared/button-link"
import { ErrorState } from "@/components/shared/query-states"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OlayListesi } from "@/features/takvim/components/olay-listesi"
import type { TakvimOlayi, TakvimOzetResponse } from "@/types/api"

const LISTE_LIMITI = 8

type Sekme = "hafta" | "geciken" | "onay"

interface SekmeTanimi {
  etiket: string
  aciklama: string
  bos: string
  olaylar: (o: TakvimOzetResponse) => TakvimOlayi[]
  tersSira?: boolean
  link: string
}

export function YapilacaklarKarti({
  ozet,
  hata,
  onRetry,
  takvimLinki,
}: {
  ozet: TakvimOzetResponse | undefined
  hata?: unknown
  onRetry: () => void
  /** Takvim liste görünümü sorgusu (sorumlu filtresi dahil) */
  takvimLinki: (sorgu: string) => string
}) {
  const [sekme, setSekme] = useState<Sekme>("hafta")

  const sekmeler: Record<Sekme, SekmeTanimi> = {
    hafta: {
      etiket: "Bu hafta",
      aciklama: "Önümüzdeki 7 gün içinde son günü olan, onaylanmamış",
      bos: "Bu hafta son günü olan açık yükümlülük yok",
      olaylar: (o) => o.buHafta,
      link: takvimLinki("aralik=hafta"),
    },
    geciken: {
      etiket: "Gecikenler",
      aciklama: "Son günü geçmiş, onaylanmamış (son 6 ay)",
      bos: "Gecikmiş yükümlülük yok",
      olaylar: (o) => o.geciken,
      tersSira: true,
      link: takvimLinki("aralik=geciken"),
    },
    onay: {
      etiket: "Onay bekleyen",
      aciklama: "Hazırlanmış, müşteri / yönetici onayı bekleyen",
      bos: "Onay bekleyen beyan yok",
      olaylar: (o) => o.onayBekleyenListe,
      link: takvimLinki("durum=hazirlandi"),
    },
  }
  const aktif = sekmeler[sekme]

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Yapılacaklar</CardTitle>
        <CardDescription>{aktif.aciklama}</CardDescription>
        <CardAction>
          <ButtonLink variant="ghost" size="sm" to={aktif.link}>
            Takvimde aç
          </ButtonLink>
        </CardAction>
      </CardHeader>
      <CardContent>
        {hata ? (
          <ErrorState error={hata} onRetry={onRetry} />
        ) : (
          <Tabs value={sekme} onValueChange={(v) => setSekme(v as Sekme)}>
            <TabsList className="max-w-full [scrollbar-width:none] justify-start overflow-x-auto">
              {(Object.keys(sekmeler) as Sekme[]).map((s) => {
                const adet = ozet ? sekmeler[s].olaylar(ozet).length : undefined
                return (
                  <TabsTrigger key={s} value={s} className="flex-none">
                    {sekmeler[s].etiket}
                    {adet !== undefined && (
                      <span
                        className={
                          s === "geciken" && adet > 0
                            ? "rounded-full bg-destructive/10 px-1.5 text-xs text-destructive tabular-nums"
                            : "rounded-full bg-foreground/5 px-1.5 text-xs tabular-nums"
                        }
                      >
                        {adet}
                      </span>
                    )}
                  </TabsTrigger>
                )
              })}
            </TabsList>
            {(Object.keys(sekmeler) as Sekme[]).map((s) => {
              const tanim = sekmeler[s]
              const olaylar = ozet ? tanim.olaylar(ozet) : []
              return (
                <TabsContent key={s} value={s} className="pt-2">
                  {!ozet ? (
                    <div className="grid gap-3" aria-busy="true">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : (
                    <>
                      <OlayListesi
                        olaylar={olaylar.slice(0, LISTE_LIMITI)}
                        tersSira={tanim.tersSira}
                        bosMesaj={tanim.bos}
                      />
                      {olaylar.length > LISTE_LIMITI && (
                        <div className="mt-3 flex justify-center">
                          <ButtonLink
                            variant="outline"
                            size="sm"
                            to={tanim.link}
                          >
                            {olaylar.length - LISTE_LIMITI} yükümlülük daha
                          </ButtonLink>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              )
            })}
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
