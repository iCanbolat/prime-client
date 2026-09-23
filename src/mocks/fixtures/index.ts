/**
 * Faker'dan bağımsız, elle yazılmış küçük veri seti. Birim/bileşen testleri buna dayanır;
 * böylece seed değişse de testler kırılmaz. Kullanım: `setDbState(createFixtureState())`.
 */
import type { DbState } from "@/mocks/db"
import { createBuro, createPersonelList } from "@/mocks/factories/personel"
import type {
  ArsivDosya,
  EBelge,
  EDefterBerat,
  NilveraBaglanti,
  EvrakTalebi,
  GelenEvrak,
  Gorev,
  GorevChecklistMaddesi,
  Mukellef,
} from "@/types/domain"

const base = {
  naceKodu: "62.01.01",
  faaliyet: "Bilgisayar programlama faaliyetleri",
  il: "İstanbul",
  ilce: "Kadıköy",
  adres: "Moda Cad. No:1 Kadıköy / İstanbul",
  aktif: true,
  etiketler: [],
  olusturmaTarihi: "2024-01-15T09:00:00.000Z",
} satisfies Partial<Mukellef>

export const FIXTURE_MUKELLEFLER: Mukellef[] = [
  {
    ...base,
    id: "m_sahis",
    tur: "SAHIS",
    unvan: "Ali Veli",
    tckn: "10000000146",
    vergiDairesi: "Kadıköy",
    telefon: "05321234567",
    eposta: "ali.veli@gmail.com",
    sorumluPersonelId: "p_2",
    kdvMukellefi: true,
    kdvPeriyodu: "AYLIK",
    defterTuru: "ISLETME",
    sgkIsyeriVar: false,
    calisanSayisi: 0,
    eDefterMukellefi: false,
  },
  {
    ...base,
    id: "m_ltd",
    tur: "LTD",
    unvan: "Çınar Yazılım San. ve Tic. Ltd. Şti.",
    vkn: "0174520662",
    vergiDairesi: "Kozyatağı",
    telefon: "05331234567",
    eposta: "info@cinaryazilim.com.tr",
    sorumluPersonelId: "p_3",
    kdvMukellefi: true,
    kdvPeriyodu: "AYLIK",
    defterTuru: "BILANCO",
    sgkIsyeriVar: true,
    calisanSayisi: 8,
    eDefterMukellefi: true,
  },
  {
    ...base,
    id: "m_as",
    tur: "AS",
    unvan: "Öztürk İnşaat A.Ş.",
    vkn: "9358005601",
    vergiDairesi: "Maslak",
    naceKodu: "41.20.01",
    faaliyet: "İkamet amaçlı binaların inşaatı",
    telefon: "05341234567",
    eposta: "info@ozturkinsaat.com.tr",
    sorumluPersonelId: "p_2",
    kdvMukellefi: true,
    kdvPeriyodu: "AYLIK",
    defterTuru: "BILANCO",
    sgkIsyeriVar: true,
    calisanSayisi: 45,
    eDefterMukellefi: true,
  },
]

const dosya = {
  mimeType: "application/pdf",
  boyut: 245_760,
  yukleyenId: "p_2",
  yuklemeTarihi: "2026-03-10T09:00:00.000Z",
  silindi: false,
} satisfies Partial<ArsivDosya>

/**
 * Referans gün 2026-09-23 iken: m_ltd'de imza sirküleri eksik ve faaliyet belgesinin
 * dolmasına 20 gün var; m_as'ın imza sirkülerinin süresi dolmuş; m_sahis'te çöp kutusunda 1 dosya.
 */
