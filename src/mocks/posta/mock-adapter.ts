/**
 * `PostaAdapter`'ın geliştirme / test uygulaması. Gerçek IMAP kutusunu taklit eder:
 * - Doğrulama: "hatali" içeren şifre veya sunucu reddedilir (demo/test için).
 * - Artımlı okuma: her çağrıda 0–2 yeni GİB/SGK bildirim e-postası "düşer" (adet son UID'den
 *   deterministik); ara sıra tebligat olmayan bir e-posta ve eşleşmeyen VKN'li bir bildirim gelir.
 */
import { Faker, base, en, tr } from "@faker-js/faker"
import { format, subHours } from "date-fns"

import type { TebligatEpostasi } from "@/features/tebligat/eposta-ayristir"
import type { PostaAdapter } from "@/features/tebligat/posta-adapter"
import { db } from "@/mocks/db"
import { karma } from "@/mocks/karma"
import type { TebligatKurum, TebligatTur } from "@/types/domain"

const TUR_METNI: Record<TebligatTur, string> = {
  ODEME_EMRI: "Ödeme Emri",
  VERGI_CEZA_IHBARNAMESI: "Vergi/Ceza İhbarnamesi",
  IZAHA_DAVET: "İzaha Davet Yazısı",
  BILGI_ISTEME: "Bilgi İsteme Yazısı",
  INCELEME: "Defter ve Belgelerin İbrazı",
  DIGER: "Bilgilendirme Yazısı",
}

export interface EpostaSecenek {
  mesajId: string
  vkn: string
  unvan: string
  tur: TebligatTur
  kurum: TebligatKurum
  belgeNo: string
  /** Belgenin elektronik adrese ulaştığı an */
  ulasma: Date
}

/** GİB/SGK bildirim e-postası (varsayımsal düzen; ayrıştırıcı bununla test edilir) */
export function tebligatEpostasiOlustur(s: EpostaSecenek): TebligatEpostasi {
  const kurumAdi =
    s.kurum === "SGK" ? "Sosyal Güvenlik Kurumu" : "Gelir İdaresi Başkanlığı"
  return {
    mesajId: s.mesajId,
    gonderen:
      s.kurum === "SGK" ? "etebligat@sgk.gov.tr" : "etebligat@gib.gov.tr",
    konu: `e-Tebligat Bildirimi - ${TUR_METNI[s.tur]}`,
    govde: [
      "Sayın Mükellefimiz,",
      `${s.vkn} vergi kimlik numaralı ${s.unvan} adına ${kurumAdi} tarafından elektronik tebligat adresinize ${format(s.ulasma, "dd.MM.yyyy HH:mm")} tarihinde belge gönderilmiştir.`,
      `Konu: ${TUR_METNI[s.tur]}`,
      `Belge No: ${s.belgeNo}`,
      "Tebligat, elektronik adrese ulaştığı tarihi izleyen beşinci günün sonunda tebliğ edilmiş sayılır.",
    ].join("\n"),
    tarih: s.ulasma.toISOString(),
  }
}

const TURLER: TebligatTur[] = [
  "ODEME_EMRI",
  "VERGI_CEZA_IHBARNAMESI",
  "IZAHA_DAVET",
  "BILGI_ISTEME",
  "INCELEME",
  "DIGER",
]

export const mockPostaAdapter: PostaAdapter = {
  async baglantiDogrula(k) {
    if (/hatali/i.test(k.sifre) || /hatali/i.test(k.sunucu))
      return {
        gecerli: false,
        hataMesaji: "IMAP oturumu açılamadı: kullanıcı adı veya şifre hatalı",
      }
    return { gecerli: true }
  },

  async yeniMesajlar(_k, sonUid) {
    const faker = new Faker({ locale: [tr, en, base] })
    faker.seed(karma(`posta:${sonUid}`))
    const adet = faker.helpers.weightedArrayElement([
      { value: 0, weight: 2 },
      { value: 1, weight: 3 },
      { value: 2, weight: 2 },
    ])
    const aktifler = db.mukellef.where((m) => m.aktif)
    const simdi = new Date()
    const mesajlar: TebligatEpostasi[] = []
    for (let i = 0; i < adet; i++) {
      const uid = sonUid + i + 1
      const ulasma = subHours(simdi, faker.number.int({ min: 1, max: 30 }))
      if (faker.number.float() < 0.1) {
        mesajlar.push({
          mesajId: `<uid-${uid}@posta>`,
          gonderen: "bulten@ornek.com",
          konu: "Haftalık mevzuat bülteni",
          govde: "Bu hafta yayımlanan tebliğler…",
          tarih: ulasma.toISOString(),
        })
        continue
      }
      const eslesmeyen = faker.number.float() < 0.12
      const m = faker.helpers.arrayElement(aktifler)
      const kurum: TebligatKurum =
        m?.sgkIsyeriVar && faker.number.float() < 0.25 ? "SGK" : "GIB"
      mesajlar.push(
        tebligatEpostasiOlustur({
          mesajId: `<uid-${uid}@posta>`,
          vkn: eslesmeyen || !m ? "4840847211" : (m.vkn ?? m.tckn)!,
          unvan: eslesmeyen || !m ? "Kayıtsız Mükellef" : m.unvan,
          tur: faker.helpers.arrayElement(TURLER),
          kurum,
          belgeNo: `${format(ulasma, "yyyy")}-${faker.string.numeric(8)}`,
          ulasma,
        })
      )
    }
    return { mesajlar, sonUid: sonUid + adet }
  },
}
