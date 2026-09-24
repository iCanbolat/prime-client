import type { TebligatKapsam } from "@/types/api"
import type {
  PostaKutusuDurumu,
  TebligatDurum,
  TebligatKurum,
  TebligatTur,
} from "@/types/domain"

export const SAYFA_BOYUTU = 20

export const TEBLIGAT_TUR_ETIKET: Record<TebligatTur, string> = {
  ODEME_EMRI: "Ödeme emri",
  VERGI_CEZA_IHBARNAMESI: "Vergi/ceza ihbarnamesi",
  IZAHA_DAVET: "İzaha davet",
  BILGI_ISTEME: "Bilgi isteme",
  INCELEME: "İnceleme / ibraz",
  DIGER: "Diğer",
}

export const TEBLIGAT_DURUM_ETIKET: Record<TebligatDurum, string> = {
  YENI: "Yeni",
  INCELENDI: "İncelendi",
  ISLEM_YAPILDI: "İşlem yapıldı",
  KAPANDI: "Kapandı",
}

export const KURUM_ETIKET: Record<TebligatKurum, string> = {
  GIB: "GİB",
  SGK: "SGK",
}

export const KAPSAM_ETIKET: Record<TebligatKapsam, string> = {
  acik: "Açık",
  acil: "Acil / geciken",
  eslesmeyen: "Eşleşmeyen",
  kapali: "Kapalı",
}

export const POSTA_DURUM_ETIKET: Record<PostaKutusuDurumu, string> = {
  BAGLI: "Bağlı",
  HATA: "Hatalı",
  BAGLI_DEGIL: "Bağlı değil",
}
