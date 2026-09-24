import { expect, test } from "@playwright/test"

import { girisYap } from "./helpers"

test("acil tebligat → göreve dönüştür → görev panelinde son gün", async ({ page }) => {
  await girisYap(page)
  await page.locator('a[href="/tebligat"]').first().click()
  await expect(page).toHaveURL("/tebligat")
  await page.getByRole("button", { name: "Acil tebligatları göster" }).click()
  const tablo = page.getByRole("table", { name: "e-Tebligatlar" })
  await tablo.locator("tbody tr").first().locator("button").first().click()

  const panel = page.getByRole("dialog")
  await expect(panel.getByRole("list", { name: "Süre çizelgesi" })).toBeVisible()
  await panel.getByRole("button", { name: "Göreve dönüştür" }).click()
  await expect(page.getByText("Görev oluşturuldu")).toBeVisible()
  await panel.getByRole("button", { name: "Göreve git" }).click()
  await expect(page).toHaveURL(/\/gorevler\?gorev=/)
})

test("eşleşmeyen tebligat mükellefe bağlanır", async ({ page }) => {
  await girisYap(page)
  await page.goto("/tebligat?kapsam=eslesmeyen")
  const tablo = page.getByRole("table", { name: "e-Tebligatlar" })
  await expect(tablo.locator("tbody tr").first()).toBeVisible()
  const satirSayisi = await tablo.locator("tbody tr").count()
  await tablo.locator("tbody tr").first().locator("button").first().click()
  const panel = page.getByRole("dialog")
  await panel.getByRole("combobox", { name: "Mükellefle eşleştir" }).click()
  await page.getByRole("option").first().click()
  await expect(page.getByText("Tebligat mükellefe bağlandı")).toBeVisible()
  await page.keyboard.press("Escape")
  if (satirSayisi > 1)
    await expect(tablo.locator("tbody tr")).toHaveCount(satirSayisi - 1)
  else await expect(page.getByText("Bu filtrede tebligat yok")).toBeVisible()
})
