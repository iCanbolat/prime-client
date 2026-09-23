/** API istek/yanıt sözleşmeleri. MSW handler'ları ve feature api katmanı ortak kullanır. */
import type {
  Gorev,
  GorevDurum,
  GorevOncelik,
  GorevTip,
  EvrakTalebi,
  GelenEvrak,
  GelenEvrakDurum,
  IstenenEvrak,
  MesajSablonTip,
  TalepDurumu,
  TalepKanal,
  AktiviteEylem,
  ArsivDosya,
  ArsivKategori,
  BeyanDurumu,
  AktiviteLog,
  Bildirim,
  Credential,
  KasaMeta,
  Mukellef,
  MukellefTur,
  Personel,
  YukumlulukTip,
  EBelge,
  EBelgeTur,
  EBelgeYon,
  EDefterBerat,
  EFaturaYanit,
  GibDurumu,
  NilveraBaglanti,
  NilveraOrtam,
} from "@/types/domain"

export interface LoginRequest {
  personelId: string
}

export interface LoginResponse {
  personel: Personel
}

export type MukellefDurumFiltre = "aktif" | "pasif" | "tumu"
export type MukellefSiralama = "unvan" | "olusturmaTarihi"
export type SiralamaYonu = "asc" | "desc"

export interface MukellefListParams {
  q?: string
  tur?: MukellefTur[]
  sorumlu?: string
  /** Varsayılan: tumu */
  durum?: MukellefDurumFiltre
  sirala?: MukellefSiralama
  yon?: SiralamaYonu
  /** 1 tabanlı. Verilmezse tüm kayıtlar döner (arama paleti, dashboard). */
  sayfa?: number
  sayfaBoyutu?: number
}

export interface MukellefListResponse {
  items: Mukellef[]
  total: number
  sayfa: number
  sayfaBoyutu: number
}

export type MukellefInput = Omit<Mukellef, "id" | "olusturmaTarihi">

export interface TopluAtamaRequest {
  ids: string[]
  sorumluPersonelId: string
}

export interface AktiviteListParams {
  mukellefId?: string
  hedefId?: string
  limit?: number
}

export type AktiviteKaydi = AktiviteLog & {
  aktor: Pick<Personel, "id" | "ad" | "soyad" | "renk"> | null
}

export interface BildirimListParams {
  sadeceOkunmamis?: boolean
  /** Varsayılan 30, en fazla 100 */
  limit?: number
}

export type BildirimView = Omit<Bildirim, "okuyanlar"> & {
  okundu: boolean
  aktor: Pick<Personel, "id" | "ad" | "soyad" | "renk"> | null
}

export interface BildirimListResponse {
  items: BildirimView[]
  /** Kullanıcının toplam okunmamış bildirim sayısı (limitten bağımsız) */
  okunmamis: number
}

export type KasaMetaResponse = Omit<KasaMeta, "id" | "olusturmaTarihi">

export interface SonErisim {
  eylem: AktiviteEylem
  zaman: string
  aktorAdi: string
}

export type CredentialKaydi = Credential & { sonErisim: SonErisim | null }

export interface CredentialListParams {
  mukellefId?: string
}

export type CredentialCreateRequest = Pick<
  Credential,
  "mukellefId" | "sistem" | "kullaniciAdi" | "cipherText" | "iv" | "not"
>

export type CredentialUpdateRequest = Pick<
  Credential,
  "kullaniciAdi" | "cipherText" | "iv" | "not"
>

export interface CredentialErisimRequest {
  eylem: Extract<AktiviteEylem, "SIFRE_GORUNTULENDI" | "SIFRE_KOPYALANDI">
}

export type TakvimDurumFiltre =
  "bekliyor" | "hazirlandi" | "onaylandi" | "gecikti"

export interface TakvimListParams {
  /** yyyy-MM-dd, dahil */
  baslangic: string
  /** yyyy-MM-dd, dahil */
  bitis: string
  mukellefId?: string
  tip?: YukumlulukTip[]
  tur?: MukellefTur[]
  sorumlu?: string
  durum?: TakvimDurumFiltre
}

