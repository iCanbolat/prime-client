import { screen, waitFor, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/mocks/db"
import { TEST_USERS, renderRoute } from "@/test/render"

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date(2026, 8, 23, 10, 0) })
})
afterEach(() => vi.useRealTimers())

describe("e-Tebligat", () => {
  it("liste kalan günü gösterir; detayda süre çizelgesi ve göreve dönüştürme", async () => {
    const { router, user } = renderRoute("/tebligat", {
      as: TEST_USERS.personel,
    })
    const tablo = await screen.findByRole("table", { name: "e-Tebligatlar" })
    expect(within(tablo).getByText("2 gün kaldı")).toBeInTheDocument()
    expect(
      screen.getByText(/1 tebligatın süresi 3 gün içinde doluyor/)
    ).toBeInTheDocument()
    // Kenar çubuğu: 2 açık tebligat
    expect(
      await screen.findByLabelText("2 açık e-Tebligat")
    ).toBeInTheDocument()

    await user.click(
      within(tablo).getAllByRole("button", { name: "Ödeme emri" })[0]!
    )
    expect(router.state.location.search).toBe("?tebligat=tb_acil")
    const panel = await screen.findByRole("dialog", { name: "Ödeme emri" })
    const cizelge = within(panel).getByRole("list", { name: "Süre çizelgesi" })
    expect(cizelge).toHaveTextContent("10.09.2026")
    expect(cizelge).toHaveTextContent("25.09.2026")

    await user.click(
      within(panel).getByRole("button", { name: "Göreve dönüştür" })
    )
    expect(
      await within(panel).findByRole("button", { name: "Göreve git" })
    ).toBeInTheDocument()
    expect(db.gorev.where((g) => g.sonTarih === "2026-09-25")).toHaveLength(1)
  })

  it("eşleşmeyen tebligat mükellefe bağlanır", async () => {
    const { user } = renderRoute(
      "/tebligat?kapsam=eslesmeyen&tebligat=tb_eslesmeyen",
      {
        as: TEST_USERS.personel,
      }
    )
    const panel = await screen.findByRole("dialog", { name: "Ödeme emri" })
    await user.click(
      within(panel).getByRole("combobox", { name: "Mükellefle eşleştir" })
    )
    await user.click(
      await screen.findByRole("option", { name: /Öztürk İnşaat/ })
    )
    await waitFor(() =>
      expect(db.tebligat.find("tb_eslesmeyen")?.mukellefId).toBe("m_as")
    )
  })

  it("Şimdi tara yeni bildirimleri listeye ekler", async () => {
    const { user } = renderRoute("/tebligat", { as: TEST_USERS.personel })
    await screen.findByRole("table", { name: "e-Tebligatlar" })
    const once = db.tebligat.count()
    for (let i = 0; i < 4 && db.tebligat.count() === once; i++) {
      await user.click(screen.getByRole("button", { name: "Şimdi tara" }))
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Şimdi tara" })).toBeEnabled()
      )
    }
    expect(db.tebligat.count()).toBeGreaterThan(once)
  })

  it("mükellef kartında yalnızca o mükellefin tebligatları", async () => {
    renderRoute("/mukellefler/m_as/tebligat", { as: TEST_USERS.personel })
    const tablo = await screen.findByRole("table", { name: "e-Tebligatlar" })
    expect(within(tablo).getAllByRole("row")).toHaveLength(2)
    expect(within(tablo).getByText("İzaha davet")).toBeInTheDocument()
  })
})
