import { Link } from "react-router"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { fromYmd } from "@/lib/tarih"
import { cn } from "@/lib/utils"
import type { TakvimOzetResponse } from "@/types/api"

/** Önümüzdeki 14 günün son gün yoğunluğu (açık yükümlülük sayısı). */
export function YogunlukSeridi({
  ozet,
  sorumlu,
}: {
  ozet: TakvimOzetResponse | undefined
  sorumlu?: string
}) {
  const enFazla = Math.max(1, ...(ozet?.yogunluk.map((g) => g.adet) ?? []))

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Önümüzdeki 14 gün</CardTitle>
        <CardDescription>
          Gün başına son günü olan açık yükümlülükler
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!ozet ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <ol
            aria-label="Günlük yoğunluk"
            className="grid grid-cols-7 gap-1.5 sm:grid-cols-14"
          >
            {ozet.yogunluk.map(({ tarih, adet }) => {
              const gun = fromYmd(tarih)
              const haftaSonu = gun.getDay() === 0 || gun.getDay() === 6
              const bugun = tarih === ozet.bugun
              const etiket = `${format(gun, "d MMMM EEEE", { locale: tr })}: ${adet} yükümlülük`
              return (
                <li key={tarih}>
                  <Link
                    to={`/takvim?ay=${tarih.slice(0, 7)}${sorumlu ? `&sorumlu=${sorumlu}` : ""}`}
                    aria-label={etiket}
                    title={etiket}
                    className={cn(
                      "group flex h-32 flex-col items-center gap-1 rounded-xl px-0.5 pt-1.5 pb-1 outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50",
                      // Hafta sonu: metni soluklaştırmak kontrastı düşürür; zeminle ayrılır
                      haftaSonu && "bg-muted/50",
                      bugun && "ring-1 ring-primary/40"
                    )}
                  >
                    <span className="text-xs font-medium tabular-nums">
                      {adet || ""}
                    </span>
                    <span className="flex w-full flex-1 items-end justify-center">
                      <span
                        className={cn(
                          "w-3/5 max-w-6 rounded-md bg-primary/70 transition-colors group-hover:bg-primary",
                          adet === 0 && "bg-border group-hover:bg-border"
                        )}
                        style={{
                          height: adet
                            ? `${Math.max(8, (adet / enFazla) * 100)}%`
                            : 3,
                        }}
                      />
                    </span>
                    <span
                      className={cn(
                        "text-xs leading-none tabular-nums",
                        bugun
                          ? "font-semibold text-link"
                          : "text-muted-foreground"
                      )}
                    >
                      {format(gun, "d")}
                    </span>
                    <span className="text-[10px] leading-none text-muted-foreground uppercase">
                      {format(gun, "EEEEEE", { locale: tr })}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
