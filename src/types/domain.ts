/**
 * Domain modelleri. Mock DB, MSW handler'ları ve feature'lar bu tipleri ortak kullanır.
 * Tüm tarih alanları ISO 8601 string olarak tutulur (JSON / localStorage uyumu için).
 */

export type ISODateString = string

export type Rol = "YONETICI" | "PERSONEL"

export interface Buro {
  id: string
  ad: string
  vkn: string
  vergiDairesi: string
  telefon: string
  eposta: string
  adres: string
  /** Evrak talebi mesaj şablonları; değişkenler: {unvan} {donem} {link} {buro} {sonTarih} {evraklar} {neden} */
  mesajSablonlari: Record<MesajSablonTip, string>
}

/** TALEP: ilk gönderim / yeniden gönderim; RED: reddedilen evrak için tekrar yükleme isteği */
export type MesajSablonTip = "TALEP" | "RED"

export interface Personel {
  id: string
  ad: string
  soyad: string
  eposta: string
  telefon: string
  rol: Rol
  /** Avatar arka planı için tailwind renk anahtarı */
  renk: PersonelRenk
  aktif: boolean
}

export type PersonelRenk = "blue" | "emerald" | "amber" | "rose" | "violet"

export type MukellefTur = "SAHIS" | "LTD" | "AS"
export type KdvPeriyodu = "AYLIK" | "UC_AYLIK"
export type DefterTuru = "ISLETME" | "BILANCO"

export interface Mukellef {
  id: string
  tur: MukellefTur
  unvan: string
  /** Ltd / A.Ş. için 10 haneli VKN */
  vkn?: string
  /** Şahıs için 11 haneli TCKN (vergi kimlik no olarak da kullanılır) */
  tckn?: string
  /** Ltd / A.Ş. için */
  ticaretSicilNo?: string
  /** Ltd / A.Ş. için 16 haneli MERSİS numarası */
  mersisNo?: string
  vergiDairesi: string
  naceKodu: string
  faaliyet: string
  telefon: string
  eposta: string
  il: string
  ilce: string
  adres: string
  sorumluPersonelId: string
  kdvMukellefi: boolean
  kdvPeriyodu: KdvPeriyodu
  defterTuru: DefterTuru
  sgkIsyeriVar: boolean
  calisanSayisi: number
  eDefterMukellefi: boolean
  aktif: boolean
  etiketler: string[]
  olusturmaTarihi: ISODateString
}

export type AktiviteEylem =
  | "GIRIS"
  | "CIKIS"
  | "MUKELLEF_OLUSTURULDU"
  | "MUKELLEF_GUNCELLENDI"
  | "SIFRE_EKLENDI"
  | "SIFRE_GORUNTULENDI"
  | "SIFRE_KOPYALANDI"
  | "SIFRE_GUNCELLENDI"
  | "SIFRE_SILINDI"
  | "BEYAN_DURUMU_GUNCELLENDI"
  | "ARSIV_YUKLENDI"
  | "ARSIV_GUNCELLENDI"
  | "ARSIV_SILINDI"
  | "ARSIV_GERI_ALINDI"
  | "ARSIV_KALICI_SILINDI"
  | "TALEP_OLUSTURULDU"
  | "TALEP_GONDERILDI"
  | "TALEP_UZATILDI"
  | "TALEP_IPTAL_EDILDI"
  | "TALEP_YENIDEN_ACILDI"
  | "TALEP_TAMAMLANDI"
  | "EVRAK_YUKLENDI"
  | "EVRAK_ONAYLANDI"
  | "EVRAK_REDDEDILDI"
  | "SABLON_GUNCELLENDI"
  | "GOREV_OLUSTURULDU"
  | "GOREV_GUNCELLENDI"
  | "GOREV_DURUMU_DEGISTI"
  | "GOREV_ATANDI"
  | "GOREV_YORUMLANDI"
  | "GOREV_SILINDI"
  | "DONEM_GOREVLERI_OLUSTURULDU"
  | "NILVERA_BAGLANDI"
  | "NILVERA_BAGLANTI_KALDIRILDI"
  | "EBELGE_SENKRONIZE_EDILDI"
  | "EFATURA_KABUL_EDILDI"
  | "EFATURA_REDDEDILDI"
  | "EBELGE_ARSIVE_KAYDEDILDI"

export interface AktiviteLog {
  id: string
  aktorId: string
  eylem: AktiviteEylem
  hedefTip?:
    | "MUKELLEF"
    | "CREDENTIAL"
    | "GOREV"
    | "EVRAK"
    | "TAKVIM"
    | "ARSIV"
    | "EBELGE"
  hedefId?: string
  /** Kaydın ilişkili olduğu mükellef (mükellef kartındaki aktivite akışı için) */
  mukellefId?: string
  aciklama?: string
  zaman: ISODateString
}

