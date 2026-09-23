import { describe, expect, it } from "vitest"

import { http } from "@/lib/http"
import { db } from "@/mocks/db"
import type { LoginResponse, MukellefListResponse } from "@/types/api"

describe("GET /api/mukellefler", () => {
  const list = (params = {}) =>
    http.get<MukellefListResponse>("/mukellefler", { params })

  it("tüm mükellefleri unvana göre (Türkçe) sıralı döner", async () => {
    const { items, total } = await list()
    expect(total).toBe(3)
    expect(items.map((m) => m.unvan)).toEqual([
      "Ali Veli",
      "Çınar Yazılım San. ve Tic. Ltd. Şti.",
      "Öztürk İnşaat A.Ş.",
    ])
  })

  it("tür filtresi (çoklu)", async () => {
    expect((await list({ tur: ["LTD"] })).items.map((m) => m.id)).toEqual([
      "m_ltd",
    ])
    expect((await list({ tur: ["LTD", "AS"] })).total).toBe(2)
  })

  it("sorumlu personel filtresi", async () => {
    expect((await list({ sorumlu: "p_2" })).items.map((m) => m.id)).toEqual([
      "m_sahis",
      "m_as",
    ])
  })

  it("arama: Türkçe büyük/küçük harf duyarsız unvan ve VKN/TCKN", async () => {
    expect((await list({ q: "ÇINAR" })).items.map((m) => m.id)).toEqual([
      "m_ltd",
    ])
    expect((await list({ q: "inşaat" })).items.map((m) => m.id)).toEqual([
      "m_as",
    ])
    expect((await list({ q: "9358005" })).items.map((m) => m.id)).toEqual([
      "m_as",
    ])
    expect((await list({ q: "10000000146" })).items.map((m) => m.id)).toEqual([
      "m_sahis",
    ])
    expect((await list({ q: "bulunmayan" })).total).toBe(0)
  })
})

describe("GET /api/mukellefler/:id", () => {
  it("kaydı döner, yoksa 404", async () => {
    await expect(http.get("/mukellefler/m_as")).resolves.toMatchObject({
      unvan: "Öztürk İnşaat A.Ş.",
    })
    await expect(http.get("/mukellefler/yok")).rejects.toMatchObject({
      status: 404,
    })
  })
})

describe("auth", () => {
  it("login personeli döner ve GIRIS aktivitesi yazar", async () => {
    const { personel } = await http.post<LoginResponse>("/auth/login", {
      personelId: "p_3",
    })
    expect(personel.ad).toBe("Zeynep")
    expect(
      db.aktivite.where((a) => a.aktorId === "p_3" && a.eylem === "GIRIS")
    ).toHaveLength(1)
  })

  it("bilinmeyen kullanıcı 404, pasif kullanıcı 403", async () => {
    await expect(
      http.post("/auth/login", { personelId: "p_99" })
    ).rejects.toMatchObject({ status: 404 })
    db.personel.update("p_4", { aktif: false })
    await expect(
      http.post("/auth/login", { personelId: "p_4" })
    ).rejects.toMatchObject({ status: 403 })
  })

  it("logout CIKIS aktivitesi yazar", async () => {
    await http.post("/auth/logout", { personelId: "p_1" })
    expect(db.aktivite.where((a) => a.eylem === "CIKIS")).toHaveLength(1)
  })
})

describe("dev", () => {
  it("reset seed'e döner, stats koleksiyon sayılarını verir", async () => {
    expect(await http.get("/dev/stats")).toEqual({
      buro: 1,
      personel: 4,
      mukellef: 3,
      aktivite: 0,
      credential: 0,
      kasa: 0,
      takvim: 0,
      arsiv: 9,
      talep: 4,
      gelen: 3,
      gorev: 6,
      nilvera: 2,
      ebelge: 9,
      berat: 11,
      bildirim: 0,
    })
    await http.post("/dev/reset")
    expect(await http.get("/dev/stats")).toMatchObject({ mukellef: 40 })
  })
})
