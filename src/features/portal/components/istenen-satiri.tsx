import { HugeiconsIcon } from "@hugeicons/react"
import {
  Camera01Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  Upload04Icon,
} from "@hugeicons/core-free-icons"

import { Button, buttonVariants } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { DosyaIkonu } from "@/features/arsiv/components/dosya-gorsel"
import { DOSYA_ACCEPT, formatBoyut } from "@/features/arsiv/kurallar"
import { ISTENEN_EVRAKLAR } from "@/features/evrak-talebi/sabitler"
import { cn } from "@/lib/utils"
import type { PortalYukleme } from "@/types/api"
import type { IstenenEvrak } from "@/types/domain"

export interface YerelYukleme {
  key: string
  istenen: IstenenEvrak
  ad: string
  mimeType: string
  /** 0-100; hazırlanırken (küçültme) null */
  ilerleme: number | null
  hata?: string
}

function DosyaSecici({
  istenen,
  kamera,
  onDosyalar,
}: {
  istenen: IstenenEvrak
  kamera?: boolean
  onDosyalar: (files: File[]) => void
}) {
  const ad = ISTENEN_EVRAKLAR[istenen].ad
  return (
    <label
      className={cn(
        buttonVariants({ variant: kamera ? "default" : "outline", size: "sm" }),
        "has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50"
      )}
    >
      <HugeiconsIcon
        icon={kamera ? Camera01Icon : Upload04Icon}
        strokeWidth={2}
        data-icon="inline-start"
      />
      {kamera ? "Fotoğraf çek" : "Dosya seç"}
      <input
        type="file"
        className="sr-only"
        aria-label={`${ad}: ${kamera ? "fotoğraf çek" : "dosya seç"}`}
        accept={kamera ? "image/*" : DOSYA_ACCEPT}
        capture={kamera ? "environment" : undefined}
        multiple={!kamera}
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          e.target.value = ""
          if (files.length) onDosyalar(files)
        }}
      />
    </label>
  )
}

export function IstenenSatiri({
  istenen,
  yuklemeler,
  yerel,
  onDosyalar,
  onSil,
  onYerelKaldir,
}: {
  istenen: IstenenEvrak
  yuklemeler: PortalYukleme[]
  yerel: YerelYukleme[]
  onDosyalar: (files: File[], istenen: IstenenEvrak) => void
  onSil: (id: string) => void
  onYerelKaldir: (key: string) => void
}) {
  const tanim = ISTENEN_EVRAKLAR[istenen]
  const tamam = yuklemeler.some((y) => y.durum !== "REDDEDILDI")
  const reddedilen = yuklemeler.some((y) => y.durum === "REDDEDILDI") && !tamam

  return (
    <li
      aria-label={tanim.ad}
      className={cn(
        "grid gap-3 rounded-2xl border bg-card p-4",
        reddedilen && "border-destructive/40",
        tamam && "border-emerald-500/40"
      )}
    >
      <div className="flex items-start gap-3">
        <HugeiconsIcon
          icon={CheckmarkCircle02Icon}
          strokeWidth={2}
          aria-label={tamam ? "Yüklendi" : "Bekleniyor"}
          className={cn(
            "mt-0.5 size-5 shrink-0",
            tamam
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-muted-foreground/40"
          )}
        />
        <div className="grid min-w-0 flex-1 leading-snug">
          <span className="font-medium">{tanim.ad}</span>
          {tanim.ipucu && (
            <span className="text-xs text-muted-foreground">{tanim.ipucu}</span>
          )}
        </div>
      </div>

      {(yuklemeler.length > 0 || yerel.length > 0) && (
        <ul className="grid gap-2" aria-label={`${tanim.ad} dosyaları`}>
          {yuklemeler.map((y) => (
            <li key={y.id} className="flex items-center gap-3">
              <DosyaIkonu mimeType={y.mimeType} className="size-8" />
              <div className="grid min-w-0 flex-1 leading-snug">
                <span className="truncate text-sm">{y.ad}</span>
                <span
                  className={cn(
                    "text-xs",
                    y.durum === "REDDEDILDI"
                      ? "text-destructive"
                      : y.durum === "ONAYLANDI"
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-muted-foreground"
                  )}
                >
                  {y.durum === "REDDEDILDI"
                    ? `Reddedildi: ${y.redNedeni ?? ""} — lütfen tekrar yükleyin`
                    : y.durum === "ONAYLANDI"
                      ? "Onaylandı"
                      : `Yüklendi · ${formatBoyut(y.boyut)}`}
                </span>
              </div>
              {y.durum === "BEKLIYOR" && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`${y.ad} sil`}
                  onClick={() => onSil(y.id)}
                >
                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                </Button>
              )}
            </li>
          ))}
          {yerel.map((y) => (
            <li key={y.key} className="flex items-center gap-3">
              <DosyaIkonu mimeType={y.mimeType} className="size-8" />
              <div className="grid min-w-0 flex-1 gap-1 leading-snug">
                <span className="truncate text-sm">{y.ad}</span>
                {y.hata ? (
                  <span className="text-xs text-destructive">{y.hata}</span>
                ) : (
                  <Progress
                    value={y.ilerleme ?? 0}
                    aria-label={`${y.ad} yükleniyor`}
                  />
                )}
              </div>
              {y.hata && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => onYerelKaldir(y.key)}
                >
                  Kaldır
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-2 gap-2">
        <DosyaSecici
          istenen={istenen}
          kamera
          onDosyalar={(f) => onDosyalar(f, istenen)}
        />
        <DosyaSecici
          istenen={istenen}
          onDosyalar={(f) => onDosyalar(f, istenen)}
        />
      </div>
    </li>
  )
}