/** Bildirim türü: aktivite eylemleri + yalnızca bildirimde var olan türler (anma, hatırlatmalar) */
export type BildirimTur =
  | AktiviteEylem
  | "GOREV_ANILDI"
  | "GOREV_GECIKTI"
  | "BELGE_GECERLILIK"
  | "EFATURA_YANIT_SURESI"
  | "BEYAN_YAKLASIYOR"

/** Uygulama içi bildirim. `aliciId: null` → tüm kullanıcılara yayın (aktörün kendisi hariç). */
export interface Bildirim {
  id: string
  tur: BildirimTur
  aliciId: string | null
  aktorId?: string
  baslik: string
  aciklama?: string
  /** Uygulama içi yol, ör. /gorevler?gorev=o_12 */
  link?: string
  mukellefId?: string
  hedefTip?: AktiviteLog["hedefTip"]
  hedefId?: string
  zaman: ISODateString
  /** Okuyan kullanıcılar (yayınlarda okundu bilgisi kişi başınadır) */
  okuyanlar: string[]
  /** Hatırlatmaların tekilleştirme anahtarı, ör. "GOREV_GECIKTI:o_12:2026-09-23" */
  anahtar?: string
}

/** Şifre kasasında tutulan sistemler */
export type Sistem = "GIB" | "SGK" | "IVD" | "EBILDIRGE"

export interface EncryptedPayload {
  /** base64 AES-256-GCM şifreli metin (auth tag dahil) */
  cipherText: string
  /** base64 12 byte IV — her şifrelemede yeni üretilir */
  iv: string
}

/**
 * Bir mükellefin bir sistemdeki giriş bilgisi. Şifreler istemcide kasa anahtarıyla şifrelenir;
 * sunucu (mock) yalnızca şifreli veriyi görür. Şifreli içerik: `CredentialSecret` JSON'u.
 */
export interface Credential extends EncryptedPayload {
  id: string
  mukellefId: string
  sistem: Sistem
  kullaniciAdi: string
  /** Şifrelenmez; hassas bilgi yazılmamalı */
  not?: string
  sonGuncelleme: ISODateString
  guncelleyenId: string
}

/** Şifreli alanın çözülmüş hali */
export interface CredentialSecret {
  sifre: string
  /** GİB "şifre", SGK "işyeri şifresi" gibi ikinci gizli alan */
  ekSifre?: string
}

/**
 * Büro kasasının anahtar türetme bilgisi. Ana şifre hiçbir yerde saklanmaz;
 * doğrulama için bilinen bir metnin şifreli hali (`verifier`) tutulur.
 */
export interface KasaMeta {
  id: string
  salt: string
  iterations: number
  verifier: EncryptedPayload
  olusturmaTarihi: ISODateString
}

/** Vergi / bildirim yükümlülüğü türleri */
export type YukumlulukTip =
  | "KDV"
  | "MUHTASAR_SGK"
  | "GECICI_VERGI"
  | "KURUMLAR"
  | "GELIR"
  | "BA_BS"
  | "E_DEFTER_BERAT"

/** Saklanan beyan durumu. "Gecikti" saklanmaz; son tarih ve bugünden türetilir. */
export type BeyanDurumu = "BEKLIYOR" | "HAZIRLANDI" | "ONAYLANDI"

/**
 * Takvim olayları kural motoruyla her istekte hesaplanır; DB'de yalnızca
 * durum değişiklikleri tutulur. id = `${mukellefId}:${tip}:${donem}`
 */
export interface TakvimDurumKaydi {
  id: string
  mukellefId: string
  tip: YukumlulukTip
  /** "2026-09" (aylık), "2026-Q3" (3 aylık), "2025" (yıllık) */
  donem: string
  durum: BeyanDurumu
  guncelleyenId: string
  guncellemeTarihi: ISODateString
}

export type ArsivKategori =
  | "IMZA_SIRKULERI"
  | "TICARET_SICIL_GAZETESI"
  | "VERGI_LEVHASI"
  | "KIRA_SOZLESMESI"
  | "FAALIYET_BELGESI"
  | "KIMLIK"
  | "FATURA"
  | "DIGER"

/**
 * Dijital arşiv dosyası (meta veri). İçerik ayrı saklanır (mock: IndexedDB),
 * `GET /api/arsiv/:id/icerik` ile alınır.
 */
export interface ArsivDosya {
  id: string
  mukellefId: string
  kategori: ArsivKategori
  ad: string
  mimeType: string
  /** byte */
  boyut: number
  yukleyenId: string
  yuklemeTarihi: ISODateString
  /** yyyy-MM-dd — imza sirküleri, faaliyet belgesi, kira sözleşmesi gibi süreli belgeler */
  gecerlilikTarihi?: string
  /** Çöp kutusunda mı */
  silindi: boolean
  silinmeTarihi?: ISODateString
}

