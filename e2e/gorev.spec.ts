import { expect, test, type Page } from "@playwright/test"

import { girisYap } from "./helpers"

async function acikGorevSayisi(page: Page): Promise<number> {
  const deger = page
    .getByRole("list", { name: "Özet" })
    .getByRole("link", { name: /^Açık görev/ })
    .locator(".tabular-nums")
  await expect(deger).toHaveText(/^\d+$/)
  return Number(await deger.textContent())
}

test("dönem görevlerini oluştur → kanban'da Tamam'a taşı → dashboard sayacı güncellenir", async ({
  page,
}) => {
  await girisYap(page)
  const baslangic = await acikGorevSayisi(page)

  // Seed'de Ba-Bs görevi yok: geçen ay için tüm uygun mükelleflere görev aç
  await page.locator('a[href="/gorevler"]').first().click()
  await page.getByRole("button", { name: /Dönem görevlerini oluştur/ }).click()
  const dialog = page.getByRole("dialog", { name: "Dönem görevlerini oluştur" })
  await dialog.getByLabel("Yükümlülük").click()
  await page.getByRole("option", { name: "Ba-Bs formları" }).click()
  await expect(
    dialog.getByRole("table", { name: "Oluşturulacak görevler" })
  ).toBeVisible()
  const olustur = dialog.getByRole("button", { name: /^\d+ görev oluştur$/ })
  const adet = Number((await olustur.textContent())!.match(/\d+/)![0])
  expect(adet).toBeGreaterThan(0)
  await olustur.click()
  await expect(page.getByText(`${adet} görev oluşturuldu`)).toBeVisible()

  // Yalnızca Ba-Bs görevleri; ilk kartı klavyeyle Yapılacak → Tamam'a taşı
  await page.goto("/gorevler?tip=BA_BS")
  const yapilacak = page.getByRole("region", { name: "Yapılacak sütunu" })
  const tamam = page.getByRole("region", { name: "Tamam sütunu" })
  await expect(yapilacak.getByRole("article")).toHaveCount(adet)
  const kart = yapilacak.getByRole("article").first()
  const kartAdi = (await kart.getAttribute("aria-label"))!
  const duyuru = page.getByRole("status").filter({ hasText: /Ba-Bs/ })
  await kart.getByRole("button", { name: /görevini taşı$/ }).focus()
  await page.keyboard.press("Space")
  await expect(duyuru).toContainText("Yapılacak sütunu üzerinde")
  for (const sutun of ["Devam", "Kontrol", "Tamam"]) {
    await page.keyboard.press("ArrowRight")
    await expect(duyuru).toContainText(`${sutun} sütunu üzerinde`)
  }
  await page.keyboard.press("Space")
  await expect(duyuru).toContainText("Tamam sütununa bırakıldı")
  await expect(tamam.getByRole("article", { name: kartAdi })).toBeVisible()
  await expect(yapilacak.getByRole("article")).toHaveCount(adet - 1)

  // Dashboard: yeni görevler eklendi, biri kapandı
  await page.locator('a[href="/"]').first().click()
  await expect.poll(() => acikGorevSayisi(page)).toBe(baslangic + adet - 1)
})
