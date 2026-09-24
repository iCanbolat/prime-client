import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useAuthStore } from "@/features/auth/store"
import { ApiError, http } from "@/lib/http"
import { STORAGE_KEY, db } from "@/mocks/db"
import { PERSONEL } from "@/mocks/factories/personel"
import type {
  TebligatListResponse,
  TebligatOzetResponse,
  TebligatPostaKutusuView,
  TebligatTaraResponse,
  TebligatView,
} from "@/types/api"
import type { Gorev } from "@/types/domain"

const [yonetici, mehmet] = PERSONEL as [
  (typeof PERSONEL)[0],
  (typeof PERSONEL)[0],
]
const oturum = (p: (typeof PERSONEL)[0]) => useAuthStore.setState({ user: p })
const hataDurumu = (p: Promise<unknown>) =>
  p.then(
    () => 0,
    (e: ApiError) => e.status
  )
const liste = (params: Record<string, unknown> = {}) =>
  http.get<TebligatListResponse>("/tebligat", { params: params as never })

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date(2026, 8, 23, 10, 0) })
  oturum(mehmet)
})
afterEach(() => vi.useRealTimers())

describe("GET /api/tebligat", () => {
  it("açıklar son güne göre önce; kapsam filtreleri", async () => {
    expect((await liste()).items.map((t) => t.id)).toEqual([
      "tb_acil",
      "tb_eslesmeyen",
      "tb_kapali",
    ])
    const acil = (await liste({ kapsam: "acil" })).items
    expect(acil.map((t) => [t.id, t.kalanGun, t.sonIslemTarihi])).toEqual([
      ["tb_acil", 2, "2026-09-25"],
    ])
    expect(
      (await liste({ kapsam: "eslesmeyen" })).items.map((t) => t.id)
    ).toEqual(["tb_eslesmeyen"])
    expect((await liste({ kapsam: "kapali" })).total).toBe(1)
    expect((await liste({ mukellefId: "m_ltd" })).total).toBe(1)
  })

  it("özet: açık, acil, eşleşmeyen ve posta kutusu (şifresiz)", async () => {
    const o = await http.get<TebligatOzetResponse>("/tebligat/ozet")
    expect(o).toMatchObject({ acik: 2, acil: 1, geciken: 0, eslesmeyen: 1 })
    expect(o.postaKutusu).toMatchObject({ durum: "BAGLI", sifreIpucu: "abcd" })
    expect(o.postaKutusu).not.toHaveProperty("sonUid")
  })
})

describe("tarama", () => {
  it("yeni bildirimler ayrıştırılır, VKN eşleşir, aynı mesaj iki kez kaydedilmez", async () => {
    let toplam = 0
    for (let i = 0; i < 6; i++) {
      const s = await http.post<TebligatTaraResponse>("/tebligat/tara")
      toplam += s.yeni
    }
    expect(toplam).toBeGreaterThan(0)
    expect(db.tebligat.count()).toBe(3 + toplam)
    const yeniler = db.tebligat.where(
      (t) => t.epostaMesajId?.startsWith("<uid-") ?? false
    )
    for (const t of yeniler) {
      expect(t.durum).toBe("YENI")
      if (t.mukellefId) {
        const m = db.mukellef.find(t.mukellefId)!
        expect(m.vkn ?? m.tckn).toBe(t.vkn)
      }
    }
    // Aynı UID aralığı yeniden okunsa da çift kayıt olmaz
    db.postaKutusu.update("pk_1", { sonUid: 10 })
    await http.post("/tebligat/tara")
    expect(db.tebligat.count()).toBe(3 + toplam)
    // Yöneticiye bildirim düştü
    expect(
      db.bildirim.where(
        (b) => b.tur === "TEBLIGAT_ALINDI" && b.aliciId === "p_1"
      ).length
    ).toBeGreaterThan(0)
  })

  it("posta kutusu bağlı değilse 409", async () => {
    db.postaKutusu.remove("pk_1")
    expect(await hataDurumu(http.post("/tebligat/tara"))).toBe(409)
  })
})

