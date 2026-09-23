import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  Upload04Icon,
  WhatsappIcon,
} from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import { ARSIV_KATEGORI_ETIKET, type ArsivKategori } from "@/types/domain"

/** Mükellef türüne göre arşivde olması gereken ama bulunmayan evraklar. */
export function EksikEvraklar({
  eksikler,
  onYukle,
  onEvrakIste,
}: {
  eksikler: ArsivKategori[]
  onYukle: (kategori: ArsivKategori) => void
  /** Müşteriden evrak talebi oluştur (tek tıkla, eksik kategoriler seçili) */
  onEvrakIste: (kategoriler: ArsivKategori[]) => void
}) {
  if (eksikler.length === 0) return null
  return (
    <section
      aria-label="Eksik zorunlu evraklar"
      className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300">
          <HugeiconsIcon
            icon={Alert02Icon}
            strokeWidth={2}
            className="size-4"
          />
        </span>
        <div className="grid min-w-0 flex-1 gap-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="leading-snug">
              <h2 className="text-sm font-medium">Eksik zorunlu evraklar</h2>
              <p className="text-xs text-muted-foreground">
                Bu mükellef türü için arşivde bulunması gereken belgeler
              </p>
            </div>
            {eksikler.length > 1 && (
              <Button size="xs" onClick={() => onEvrakIste(eksikler)}>
                <HugeiconsIcon
                  icon={WhatsappIcon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
                Tümünü müşteriden iste
              </Button>
            )}
          </div>
          <ul className="grid gap-2">
            {eksikler.map((k) => (
              <li key={k} className="flex flex-wrap items-center gap-2">
                <span className="min-w-0 flex-1 text-sm">
                  {ARSIV_KATEGORI_ETIKET[k]}
                </span>
                <Button size="xs" variant="outline" onClick={() => onYukle(k)}>
                  <HugeiconsIcon
                    icon={Upload04Icon}
                    strokeWidth={2}
                    data-icon="inline-start"
                  />
                  Yükle
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => onEvrakIste([k])}
                >
                  Evrak iste
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
