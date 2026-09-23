import { Link } from "react-router"

import { PersonelAvatar } from "@/components/shared/personel-avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { usePersonelList } from "@/features/auth/queries"
import type { TakvimOzetResponse } from "@/types/api"

/** Personel başına bu hafta son günü olan + gecikmiş açık yükümlülükler. */
export function PersonelIsYuku({
  ozet,
}: {
  ozet: TakvimOzetResponse | undefined
}) {
  const personel = usePersonelList()
  const satirlar = (personel.data ?? [])
    .filter((p) => p.aktif)
    .map((p) => ({
      p,
      ...(ozet?.personel.find((x) => x.personelId === p.id) ?? {
        acik: 0,
        geciken: 0,
      }),
    }))
    .sort((a, b) => b.acik - a.acik)
  const enFazla = Math.max(1, ...satirlar.map((s) => s.acik))

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Personel iş yükü</CardTitle>
        <CardDescription>
          Bu hafta son günü olan ve gecikmiş açık yükümlülükler
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {!ozet || personel.isPending ? (
          <div className="grid gap-3" aria-busy="true">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : (
          <ul className="grid gap-1" aria-label="Personel iş yükü">
            {satirlar.map(({ p, acik, geciken }) => (
              <li key={p.id}>
                <Link
                  to={`/takvim?gorunum=liste&aralik=hafta&sorumlu=${p.id}`}
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 rounded-xl px-2 py-2 outline-none hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <PersonelAvatar
                    personel={p}
                    size="sm"
                    className="row-span-2"
                  />
                  <span className="truncate text-sm font-medium">
                    {p.ad} {p.soyad}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    <span className="font-medium text-foreground">{acik}</span>{" "}
                    açık
                    {geciken > 0 && (
                      <span className="text-destructive">
                        {" "}
                        · {geciken} gecikmiş
                      </span>
                    )}
                  </span>
                  <span
                    className="col-span-2 flex h-1.5 overflow-hidden rounded-full bg-muted"
                    aria-hidden="true"
                  >
                    <span
                      className="bg-destructive"
                      style={{ width: `${(geciken / enFazla) * 100}%` }}
                    />
                    <span
                      className="bg-primary/70"
                      style={{
                        width: `${((acik - geciken) / enFazla) * 100}%`,
                      }}
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div
          className="flex gap-4 px-2 text-xs text-muted-foreground"
          aria-hidden="true"
        >
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary/70" /> Bu hafta
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-destructive" /> Gecikmiş
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
