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
  PersonelRenk,
  Rol,
  YukumlulukTip,
  EBelge,
  EBelgeTur,
  EBelgeYon,
  EDefterBerat,
  EFaturaYanit,
  GibDurumu,
  EntegratorBaglanti,
  EntegratorOrtam,
  KontorAlim,
  Mizan,
  MizanHesap,
  Tahakkuk,
  CariHareket,
  Kapatma,
  KesintiIceAktarim,
  MukellefUcret,
  Tebligat,
  TebligatDurum,
  TebligatPostaKutusu,
  TebligatTur,
  BildirimTercihi,
  Gonderim,
  GonderimDurumu,
  GonderimKaynak,
  KanalAyari,
  KanalTip,
  MukellefKanal,
  WhatsappSablon,
  BelgeOkuma,
  FisDurum,
  FisHesapAyari,
  FisBelgeTuru,
  FisSatiri,
  LucaAktarim,
  LucaSablonAyari,
  MuhasebeFisi,
} from "@/types/domain"
import type { TebligatSureDurumu } from "@/features/tebligat/kurallar"
import type {
  AylikTahsilat,
  CariDurum,
  KesintiDurum,
  KesintiSatirOkuma,
  KesintiSatiri,
  YasDilimi,
} from "@/features/tahsilat/kurallar"

export interface LoginRequest {
  personelId: string
  sifre: string
}

/** Personel yönetimi işlemleri: yönetici her işlemde kendi şifresiyle onay verir. */
export interface YoneticiOnayi {
  yoneticiSifresi: string
}

export interface PersonelBilgi {
  ad: string
  soyad: string
  eposta: string
  telefon: string
  rol: Rol
  renk: PersonelRenk
  aktif: boolean
}

export interface PersonelOlusturRequest extends PersonelBilgi, YoneticiOnayi {
  sifre: string
}

export type PersonelGuncelleRequest = PersonelBilgi & YoneticiOnayi