/** Hesaplanmış takvim olayı (kural motoru + saklanan durum) */
export interface TakvimOlayi {
  /** `${mukellefId}:${tip}:${donem}` */
  id: string
  mukellefId: string
  mukellefUnvan: string
  mukellefTur: MukellefTur
  sorumluPersonelId: string
  tip: YukumlulukTip
  donem: string
  /** Tatil/hafta sonu kaydırması uygulanmış son gün (yyyy-MM-dd) */
  sonTarih: string
  /** Kuraldaki asıl son gün; kaydırma yoksa sonTarih ile aynı */
  yasalSonTarih: string
  durum: BeyanDurumu
  /** Son gün geçti ve onaylanmadı */
  gecikti: boolean
  guncelleyenId?: string
  guncellemeTarihi?: string
  /** Bu yükümlülük için üretilmiş görev */
  gorevId?: string
  gorevDurum?: GorevDurum
}

export interface TakvimDurumGuncelleRequest {
  durum: BeyanDurumu
}

export interface TakvimOzetParams {
  sorumlu?: string
}

export interface TakvimOzetResponse {
  bugun: string
  /** Bugünden itibaren 7 gün içinde son günü olan, onaylanmamış olaylar */
  buHafta: TakvimOlayi[]
  /** Son günü geçmiş, onaylanmamış olaylar (son 6 ay) */
  geciken: TakvimOlayi[]
  /** Bu ay ve gelecek ay, hazırlanıp onay bekleyenler */
  onayBekleyen: number
  onayBekleyenListe: TakvimOlayi[]
  /** Bugünden itibaren 14 gün, gün başına açık yükümlülük sayısı */
  yogunluk: { tarih: string; adet: number }[]
  personel: { personelId: string; acik: number; geciken: number }[]
}

export type ArsivSiralama =
  "ad" | "yuklemeTarihi" | "boyut" | "gecerlilikTarihi"
export type GecerlilikDurumu = "GECERLI" | "YAKINDA" | "DOLDU"

export interface ArsivListParams {
  mukellefId?: string
  kategori?: ArsivKategori
  q?: string
  sirala?: ArsivSiralama
  yon?: SiralamaYonu
  /** true: yalnızca çöp kutusu */
  cop?: boolean
  sorumlu?: string
  /** 1 tabanlı. Verilmezse tüm kayıtlar döner (mükellef kartındaki kategori sayıları). */
  sayfa?: number
  sayfaBoyutu?: number
}

export type ArsivDosyaView = ArsivDosya & {
  mukellefUnvan: string
  yukleyen: Pick<Personel, "id" | "ad" | "soyad" | "renk"> | null
}

export interface ArsivListResponse {
  items: ArsivDosyaView[]
  total: number
  sayfa: number
  sayfaBoyutu: number
}

export interface ArsivAgacMukellef {
  mukellefId: string
  unvan: string
  tur: MukellefTur
  toplam: number
  kategoriler: Partial<Record<ArsivKategori, number>>
  eksikZorunlu: ArsivKategori[]
}

export interface ArsivAgacParams {
  sorumlu?: string
}

export interface ArsivAgacResponse {
  mukellefler: ArsivAgacMukellef[]
  copSayisi: number
}

export interface ArsivYukleRequest {
  mukellefId: string
  kategori: ArsivKategori
  ad: string
  mimeType: string
  boyut: number
  gecerlilikTarihi?: string
  /** base64 data URL */
  dataUrl: string
}

export interface ArsivGuncelleRequest {
  ad?: string
  kategori?: ArsivKategori
  /** null: kaldır */
  gecerlilikTarihi?: string | null
}

export interface ArsivIcerikResponse {
  dataUrl: string
}

export interface ArsivOzetParams {
  sorumlu?: string
}

export type ArsivGecerlilikKaydi = ArsivDosyaView & {
  gecerlilik: Exclude<GecerlilikDurumu, "GECERLI">
  kalanGun: number
}

export interface ArsivOzetResponse {
  /** Süresi dolmuş veya 30 gün içinde dolacak belgeler (en acil önce) */
  gecerlilik: ArsivGecerlilikKaydi[]
  eksikZorunlu: {
    mukellefId: string
    unvan: string
    eksik: ArsivKategori[]
  }[]
}

// ——— Evrak talepleri (Faz 4) ———