export const FIXTURE_ARSIV: ArsivDosya[] = [
  {
    ...dosya,
    id: "d_sahis_levha",
    mukellefId: "m_sahis",
    kategori: "VERGI_LEVHASI",
    ad: "Vergi levhası 2026.pdf",
  },
  {
    ...dosya,
    id: "d_sahis_kimlik",
    mukellefId: "m_sahis",
    kategori: "KIMLIK",
    ad: "Kimlik ön yüz.png",
    mimeType: "image/png",
    boyut: 512_000,
  },
  {
    ...dosya,
    id: "d_sahis_cop",
    mukellefId: "m_sahis",
    kategori: "DIGER",
    ad: "Eski dekont.pdf",
    silindi: true,
    silinmeTarihi: "2026-09-20T09:00:00.000Z",
  },
  {
    ...dosya,
    id: "d_ltd_levha",
    mukellefId: "m_ltd",
    kategori: "VERGI_LEVHASI",
    ad: "Vergi levhası.pdf",
  },
  {
    ...dosya,
    id: "d_ltd_gazete",
    mukellefId: "m_ltd",
    kategori: "TICARET_SICIL_GAZETESI",
    ad: "Kuruluş gazetesi.pdf",
  },
  {
    ...dosya,
    id: "d_ltd_faaliyet",
    mukellefId: "m_ltd",
    kategori: "FAALIYET_BELGESI",
    ad: "Faaliyet belgesi.pdf",
    gecerlilikTarihi: "2026-10-13",
  },
  {
    ...dosya,
    id: "d_as_imza",
    mukellefId: "m_as",
    kategori: "IMZA_SIRKULERI",
    ad: "İmza sirküleri.pdf",
    gecerlilikTarihi: "2026-09-01",
  },
  {
    ...dosya,
    id: "d_as_levha",
    mukellefId: "m_as",
    kategori: "VERGI_LEVHASI",
    ad: "Vergi levhası.pdf",
  },
  {
    ...dosya,
    id: "d_as_gazete",
    mukellefId: "m_as",
    kategori: "TICARET_SICIL_GAZETESI",
    ad: "Sicil gazetesi.pdf",
  },
]

const talep = {
  kanal: "WHATSAPP",
  olusturanId: "p_2",
  olusturmaTarihi: "2026-09-20T09:00:00.000Z",
  gonderimler: [],
} satisfies Partial<EvrakTalebi>

/**
 * Referans an 2026-09-23 10:00 iken: tkn_aktif aktif (1 bekleyen dosya), tkn_sure süresi dolmuş,
 * tkn_iptal iptal, tkn_tamam tamamlanmış (1 onaylı, 1 reddedilmiş dosya).
 */
export const FIXTURE_TALEPLER: EvrakTalebi[] = [
  {
    ...talep,
    id: "e_aktif",
    mukellefId: "m_ltd",
    token: "tkn_aktif",
    istenenler: ["FIS_FATURA", "BANKA_EKSTRESI"],
    donem: "2026-08",
    durum: "AKTIF",
    sonKullanma: "2026-09-30T20:59:59.000Z",
    gonderimler: [
      {
        kanal: "WHATSAPP",
        zaman: "2026-09-20T09:05:00.000Z",
        gonderenId: "p_3",
      },
    ],
    olusturanId: "p_3",
  },
  {
    ...talep,
    id: "e_sure",
    mukellefId: "m_sahis",
    token: "tkn_sure",
    kanal: "SMS",
    istenenler: ["KIMLIK"],
    durum: "AKTIF",
    sonKullanma: "2026-09-10T20:59:59.000Z",
    olusturmaTarihi: "2026-09-03T09:00:00.000Z",
  },
  {
    ...talep,
    id: "e_iptal",
    mukellefId: "m_as",
    token: "tkn_iptal",
    istenenler: ["KIRA_SOZLESMESI"],
    durum: "IPTAL",
    sonKullanma: "2026-09-27T20:59:59.000Z",
  },
  {
    ...talep,
    id: "e_tamam",
    mukellefId: "m_as",
    token: "tkn_tamam",
    istenenler: ["VERGI_LEVHASI", "FIS_FATURA"],
    donem: "2026-08",
    durum: "TAMAMLANDI",
    sonKullanma: "2026-09-25T20:59:59.000Z",
    olusturmaTarihi: "2026-09-15T09:00:00.000Z",
    tamamlanmaTarihi: "2026-09-16T12:00:00.000Z",
    musteriNotu: "Faturaların tamamı ekte.",
  },
]

const gelen = {
  mimeType: "application/pdf",
  boyut: 320_000,
  yuklemeTarihi: "2026-09-21T10:00:00.000Z",
} satisfies Partial<GelenEvrak>

