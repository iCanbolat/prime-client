import { useMemo, useState } from "react"
import { CheckListIcon } from "@hugeicons/core-free-icons"

import { EmptyState, ErrorState } from "@/components/shared/query-states"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { GorevDurumBadge } from "@/features/gorev/components/gorev-rozetleri"
import {
  donemGorevleriniPlanla,
  donemSecenekleri,
} from "@/features/gorev/kurallar"
import { MukellefSelect } from "@/features/mukellef/components/mukellef-select"
import { useMukellefList } from "@/features/mukellef/queries"
import { YUKUMLULUK_TANIMLARI } from "@/features/takvim/kurallar"
import { takvimOlayId, uygulananTipler } from "@/features/takvim/motor"
import { useTakvim } from "@/features/takvim/queries"
import { BEYAN_DURUM_ETIKET } from "@/features/takvim/sabitler"
import { formatDate } from "@/lib/format"
import { bugun } from "@/lib/tarih"
import { cn } from "@/lib/utils"

const BEYAN_RENK = {
  BEKLIYOR: "text-muted-foreground",
  HAZIRLANDI: "text-amber-800 dark:text-amber-300",
  ONAYLANDI: "text-emerald-700 dark:text-emerald-300",
} as const

/**
 * "X müşterisinin KDV'si onaylandı mı?" — mükellef + dönem seçilince o döneme ait
 * yükümlülüklerin beyan durumu ve bağlı görevin durumu.
 */
export function HizliSorguKarti({
  onGorevAc,
}: {
  onGorevAc: (id: string) => void
}) {
  const donemler = useMemo(() => donemSecenekleri(bugun()), [])
  const [mukellefId, setMukellefId] = useState("")
  const [donem, setDonem] = useState(donemler[0]?.value ?? "")
  const mukellefler = useMukellefList({ durum: "aktif" })
  const mukellef = mukellefler.data?.items.find((m) => m.id === mukellefId)

  // Dönemin yükümlülükleri ve son günleri kural motorundan; durumlar sunucudan
  const beklenen = useMemo(
    () =>
      mukellef && donem
        ? uygulananTipler(mukellef).flatMap((tip) =>
            donemGorevleriniPlanla([mukellef], tip, donem, new Map()).map(
              (s) => ({ tip, sonTarih: s.sonTarih })
            )
          )
        : [],
    [mukellef, donem]
  )
  const tarihler = beklenen.map((b) => b.sonTarih).sort()
  const hazir = beklenen.length > 0
  const takvim = useTakvim(
    {
      baslangic: tarihler[0] ?? "",
      bitis: tarihler.at(-1) ?? "",
      mukellefId,
    },
    hazir
  )
  const olaylar = new Map((takvim.data ?? []).map((o) => [o.id, o]))

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Hızlı sorgu</CardTitle>
        <CardDescription>
          Bir mükellefin dönem beyanları hangi aşamada?
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <MukellefSelect
            aria-label="Sorgulanacak mükellef"
            value={mukellefId}
            onValueChange={setMukellefId}
          />
          <Select
            items={Object.fromEntries(donemler.map((d) => [d.value, d.label]))}
            value={donem}
            onValueChange={(v) => v && setDonem(String(v))}
          >
            <SelectTrigger className="w-full" aria-label="Sorgulanacak dönem">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {donemler.map((d) => (
                <SelectItem key={d.value} value={d.value}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!mukellef ? (
          <p className="text-sm text-muted-foreground">
            Sonuçları görmek için bir mükellef seçin.
          </p>
        ) : !hazir ? (
          <EmptyState
            icon={CheckListIcon}
            title="Bu dönemde beyan yok"
            description="Mükellef seçilen dönem için hiçbir yükümlülüğe tabi değil."
          />
        ) : takvim.isError ? (
          <ErrorState error={takvim.error} onRetry={() => takvim.refetch()} />
        ) : !takvim.data || takvim.isPlaceholderData ? (
          <div className="grid gap-2" aria-busy="true">
            {beklenen.map((b) => (
              <Skeleton key={b.tip} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <ul className="grid gap-1" aria-label="Sorgu sonucu">
            {beklenen.map((b) => {
              const o = olaylar.get(takvimOlayId(mukellef.id, b.tip, donem))
              const durum = o?.durum ?? "BEKLIYOR"
              return (
                <li
                  key={b.tip}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 rounded-xl border px-3 py-2"
                >
                  <span className="truncate text-sm font-medium">
                    {YUKUMLULUK_TANIMLARI[b.tip].ad}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      o?.gecikti ? "text-destructive" : BEYAN_RENK[durum]
                    )}
                  >
                    {o?.gecikti ? "Gecikti" : BEYAN_DURUM_ETIKET[durum]}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    Son gün {formatDate(b.sonTarih)}
                  </span>
                  <span className="justify-self-end">
                    {o?.gorevId && o.gorevDurum ? (
                      <button
                        type="button"
                        onClick={() => onGorevAc(o.gorevId!)}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
                      >
                        Görev: <GorevDurumBadge durum={o.gorevDurum} />
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Görev yok
                      </span>
                    )}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