export interface TalepListParams {
  mukellefId?: string
  durum?: TalepDurumu
  q?: string
}

export type TalepView = Omit<EvrakTalebi, "durum"> & {
  durum: TalepDurumu
  mukellefUnvan: string
  mukellefTelefon: string
  olusturan: Pick<Personel, "id" | "ad" | "soyad" | "renk"> | null
  yuklemeSayisi: number
  bekleyenSayisi: number
}

export type TalepDetay = TalepView & { gelenler: GelenEvrak[] }

export interface TalepOlusturRequest {
  mukellefId: string
  istenenler: IstenenEvrak[]
  donem?: string
  aciklama?: string
  kanal: TalepKanal
  gecerlilikGun: number
}

export interface TalepGonderimRequest {
  kanal: TalepKanal
}

export interface TalepUzatRequest {
  gun: number
}

export interface GelenListParams {
  durum?: GelenEvrakDurum
  mukellefId?: string
  talepId?: string
}

export type GelenEvrakView = GelenEvrak & {
  mukellefUnvan: string
  talep: Pick<EvrakTalebi, "id" | "donem" | "kanal">
}

export interface GelenOnaylaRequest {
  kategori: ArsivKategori
  ad: string
  gecerlilikTarihi?: string
}

export interface GelenReddetRequest {
  neden: string
  /** Talep tamamlanmış/süresi dolmuşsa yeniden açılır ve süre en az 7 gün uzatılır */
  yenidenAc: boolean
}

export interface GelenSayacResponse {
  bekleyen: number
}

export type MesajSablonlari = Record<MesajSablonTip, string>

// ——— Müşteri portalı (girişsiz) ———

export interface PortalYukleme {
  id: string
  istenen: IstenenEvrak
  ad: string
  mimeType: string
  boyut: number
  durum: GelenEvrakDurum
  redNedeni?: string
  yuklemeTarihi: string
}

export interface PortalResponse {
  durum: TalepDurumu
  buro: { ad: string; telefon: string }
  mukellefUnvan: string
  istenenler: IstenenEvrak[]
  donem?: string
  aciklama?: string
  sonKullanma: string
  yuklemeler: PortalYukleme[]
}

export interface PortalYukleRequest {
  istenen: IstenenEvrak
  ad: string
  mimeType: string
  boyut: number
  dataUrl: string
}

export interface PortalTamamlaRequest {
  not?: string
}

// ——— Görevler (Faz 5) ———

export interface GorevListParams {
  /** Atanan personel id'leri (herhangi biri) */
  atanan?: string[]
  mukellefId?: string
  tip?: GorevTip[]
  donem?: string
  durum?: GorevDurum[]
  /** true: yalnızca gecikenler */
  geciken?: boolean
  q?: string
}

export type GorevView = Gorev & {
  mukellefUnvan: string
  mukellefTur: MukellefTur
  gecikti: boolean
}

export interface GorevBagliTalep {
  id: string
  durum: TalepDurumu
  istenenler: IstenenEvrak[]
  donem?: string
  olusturmaTarihi: string
}

export type GorevDetay = GorevView & {
  bagliTalepler: GorevBagliTalep[]
  /** Otomatik görevlerde takvimdeki beyan durumu */
  beyanDurumu?: BeyanDurumu
}

export interface GorevOlusturRequest {
  baslik: string
  aciklama?: string
  mukellefId: string
  tip: GorevTip
  donem?: string
  atananId: string
  oncelik: GorevOncelik
  sonTarih: string
  /** Madde metinleri */
  checklist: string[]
}

export type GorevGuncelleRequest = Partial<
  Pick<
    Gorev,
    | "baslik"
    | "aciklama"
    | "atananId"
    | "oncelik"
    | "sonTarih"
    | "checklist"
    | "bagliTalepIdler"
  >
>

export interface GorevTasiRequest {
  durum: GorevDurum
}

export interface GorevTopluRequest {
  ids: string[]
  durum?: GorevDurum
  atananId?: string
}

export interface GorevTopluResponse {
  guncellenen: string[]
  /** Yetki nedeniyle güncellenmeyenler */
  reddedilen: string[]
}

export interface GorevYorumRequest {
  metin: string
}

export interface DonemPlanRequest {
  tip: YukumlulukTip
  donem: string
}

