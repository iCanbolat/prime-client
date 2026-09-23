import { screen, waitFor, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/mocks/db"
import { TEST_USERS, renderRoute } from "@/test/render"

beforeEach(() => {
  // Bugün: 23 Eylül 2026 Çarşamba
  vi.useFakeTimers({ toFake: ["Date"], now: new Date(2026, 8, 23, 10, 0) })
})
afterEach(() => vi.useRealTimers())

const kpi = (label: string) =>
  within(screen.getByRole("list", { name: "Özet" }))
    .getByText(label)
    .closest("[data-slot=kpi]") as HTMLElement

describe("Gösterge paneli", () => {
  it("özet göstergeleri: bu hafta, geciken, onay bekleyen, belge uyarısı", async () => {
    db.takvim.insert({
      id: "m_as:KDV:2026-08",
      mukellefId: "m_as",
      tip: "KDV",
      donem: "2026-08",
      durum: "HAZIRLANDI",
      guncelleyenId: "p_2",
      guncellemeTarihi: "2026-09-20T10:00:00Z",
    })
    renderRoute("/", { as: TEST_USERS.yonetici })

    await screen.findByRole("list", { name: "Özet" })
    await waitFor(() =>
      expect(
        within(kpi("Bu hafta son günü olan")).getByText("9")
      ).toBeInTheDocument()
    )
    expect(within(kpi("Aktif mükellef")).getByText("3")).toBeInTheDocument()
    expect(within(kpi("Onay bekleyen")).getByText("1")).toBeInTheDocument()
    expect(
      Number(within(kpi("Geciken")).getByText(/^\d+$/).textContent)
    ).toBeGreaterThan(0)
    // Fixture: A.Ş. imza sirkülerinin süresi dolmuş, Ltd faaliyet belgesine 20 gün var
    await waitFor(() =>
      expect(within(kpi("Belge uyarısı")).getByText("2")).toBeInTheDocument()
    )
    expect(
      within(kpi("Belge uyarısı")).getByText("1 belgenin süresi doldu")
    ).toBeInTheDocument()

    const isYuku = screen.getByRole("list", { name: "Personel iş yükü" })
    expect(await within(isYuku).findByText(/Zeynep Demir/)).toBeInTheDocument()
  })

  it("Yapılacaklar sekmeleri listeyi değiştirir", async () => {
    db.takvim.insert({
      id: "m_ltd:KDV:2026-08",
      mukellefId: "m_ltd",
      tip: "KDV",
      donem: "2026-08",
      durum: "HAZIRLANDI",
      guncelleyenId: "p_3",
      guncellemeTarihi: "2026-09-20T10:00:00Z",
    })
    const { user } = renderRoute("/", { as: TEST_USERS.yonetici })

    await screen.findByRole("tabpanel")
    const panel = () => screen.getByRole("tabpanel")
    expect(
      await within(panel()).findByRole("region", { name: "28.09.2026" })
    ).toBeInTheDocument()

    await user.click(screen.getByRole("tab", { name: /Gecikenler/ }))
    expect(await within(panel()).findAllByText("Gecikti")).not.toHaveLength(0)

    await user.click(screen.getByRole("tab", { name: /Onay bekleyen/ }))
    const onay = within(panel()).getAllByRole("listitem")
    expect(onay).toHaveLength(1)
    expect(onay[0]).toHaveAccessibleName(
      /Çınar Yazılım .* KDV beyannamesi Ağustos 2026/
    )
  })

  it("belge uyarıları: süresi dolan belge ve eksik zorunlu evrak listelenir", async () => {
    renderRoute("/", { as: TEST_USERS.yonetici })
    const suresi = await screen.findByRole("region", {
      name: "Süresi dolan belgeler",
    })
    expect(within(suresi).getByText("Süresi doldu")).toBeInTheDocument()
    expect(within(suresi).getByText("20 gün kaldı")).toBeInTheDocument()

    const eksik = screen.getByRole("region", { name: "Eksik zorunlu evraklar" })
    const link = within(eksik).getByRole("link", { name: /Çınar Yazılım/ })
    expect(link).toHaveAttribute("href", "/mukellefler/m_ltd/arsiv")
    expect(within(link).getByText("İmza sirküleri")).toBeInTheDocument()
  })

  it("'Benim mükelleflerim' yalnızca kullanıcının mükelleflerini sayar, iş yükünü gizler", async () => {
    const { router, user } = renderRoute("/", { as: TEST_USERS.personel }) // Mehmet: m_sahis, m_as
    await screen.findByRole("list", { name: "Personel iş yükü" })
    await user.click(
      screen.getByRole("button", { name: "Benim mükelleflerim" })
    )

    expect(router.state.location.search).toBe("?kapsam=benim")
    await waitFor(() =>
      expect(
        within(kpi("Bu hafta son günü olan")).getByText("5")
      ).toBeInTheDocument()
    )
    expect(within(kpi("Aktif mükellef")).getByText("2")).toBeInTheDocument()
    expect(
      screen.queryByRole("list", { name: "Personel iş yükü" })
    ).not.toBeInTheDocument()
    // Ltd (Zeynep'in) eksik evrak uyarısı bu kapsamda görünmez
    await waitFor(() =>
      expect(
        screen.queryByRole("region", { name: "Eksik zorunlu evraklar" })
      ).not.toBeInTheDocument()
    )
  })

  it("göstergeler ve 'Takvimde aç' takvimin ilgili liste görünümüne gider", async () => {
    const { router, user } = renderRoute("/?kapsam=benim", {
      as: TEST_USERS.personel,
    })
    await user.click(await screen.findByRole("link", { name: "Takvimde aç" }))
    await waitFor(() => expect(router.state.location.pathname).toBe("/takvim"))
    expect(router.state.location.search).toBe(
      "?gorunum=liste&aralik=hafta&sorumlu=p_2"
    )
  })

  it("14 günlük yoğunluk şeridi bugünden başlar", async () => {
    renderRoute("/", { as: TEST_USERS.yonetici })
    const serit = await screen.findByRole("list", { name: "Günlük yoğunluk" })
    const gunler = within(serit).getAllByRole("link")
    expect(gunler).toHaveLength(14)
    expect(gunler[0]).toHaveAccessibleName(/^23 Eylül Çarşamba/)
    expect(gunler[5]).toHaveAccessibleName("28 Eylül Pazartesi: 5 yükümlülük")
  })
})
