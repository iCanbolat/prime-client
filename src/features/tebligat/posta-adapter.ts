/**
 * e-Tebligat posta kutusu sözleşmesi — **backend** tarafından uygulanır (IMAP).
 *
 * GİB/SGK, elektronik adrese belge düştüğünde kayıtlı e-posta adresine bildirim gönderir. Büro,
 * mükelleflerin bildirim adresi olarak kendi kutusunu tanımlarsa tüm bildirimler tek kutuya düşer.
 * Backend bu kutuyu artımlı okur (son UID'den sonrası), `tebligatEpostasiAyristir` ile ayrıştırır ve
 * VKN/TCKN'yi mükellefle eşleştirir. Frontend kutuya erişmez; yalnızca `/api/tebligat/*` uçlarını bilir.
 * Geliştirmede MSW handler'ları bu arayüzün mock uygulamasını (`mocks/posta/mock-adapter.ts`) kullanır.
 *
 * Kurallar:
 * - IMAP şifresi (uygulama şifresi) yalnızca backend'de (KMS ile şifreli) tutulur; yanıtlarda dönmez.
 * - Okunan mesajlar silinmez veya taşınmaz; yalnızca UID ilerletilir.
 */
import type { TebligatEpostasi } from "@/features/tebligat/eposta-ayristir"

export interface PostaKimlik {
  sunucu: string
  port: number
  kullanici: string
  /** Yalnızca backend'de çözülür */
  sifre: string
  klasor: string
}

export interface PostaDogrulamaSonucu {
  gecerli: boolean
  hataMesaji?: string
}

export interface YeniMesajlar {
  mesajlar: TebligatEpostasi[]
  /** Okunan en büyük UID */
  sonUid: number
}

export interface PostaAdapter {
  baglantiDogrula(kimlik: PostaKimlik): Promise<PostaDogrulamaSonucu>
  /** `sonUid`den sonra gelen mesajlar, eskiden yeniye */
  yeniMesajlar(kimlik: PostaKimlik, sonUid: number): Promise<YeniMesajlar>
}