export interface DonemPlanSatiri {
  mukellefId: string
  unvan: string
  tur: MukellefTur
  atananId: string
  sonTarih: string
  /** Bu dönem için zaten görev varsa id'si */
  mevcutGorevId?: string
}

export type DonemOlusturRequest = DonemPlanRequest & {
  mukellefIdler: string[]
}

export interface DonemOlusturResponse {
  olusturulan: number
  atlanan: number
}

export interface GorevOzetParams {
  atanan?: string
}

export interface GorevOzetResponse {
  acik: number
  geciken: number
  personel: { personelId: string; acik: number; geciken: number }[]
}

export type DevStatsResponse = Record<string, number>

// --- e-Belge (Nilvera) ------------------------------------------------------

/** Mükellef başına bağlantı; kayıt yoksa `durum: "BAGLI_DEGIL"` ile üretilir. */
export type NilveraBaglantiView = NilveraBaglanti & {
  mukellefUnvan: string
  mukellefTur: MukellefTur
  sorumluPersonelId: string
}

export interface BaglantiKaydetRequest {
  /** Yalnızca backend'e iletilir; yanıtta ve istemci durumunda tutulmaz. */
  apiAnahtari: string
  ortam: NilveraOrtam
}

export type EBelgeSiralama = "tarih" | "toplam"

export interface EBelgeListParams {
  mukellefId?: string
  tur?: EBelgeTur
  yon?: EBelgeYon
  gibDurumu?: GibDurumu
  yanit?: EFaturaYanit
  q?: string
  /** yyyy-MM-dd, düzenleme tarihi (dahil) */
  baslangic?: string
  bitis?: string
  sirala?: EBelgeSiralama
  siralamaYonu?: SiralamaYonu
  /** 1 tabanlı. Verilmezse ilk sayfa. */
  sayfa?: number
  sayfaBoyutu?: number
}

export type EBelgeView = Omit<EBelge, "yanit"> & {
  mukellefUnvan: string
  /** Türetilmiş yanıt durumu (yalnızca gelen ticari faturalarda) */
  yanit?: EFaturaYanit
  /** Yanıt için kalan gün (BEKLIYOR iken) */
  yanitKalanGun?: number
}

export interface EBelgeListResponse {
  items: EBelgeView[]
  total: number
  sayfa: number
  sayfaBoyutu: number
  /** Filtrelenmiş kümenin toplam tutarı */
  toplamTutar: number
}

export interface EBelgeKalem {
  sira: number
  ad: string
  miktar: number
  birim: string
  birimFiyat: number
  kdvOrani: number
  tutar: number
}

export type EBelgeDetay = EBelgeView & {
  kalemler: EBelgeKalem[]
  mukellefVknTckn: string
}

export interface EFaturaYanitRequest {
  karar: "KABUL" | "RED"
  neden?: string
}

export interface EBelgeIcerikResponse {
  dataUrl: string
  ad: string
}

export interface SenkronRequest {
  /** Verilmezse tüm bağlı mükellefler */
  mukellefId?: string
}

export interface SenkronResponse {
  mukellefSayisi: number
  yeniFatura: number
  guncellenenFatura: number
  onaylananBerat: number
  hatali: { mukellefId: string; unvan: string; mesaj: string }[]
  sonSenkron: string
}

export interface BeratListParams {
  mukellefId?: string
  /** "2026" — verilmezse son 12 dönem */
  yil?: string
}

export type BeratView = EDefterBerat & {
  mukellefUnvan: string
  /** Takvimdeki E_DEFTER_BERAT olayının son günü (yyyy-MM-dd) */
  sonTarih?: string
  gecikti: boolean
}

export interface BeratListResponse {
  /** Matrisin sütunları, eskiden yeniye ("2025-09" … "2026-08") */
  donemler: string[]
  items: BeratView[]
}

export interface EBelgeOzetResponse {
  yanitBekleyen: number
  /** 2 gün içinde yanıt süresi dolacak gelen ticari faturalar */
  yanitSuresiYaklasan: EBelgeView[]
  hataliGonderim: number
  baglantiHatasi: number
  bagliMukellef: number
  beratGeciken: number
  sonSenkron?: string
}
