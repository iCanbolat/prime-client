import { screen, waitFor, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/mocks/db"
import { TEST_USERS, renderRoute } from "@/test/render"

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date(2026, 8, 23, 10, 0) })
})
afterEach(() => vi.useRealTimers())

describe("e-Belge — faturalar", () => {
  it("/e-belge e-Fatura sekmesine yönlenir; yön filtresi URL'e yazılır", async () => {
    const { router, user } = renderRoute("/e-belge", {
      as: TEST_USERS.personel,
    })
    await screen.findByRole("button", {
      name: "DNZ2026000000412 faturasını aç",
    })
    const tablo = screen.getByRole("table", { name: "Faturalar" })
    expect(router.state.location.pathname).toBe("/e-belge/e-fatura")
    const satir = (belgeNo: string) =>
      within(tablo)
        .getByRole("button", { name: `${belgeNo} faturasını aç` })
        .closest("tr")!
    expect(
      within(satir("DNZ2026000000412")).getAllByText("Yanıt bekliyor · 6 gün")
    ).not.toHaveLength(0)
    expect(
      within(satir("CNR2026000000057")).getAllByText("İşleniyor")
    ).not.toHaveLength(0)

    await user.click(screen.getByRole("button", { name: "Giden" }))
    expect(router.state.location.search).toBe("?yon=GIDEN")
    await waitFor(() =>
      expect(within(tablo).getAllByRole("row")).toHaveLength(4)
    )
    // Giden faturada yanıt filtresi gösterilmez
    expect(screen.queryByLabelText("Yanıt durumu")).not.toBeInTheDocument()
  })

  it("kenar çubuğunda ve sekmede yanıt bekleyen fatura sayısı görünür", async () => {
    renderRoute("/e-belge/e-arsiv", { as: TEST_USERS.personel })
    // Kenar çubuğu rozeti + e-Fatura sekmesi rozeti
    await waitFor(() =>
      expect(screen.getAllByLabelText("2 yanıt bekleyen fatura")).toHaveLength(
        2
      )
    )
  })

  it("ticari faturayı red: neden zorunlu, yanıt kaydedilir", async () => {
    const { user } = renderRoute("/e-belge/e-fatura?fatura=f_yakin", {
      as: TEST_USERS.personel,
    })
    const panel = await screen.findByRole("dialog", {
      name: "OFS2026000001207",
    })
    expect(
      await within(panel).findByText("Ticari fatura yanıtı bekleniyor")
    ).toBeInTheDocument()
    expect(
      within(panel).getByText("Yanıt bekliyor · 1 gün")
    ).toBeInTheDocument()

    await user.click(within(panel).getByRole("button", { name: "Reddet" }))
    const dialog = await screen.findByRole("dialog", {
      name: "Faturayı reddet",
    })
    await user.click(within(dialog).getByRole("button", { name: "Reddet" }))
    expect(
      within(dialog).getByText("Red nedeni zorunludur")
    ).toBeInTheDocument()

    await user.click(
      within(dialog).getByRole("button", { name: "Mükerrer fatura" })
    )
    await user.click(within(dialog).getByRole("button", { name: "Reddet" }))

    expect(await within(panel).findByText("Reddedildi")).toBeInTheDocument()
    expect(within(panel).getByText("Mükerrer fatura")).toBeInTheDocument()
    expect(
      within(panel).queryByText("Ticari fatura yanıtı bekleniyor")
    ).not.toBeInTheDocument()
    expect(db.ebelge.find("f_yakin")).toMatchObject({
      yanit: "RED",
      redNedeni: "Mükerrer fatura",
      yanitlayanId: TEST_USERS.personel.id,
    })
  })

  it("kabul onay penceresiyle yapılır; arşive kaydet arşiv bağlantısına dönüşür", async () => {
    const { user } = renderRoute("/e-belge/e-fatura?fatura=f_bekleyen", {
      as: TEST_USERS.personel,
    })
    const panel = await screen.findByRole("dialog", {
      name: "DNZ2026000000412",
    })
    await within(panel).findByText("Kalemler")
    await user.click(within(panel).getByRole("button", { name: "Kabul et" }))
    const onay = await screen.findByRole("alertdialog", {
      name: "Fatura kabul edilsin mi?",
    })
    await user.click(within(onay).getByRole("button", { name: "Kabul et" }))
    expect(await within(panel).findByText("Kabul edildi")).toBeInTheDocument()

    await user.click(
      within(panel).getByRole("button", { name: "Arşive kaydet" })
    )
    expect(
      await within(panel).findByRole("link", { name: "Arşivde" })
    ).toHaveAttribute("href", "/arsiv?mukellef=m_ltd&kategori=FATURA")
    expect(db.arsiv.where((d) => d.kategori === "FATURA")).toHaveLength(1)
  })
})

