import { describe, expect, it } from "vitest"

import { tebligatEpostasiAyristir } from "@/features/tebligat/eposta-ayristir"
import {
  sonIslemTarihi,
  sureDurumu,
  tebligTarihi,
} from "@/features/tebligat/kurallar"
import { tebligatEpostasiOlustur } from "@/mocks/posta/mock-adapter"

/** Yerel saatle ulaşma anı (ISO) */
const ulasma = (ymd: string, saat = 10) =>
  new Date(`${ymd}T${String(saat).padStart(2, "0")}:00:00`).toISOString()

describe("e-Tebligat süreleri", () => {
  it("tebliğ, ulaşmayı izleyen 5. gün", () => {
    expect(tebligTarihi(ulasma("2026-09-05"))).toBe("2026-09-10")
    expect(tebligTarihi(ulasma("2026-12-29", 23))).toBe("2027-01-03")
  })

  it("son gün tebliğ + türün süresi; hafta sonu ve resmi tatil kaydırılır", () => {
    const t = (
      tur: "ODEME_EMRI" | "VERGI_CEZA_IHBARNAMESI" | "DIGER",
      ymd: string
    ) => sonIslemTarihi({ tur, ulasmaTarihi: ulasma(ymd) })
    expect(t("ODEME_EMRI", "2026-09-05")).toBe("2026-09-25")
    // 27 Eylül Pazar → Pazartesi
    expect(t("ODEME_EMRI", "2026-09-07")).toBe("2026-09-28")
    // 29 Ekim Cumhuriyet Bayramı → 30 Ekim
    expect(t("ODEME_EMRI", "2026-10-09")).toBe("2026-10-30")
    expect(t("VERGI_CEZA_IHBARNAMESI", "2026-09-05")).toBe("2026-10-12")
    // Süresi izlenmeyen tür
    expect(t("DIGER", "2026-09-05")).toBeUndefined()
    // Yazıdaki özel süre
    expect(
      sonIslemTarihi({
        tur: "BILGI_ISTEME",
        sureGun: 30,
        ulasmaTarihi: ulasma("2026-09-05"),
      })
    ).toBe("2026-10-12")
  })

  it("acil / gecikti yalnızca açık tebligatta", () => {
    const base = {
      tur: "ODEME_EMRI" as const,
      ulasmaTarihi: ulasma("2026-09-05"),
    }
    expect(sureDurumu({ ...base, durum: "YENI" }, "2026-09-23")).toMatchObject({
      kalanGun: 2,
      acil: true,
      gecikti: false,
    })
    expect(
      sureDurumu({ ...base, durum: "INCELENDI" }, "2026-09-26")
    ).toMatchObject({
      kalanGun: -1,
      gecikti: true,
      acil: false,
    })
    expect(
      sureDurumu({ ...base, durum: "ISLEM_YAPILDI" }, "2026-09-26")
    ).toMatchObject({
      acik: false,
      gecikti: false,
    })
  })
})

describe("bildirim e-postası ayrıştırma", () => {
  it("VKN, tür, kurum, belge no ve ulaşma anını çıkarır", () => {
    const e = tebligatEpostasiOlustur({
      mesajId: "<1@x>",
      vkn: "0174520662",
      unvan: "Çınar Yazılım 1234567890 Ltd.",
      tur: "IZAHA_DAVET",
      kurum: "GIB",
      belgeNo: "2026-00012345",
      ulasma: new Date(2026, 8, 20, 14, 30),
    })
    expect(tebligatEpostasiAyristir(e)).toEqual({
      vkn: "0174520662",
      kurum: "GIB",
      tur: "IZAHA_DAVET",
      konu: "İzaha Davet Yazısı",
      belgeNo: "2026-00012345",
      ulasmaTarihi: new Date(2026, 8, 20, 14, 30).toISOString(),
    })
  })

  it("SGK ve ihbarname tanınır; tebligat olmayan e-posta null", () => {
    const sgk = tebligatEpostasiOlustur({
      mesajId: "<2@x>",
      vkn: "10000000146",
      unvan: "Ali Veli",
      tur: "VERGI_CEZA_IHBARNAMESI",
      kurum: "SGK",
      belgeNo: "2026-1",
      ulasma: new Date(2026, 8, 20),
    })
    expect(tebligatEpostasiAyristir(sgk)).toMatchObject({
      vkn: "10000000146",
      kurum: "SGK",
      tur: "VERGI_CEZA_IHBARNAMESI",
    })
    expect(
      tebligatEpostasiAyristir({
        mesajId: "<3@x>",
        gonderen: "bulten@ornek.com",
        konu: "Bülten",
        govde: "0174520662 numaralı…",
        tarih: new Date().toISOString(),
      })
    ).toBeNull()
  })
})
