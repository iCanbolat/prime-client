import {
  Alert02Icon,
  AtIcon,
  Folder01Icon,
  InboxDownloadIcon,
  Invoice03Icon,
  LegalDocument01Icon,
  MoneyReceive02Icon,
  Settings01Icon,
  TaskDone01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons"

import type { BildirimTur } from "@/types/domain"

type Ikon = typeof TaskDone01Icon

export type BildirimKategori =
  | "gorev"
  | "anilma"
  | "evrak"
  | "ebelge"
  | "arsiv"
  | "mukellef"
  | "tahsilat"
  | "tebligat"
  | "uyari"
  | "sistem"

/** Kategori → ikon ve ikon rozetinin rengi */
export const BILDIRIM_GORUNUM: Record<
  BildirimKategori,
  { icon: Ikon; className: string; etiket: string }
> = {
  gorev: {
    icon: TaskDone01Icon,
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    etiket: "Görev",
  },
  anilma: {
    icon: AtIcon,
    className: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    etiket: "Anılma",
  },
  evrak: {
    icon: InboxDownloadIcon,
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    etiket: "Evrak",
  },
  ebelge: {
    icon: Invoice03Icon,
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    etiket: "e-Belge",
  },
  arsiv: {
    icon: Folder01Icon,
    className: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    etiket: "Arşiv",
  },
  mukellef: {
    icon: UserIcon,
    className: "bg-muted text-foreground",
    etiket: "Mükellef",
  },
  tahsilat: {
    icon: MoneyReceive02Icon,
    className: "bg-teal-500/10 text-teal-700 dark:text-teal-400",
    etiket: "Tahsilat",
  },
  tebligat: {
    icon: LegalDocument01Icon,
    className: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
    etiket: "e-Tebligat",
  },
  uyari: {
    icon: Alert02Icon,
    className: "bg-destructive/10 text-destructive",
    etiket: "Hatırlatma",
  },
  sistem: {
    icon: Settings01Icon,
    className: "bg-muted text-muted-foreground",
    etiket: "Sistem",
  },
}

const OZEL: Partial<Record<BildirimTur, BildirimKategori>> = {
  GOREV_ANILDI: "anilma",
  GOREV_GECIKTI: "uyari",
  BELGE_GECERLILIK: "uyari",
  EFATURA_YANIT_SURESI: "uyari",
  BEYAN_YAKLASIYOR: "uyari",
  EFATURA_REDDEDILDI: "uyari",
  ENTEGRATOR_BAGLANTI_KALDIRILDI: "uyari",
  SIFRE_SILINDI: "uyari",
  SABLON_GUNCELLENDI: "sistem",
  BEYAN_DURUMU_GUNCELLENDI: "gorev",
}

/** Tür önekinden kategori türetilir; istisnalar `OZEL` tablosunda. */
export function turKategorisi(tur: BildirimTur): BildirimKategori {
  const ozel = OZEL[tur]
  if (ozel) return ozel
  if (tur.startsWith("GOREV_") || tur.startsWith("DONEM_")) return "gorev"
  if (tur.startsWith("EVRAK_") || tur.startsWith("TALEP_")) return "evrak"
  if (
    tur.startsWith("EBELGE_") ||
    tur.startsWith("EFATURA_") ||
    tur.startsWith("ENTEGRATOR_")
  )
    return "ebelge"
  if (tur.startsWith("ARSIV_")) return "arsiv"
  if (tur.startsWith("MUKELLEF_")) return "mukellef"
  if (tur.startsWith("TEBLIGAT_") || tur.startsWith("POSTA_KUTUSU_"))
    return "tebligat"
  if (
    tur.startsWith("TAHSILAT_") ||
    tur.startsWith("ODEME_") ||
    tur.startsWith("KESINTI_") ||
    tur === "UCRET_GUNCELLENDI"
  )
    return "tahsilat"
  return "sistem"
}