describe("posta kutusu", () => {
  it("yalnızca yönetici; şifre saklanmaz, yalnızca son 4 karakter; hatalı şifre 422", async () => {
    const govde = {
      sunucu: "imap.gmail.com",
      port: 993,
      kullanici: "tebligat@buro.com",
      klasor: "INBOX",
      sifre: "uygulama-sifresi-9f3k",
    }
    expect(await hataDurumu(http.put("/tebligat/posta-kutusu", govde))).toBe(
      403
    )
    oturum(yonetici)
    expect(
      await hataDurumu(
        http.put("/tebligat/posta-kutusu", { ...govde, sifre: "hatali-sifre" })
      )
    ).toBe(422)
    const k = await http.put<TebligatPostaKutusuView>(
      "/tebligat/posta-kutusu",
      govde
    )
    expect(k.sifreIpucu).toBe("9f3k")
    expect(JSON.stringify(k)).not.toContain(govde.sifre)
    expect(localStorage.getItem(STORAGE_KEY)).not.toContain(govde.sifre)
    await http.delete("/tebligat/posta-kutusu")
    expect(await http.get("/tebligat/posta-kutusu")).toBeNull()
  })
})

describe("güncelleme, görev ve belge", () => {
  it("eşleşmeyen tebligat mükellefe bağlanır, sorumlu atanır ve bildirim gider", async () => {
    oturum(yonetici)
    const t = await http.patch<TebligatView>("/tebligat/tb_eslesmeyen", {
      mukellefId: "m_as",
      atananId: "p_2",
      durum: "INCELENDI",
    })
    expect(t).toMatchObject({
      mukellefUnvan: "Öztürk İnşaat A.Ş.",
      atananAd: "Mehmet Kaya",
    })
    expect(
      db.bildirim.where(
        (b) => b.aliciId === "p_2" && b.baslik === "Bir e-Tebligat size atandı"
      )
    ).toHaveLength(1)
  })

  it("görev son işlem gününe açılır, ikinci kez açılamaz; eşleşmeyende 409", async () => {
    const g = await http.post<Gorev>("/tebligat/tb_acil/gorev")
    expect(g).toMatchObject({
      mukellefId: "m_ltd",
      sonTarih: "2026-09-25",
      oncelik: "YUKSEK",
      atananId: "p_3",
    })
    expect(db.tebligat.find("tb_acil")).toMatchObject({
      gorevId: g.id,
      durum: "INCELENDI",
    })
    expect(await hataDurumu(http.post("/tebligat/tb_acil/gorev"))).toBe(409)
    expect(await hataDurumu(http.post("/tebligat/tb_eslesmeyen/gorev"))).toBe(
      409
    )
  })

  it("özel süre son günü değiştirir; belge arşive TEBLIGAT kategorisinde", async () => {
    const t = await http.patch<TebligatView>("/tebligat/tb_acil", {
      sureGun: 30,
    })
    expect(t.sonIslemTarihi).toBe("2026-10-12")
    const b = await http.post<TebligatView>("/tebligat/tb_acil/belge", {
      dosya: {
        ad: "odeme-emri.pdf",
        dataUrl: "data:application/pdf;base64,JVBERg==",
      },
    })
    expect(db.arsiv.find(b.arsivDosyaId!)).toMatchObject({
      mukellefId: "m_ltd",
      kategori: "TEBLIGAT",
    })
  })

  it("elle kayıt; gelecek tarih reddedilir", async () => {
    const t = await http.post<TebligatView>("/tebligat", {
      mukellefId: "m_sahis",
      kurum: "GIB",
      tur: "IZAHA_DAVET",
      konu: "İzaha davet",
      ulasmaGunu: "2026-09-22",
    })
    expect(t).toMatchObject({
      kaynak: "ELLE",
      vkn: "10000000146",
      atananId: "p_2",
    })
    expect(
      await hataDurumu(
        http.post("/tebligat", {
          mukellefId: "m_sahis",
          kurum: "GIB",
          tur: "DIGER",
          konu: "x",
          ulasmaGunu: "2026-09-30",
        })
      )
    ).toBe(400)
  })
})

describe("hatırlatma", () => {
  it("son günü yaklaşan açık tebligat için sorumluya bildirim", async () => {
    oturum(PERSONEL[2]!)
    await http.get("/bildirim")
    expect(
      db.bildirim.where(
        (b) => b.tur === "TEBLIGAT_SURE_YAKLASIYOR" && b.aliciId === "p_3"
      )
    ).toHaveLength(1)
  })
})
