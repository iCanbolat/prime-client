/**
 * Evrak talebi mesajları: şablon doldurma, telefon normalizasyonu ve paylaşım bağlantıları.
 * Saf fonksiyonlar (UI ve testler).
 */
import { ISTENEN_EVRAKLAR } from "@/features/evrak-talebi/sabitler"
import { formatDate, formatDonem } from "@/lib/format"
import type { IstenenEvrak } from "@/types/domain"

export const SABLON_DEGISKENLERI = [
  { ad: "unvan", aciklama: "Mükellef unvanı" },
  { ad: "buro", aciklama: "Büro adı" },
  { ad: "donem", aciklama: "Dönem (ör. Eylül 2026)" },
  { ad: "evraklar", aciklama: "İstenen evraklar" },
  { ad: "link", aciklama: "Yükleme bağlantısı" },
  { ad: "sonTarih", aciklama: "Son yükleme günü" },
  { ad: "neden", aciklama: "Red nedeni (red şablonu)" },
] as const

export type SablonDegiskenleri = Partial<
  Record<(typeof SABLON_DEGISKENLERI)[number]["ad"], string>
>

/** `{degisken}` yer tutucularını doldurur; bilinmeyen/boş değişkenler olduğu gibi kalmaz, boşaltılır. */
export function mesajOlustur(
  sablon: string,
  degiskenler: SablonDegiskenleri
): string {
  return sablon
    .replace(/\{(\w+)\}/g, (_, ad: string) =>
      ad in degiskenler
        ? (degiskenler[ad as keyof SablonDegiskenleri] ?? "")
        : ""
    )
    .replace(/[ \t]{2,}/g, " ")
    .trim()
}

/** Talep verisinden şablon değişkenleri */
export function talepDegiskenleri(t: {
  mukellefUnvan: string
  buroAd: string
  donem?: string
  istenenler: IstenenEvrak[]
  link: string
  sonKullanma: string
  neden?: string
}): SablonDegiskenleri {
  return {
    unvan: t.mukellefUnvan,
    buro: t.buroAd,
    donem: t.donem ? formatDonem(t.donem) : "ilgili",
    evraklar: t.istenenler
      .map((i) => ISTENEN_EVRAKLAR[i].ad.toLocaleLowerCase("tr-TR"))
      .join(", "),
    link: t.link,
    sonTarih: formatDate(t.sonKullanma),
    neden: t.neden,
  }
}

/**
 * Türkiye cep telefonunu uluslararası rakam dizisine çevirir: "0532 123 45 67" / "+90 532..." /
 * "532..." → "905321234567". Geçersizse null.
 */
export function telefonNormalize(telefon: string): string | null {
  const rakamlar = telefon.replace(/\D/g, "")
  let yerel: string
  if (rakamlar.length === 12 && rakamlar.startsWith("90"))
    yerel = rakamlar.slice(2)
  else if (rakamlar.length === 11 && rakamlar.startsWith("0"))
    yerel = rakamlar.slice(1)
  else if (rakamlar.length === 10) yerel = rakamlar
  else return null
  return `90${yerel}`
}

export function whatsappLinki(telefon: string, mesaj: string): string | null {
  const numara = telefonNormalize(telefon)
  return numara
    ? `https://wa.me/${numara}?text=${encodeURIComponent(mesaj)}`
    : null
}

export function smsLinki(telefon: string, mesaj: string): string | null {
  const numara = telefonNormalize(telefon)
  return numara ? `sms:+${numara}?body=${encodeURIComponent(mesaj)}` : null
}

export function portalLinki(
  token: string,
  origin: string = window.location.origin
) {
  return `${origin}/p/${token}`
}
