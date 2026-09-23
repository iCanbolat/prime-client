import { expect, test } from "@playwright/test"

test("giriş yapıp gösterge paneline ulaşılır", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveURL(/\/login$/)

  await page.getByRole("button", { name: /Ayşe Yılmaz/ }).click()
  await expect(page).toHaveURL("/")
  await expect(
    page.getByRole("heading", { name: "Merhaba, Ayşe" })
  ).toBeVisible()
  await expect(page.getByText("Aktif mükellef")).toBeVisible()
})
