import { Link } from "react-router"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export interface Kpi {
  label: string
  value: number | undefined
  aciklama: string
  icon: IconSvgElement
  to: string
  ton?: "tehlike" | "uyari"
}

/** Tek kart içinde, ince çizgilerle ayrılmış tıklanabilir gösterge hücreleri. */
export function KpiSeridi({ kpiler }: { kpiler: Kpi[] }) {
  return (
    <div className="@container">
      <ul
        aria-label="Özet"
        className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-border shadow-md ring-1 ring-foreground/5 @xl:grid-cols-3 @5xl:grid-cols-6 dark:ring-foreground/10"
      >
        {kpiler.map((k) => {
          const vurgu = k.value !== undefined && k.value > 0 ? k.ton : undefined
          return (
            <li
              key={k.label}
              data-slot="kpi"
              className="bg-card last:odd:col-span-2 @xl:last:odd:col-span-1"
            >
              <Link
                to={k.to}
                className="group flex h-full flex-col gap-2 p-4 outline-none hover:bg-muted/40 focus-visible:bg-muted/60"
              >
                <span className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                  {k.label}
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground",
                      vurgu === "tehlike" &&
                        "bg-destructive/10 text-destructive",
                      vurgu === "uyari" &&
                        "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                    )}
                  >
                    <HugeiconsIcon
                      icon={k.icon}
                      strokeWidth={2}
                      className="size-4"
                    />
                  </span>
                </span>
                <span
                  className={cn(
                    "font-heading text-3xl font-semibold tracking-tight tabular-nums",
                    vurgu === "tehlike" && "text-destructive",
                    vurgu === "uyari" && "text-amber-800 dark:text-amber-300"
                  )}
                >
                  {k.value === undefined ? (
                    <Skeleton className="h-9 w-14" />
                  ) : (
                    k.value
                  )}
                </span>
                <span className="text-xs text-muted-foreground group-hover:text-foreground">
                  {k.aciklama}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