export type TalepKanal = "WHATSAPP" | "SMS" | "LINK"
/** Saklanan durum. "Süresi doldu" saklanmaz; `sonKullanma` ve şimdiden türetilir. */
export type TalepKayitDurumu = "AKTIF" | "TAMAMLANDI" | "IPTAL"
export type TalepDurumu = TalepKayitDurumu | "SURESI_DOLDU"

/** Müşteriden istenebilecek evrak türleri (şablon) */
export type IstenenEvrak =
  | "FIS_FATURA"
  | "BANKA_EKSTRESI"
  | "KIRA_SOZLESMESI"
  | "KIMLIK"
  | "IMZA_SIRKULERI"
  | "VERGI_LEVHASI"
  | "TICARET_SICIL_GAZETESI"
  | "FAALIYET_BELGESI"
  | "SGK_BELGELERI"
  | "DIGER"

export interface TalepGonderim {
  kanal: TalepKanal
  zaman: ISODateString
  gonderenId: string
}

/**
 * Müşteriye magic link ile gönderilen evrak talebi. Portal adresi: `/p/${token}`.
 * Token tahmin edilemez (32 byte rastgele, base64url) ve yalnızca URL path'inde taşınır.
 */
export interface EvrakTalebi {
  id: string
  mukellefId: string
  token: string
  kanal: TalepKanal
  istenenler: IstenenEvrak[]
  /** "2026-09"; dönemsiz talepler için boş */
  donem?: string
  /** Müşteriye gösterilen ek açıklama */
  aciklama?: string
  durum: TalepKayitDurumu
  sonKullanma: ISODateString
  olusturanId: string
  olusturmaTarihi: ISODateString
  gonderimler: TalepGonderim[]
  /** Müşterinin "Gönderimi tamamla" ile bıraktığı not */
  musteriNotu?: string
  tamamlanmaTarihi?: ISODateString
}

export type GelenEvrakDurum = "BEKLIYOR" | "ONAYLANDI" | "REDDEDILDI"

/** Portal üzerinden müşterinin yüklediği dosya. İçerik blob-store'da (id ile). */
export interface GelenEvrak {
  id: string
  talepId: string
  mukellefId: string
  /** Müşterinin hangi istenen evrak için yüklediği */
  istenen: IstenenEvrak
  ad: string
  mimeType: string
  boyut: number
  yuklemeTarihi: ISODateString
  durum: GelenEvrakDurum
  redNedeni?: string
  /** Onaylanınca oluşturulan arşiv dosyası */
  arsivDosyaId?: string
  inceleyenId?: string
  incelemeTarihi?: ISODateString
}

export type GorevDurum = "YAPILACAK" | "DEVAM" | "KONTROL" | "TAMAM"
export type GorevOncelik = "DUSUK" | "NORMAL" | "YUKSEK"
/** Beyanname görevleri yükümlülük tipini taşır; serbest görevler "DIGER" */
export type GorevTip = YukumlulukTip | "DIGER"

export interface GorevChecklistMaddesi {
  id: string
  metin: string
  tamam: boolean
  tamamlayanId?: string
  tamamlanmaTarihi?: ISODateString
}

export interface GorevYorum {
  id: string
  yazarId: string
  metin: string
  /** Yorumda @ ile anılan personel id'leri */
  bahsedilenler: string[]
  zaman: ISODateString
}

/** Büro içi iş takibi kaydı */
export interface Gorev {
  id: string
  baslik: string
  aciklama?: string
  mukellefId: string
  tip: GorevTip
  /** "2026-08" / "2026-Q2" / "2025"; serbest görevlerde isteğe bağlı */
  donem?: string
  atananId: string
  durum: GorevDurum
  oncelik: GorevOncelik
  /** yyyy-MM-dd */
  sonTarih: string
  checklist: GorevChecklistMaddesi[]
  yorumlar: GorevYorum[]
  bagliTalepIdler: string[]
  olusturanId: string
  olusturmaTarihi: ISODateString
  guncellemeTarihi: ISODateString
  tamamlanmaTarihi?: ISODateString
  /**
   * Takvim olayından üretilen görevlerde `${mukellefId}:${tip}:${donem}` (takvim olay id'si).
   * Dönem görevi üretimini idempotent yapar ve beyan durumu senkronu için kullanılır.
   */
  otomatikAnahtar?: string
}

// --- e-Belge (Nilvera) ------------------------------------------------------

