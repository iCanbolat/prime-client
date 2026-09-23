import type {
  ArsivKategori,
  IstenenEvrak,
  MesajSablonTip,
  TalepDurumu,
  TalepKanal,
} from "@/types/domain"

/** Müşteri portalından gelen aktivite kayıtları bu aktörle yazılır */
export const MUSTERI_AKTOR_ID = "musteri"

export interface IstenenEvrakTanimi {
  ad: string
  /** Onaylanınca arşivde önerilen kategori */
  kategori: ArsivKategori
  /** Portalda müşteriye kısa açıklama */
  ipucu?: string
}

export const ISTENEN_EVRAKLAR: Record<IstenenEvrak, IstenenEvrakTanimi> = {
  FIS_FATURA: {
    ad: "Aylık fiş / fatura",
    kategori: "DIGER",
    ipucu: "Alış ve satış fişleri, faturalar",
  },
  BANKA_EKSTRESI: {
    ad: "Banka ekstresi",
    kategori: "DIGER",
    ipucu: "Dönemin tüm hesap hareketleri",
  },
  KIRA_SOZLESMESI: { ad: "Kira sözleşmesi", kategori: "KIRA_SOZLESMESI" },
  KIMLIK: {
    ad: "Kimlik fotokopisi",
    kategori: "KIMLIK",
    ipucu: "Ön ve arka yüz",
  },
  IMZA_SIRKULERI: { ad: "İmza sirküleri", kategori: "IMZA_SIRKULERI" },
  VERGI_LEVHASI: { ad: "Vergi levhası", kategori: "VERGI_LEVHASI" },
  TICARET_SICIL_GAZETESI: {
    ad: "Ticaret sicil gazetesi",
    kategori: "TICARET_SICIL_GAZETESI",
  },
  FAALIYET_BELGESI: { ad: "Faaliyet belgesi", kategori: "FAALIYET_BELGESI" },
  SGK_BELGELERI: { ad: "SGK işe giriş / çıkış belgeleri", kategori: "DIGER" },
  DIGER: { ad: "Diğer evraklar", kategori: "DIGER" },
}

export const ISTENEN_SIRASI: IstenenEvrak[] = [
  "FIS_FATURA",
  "BANKA_EKSTRESI",
  "SGK_BELGELERI",
  "KIRA_SOZLESMESI",
  "KIMLIK",
  "IMZA_SIRKULERI",
  "VERGI_LEVHASI",
  "TICARET_SICIL_GAZETESI",
  "FAALIYET_BELGESI",
  "DIGER",
]

/** Arşivdeki eksik kategoriden istenecek evrak türü */
export const KATEGORIDEN_ISTENEN: Partial<Record<ArsivKategori, IstenenEvrak>> =
  {
    IMZA_SIRKULERI: "IMZA_SIRKULERI",
    TICARET_SICIL_GAZETESI: "TICARET_SICIL_GAZETESI",
    VERGI_LEVHASI: "VERGI_LEVHASI",
    KIRA_SOZLESMESI: "KIRA_SOZLESMESI",
    FAALIYET_BELGESI: "FAALIYET_BELGESI",
    KIMLIK: "KIMLIK",
    DIGER: "DIGER",
  }

export function kategorilerdenIstenen(
  kategoriler: ArsivKategori[]
): IstenenEvrak[] {
  return [...new Set(kategoriler.map((k) => KATEGORIDEN_ISTENEN[k] ?? "DIGER"))]
}

export const KANAL_ETIKET: Record<TalepKanal, string> = {
  WHATSAPP: "WhatsApp",
  SMS: "SMS",
  LINK: "Bağlantı",
}

export const TALEP_DURUM_ETIKET: Record<TalepDurumu, string> = {
  AKTIF: "Aktif",
  TAMAMLANDI: "Tamamlandı",
  SURESI_DOLDU: "Süresi doldu",
  IPTAL: "İptal",
}

export const GECERLILIK_SECENEKLERI = [3, 7, 14, 30] as const
export const VARSAYILAN_GECERLILIK_GUN = 7

/** Büro şablonu yoksa kullanılan mesajlar */
export const VARSAYILAN_SABLONLAR: Record<MesajSablonTip, string> = {
  TALEP:
    "Merhaba {unvan}, {buro} olarak {donem} dönemi için şu evraklara ihtiyacımız var: {evraklar}. Aşağıdaki bağlantıdan fotoğraf çekerek veya dosya seçerek yükleyebilirsiniz: {link} (Son gün: {sonTarih}). Teşekkürler.",
  RED: "Merhaba {unvan}, gönderdiğiniz evraklardan biri uygun değil: {neden}. Lütfen aynı bağlantıdan tekrar yükleyin: {link} (Son gün: {sonTarih}). {buro}",
}
