/**
 * Nilvera entegrasyon sözleşmesi — **backend** tarafından uygulanır.
 *
 * Frontend Nilvera'yı doğrudan çağırmaz: yalnızca `/api/e-belge/*` uçlarını bilir. Backend her
 * mükellef için bu arayüzün bir örneğini (mükellefin şifreli saklanan API anahtarıyla) kurar,
 * Nilvera yanıtlarını aşağıdaki normalize tiplere çevirir ve kendi veritabanına senkronize eder.
 * Geliştirmede MSW handler'ları (`mocks/handlers/e-belge.ts`) aynı arayüzün mock uygulamasını
 * (`mocks/nilvera/mock-adapter.ts`) kullanır; gerçek backend geldiğinde frontend değişmez.
 *
 * Kurallar:
 * - API anahtarı yalnızca backend'de (KMS ile şifreli) tutulur; istemciye hiçbir yanıtta dönmez.
 * - Nilvera uç noktaları ve alan adları eşlenirken güncel Nilvera API dokümanı esas alınmalıdır;
 *   buradaki tipler uygulamanın ihtiyaç duyduğu normalize görünümdür, Nilvera DTO'su değildir.
 */
import type {
  BeratDurumu,
  EBelge,
  EBelgeTur,
  EBelgeYon,
  NilveraOrtam,
} from "@/types/domain"
import type { EBelgeKalem } from "@/types/api"

export interface NilveraKimlik {
  mukellefId: string
  /** Yalnızca backend'de çözülür */
  apiAnahtari: string
  ortam: NilveraOrtam
}

export interface BaglantiDogrulamaSonucu {
  gecerli: boolean
  hataMesaji?: string
  /** Hesapta açık servisler (GİB kayıtlı kullanıcı sorgusu) */
  eFatura: boolean
  eArsiv: boolean
  eDefter: boolean
  postaKutusu?: string
}

/** Entegratörden gelen fatura başlığı (uygulamanın id / arşiv alanları hariç). */
export type NilveraFatura = Omit<
  EBelge,
  | "id"
  | "mukellefId"
  | "yanit"
  | "redNedeni"
  | "yanitlayanId"
  | "yanitTarihi"
  | "arsivDosyaId"
> & {
  /** Gelen ticari faturada alıcının yanıtı; Nilvera tarafında verilmişse */
  yanit?: "BEKLIYOR" | "KABUL" | "RED"
}

export interface FaturaSorgusu {
  tur: EBelgeTur
  yon: EBelgeYon
  /** Bu andan sonra oluşan / durumu değişen faturalar (artımlı senkron) */
  sonra?: string
}

export interface NilveraBerat {
  /** "2026-06" */
  donem: string
  durum: BeratDurumu
  yuklemeTarihi?: string
  onayTarihi?: string
  hataMesaji?: string
}

export interface NilveraAdapter {
  /** Anahtarı doğrular ve hesabın servis bilgilerini döner. */
  baglantiDogrula(kimlik: NilveraKimlik): Promise<BaglantiDogrulamaSonucu>
  /** Artımlı fatura senkronu: yeni ve durumu değişen faturalar. */
  faturalariGetir(
    kimlik: NilveraKimlik,
    sorgu: FaturaSorgusu
  ): Promise<NilveraFatura[]>
  /** Fatura kalemleri (başlıkla birlikte saklanmaz, detayda istenir). */
  faturaKalemleri(kimlik: NilveraKimlik, ettn: string): Promise<EBelgeKalem[]>
  /** Fatura görüntüsü: PDF (base64 data URL) veya UBL XML */
  faturaIcerik(
    kimlik: NilveraKimlik,
    ettn: string,
    format: "PDF" | "XML"
  ): Promise<string>
  /** Gelen ticari faturaya uygulama yanıtı (kabul / red). */
  ticariYanitGonder(
    kimlik: NilveraKimlik,
    ettn: string,
    karar: "KABUL" | "RED",
    neden?: string
  ): Promise<void>
  /** e-Defter berat durumları */
  beratDurumlari(kimlik: NilveraKimlik, yil: string): Promise<NilveraBerat[]>
}
