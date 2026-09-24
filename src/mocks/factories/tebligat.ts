import type { Faker } from "@faker-js/faker"
import { addDays } from "date-fns"

import { fromYmd, toYmd } from "@/lib/tarih"
import type {
  Mukellef,
  Tebligat,
  TebligatDurum,
  TebligatPostaKutusu,
  TebligatTur,
} from "@/types/domain"

const KONU: Record<TebligatTur, string[]> = {
  ODEME_EMRI: ["Ödeme Emri", "KDV borcu ödeme emri"],
  VERGI_CEZA_IHBARNAMESI: [
    "Vergi/Ceza İhbarnamesi",
    "Usulsüzlük cezası ihbarnamesi",
  ],
  IZAHA_DAVET: ["İzaha Davet Yazısı", "Sahte belge riski izaha davet"],
  BILGI_ISTEME: ["Bilgi İsteme Yazısı", "Ba-Bs mutabakat bilgi isteme"],
  INCELEME: ["Defter ve Belgelerin İbrazı"],
  DIGER: ["Bilgilendirme Yazısı", "Mükellefiyet bilgilendirmesi"],
}

/** Sabit örnekler: süre ekranında her durum görünsün (bugün ≈ 2026-09-23) */
const SABITLER: {
  tur: TebligatTur
  ulasma: string
  durum: TebligatDurum
  eslesmeyen?: boolean
  sgk?: boolean
}[] = [
  // Son günü yaklaşan (acil)
  { tur: "ODEME_EMRI", ulasma: "2026-09-05", durum: "YENI" },
  { tur: "IZAHA_DAVET", ulasma: "2026-09-06", durum: "INCELENDI" },
  // Süresi geçmiş, hâlâ açık
  { tur: "ODEME_EMRI", ulasma: "2026-08-03", durum: "INCELENDI" },
  // Yeni düşenler
  { tur: "VERGI_CEZA_IHBARNAMESI", ulasma: "2026-09-21", durum: "YENI" },
  { tur: "BILGI_ISTEME", ulasma: "2026-09-18", durum: "YENI", sgk: true },
  // Eşleşmeyen VKN
  { tur: "ODEME_EMRI", ulasma: "2026-09-19", durum: "YENI", eslesmeyen: true },
  { tur: "DIGER", ulasma: "2026-09-12", durum: "YENI", eslesmeyen: true },
]

export interface TebligatSeed {
  tebligat: Tebligat[]
  postaKutusu: TebligatPostaKutusu[]
}

/** Son 90 günde ~25 tebligat; eskiler çoğunlukla işlem görmüş, yenileri açık */
export function createTebligatVerisi(
  faker: Faker,
  mukellefler: Mukellef[],
  personelIds: string[]
): TebligatSeed {
  const aktifler = mukellefler.filter((m) => m.aktif)
  let sira = 0
  const tebligat: Tebligat[] = []
  const ekle = (
    tur: TebligatTur,
    ulasmaYmd: string,
    durum: TebligatDurum,
    { eslesmeyen = false, sgk = false } = {}
  ) => {
    sira++
    const m = faker.helpers.arrayElement(aktifler)
    const ulasma = fromYmd(ulasmaYmd)
    ulasma.setHours(faker.number.int({ min: 8, max: 18 }), 15)
    tebligat.push({
      id: `tb_${String(sira).padStart(3, "0")}`,
      mukellefId: eslesmeyen ? undefined : m.id,
      vkn: eslesmeyen
        ? faker.helpers.arrayElement(["4840847211", "7250331843"])
        : (m.vkn ?? m.tckn)!,
      kurum: sgk && !eslesmeyen ? "SGK" : "GIB",
      tur,
      konu: faker.helpers.arrayElement(KONU[tur]),
      belgeNo: `${ulasmaYmd.slice(0, 4)}-${faker.string.numeric(8)}`,
      ulasmaTarihi: ulasma.toISOString(),
      durum,
      atananId:
        durum === "YENI" || eslesmeyen ? undefined : m.sorumluPersonelId,
      not:
        durum === "ISLEM_YAPILDI"
          ? faker.helpers.arrayElement([
              "Ödeme yapıldı, dekont arşivde.",
              "İzah dilekçesi verildi.",
              "Uzlaşma talebinde bulunuldu.",
            ])
          : undefined,
      kaynak: "EPOSTA",
      epostaMesajId: `<seed-${sira}@posta>`,
      olusturmaTarihi: ulasma.toISOString(),
    })
  }

  for (const s of SABITLER)
    ekle(s.tur, s.ulasma, s.durum, { eslesmeyen: s.eslesmeyen, sgk: s.sgk })

  const turler: TebligatTur[] = [
    "ODEME_EMRI",
    "ODEME_EMRI",
    "VERGI_CEZA_IHBARNAMESI",
    "IZAHA_DAVET",
    "BILGI_ISTEME",
    "INCELEME",
    "DIGER",
  ]
  for (let i = 0; i < 18; i++) {
    const gun = faker.number.int({ min: 20, max: 90 })
    const ulasma = addDays(fromYmd("2026-09-22"), -gun)
    ekle(
      faker.helpers.arrayElement(turler),
      toYmd(ulasma),
      faker.helpers.weightedArrayElement([
        { value: "ISLEM_YAPILDI" as const, weight: 6 },
        { value: "KAPANDI" as const, weight: 3 },
      ]),
      { sgk: faker.number.float() < 0.15 }
    )
  }

  tebligat.sort((a, b) => b.ulasmaTarihi.localeCompare(a.ulasmaTarihi))
  return {
    tebligat,
    postaKutusu: [
      {
        id: "pk_1",
        durum: "BAGLI",
        sunucu: "imap.yandex.com.tr",
        port: 993,
        kullanici: "tebligat@primemusavirlik.com.tr",
        klasor: "INBOX",
        sifreIpucu: "x7Qa",
        sonUid: 1000,
        sonTarama: "2026-09-22T07:30:00.000Z",
        baglayanId: personelIds[0],
        baglanmaTarihi: "2026-01-10T09:00:00.000Z",
      },
    ],
  }
}