describe("e-Belge — bağlantılar ve e-Defter", () => {
  it("yönetici bağlantı kurar; hatalı anahtar alana yazılır", async () => {
    const { user } = renderRoute("/e-belge/baglantilar", {
      as: TEST_USERS.yonetici,
    })
    await user.click(
      await screen.findByRole("button", { name: "Ali Veli Nilvera'ya bağla" })
    )
    const dialog = await screen.findByRole("dialog", {
      name: "Nilvera'ya bağla",
    })
    const alan = within(dialog).getByLabelText("API anahtarı")
    expect(alan).toHaveAttribute("type", "password")

    await user.type(alan, "kisa")
    await user.click(within(dialog).getByRole("button", { name: "Bağla" }))
    expect(
      await within(dialog).findByText("API anahtarı en az 16 karakter olmalı")
    ).toBeInTheDocument()

    await user.clear(alan)
    await user.type(alan, "hatali-anahtar-00000000")
    await user.click(within(dialog).getByRole("button", { name: "Bağla" }))
    expect(
      await within(dialog).findByText(
        "Nilvera API anahtarı doğrulanamadı (401)"
      )
    ).toBeInTheDocument()

    await user.clear(alan)
    await user.type(alan, "nv_live_0123456789abcdef")
    await user.click(within(dialog).getByRole("button", { name: "Bağla" }))
    await waitFor(() => expect(dialog).not.toBeInTheDocument())
    const tablo = screen.getByRole("table", { name: "Nilvera bağlantıları" })
    const satir = within(tablo)
      .getByRole("link", { name: "Ali Veli" })
      .closest("tr")!
    expect(await within(satir).findByText("Bağlı")).toBeInTheDocument()
    expect(within(satir).getByText(/••••cdef/)).toBeInTheDocument()
  })

  it("personel bağlantı kuramaz", async () => {
    renderRoute("/e-belge/baglantilar", { as: TEST_USERS.personel })
    expect(
      await screen.findByText(
        "Bağlantıları yalnızca yönetici kurabilir veya kaldırabilir."
      )
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /Nilvera'ya bağla/ })
    ).not.toBeInTheDocument()
  })

  it("e-Defter matrisi: hücreden berat ayrıntısı açılır", async () => {
    const { user } = renderRoute("/e-belge/e-defter", {
      as: TEST_USERS.personel,
    })
    const hucre = await screen.findByRole("button", {
      name: "Çınar Yazılım San. ve Tic. Ltd. Şti. Temmuz 2026: Hatalı",
    })
    // Bağlantısı hatalı mükellefin yüklenmemiş, son günü geçmiş dönemi
    expect(
      screen.getByRole("button", {
        name: "Öztürk İnşaat A.Ş. Mayıs 2026: Gecikti",
      })
    ).toBeInTheDocument()
    await user.click(hucre)
    const panel = await screen.findByRole("dialog", {
      name: "Temmuz 2026 beratı",
    })
    expect(
      within(panel).getByText(
        "Yevmiye defteri kapanış kaydı ile kebir bakiyeleri tutarsız"
      )
    ).toBeInTheDocument()
  })
})

describe("Mükellef kartı — e-Belge sekmesi", () => {
  it("bağlı mükellefte faturalar ve beratlar listelenir", async () => {
    renderRoute("/mukellefler/m_ltd/e-belge", { as: TEST_USERS.personel })
    expect(await screen.findByText(/anahtar ••••x7k2/)).toBeInTheDocument()
    await screen.findByRole("button", {
      name: "CNR2026000000057 faturasını aç",
    })
    const tablo = screen.getByRole("table", { name: "Faturalar" })
    // Mükellef sütunu gizli; yalnızca bu mükellefin 7 e-Faturası (+ başlık)
    expect(within(tablo).getAllByRole("row")).toHaveLength(8)
    // jsdom CSS uygulamaz; sütunun gizleme sınıfı taşıdığı doğrulanır
    expect(
      within(tablo).getByRole("columnheader", { name: "Mükellef" })
    ).toHaveClass("hidden")
    expect(
      await screen.findByRole("table", { name: "e-Defter berat durumları" })
    ).toBeInTheDocument()
  })

  it("bağlantısız mükellefte personele yalnızca bilgi gösterilir", async () => {
    renderRoute("/mukellefler/m_sahis/e-belge", { as: TEST_USERS.personel })
    expect(
      await screen.findByText("Nilvera bağlantısı yok")
    ).toBeInTheDocument()
    expect(
      screen.getByText("Bağlantıyı büro yöneticisi kurabilir.")
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Nilvera'ya bağla" })
    ).not.toBeInTheDocument()
  })
})

describe("Gösterge paneli — e-Belge kartı", () => {
  it("yanıt bekleyen ve süresi dolmak üzere olan faturalar görünür", async () => {
    renderRoute("/", { as: TEST_USERS.yonetici })
    const liste = await screen.findByRole("region", {
      name: "Yanıt süresi dolmak üzere olan faturalar",
    })
    expect(
      within(liste).getByText("Çınar Yazılım San. ve Tic. Ltd. Şti.")
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /2\s*Yanıt bekleyen fatura/ })
    ).toHaveAttribute("href", "/e-belge/e-fatura?yon=GELEN&yanit=BEKLIYOR")
  })
})