export const FIXTURE_GELENLER: GelenEvrak[] = [
  {
    ...gelen,
    id: "g_bekleyen",
    talepId: "e_aktif",
    mukellefId: "m_ltd",
    istenen: "FIS_FATURA",
    ad: "agustos-faturalar.pdf",
    durum: "BEKLIYOR",
  },
  {
    ...gelen,
    id: "g_onayli",
    talepId: "e_tamam",
    mukellefId: "m_as",
    istenen: "VERGI_LEVHASI",
    ad: "levha.pdf",
    durum: "ONAYLANDI",
    arsivDosyaId: "d_as_levha",
    inceleyenId: "p_2",
    incelemeTarihi: "2026-09-17T09:00:00.000Z",
  },
  {
    ...gelen,
    id: "g_red",
    talepId: "e_tamam",
    mukellefId: "m_as",
    istenen: "FIS_FATURA",
    ad: "IMG_0001.jpg",
    mimeType: "image/jpeg",
    durum: "REDDEDILDI",
    redNedeni: "Fotoğraf bulanık",
    inceleyenId: "p_2",
    incelemeTarihi: "2026-09-17T09:00:00.000Z",
  },
]

const KDV_MADDELERI = [
  "Faturalar alındı",
  "Beyanname hazırlandı",
  "Müşteri onayı",
  "Tahakkuk gönderildi",
]

const maddeler = (
  gorevId: string,
  metinler: string[],
  tamam: number
): GorevChecklistMaddesi[] =>
  metinler.map((metin, i) => ({
    id: `${gorevId}_c${i + 1}`,
    metin,
    tamam: i < tamam,
    ...(i < tamam
      ? { tamamlayanId: "p_2", tamamlanmaTarihi: "2026-09-20T09:00:00.000Z" }
      : {}),
  }))

const gorev = {
  oncelik: "NORMAL",
  yorumlar: [],
  bagliTalepIdler: [],
  olusturanId: "p_1",
  olusturmaTarihi: "2026-09-10T09:00:00.000Z",
  guncellemeTarihi: "2026-09-20T09:00:00.000Z",
} satisfies Partial<Gorev>

/**
 * Referans gün 2026-09-23 iken: o_vergi gecikmiş; o_muh_ltd p_3'ün Kontrol'deki görevi;
 * o_kdv_ltd 2/4 kontrol listeli; o_banka e_aktif talebine bağlı. Takvim durumu fixture'da boş.
 */
export const FIXTURE_GOREVLER: Gorev[] = [
  {
    ...gorev,
    id: "o_kdv_ltd",
    baslik: "KDV beyannamesi — Ağustos 2026",
    mukellefId: "m_ltd",
    tip: "KDV",
    donem: "2026-08",
    atananId: "p_3",
    durum: "DEVAM",
    oncelik: "YUKSEK",
    sonTarih: "2026-09-28",
    checklist: maddeler("o_kdv_ltd", KDV_MADDELERI, 2),
    otomatikAnahtar: "m_ltd:KDV:2026-08",
  },
  {
    ...gorev,
    id: "o_muh_ltd",
    baslik: "Muhtasar ve prim hizmet — Ağustos 2026",
    mukellefId: "m_ltd",
    tip: "MUHTASAR_SGK",
    donem: "2026-08",
    atananId: "p_3",
    durum: "KONTROL",
    sonTarih: "2026-09-28",
    checklist: maddeler(
      "o_muh_ltd",
      [
        "Puantaj ve bordro alındı",
        "Bordro hazırlandı",
        "Beyanname hazırlandı",
        "Tahakkuk gönderildi",
      ],
      3
    ),
    otomatikAnahtar: "m_ltd:MUHTASAR_SGK:2026-08",
  },
  {
    ...gorev,
    id: "o_kdv_as",
    baslik: "KDV beyannamesi — Ağustos 2026",
    mukellefId: "m_as",
    tip: "KDV",
    donem: "2026-08",
    atananId: "p_2",
    durum: "YAPILACAK",
    sonTarih: "2026-09-28",
    checklist: maddeler("o_kdv_as", KDV_MADDELERI, 0),
    otomatikAnahtar: "m_as:KDV:2026-08",
  },
  {
    ...gorev,
    id: "o_vergi",
    baslik: "Vergi levhası güncelleme",
    mukellefId: "m_sahis",
    tip: "DIGER",
    atananId: "p_2",
    durum: "YAPILACAK",
    sonTarih: "2026-09-15",
    checklist: [],
    olusturanId: "p_2",
  },
  {
    ...gorev,
    id: "o_kdv_sahis",
    baslik: "KDV beyannamesi — Temmuz 2026",
    mukellefId: "m_sahis",
    tip: "KDV",
    donem: "2026-07",
    atananId: "p_2",
    durum: "TAMAM",
    sonTarih: "2026-08-28",
    checklist: maddeler("o_kdv_sahis", KDV_MADDELERI, 4),
    tamamlanmaTarihi: "2026-08-27T15:00:00.000Z",
    otomatikAnahtar: "m_sahis:KDV:2026-07",
  },
  {
    ...gorev,
    id: "o_banka",
    baslik: "Banka mutabakatı",
    aciklama: "Eylül sonu banka bakiyeleri mutabakatı.",
    mukellefId: "m_ltd",
    tip: "DIGER",
    atananId: "p_2",
    durum: "DEVAM",
    sonTarih: "2026-10-05",
    checklist: maddeler("o_banka", ["Ekstreler alındı", "Mutabakat"], 1),
    bagliTalepIdler: ["e_aktif"],
    olusturanId: "p_3",
  },
]