/**
 * Mükellefin Nilvera hesabıyla bağlantısı (mükellef başına bir kayıt). API anahtarı yalnızca
 * backend'de şifreli saklanır; istemci ve mock DB yalnızca son 4 haneyi (`anahtarIpucu`) görür.
 */
export type NilveraBaglantiDurumu = "BAGLI" | "HATA" | "BAGLI_DEGIL"
export type NilveraOrtam = "TEST" | "CANLI"

export interface NilveraBaglanti {
  id: string
  mukellefId: string
  durum: NilveraBaglantiDurumu
  ortam: NilveraOrtam
  /** Nilvera'da açık servisler (GİB kayıtlı kullanıcı durumu) */
  eFatura: boolean
  eArsiv: boolean
  eDefter: boolean
  /** e-Fatura gelen posta kutusu etiketi, ör. "urn:mail:defaultpk@cinar.com.tr" */
  postaKutusu?: string
  /** API anahtarının son 4 karakteri */
  anahtarIpucu?: string
  sonSenkron?: ISODateString
  hataMesaji?: string
  baglayanId?: string
  baglanmaTarihi?: ISODateString
}

export type EBelgeTur = "E_FATURA" | "E_ARSIV"
export type EBelgeYon = "GELEN" | "GIDEN"
/** TEMEL: yanıt yok; TICARI: alıcı 8 gün içinde kabul/red verir; EARSIV: e-Arşiv faturası */
export type EBelgeSenaryo = "TEMEL" | "TICARI" | "EARSIV"
export type EBelgeFaturaTipi = "SATIS" | "IADE" | "TEVKIFAT" | "ISTISNA"
/** GİB'e iletim durumu */
export type GibDurumu = "BASARILI" | "ISLENIYOR" | "HATA" | "IPTAL"
/** Saklanan ticari fatura yanıtı. "Süresi doldu" saklanmaz; `alinmaTarihi`nden türetilir. */
export type EFaturaYanitKayit = "BEKLIYOR" | "KABUL" | "RED"
export type EFaturaYanit = EFaturaYanitKayit | "SURESI_DOLDU"

/**
 * Nilvera'dan senkronize edilen e-Fatura / e-Arşiv faturası (başlık bilgisi).
 * Kalemler saklanmaz; detay isteğinde entegratörden alınır.
 */
export interface EBelge {
  id: string
  mukellefId: string
  tur: EBelgeTur
  yon: EBelgeYon
  /** Evrensel tekil tanımlayıcı (UUID) */
  ettn: string
  /** 16 karakter, ör. "ABC2026000000123" */
  belgeNo: string
  senaryo: EBelgeSenaryo
  faturaTipi: EBelgeFaturaTipi
  karsiTaraf: { unvan: string; vknTckn: string }
  /** yyyy-MM-dd */
  duzenlemeTarihi: string
  /** Faturanın posta kutusuna düştüğü / gönderildiği an */
  alinmaTarihi: ISODateString
  matrah: number
  kdv: number
  toplam: number
  paraBirimi: "TRY" | "USD" | "EUR"
  gibDurumu: GibDurumu
  /** Yalnızca gelen ticari faturalarda */
  yanit?: EFaturaYanitKayit
  redNedeni?: string
  yanitlayanId?: string
  yanitTarihi?: ISODateString
  /** "Arşive kaydet" ile oluşturulan arşiv dosyası */
  arsivDosyaId?: string
}

/** e-Defter beratının GİB durumu. id = `${mukellefId}:${donem}` */
export type BeratDurumu = "YUKLENMEDI" | "YUKLENDI" | "ONAYLANDI" | "HATA"

export interface EDefterBerat {
  id: string
  mukellefId: string
  /** "2026-06" */
  donem: string
  durum: BeratDurumu
  yuklemeTarihi?: ISODateString
  onayTarihi?: ISODateString
  hataMesaji?: string
}

export const ARSIV_KATEGORI_ETIKET: Record<ArsivKategori, string> = {
  IMZA_SIRKULERI: "İmza sirküleri",
  TICARET_SICIL_GAZETESI: "Ticaret sicil gazetesi",
  VERGI_LEVHASI: "Vergi levhası",
  KIRA_SOZLESMESI: "Kira sözleşmesi",
  FAALIYET_BELGESI: "Faaliyet belgesi",
  KIMLIK: "Kimlik",
  FATURA: "Fatura",
  DIGER: "Diğer",
}

export const MUKELLEF_TUR_ETIKET: Record<MukellefTur, string> = {
  SAHIS: "Şahıs",
  LTD: "Ltd. Şti.",
  AS: "A.Ş.",
}

export const ROL_ETIKET: Record<Rol, string> = {
  YONETICI: "Yönetici",
  PERSONEL: "Personel",
}
