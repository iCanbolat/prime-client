import { Link } from "react-router"
import { FileNotFoundIcon } from "@hugeicons/core-free-icons"

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
import { GecerlilikBadge } from "@/features/arsiv/components/dosya-gorsel"
import { ARSIV_KATEGORI_ETIKET } from "@/types/domain"
import type { ArsivOzetResponse } from "@/types/api"

const LIMIT = 5

function Baslik({ children, adet }: { children: string; adet: number }) {
  return (
    <h3 className="flex items-center justify-between text-xs font-medium tracking-wide text-muted-foreground uppercase">
      {children}
      <span className="tabular-nums">{adet}</span>
    </h3>
  )
}

/** Süresi dolan / dolmak üzere olan belgeler ve eksik zorunlu evraklar. */
export function BelgeUyarilari({
  ozet,
  hata,
  onRetry,
}: {
  ozet: ArsivOzetResponse | undefined
  hata?: unknown
  onRetry: () => void
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Belge uyarıları</CardTitle>
        <CardDescription>
          Geçerlilik süresi ve eksik zorunlu evraklar
        </CardDescription>
        <CardAction>
          <ButtonLink variant="ghost" size="sm" to="/arsiv">
            Arşiv
          </ButtonLink>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-5">
        {hata ? (
          <ErrorState error={hata} onRetry={onRetry} />
        ) : !ozet ? (
          <div className="grid gap-3" aria-busy="true">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : ozet.gecerlilik.length === 0 && ozet.eksikZorunlu.length === 0 ? (
          <EmptyState icon={FileNotFoundIcon} title="Belge uyarısı yok" />
        ) : (
          <>
            {ozet.gecerlilik.length > 0 && (
              <section
                className="grid gap-1"
                aria-label="Süresi dolan belgeler"
              >
                <Baslik adet={ozet.gecerlilik.length}>
                  Süresi dolan / yaklaşan
                </Baslik>
                <ul className="divide-y">
                  {ozet.gecerlilik.slice(0, LIMIT).map((d) => (
                    <li key={d.id}>
                      <Link
                        to={`/mukellefler/${d.mukellefId}/arsiv?kategori=${d.kategori}`}
                        className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-start gap-x-3 py-2 hover:[&_.ad]:underline"
                      >
                        <GecerlilikBadge
                          tarih={d.gecerlilikTarihi}
                          className="mt-px w-full"
                        />
                        <span className="grid min-w-0 leading-snug">
                          <span className="ad truncate text-sm font-medium">
                            {d.mukellefUnvan}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {ARSIV_KATEGORI_ETIKET[d.kategori]} · {d.ad}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {ozet.eksikZorunlu.length > 0 && (
              <section
                className="grid gap-1"
                aria-label="Eksik zorunlu evraklar"
              >
                <Baslik adet={ozet.eksikZorunlu.length}>
                  Eksik zorunlu evrak
                </Baslik>
                <ul className="divide-y">
                  {ozet.eksikZorunlu.slice(0, LIMIT).map((m) => (
                    <li key={m.mukellefId}>
                      <Link
                        to={`/mukellefler/${m.mukellefId}/arsiv`}
                        className="grid gap-0.5 py-2 leading-snug hover:[&_.ad]:underline"
                      >
                        <span className="ad truncate text-sm font-medium">
                          {m.unvan}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {m.eksik
                            .map((k) => ARSIV_KATEGORI_ETIKET[k])
                            .join(", ")}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {ozet.eksikZorunlu.length > LIMIT && (
                  <p className="text-xs text-muted-foreground">
                    ve {ozet.eksikZorunlu.length - LIMIT} mükellef daha
                  </p>
                )}
              </section>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
