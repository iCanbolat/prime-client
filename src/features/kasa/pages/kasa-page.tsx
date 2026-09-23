import { useMemo, useState } from "react"
import { Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  CheckmarkCircle02Icon,
  LockPasswordIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons"

import { PageHeader } from "@/components/shared/page-header"
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/shared/query-states"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MukellefCredentialKartlari } from "@/features/kasa/components/credential-kartlari"
import { KasaDurumUyarisi } from "@/features/kasa/components/kasa-kilidi"
import { useCredentials } from "@/features/kasa/queries"
import {
  SISTEMLER,
  SISTEM_SIRASI,
  sistemGerekliMi,
} from "@/features/kasa/sistemler"
import { MukellefTurBadge } from "@/features/mukellef/components/mukellef-badges"
import { useMukellefList } from "@/features/mukellef/queries"
import { cn } from "@/lib/utils"
import type { Mukellef, Sistem } from "@/types/domain"

type HucreDurumu = "kayitli" | "eksik" | "gerekmez"

interface Satir {
  mukellef: Mukellef
  hucreler: Record<Sistem, HucreDurumu>
  eksikSayisi: number
}

const HUCRE_ETIKET: Record<HucreDurumu, string> = {
  kayitli: "Kayıtlı",
  eksik: "Eksik",
  gerekmez: "Gerekmez",
}

function OzetKarti({
  label,
  value,
  tone,
}: {
  label: string
  value: string | number
  tone?: "warn"
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle
          className={cn(
            "text-3xl tabular-nums",
            tone === "warn" && "text-amber-600 dark:text-amber-400"
          )}
        >
          {value}
        </CardTitle>
      </CardHeader>
    </Card>
  )
}

export function KasaPage() {
  const mukellefler = useMukellefList({ durum: "aktif" })
  const credentials = useCredentials()
  const [arama, setArama] = useState("")
  const [yalnizcaEksik, setYalnizcaEksik] = useState(false)
  const [secili, setSecili] = useState<Mukellef | null>(null)

  const satirlar = useMemo<Satir[]>(() => {
    if (!mukellefler.data || !credentials.data) return []
    const kayitli = new Set(
      credentials.data.map((c) => `${c.mukellefId}:${c.sistem}`)
    )
    return mukellefler.data.items.map((m) => {
      const hucreler = Object.fromEntries(
        SISTEM_SIRASI.map((s) => [
          s,
          kayitli.has(`${m.id}:${s}`)
            ? "kayitli"
            : sistemGerekliMi(m, s)
              ? "eksik"
              : "gerekmez",
        ])
      ) as Record<Sistem, HucreDurumu>
      const eksikSayisi = Object.values(hucreler).filter(
        (h) => h === "eksik"
      ).length
      return { mukellef: m, hucreler, eksikSayisi }
    })
  }, [mukellefler.data, credentials.data])

  const ozet = useMemo(() => {
    let kayitli = 0
    let eksik = 0
    for (const s of satirlar) {
      for (const h of Object.values(s.hucreler)) {
        if (h === "kayitli") kayitli++
        if (h === "eksik") eksik++
      }
    }
    const oran =
      kayitli + eksik === 0
        ? 100
        : Math.round((kayitli / (kayitli + eksik)) * 100)
    return { kayitli, eksik, oran }
  }, [satirlar])

  const gorunenler = satirlar.filter(
    (s) =>
      (!yalnizcaEksik || s.eksikSayisi > 0) &&
      (!arama ||
        s.mukellef.unvan
          .toLocaleLowerCase("tr-TR")
          .includes(arama.toLocaleLowerCase("tr-TR")))
  )

  const hata = mukellefler.error ?? credentials.error

  return (
    <>
      <PageHeader
        title="Şifre Kasası"
        description="Aktif mükelleflerin GİB, İnteraktif VD, SGK ve e-Bildirge giriş bilgileri"
      />
      <KasaDurumUyarisi />

      {hata ? (
        <ErrorState
          error={hata}
          onRetry={() => {
            void mukellefler.refetch()
            void credentials.refetch()
          }}
        />
      ) : mukellefler.isPending || credentials.isPending ? (
        <LoadingState />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <OzetKarti label="Kayıtlı şifre" value={ozet.kayitli} />
            <OzetKarti
              label="Eksik şifre"
              value={ozet.eksik}
              tone={ozet.eksik > 0 ? "warn" : undefined}
            />
            <OzetKarti label="Tamamlanma" value={`%${ozet.oran}`} />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <InputGroup className="w-full sm:w-72">
              <InputGroupAddon>
                <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                aria-label="Kasada mükellef ara"
                placeholder="Mükellef ara…"
                value={arama}
                onChange={(e) => setArama(e.target.value)}
              />
            </InputGroup>
            <Field orientation="horizontal" className="w-auto">
              <Checkbox
                id="yalnizca-eksik"
                checked={yalnizcaEksik}
                onCheckedChange={setYalnizcaEksik}
              />
              <FieldLabel htmlFor="yalnizca-eksik">
                Yalnızca eksiği olanlar
              </FieldLabel>
            </Field>
          </div>

          {gorunenler.length === 0 ? (
            <EmptyState
              icon={LockPasswordIcon}
              title={
                yalnizcaEksik
                  ? "Eksik şifresi olan mükellef yok"
                  : "Sonuç bulunamadı"
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-3xl border">
              <Table aria-label="Şifre kasası tamamlanma tablosu">
                <TableHeader>
                  <TableRow>
                    <TableHead>Mükellef</TableHead>
                    {SISTEM_SIRASI.map((s) => (
                      <TableHead key={s} className="text-center">
                        {SISTEMLER[s].ad}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gorunenler.map(({ mukellef, hucreler }) => (
                    <TableRow key={mukellef.id}>
                      <TableCell className="max-w-72">
                        <div className="flex min-w-0 flex-col gap-1">
                          <Link
                            to={`/mukellefler/${mukellef.id}/sifreler`}
                            className="truncate font-medium hover:underline"
                          >
                            {mukellef.unvan}
                          </Link>
                          <MukellefTurBadge tur={mukellef.tur} />
                        </div>
                      </TableCell>
                      {SISTEM_SIRASI.map((s) => {
                        const durum = hucreler[s]
                        return (
                          <TableCell key={s} className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`${mukellef.unvan} ${SISTEMLER[s].ad}: ${HUCRE_ETIKET[durum]}`}
                              onClick={() => setSecili(mukellef)}
                              className={cn(
                                durum === "eksik" &&
                                  "text-amber-800 dark:text-amber-300",
                                durum === "gerekmez" && "text-muted-foreground"
                              )}
                            >
                              {durum === "kayitli" && (
                                <HugeiconsIcon
                                  icon={CheckmarkCircle02Icon}
                                  strokeWidth={2}
                                  className="text-emerald-600 dark:text-emerald-400"
                                />
                              )}
                              {durum === "eksik" && (
                                <HugeiconsIcon
                                  icon={Alert02Icon}
                                  strokeWidth={2}
                                />
                              )}
                              <span
                                className={cn(
                                  durum === "kayitli" &&
                                    "sr-only sm:not-sr-only"
                                )}
                              >
                                {HUCRE_ETIKET[durum]}
                              </span>
                            </Button>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      <Sheet
        open={secili !== null}
        onOpenChange={(open) => !open && setSecili(null)}
      >
        <SheetContent className="overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-2xl">
          {secili && (
            <>
              <SheetHeader>
                <SheetTitle>{secili.unvan}</SheetTitle>
                <SheetDescription>
                  <Link to={`/mukellefler/${secili.id}`} className="underline">
                    Mükellef kartına git
                  </Link>
                </SheetDescription>
              </SheetHeader>
              <div className="px-4 pb-4">
                <MukellefCredentialKartlari mukellefId={secili.id} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
