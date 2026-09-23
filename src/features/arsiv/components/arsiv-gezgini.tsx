import type { ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Delete02Icon,
  FolderOpenIcon,
  Upload04Icon,
} from "@hugeicons/core-free-icons"

import {
  AramaKutusu,
  FiltreAlani,
  FiltreSheet,
  GorunumToggle,
  ListeAraclari,
} from "@/components/shared/liste-araclari"
import { EmptyState, ErrorState } from "@/components/shared/query-states"
import { Sayfalama } from "@/components/shared/sayfalama"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DosyaGrid,
  DosyaTablo,
} from "@/features/arsiv/components/dosya-listesi"
import type { DosyaIslemleri } from "@/features/arsiv/components/dosya-islemleri"
import {
  ARSIV_SAYFA_BOYUTU,
  type ArsivParams,
  type useArsivParams,
} from "@/features/arsiv/hooks/use-arsiv-params"
import { useArsivList } from "@/features/arsiv/queries"
import type { ArsivSiralama, SiralamaYonu } from "@/types/api"

const SIRALAMA_ETIKET = {
  "ad:asc": "Ad (A → Z)",
  "ad:desc": "Ad (Z → A)",
  "yuklemeTarihi:desc": "Yükleme tarihi (en yeni)",
  "yuklemeTarihi:asc": "Yükleme tarihi (en eski)",
  "boyut:desc": "Boyut (en büyük)",
  "boyut:asc": "Boyut (en küçük)",
  "gecerlilikTarihi:asc": "Geçerlilik (en yakın)",
  "gecerlilikTarihi:desc": "Geçerlilik (en uzak)",
} satisfies Record<`${ArsivSiralama}:${SiralamaYonu}`, string>

type Siralama = keyof typeof SIRALAMA_ETIKET
type Update = ReturnType<typeof useArsivParams>["update"]

/**
 * Arama solda; sağda (varsa) klasör düğmesi, sıralama sheet'i, görünüm toggle'ı ve yükle.
 * Mobilde iki satıra iner: arama / düğmeler.
 */
export function ArsivAraclari({
  params,
  update,
  onYukle,
  baslangic,
}: {
  params: ArsivParams
  update: Update
  /** Verilirse araç çubuğunda "Yükle" düğmesi gösterilir */
  onYukle?: () => void
  /** Düğme grubunun başına eklenen öğe (ör. mobilde klasör düğmesi) */
  baslangic?: ReactNode
}) {
  const siralama = `${params.sirala}:${params.yon}` as Siralama
  return (
    <ListeAraclari
      etiket="Dosya filtreleri"
      arama={
        <AramaKutusu
          etiket="Dosya ara"
          placeholder="Dosya ara"
          value={params.q}
          onChange={(q) => update({ q })}
        />
      }
    >
      <div className="flex items-center gap-2">{baslangic}</div>
      <div className="flex items-center gap-2">
        <FiltreSheet
          deger={{ siralama }}
          varsayilan={{ siralama: "ad:asc" as Siralama }}
          // Sıralama "filtre" sayılmaz; rozet göstermez
          aktifSayi={0}
          aciklama="Dosyaların sıralamasını seçin."
          onUygula={({ siralama }) => {
            const [sirala, yon] = siralama.split(":") as [
              ArsivSiralama,
              SiralamaYonu,
            ]
            update({ sirala, yon })
          }}
        >
          {(taslak, degistir) => (
            <FiltreAlani etiket="Sıralama" htmlFor="filtre-siralama">
              <Select
                items={SIRALAMA_ETIKET}
                value={taslak.siralama}
                onValueChange={(v) =>
                  v && degistir({ siralama: v as Siralama })
                }
              >
                <SelectTrigger id="filtre-siralama" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SIRALAMA_ETIKET).map(([k, ad]) => (
                    <SelectItem key={k} value={k}>
                      {ad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FiltreAlani>
          )}
        </FiltreSheet>
        <GorunumToggle
          value={params.gorunum}
          onChange={(gorunum) => update({ gorunum })}
        />
        {onYukle && !params.cop && (
          <Button onClick={onYukle} aria-label="Dosya yükle">
            <HugeiconsIcon
              icon={Upload04Icon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            <span className="max-sm:sr-only">Yükle</span>
          </Button>
        )}
      </div>
    </ListeAraclari>
  )
}

/** Seçili klasörün dosyaları: yükleniyor / boş / hata / ızgara / liste. */
export function DosyaAlani({
  params,
  mukellefId,
  islemler,
  gosterMukellef,
  onYukle,
  onSayfa,
}: {
  params: ArsivParams
  mukellefId?: string
  islemler: DosyaIslemleri
  gosterMukellef: boolean
  onYukle?: () => void
  onSayfa: (sayfa: number) => void
}) {
  const liste = useArsivList({
    mukellefId,
    kategori: params.cop ? undefined : params.kategori,
    q: params.q || undefined,
    sirala: params.sirala,
    yon: params.yon,
    cop: params.cop || undefined,
    sayfa: params.sayfa,
    sayfaBoyutu: ARSIV_SAYFA_BOYUTU,
  })

  if (liste.isError)
    return <ErrorState error={liste.error} onRetry={() => liste.refetch()} />

  if (liste.isPending)
    return (
      <div
        className="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-3"
        aria-busy="true"
      >
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    )

  const { items, total, sayfa } = liste.data
  if (total === 0) {
    if (params.cop)
      return <EmptyState icon={Delete02Icon} title="Çöp kutusu boş" />
    return (
      <EmptyState
        icon={FolderOpenIcon}
        title={
          params.q ? "Aramayla eşleşen dosya yok" : "Bu klasörde dosya yok"
        }
        action={
          onYukle &&
          !params.q && (
            <Button size="sm" onClick={onYukle}>
              <HugeiconsIcon
                icon={Upload04Icon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              Dosya yükle
            </Button>
          )
        }
      />
    )
  }

  const props = {
    dosyalar: items,
    islemler,
    gosterMukellef,
    cop: params.cop,
  }
  return (
    <>
      {params.gorunum === "liste" ? (
        <DosyaTablo {...props} />
      ) : (
        <DosyaGrid {...props} />
      )}
      <Sayfalama
        total={total}
        sayfa={sayfa}
        sayfaBoyutu={ARSIV_SAYFA_BOYUTU}
        birim="dosyadan"
        onChange={(s) => onSayfa(s)}
      />
    </>
  )
}
