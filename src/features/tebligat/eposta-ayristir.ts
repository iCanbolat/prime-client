/**
 * GİB / SGK e-Tebligat bildirim e-postası ayrıştırıcısı — saf fonksiyon; backend'in posta tarama
 * servisi aynen kullanabilir.
 *
 * Bildirim e-postası tebligatın kendisini değil, elektronik adrese belge düştüğünü haber verir:
 * konu ve gövdeden mükellefin VKN/TCKN'si, belge türü, sayısı ve ulaşma zamanı çıkarılır.
 * Not: aşağıdaki kalıplar varsayımsal örnek metinlerle yazıldı; gerçek bildirim e-postalarıyla
 * kalibre edilmelidir.
 */
import { normalize } from "@/features/ice-aktarim/tahakkuk"
import type { TebligatKurum, TebligatTur } from "@/types/domain"

export interface TebligatEpostasi {
  /** IMAP mesaj kimliği (Message-ID) */
  mesajId: string
  gonderen: string
  konu: string
  govde: string
  /** Mesajın alındığı an (ISO) */
  tarih: string
}

export interface AyrisanTebligat {
  vkn: string
  kurum: TebligatKurum
  tur: TebligatTur
  konu: string
  belgeNo?: string
  ulasmaTarihi: string
}

/** Sıra önemli: daha özgül ifade önce */
const TUR_KALIPLARI: [TebligatTur, RegExp][] = [
  ["ODEME_EMRI", /ODEME EMRI/],
  [
    "VERGI_CEZA_IHBARNAMESI",
    /(VERGI\/CEZA|VERGI ZIYAI|CEZA) IHBARNAME|IHBARNAME/,
  ],
  ["IZAHA_DAVET", /IZAHA DAVET/],
  ["BILGI_ISTEME", /BILGI (ISTEME|TALEP)|BILGI VE BELGE (ISTEME|TALEP)/],
  ["INCELEME", /INCELEME|DEFTER VE BELGE(LERIN)? IBRAZ/],
]

const TEBLIGAT_RE = /E-?TEBLIGAT|ELEKTRONIK TEBLIGAT/
/** "0174520662 vergi kimlik numaralı …" */
const ONCE_NUMARA_RE =
  /(?<!\d)(\d{10,11})\s+(?:VERGI |T\.?C\.? )?KIMLIK (?:NO(?:LU)?|NUMARALI)/
/** "VKN: 0174520662" */
const ETIKETLI_VKN_RE =
  /(?:VKN|TCKN|KIMLIK (?:NO|NUMARASI))\s*[:：]?\s*(\d{10,11})(?!\d)/
const VKN_RE = /(?<!\d)(\d{10}|\d{11})(?!\d)/
const BELGE_NO_RE =
  /(?:SAYI|SAYISI|BELGE NO|EVRAK NO|BELGE NUMARASI)\s*[:：]?\s*([A-Z0-9][A-Z0-9./-]{3,})/
const TARIH_RE = /(\d{2})[./](\d{2})[./](\d{4})(?:\s+(\d{2}):(\d{2}))?/

/** "Konu: …" satırı ya da tırnak içindeki belge konusu */
function konuBul(ham: string): string | undefined {
  const satir = /Konu(?:su)?\s*[:：]\s*(.+)/i.exec(ham)?.[1]
  if (satir) return satir.trim()
  const tirnak = /["“']([^"”']{6,120})["”']\s*konulu/i.exec(ham)?.[1]
  return tirnak?.trim()
}

/** Tebligat bildirimi değilse null */
export function tebligatEpostasiAyristir(
  e: TebligatEpostasi
): AyrisanTebligat | null {
  const ham = `${e.konu}\n${e.govde}`
  const metin = normalize(ham)
  if (!TEBLIGAT_RE.test(metin)) return null
  const vkn = (ONCE_NUMARA_RE.exec(metin) ??
    ETIKETLI_VKN_RE.exec(metin) ??
    VKN_RE.exec(metin))?.[1]
  if (!vkn) return null

  const kurum: TebligatKurum =
    /SOSYAL GUVENLIK|SGK/.test(metin) || /sgk\.gov\.tr/i.test(e.gonderen)
      ? "SGK"
      : "GIB"
  const tur = TUR_KALIPLARI.find(([, re]) => re.test(metin))?.[0] ?? "DIGER"

  // Gövdede belgenin elektronik adrese ulaştığı an yazıyorsa o, yoksa e-postanın tarihi
  let ulasmaTarihi = e.tarih
  const t = TARIH_RE.exec(e.govde)
  if (t) {
    const [, g, a, y, s = "09", d = "00"] = t
    const tarih = new Date(
      Number(y),
      Number(a) - 1,
      Number(g),
      Number(s),
      Number(d)
    )
    if (!Number.isNaN(tarih.getTime())) ulasmaTarihi = tarih.toISOString()
  }

  return {
    vkn,
    kurum,
    tur,
    konu: konuBul(ham) ?? e.konu.trim(),
    belgeNo: BELGE_NO_RE.exec(metin)?.[1],
    ulasmaTarihi,
  }
}
