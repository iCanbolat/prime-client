/**
 * e-Belge / Luca hesabı istek doğrulamaları — mock handler'lar kullanır (backend aynı mesajları
 * döner). Hata metni ya da null.
 */
const nesne = (v: unknown) =>
  (v && typeof v === "object" ? v : {}) as Record<string, unknown>

/** `PUT /e-belge/baglantilar/:mukellefId` */
export function baglantiHatasi(body: unknown): string | null {
  const firma = nesne(body).lucaFirmaId
  return typeof firma === "string" && firma.trim()
    ? null
    : "Luca firması seçilmelidir"
}

export const LUCA_KULLANICI_SINIRI = 64
export const LUCA_SIFRE_SINIRI = 128

/** `PUT /luca-hesap`. `mevcutKullanici`: kayıtlı hesap varsa kullanıcı adı (şifre boş geçilebilir) */
export function lucaHesapHatasi(
  body: unknown,
  mevcutKullanici?: string
): string | null {
  const b = nesne(body)
  const kullanici = typeof b.kullanici === "string" ? b.kullanici.trim() : ""
  const sifre = typeof b.sifre === "string" ? b.sifre : ""
  if (!kullanici) return "Luca kullanıcı adı zorunludur"
  if (kullanici.length > LUCA_KULLANICI_SINIRI)
    return "Luca kullanıcı adı çok uzun"
  if (sifre.length > LUCA_SIFRE_SINIRI) return "Luca şifresi çok uzun"
  if (!sifre && kullanici !== mevcutKullanici) return "Luca şifresi zorunludur"
  return null
}

/** `POST /luca-dogrulama` */
export function lucaDogrulamaHatasi(body: unknown): string | null {
  const kod = nesne(body).kod
  if (typeof kod !== "string" || !kod.trim()) return "Doğrulama kodu zorunludur"
  if (kod.trim().length > 16) return "Doğrulama kodu çok uzun"
  return null
}

/** `POST /luca-hesap/firmalar/aktar` */
export function lucaAktarimHatasi(body: unknown): string | null {
  const b = nesne(body)
  if (
    !Array.isArray(b.firmaIdler) ||
    b.firmaIdler.length === 0 ||
    !b.firmaIdler.every((f) => typeof f === "string" && f.trim())
  )
    return "Aktarılacak firma seçilmelidir"
  if (b.firmaIdler.length > 500)
    return "Tek seferde en çok 500 firma aktarılabilir"
  if (typeof b.sorumluPersonelId !== "string" || !b.sorumluPersonelId)
    return "Sorumlu personel seçilmelidir"
  return null
}
