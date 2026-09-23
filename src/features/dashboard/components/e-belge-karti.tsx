import { Link } from "react-router"
import { Invoice03Icon } from "@hugeicons/core-free-icons"

import { ButtonLink } from "@/components/shared/button-link"
import { EmptyState, ErrorState } from "@/components/shared/query-states"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { YanitBadge } from "@/features/e-belge/components/ebelge-rozetleri"
import { formatTutar } from "@/features/e-belge/kurallar"
import { cn } from "@/lib/utils"
import type { EBelgeOzetResponse } from "@/types/api"

const LIMIT = 5

function Sayac({
  etiket,
  deger,
  to,
  ton,
}: {
  etiket: string
  deger: number
  to: string
  ton?: "tehlike" | "uyari"
}) {
  const vurgu = deger > 0 ? ton : undefined
  return (
    <Link
      to={to}
      className="grid gap-0.5 rounded-2xl bg-muted/40 px-3 py-2 hover:bg-muted"
    >
      <span
        className={cn(
          "font-heading text-xl font-semibold tabular-nums",
          vurgu === "tehlike" && "text-destructive",
          vurgu === "uyari" && "text-amber-800 dark:text-amber-300"
        )}
      >
        {deger}
      </span>
      <span className="text-xs text-muted-foreground">{etiket}</span>
    </Link>
  )
}

/** Nilvera özeti: yanıt bekleyen ticari faturalar, hatalı gönderimler, bağlantı ve berat sorunları. */
export function EBelgeKarti({
  ozet,
  hata,
  onRetry,
}: {
  ozet: EBelgeOzetResponse | undefined
  hata?: unknown
  onRetry: () => void
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>e-Belge</CardTitle>
        <CardDescription>
          Nilvera faturaları ve e-Defter beratları
        </CardDescription>
        <CardAction>
          <ButtonLink variant="ghost" size="sm" to="/e-belge">
            e-Belge
          </ButtonLink>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-4">
        {hata ? (
          <ErrorState error={hata} onRetry={onRetry} />
        ) : !ozet ? (
          <div className="grid gap-3" aria-busy="true">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : ozet.bagliMukellef === 0 && ozet.baglantiHatasi === 0 ? (
          <EmptyState
            icon={Invoice03Icon}
            title="Nilvera'ya bağlı mükellef yok"
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Sayac
                etiket="Yanıt bekleyen fatura"
                deger={ozet.yanitBekleyen}
                to="/e-belge/e-fatura?yon=GELEN&yanit=BEKLIYOR"
                ton="uyari"
              />
              <Sayac
                etiket="Hatalı gönderim"
                deger={ozet.hataliGonderim}
                to="/e-belge/e-fatura?gibDurumu=HATA"
                ton="tehlike"
              />
              <Sayac
                etiket="Geciken berat"
                deger={ozet.beratGeciken}
                to="/e-belge/e-defter"
                ton="tehlike"
              />
              <Sayac
                etiket="Bağlantı hatası"
                deger={ozet.baglantiHatasi}
                to="/e-belge/baglantilar?durum=HATA"
                ton="tehlike"
              />
            </div>
            {ozet.yanitSuresiYaklasan.length > 0 && (
              <section
                className="grid gap-1"
                aria-label="Yanıt süresi dolmak üzere olan faturalar"
              >
                <h3 className="flex items-center justify-between text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Yanıt süresi dolmak üzere
                  <span className="tabular-nums">
                    {ozet.yanitSuresiYaklasan.length}
                  </span>
                </h3>
                <ul className="divide-y">
                  {ozet.yanitSuresiYaklasan.slice(0, LIMIT).map((f) => (
                    <li key={f.id}>
                      <Link
                        to={`/e-belge/e-fatura?yon=GELEN&yanit=BEKLIYOR&fatura=${f.id}`}
                        className="grid gap-1 py-2 leading-snug hover:[&_.ad]:underline"
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="ad truncate text-sm font-medium">
                            {f.mukellefUnvan}
                          </span>
                          <YanitBadge
                            yanit={f.yanit ?? "BEKLIYOR"}
                            kalanGun={f.yanitKalanGun}
                            className="shrink-0"
                          />
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {f.karsiTaraf.unvan} ·{" "}
                          {formatTutar(f.toplam, f.paraBirimi)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