/** m_ltd bağlı (e-Fatura, e-Arşiv, e-Defter); m_as bağlantı hatalı; m_sahis bağlı değil. */
export const FIXTURE_NILVERA: NilveraBaglanti[] = [
  {
    id: "n_m_ltd",
    mukellefId: "m_ltd",
    durum: "BAGLI",
    ortam: "CANLI",
    eFatura: true,
    eArsiv: true,
    eDefter: true,
    postaKutusu: "urn:mail:defaultpk@cinaryazilim.com.tr",
    anahtarIpucu: "x7k2",
    sonSenkron: "2026-09-22T06:00:00.000Z",
    baglayanId: "p_1",
    baglanmaTarihi: "2025-01-10T09:00:00.000Z",
  },
  {
    id: "n_m_as",
    mukellefId: "m_as",
    durum: "HATA",
    ortam: "CANLI",
    eFatura: true,
    eArsiv: true,
    eDefter: true,
    postaKutusu: "urn:mail:defaultpk@ozturkinsaat.com.tr",
    anahtarIpucu: "9qa1",
    sonSenkron: "2026-08-14T06:00:00.000Z",
    hataMesaji: "Nilvera API anahtarı geçersiz veya süresi dolmuş (401)",
    baglayanId: "p_1",
    baglanmaTarihi: "2025-01-10T09:00:00.000Z",
  },
]

const fatura = (
  id: string,
  alanlar: Partial<EBelge> &
    Pick<EBelge, "tur" | "yon" | "senaryo" | "duzenlemeTarihi" | "belgeNo">
): EBelge => ({
  mukellefId: "m_ltd",
  ettn: `00000000-0000-4000-8000-${id.padStart(12, "0").slice(-12)}`,
  faturaTipi: "SATIS",
  karsiTaraf: { unvan: "Deniz Lojistik Ltd. Şti.", vknTckn: "2940105481" },
  alinmaTarihi: `${alanlar.duzenlemeTarihi}T09:00:00.000Z`,
  matrah: 1000,
  kdv: 200,
  toplam: 1200,
  paraBirimi: "TRY",
  gibDurumu: "BASARILI",
  ...alanlar,
  id,
})

/**
 * Referans an 2026-09-23 10:00 iken: f_yakin'in yanıt süresine 1 gün, f_bekleyen'inkine 6 gün
 * var; f_doldu'nun süresi dolmuş. f_giden GİB'de işleniyor (senkronda başarılı olur).
 */
