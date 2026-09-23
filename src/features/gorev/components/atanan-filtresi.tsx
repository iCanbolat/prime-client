import { useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"

import { PersonelAvatar } from "@/components/shared/personel-avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { usePersonelList } from "@/features/auth/queries"
import { cn } from "@/lib/utils"

/** Yan yana gösterilen en fazla avatar; fazlası "+N" menüsünde */
const GORUNUR_AVATAR = 5

/**
 * Jira tarzı atanan filtresi: üst üste binen personel avatarları, her biri aç/kapa.
 * Birden çok kişi seçilebilir; oturumdaki kullanıcı başta gelir. `value` içindeki
 * "benim" oturumdaki kullanıcıya çözülür; değişiklikte gerçek id'ler yazılır.
 */
export function AtananFiltresi({
  kullaniciId,
  value,
  onChange,
}: {
  kullaniciId: string | undefined
  value: string[]
  onChange: (ids: string[]) => void
}) {
  const personel = usePersonelList()
  const liste = useMemo(() => {
    const aktifler = (personel.data ?? []).filter((p) => p.aktif)
    return [
      ...aktifler.filter((p) => p.id === kullaniciId),
      ...aktifler.filter((p) => p.id !== kullaniciId),
    ]
  }, [personel.data, kullaniciId])

  const secili = new Set(
    value.map((v) => (v === "benim" ? (kullaniciId ?? v) : v))
  )
  const degistir = (id: string, sec: boolean) => {
    const next = new Set(secili)
    if (sec) next.add(id)
    else next.delete(id)
    onChange([...next])
  }

  const gorunur = liste.slice(0, GORUNUR_AVATAR)
  const fazla = liste.slice(GORUNUR_AVATAR)
  const fazlaSecili = fazla.filter((p) => secili.has(p.id)).length

  if (liste.length === 0) return null

  return (
    <div
      role="group"
      aria-label="Atanan kişiye göre filtrele"
      className="flex shrink-0 items-center gap-1"
    >
      <div className="flex items-center -space-x-1.5">
        {gorunur.map((p) => {
          const ad = `${p.ad} ${p.soyad}${p.id === kullaniciId ? " (siz)" : ""}`
          const aktif = secili.has(p.id)
          return (
            <Tooltip key={p.id}>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    aria-pressed={aktif}
                    aria-label={ad}
                    onClick={() => degistir(p.id, !aktif)}
                    className={cn(
                      "relative rounded-full ring-2 ring-background transition outline-none hover:z-20 hover:-translate-y-0.5 hover:opacity-100 focus-visible:z-20 focus-visible:ring-ring/60",
                      aktif &&
                        "z-10 ring-primary ring-offset-2 ring-offset-background",
                      // Seçim varken seçilmeyenler soluklaşır
                      secili.size > 0 && !aktif && "opacity-50"
                    )}
                  />
                }
              >
                <PersonelAvatar personel={p} />
              </TooltipTrigger>
              <TooltipContent>{ad}</TooltipContent>
            </Tooltip>
          )
        })}
        {fazla.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  aria-label={`Diğer ${fazla.length} kişi`}
                  className={cn(
                    "relative flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium ring-2 ring-background outline-none hover:z-20 focus-visible:ring-ring/60",
                    fazlaSecili > 0 && "z-10 ring-primary"
                  )}
                />
              }
            >
              +{fazla.length}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-48">
              {fazla.map((p) => (
                <DropdownMenuCheckboxItem
                  key={p.id}
                  checked={secili.has(p.id)}
                  onCheckedChange={(c) => degistir(p.id, c)}
                >
                  <PersonelAvatar personel={p} size="sm" />
                  {p.ad} {p.soyad}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {secili.size > 0 && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Atanan filtresini temizle"
          onClick={() => onChange([])}
        >
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
        </Button>
      )}
    </div>
  )
}