export interface PersonelSifreRequest extends YoneticiOnayi {
  sifre: string
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
  /** Yalnızca süresi dolmuş / 30 gün içinde dolacak belgeler */
  gecerlilik?: Exclude<GecerlilikDurumu, "GECERLI">
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
  mukellefEposta: string
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

// --- e-Belge (Luca) ------------------------------------------------------

/** Mükellef başına bağlantı; kayıt yoksa `durum: "BAGLI_DEGIL"` ile üretilir. */
export type EntegratorBaglantiView = EntegratorBaglanti & {
  mukellefUnvan: string
  mukellefTur: MukellefTur
  sorumluPersonelId: string
}

export interface BaglantiKaydetRequest {
  /** Yalnızca backend'e iletilir; yanıtta ve istemci durumunda tutulmaz. */
  apiAnahtari: string
  ortam: EntegratorOrtam
}

export type EBelgeSiralama = "tarih" | "toplam"

export interface EBelgeListParams {
  mukellefId?: string
  tur?: EBelgeTur
  yon?: EBelgeYon
  gibDurumu?: GibDurumu
  yanit?: EFaturaYanit
  /** true: yanıt bekleyen ve süresi `YANIT_UYARI_GUN` gün içinde dolacak olanlar */
  yanitYaklasan?: boolean
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
  /** `hataliGonderim` içindeki e-Arşiv faturaları */
  hataliEArsiv: number
  baglantiHatasi: number
  bagliMukellef: number
  beratGeciken: number
  sonSenkron?: string
  kontorKalan: number
  kontorDusuk: boolean
}

// --- Kontör ------------------------------------------------------------------

export type KontorMukellefSatiri = {
  mukellefId: string
  mukellefUnvan: string
  gelen: number
  giden: number
  toplam: number
  /** toplam × birim maliyet: müşteriye yansıtılacak tutar (TL, KDV dahil) */
  tutar: number
}

export type KontorAlimView = KontorAlim & { ekleyenAd: string }

export interface KontorOzetResponse {
  donem: string
  toplamAlinan: number
  toplamTuketim: number
  kalan: number
  birimMaliyet: number
  aylikOrtalama: number
  tahminiAy: number | null
  dusukBakiye: boolean
  /** Son 6 ayın tüketimi, eskiden yeniye */
  aylik: { donem: string; tuketim: number }[]
  /** Seçili dönemde kontör harcayan mükellefler */
  mukellefler: KontorMukellefSatiri[]
  /** Yeniden eskiye */
  alimlar: KontorAlimView[]
}

export interface KontorAlimRequest {
  /** yyyy-MM-dd */
  tarih: string
  paketAdet: number
  hediyeAdet: number
  tutar: number
  not?: string
}

// --- İçe aktarım ----------------------------------------------------------------

/** İçe aktarılan dosya; istemci tarafından data URL olarak gönderilir, arşive kaydedilir */
export interface IceAktarDosya {
  ad: string
  dataUrl: string
}

/** Önizlemede kullanıcının onayladığı tahakkuk (ayrıştırma istemcide yapılır) */
export interface TahakkukIceAktarKalem {
  mukellefId: string
  tip: YukumlulukTip
  donem: string
  beyannameKodu?: string
  tahakkukNo?: string
  odenecek?: number
  vade?: string
  dosya: IceAktarDosya
}

export interface TahakkukIceAktarRequest {
  kalemler: TahakkukIceAktarKalem[]
}

export interface IceAktarSonucu {
  /** İstekteki kalem sırası */
  sira: number
  durum: "EKLENDI" | "GUNCELLENDI" | "HATA"
  mesaj?: string
}

export interface TahakkukIceAktarResponse {
  sonuclar: IceAktarSonucu[]
}

export type TahakkukView = Tahakkuk & { mukellefUnvan: string }

export interface MizanIceAktarRequest {
  mukellefId: string
  /** "2026-08" */
  donem: string
  dosya: IceAktarDosya
  hesaplar: MizanHesap[]
}

export interface MizanOzetBilgi {
  toplamBorc: number
  toplamAlacak: number
  donemSonucu: number
}

export type MizanView = Omit<Mizan, "hesaplar"> & {
  mukellefUnvan: string
  ozet: MizanOzetBilgi
  hesapSayisi: number
  /** Otomatik işaretlenen görev maddesi (geçici vergi görevinde "Mizan kontrol edildi") */
  isaretlenenGorevId?: string
}

export type MizanDetay = MizanView & { hesaplar: MizanHesap[] }

// --- Tahsilat ------------------------------------------------------------------

export type CariHareketView = CariHareket & {
  olusturanAd: string
  /** Borçta kapatılmamış tutar */
  kalan?: number
  /** Ödemede borçlara dağıtılmamış tutar (avans) */
  dagitilmamis?: number
  /** Hareketten sonraki yürüyen bakiye */
  bakiyeSonrasi: number
}

export type CariSatiri = CariDurum & {
  mukellefId: string
  mukellefUnvan: string
  mukellefTur: MukellefTur
  sorumluPersonelId: string
  ucret?: MukellefUcret
  /** yyyy-MM-dd */
  sonOdeme?: string
}

export type CariSiralama = "unvan" | "bakiye" | "gecikme"

export interface CariListParams {
  q?: string
  sorumlu?: string
  /** Yalnızca vadesi geçmiş açık borcu olanlar */
  geciken?: boolean
  /** Yalnızca bakiyesi sıfırdan farklı olanlar */
  bakiyeli?: boolean
  sirala?: CariSiralama
  yon?: SiralamaYonu
  sayfa?: number
  sayfaBoyutu?: number
}

export interface CariListResponse {
  items: CariSatiri[]
  total: number
  sayfa: number
  sayfaBoyutu: number
  /** Filtrelenen satırların bakiye toplamı */
  toplamBakiye: number
}

export type AcikBorcView = {
  id: string
  tarih: string
  kalan: number
  tutar: number
  kalem: CariHareket["kalem"]
  donem?: string
  aciklama?: string
}

export interface CariEkstreResponse {
  mukellefId: string
  mukellefUnvan: string
  ucret?: MukellefUcret
  durum: CariDurum
  /** Eskiden yeniye */
  hareketler: CariHareketView[]
  acikBorclar: AcikBorcView[]
  /** Dağıtılmamış ödeme toplamı */
  avans: number
}

export interface TahsilatOzetResponse {
  /** Pozitif bakiyelerin toplamı */
  toplamAlacak: number
  /** Negatif bakiyelerin (avans) mutlak toplamı */
  avans: number
  buAyTahakkuk: number
  buAyTahsilat: number
  borcluMukellef: number
  gecikenMukellef: number
  ucretliMukellef: number
  yaslandirma: Record<YasDilimi, number>
  /** Son 12 ay, eskiden yeniye */
  aylik: AylikTahsilat[]
  /** En uzun süredir borcu olan 5 mükellef */
  enGecikenler: CariSatiri[]
}

export interface BorcEkleRequest {
  tip: "BORC"
  mukellefId: string
  /** yyyy-MM-dd */
  tarih: string
  brut: number
  kdvOrani: number
  stopajVar: boolean
  aciklama: string
  makbuzNo?: string
}

export interface OdemeEkleRequest {
  tip: "ODEME"
  mukellefId: string
  kalem: "ODEME" | "DUZELTME"
  /** yyyy-MM-dd */
  tarih: string
  tutar: number
  aciklama?: string
  makbuzNo?: string
  /** Verilmezse en eski borçtan başlayarak (FIFO) dağıtılır */
  kapatmalar?: Kapatma[]
}

export type HareketEkleRequest = BorcEkleRequest | OdemeEkleRequest

export interface UcretKaydetRequest {
  /** null: ücret kaldırılır (sonraki aylar borçlandırılmaz) */
  ucret: MukellefUcret | null
}

export interface KesintiIceAktarRequest {
  yil: number
  dosyaAdi: string
  kayitlar: KesintiSatirOkuma[]
}

export type KesintiIceAktarimView = KesintiIceAktarim & { yukleyenAd: string }

export interface KesintiRaporResponse {
  yil: number
  iceAktarim?: KesintiIceAktarimView
  satirlar: KesintiSatiri[]
  ozet: Record<KesintiDurum, number>
  /** İçe aktarım yapılmış yıllar, yeniden eskiye */
  yillar: number[]
}

export interface BuroGuncelleRequest {
  iban?: string
}

// --- e-Tebligat --------------------------------------------------------------------

export type TebligatView = Tebligat &
  TebligatSureDurumu & {
    mukellefUnvan?: string
    sorumluPersonelId?: string
    atananAd?: string
  }

export type TebligatKapsam = "acik" | "acil" | "eslesmeyen" | "kapali"

export interface TebligatListParams {
  kapsam?: TebligatKapsam
  tur?: TebligatTur
  mukellefId?: string
  q?: string
  sayfa?: number
  sayfaBoyutu?: number
}

export interface TebligatListResponse {
  items: TebligatView[]
  total: number
  sayfa: number
  sayfaBoyutu: number
}

export interface TebligatOzetResponse {
  acik: number
  acil: number
  geciken: number
  eslesmeyen: number
  /** Son 7 günde ulaşan */
  yeni: number
  /** Son işlem günü en yakın açık tebligatlar (en fazla 5) */
  yaklasan: TebligatView[]
  postaKutusu: TebligatPostaKutusuView | null
}

export interface TebligatGuncelleRequest {
  durum?: TebligatDurum
  /** null: atama kaldırılır */
  atananId?: string | null
  not?: string
  /** Eşleşmeyen tebligatı mükellefe bağlar */
  mukellefId?: string
  /** null: türün varsayılan süresine döner */
  sureGun?: number | null
}

export interface TebligatEkleRequest {
  mukellefId: string
  kurum: Tebligat["kurum"]
  tur: TebligatTur
  konu: string
  belgeNo?: string
  /** yyyy-MM-dd — belgenin elektronik adrese ulaştığı gün */
  ulasmaGunu: string
  sureGun?: number
}

export interface TebligatBelgeRequest {
  dosya: IceAktarDosya
}

export interface TebligatTaraResponse {
  okunan: number
  yeni: number
  eslesmeyen: number
  /** Tebligat bildirimi olmayan e-postalar */
  atlanan: number
  sonTarama: string
}

export type TebligatPostaKutusuView = Omit<TebligatPostaKutusu, "sonUid">

export interface PostaKutusuKaydetRequest {
  sunucu: string
  port: number
  kullanici: string
  klasor: string
  /** Yalnızca bu istekte backend'e gider; yanıtta ve depoda son 4 karakteri kalır */
  sifre: string
}

// --- Gönderim kanalları --------------------------------------------------------------

/** Yapılandırılmamış kanal null döner. Gizli alanlar (şifre, token) hiçbir yanıtta yer almaz. */
export type KanallarResponse = Record<KanalTip, KanalAyari | null>

interface KanalKaydetTemel {
  aktif: boolean
}

export type KanalKaydetRequest =
  | (KanalKaydetTemel & {
      tip: "EPOSTA"
      sunucu: string
      port: number
      guvenlik: "TLS" | "STARTTLS"
      kullanici: string
      gonderenAd: string
      gonderenAdres: string
      /** İlk kurulumda zorunlu; güncellemede boş bırakılırsa mevcut şifre korunur */
      sifre?: string
    })
  | (KanalKaydetTemel & {
      tip: "TELEGRAM"
      botKullaniciAdi: string
      token?: string
    })
  | (KanalKaydetTemel & {
      tip: "WHATSAPP"
      telefonNumarasiId: string
      wabaId: string
      gorunenNumara: string
      sablonlar: Partial<Record<WhatsappSablon, string>>
      erisimAnahtari?: string
    })

export interface KanalTestResponse {
  gonderim: Gonderim
}

export type BildirimTercihView = BildirimTercihi & {
  eposta: string
  telefon: string
  telegramBagli: boolean
}

export interface BildirimTercihKaydetRequest {
  kanallar: Partial<Record<string, KanalTip[]>>
}

export interface TelegramBaglamaResponse {
  kod: string
  /** https://t.me/<bot>?start=<kod> */
  link: string
}

export interface GonderimListParams {
  kanal?: KanalTip
  durum?: GonderimDurumu
  aliciTip?: Gonderim["aliciTip"]
  kaynak?: GonderimKaynak
  sayfa?: number
  sayfaBoyutu?: number
}

export interface GonderimListResponse {
  items: Gonderim[]
  total: number
  sayfa: number
  sayfaBoyutu: number
  /** Son 7 günde hatalı gönderim sayısı */
  hataliSon7Gun: number
}

export interface MukellefGonderHedef {
  mukellefId: string
  talepId?: string
  tahakkukId?: string
}

export interface MukellefGonderRequest {
  sablon: MesajSablonTip
  /** Verilmezse mükellefin tercihi; o da yoksa telefon varsa WhatsApp, yoksa e-posta */
  kanal?: MukellefKanal
  hedefler: MukellefGonderHedef[]
  /** Tek hedefte düzenlenmiş metin (e-posta ve wa.me için; WhatsApp Business onaylı şablon kullanır) */
  metin?: string
  /** true: gönderilmez, yalnızca mesajlar ve kanal önizlenir */
  onizleme?: boolean
  /** RED şablonu için */
  neden?: string
}

export interface MukellefGonderSonucu {
  mukellefId: string
  unvan: string
  kanal: MukellefKanal
  /** Maskesiz adres (yalnızca büro kullanıcısına) */
  adres: string
  konu: string
  mesaj: string
  /** Önizlemede boş */
  durum?: GonderimDurumu
  hataMesaji?: string
  /** Kanal yapılandırılmamışsa wa.me / mailto bağlantısı */
  link?: string
  /** Kanal sunucudan gönderebilir mi (yapılandırılmış ve bağlı) */
  sunucudan: boolean
  gonderimId?: string
}

export interface MukellefGonderResponse {
  sonuclar: MukellefGonderSonucu[]
}

// ——— Fiş aktarımı (OCR → muhasebe fişi → Luca Excel) ———

export interface FisListParams {
  mukellefId?: string
  durum?: FisDurum
  /** "2026-08": fiş tarihi bu ayda olanlar */
  donem?: string
}

export type FisView = MuhasebeFisi & {
  mukellefUnvan: string
  gelenAd: string
  toplam: number
  /** Onayı engelleyen hatalar (`fisHatalari`) */
  hatalar: string[]
  aktarimDosyaAdi?: string
}

export type FisDetay = FisView & {
  okuma: BelgeOkuma
  gelenMimeType: string
}

/** Okunmakta olan ya da okunamayan belgeler (henüz fişi olmayanlar) */
export type OkumaView = BelgeOkuma & {
  mukellefUnvan: string
  gelenAd: string
}

export interface FisGuncelleRequest {
  tarih: string
  aciklama: string
  evrakNo?: string
  evrakTarihi?: string
  belgeTuru?: FisBelgeTuru
  satirlar: FisSatiri[]
}

export interface FisSayacResponse {
  /** Onay bekleyen taslaklar */
  taslak: number
  /** Onaylı, Luca'ya aktarılmamış */
  hazir: number
  okunuyor: number
  hatali: number
}

export interface LucaAktarimRequest {
  mukellefId: string
  fisIdleri: string[]
}

export type LucaAktarimView = LucaAktarim & {
  mukellefUnvan: string
  olusturan: string
}

/** Excel istemcide büro şablonuyla üretilir; yeniden indirme için fişler de döner */
export interface LucaAktarimDetay {
  aktarim: LucaAktarimView
  fisler: MuhasebeFisi[]
  sablon: LucaSablonAyari
}

export type FisHesapAyariRequest = Omit<FisHesapAyari, "id">

export interface FisHesapAyariResponse {
  ayar: FisHesapAyari
  /** Mükellefin defter türü fiş aktarımını destekliyor mu (şimdilik yalnızca bilanço) */
  destekli: boolean
}