export const FIXTURE_EBELGE: EBelge[] = [
  fatura("f_bekleyen", {
    tur: "E_FATURA",
    yon: "GELEN",
    senaryo: "TICARI",
    belgeNo: "DNZ2026000000412",
    duzenlemeTarihi: "2026-09-21",
    yanit: "BEKLIYOR",
    matrah: 15000,
    kdv: 3000,
    toplam: 18000,
  }),
  fatura("f_yakin", {
    tur: "E_FATURA",
    yon: "GELEN",
    senaryo: "TICARI",
    belgeNo: "OFS2026000001207",
    duzenlemeTarihi: "2026-09-16",
    karsiTaraf: { unvan: "Ofis Kırtasiye A.Ş.", vknTckn: "6470152733" },
    yanit: "BEKLIYOR",
  }),
  fatura("f_doldu", {
    tur: "E_FATURA",
    yon: "GELEN",
    senaryo: "TICARI",
    belgeNo: "DNZ2026000000388",
    duzenlemeTarihi: "2026-09-01",
    yanit: "BEKLIYOR",
  }),
  fatura("f_kabul", {
    tur: "E_FATURA",
    yon: "GELEN",
    senaryo: "TICARI",
    belgeNo: "DNZ2026000000301",
    duzenlemeTarihi: "2026-08-20",
    yanit: "KABUL",
    yanitlayanId: "p_3",
    yanitTarihi: "2026-08-21T10:00:00.000Z",
  }),
  fatura("f_temel", {
    tur: "E_FATURA",
    yon: "GELEN",
    senaryo: "TEMEL",
    belgeNo: "ELK2026000045120",
    duzenlemeTarihi: "2026-09-10",
    karsiTaraf: {
      unvan: "Boğaziçi Elektrik Dağıtım A.Ş.",
      vknTckn: "1800396511",
    },
  }),
  fatura("f_giden", {
    tur: "E_FATURA",
    yon: "GIDEN",
    senaryo: "TICARI",
    belgeNo: "CNR2026000000057",
    duzenlemeTarihi: "2026-09-22",
    karsiTaraf: { unvan: "Mavi Yapı Market Ltd. Şti.", vknTckn: "6120467380" },
    gibDurumu: "ISLENIYOR",
    matrah: 42000,
    kdv: 8400,
    toplam: 50400,
  }),
  fatura("f_hata", {
    tur: "E_FATURA",
    yon: "GIDEN",
    senaryo: "TEMEL",
    belgeNo: "CNR2026000000051",
    duzenlemeTarihi: "2026-09-05",
    karsiTaraf: { unvan: "Mavi Yapı Market Ltd. Şti.", vknTckn: "6120467380" },
    gibDurumu: "HATA",
  }),
  fatura("f_arsiv", {
    tur: "E_ARSIV",
    yon: "GIDEN",
    senaryo: "EARSIV",
    belgeNo: "ACN2026000000019",
    duzenlemeTarihi: "2026-09-12",
    karsiTaraf: { unvan: "Selin Arslan", vknTckn: "10000000146" },
    paraBirimi: "USD",
    matrah: 500,
    kdv: 100,
    toplam: 600,
  }),
  fatura("f_as", {
    mukellefId: "m_as",
    tur: "E_FATURA",
    yon: "GIDEN",
    senaryo: "TEMEL",
    belgeNo: "OZT2026000000210",
    duzenlemeTarihi: "2026-08-15",
  }),
]

/** m_ltd: 2025-09…2026-05 berat alındı, 2026-06 berat bekleniyor, 2026-07 hatalı. */
export const FIXTURE_BERAT: EDefterBerat[] = [
  ...[
    "2025-09",
    "2025-10",
    "2025-11",
    "2025-12",
    "2026-01",
    "2026-02",
    "2026-03",
    "2026-04",
    "2026-05",
  ].map((donem): EDefterBerat => ({
    id: `m_ltd:${donem}`,
    mukellefId: "m_ltd",
    donem,
    durum: "ONAYLANDI",
    yuklemeTarihi: "2026-01-01T09:00:00.000Z",
    onayTarihi: "2026-01-02T09:00:00.000Z",
  })),
  {
    id: "m_ltd:2026-06",
    mukellefId: "m_ltd",
    donem: "2026-06",
    durum: "YUKLENDI",
    yuklemeTarihi: "2026-09-18T09:00:00.000Z",
  },
  {
    id: "m_ltd:2026-07",
    mukellefId: "m_ltd",
    donem: "2026-07",
    durum: "HATA",
    yuklemeTarihi: "2026-09-20T09:00:00.000Z",
    hataMesaji: "Yevmiye defteri kapanış kaydı ile kebir bakiyeleri tutarsız",
  },
]

export function createFixtureState(): DbState {
  return {
    buro: [createBuro()],
    personel: createPersonelList(),
    mukellef: structuredClone(FIXTURE_MUKELLEFLER),
    aktivite: [],
    credential: [],
    kasa: [],
    takvim: [],
    arsiv: structuredClone(FIXTURE_ARSIV),
    talep: structuredClone(FIXTURE_TALEPLER),
    gelen: structuredClone(FIXTURE_GELENLER),
    gorev: structuredClone(FIXTURE_GOREVLER),
    nilvera: structuredClone(FIXTURE_NILVERA),
    ebelge: structuredClone(FIXTURE_EBELGE),
    berat: structuredClone(FIXTURE_BERAT),
    bildirim: [],
  }
}
