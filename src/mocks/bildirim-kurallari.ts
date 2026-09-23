/**
 * Aktivite → bildirim kuralları. Hangi eylemin bildirim ürettiği, başlığı, bağlantısı ve alıcısı
 * burada belirlenir. Alıcı kuralı: olayın atananı (görev atananı → talebi oluşturan → mükellef
 * sorumlusu); atanan yoksa tüm kullanıcılara yayın. Aktör kendi eylemi için bildirim almaz.
 */
import { db } from "@/mocks/db"
import type { AktiviteLog, Bildirim, BildirimTur } from "@/types/domain"

/** Bildirim üreten eylemler ve başlıkları; açıklama olarak log açıklaması kullanılır. */
const BASLIKLAR: Partial<Record<AktiviteLog["eylem"], string>> = {
  GOREV_OLUSTURULDU: "Size yeni bir görev atandı",
  GOREV_ATANDI: "Bir görev size atandı",
  GOREV_DURUMU_DEGISTI: "Görevinizin durumu değişti",
  GOREV_YORUMLANDI: "Görevinize yorum yazıldı",
  GOREV_SILINDI: "Görevleriniz arasından bir görev silindi",
  DONEM_GOREVLERI_OLUSTURULDU: "Dönem görevleri oluşturuldu",
  EVRAK_YUKLENDI: "Müşteri evrak yükledi",
  TALEP_TAMAMLANDI: "Evrak talebi tamamlandı",
  EFATURA_KABUL_EDILDI: "e-Fatura kabul edildi",
  EFATURA_REDDEDILDI: "e-Fatura reddedildi",
  EBELGE_SENKRONIZE_EDILDI: "e-Belge senkronu tamamlandı",
  NILVERA_BAGLANTI_KALDIRILDI: "Nilvera bağlantısı kaldırıldı",
  ARSIV_YUKLENDI: "Arşive yeni dosya yüklendi",
  MUKELLEF_OLUSTURULDU: "Sorumlu olduğunuz yeni mükellef",
  BEYAN_DURUMU_GUNCELLENDI: "Beyan durumu güncellendi",
  SIFRE_SILINDI: "Kasadan bir şifre silindi",
  SABLON_GUNCELLENDI: "Mesaj şablonları güncellendi",
}

/** Bağlantı: bildirime tıklanınca açılacak uygulama içi yol */
export function bildirimLinki(
  log: Pick<AktiviteLog, "eylem" | "hedefTip" | "hedefId" | "mukellefId">
): string | undefined {
  const { hedefTip, hedefId, mukellefId } = log
  switch (hedefTip) {
    case "GOREV":
      return hedefId && log.eylem !== "GOREV_SILINDI"
        ? `/gorevler?gorev=${hedefId}`
        : "/gorevler"
    case "EVRAK": {
      const talepId = hedefId && (db.gelen.find(hedefId)?.talepId ?? hedefId)
      return talepId ? `/evrak-talepleri?talep=${talepId}` : "/evrak-talepleri"
    }
    case "EBELGE":
      if (hedefId) {
        const e = db.ebelge.find(hedefId)
        const sekme = e?.tur === "E_ARSIV" ? "e-arsiv" : "e-fatura"
        return `/e-belge/${sekme}?fatura=${hedefId}`
      }
      return "/e-belge"
    case "ARSIV":
      return mukellefId ? `/arsiv?mukellef=${mukellefId}` : "/arsiv"
    case "TAKVIM":
      return mukellefId ? `/mukellefler/${mukellefId}/takvim` : "/takvim"
    case "CREDENTIAL":
      return mukellefId ? `/mukellefler/${mukellefId}/sifreler` : "/kasa"
    case "MUKELLEF":
      return mukellefId ? `/mukellefler/${mukellefId}` : "/mukellefler"
    default:
      return log.eylem === "SABLON_GUNCELLENDI"
        ? "/ayarlar/sablonlar"
        : undefined
  }
}

/** Olayın atananı; yoksa `null` (yayın). */
export function aliciBul(log: AktiviteLog): string | null {
  if (log.hedefTip === "GOREV" && log.hedefId) {
    const g = db.gorev.find(log.hedefId)
    if (g) return g.atananId
  }
  if (log.hedefTip === "EVRAK" && log.hedefId) {
    const talepId = db.gelen.find(log.hedefId)?.talepId ?? log.hedefId
    const t = db.talep.find(talepId)
    if (t) return t.olusturanId
  }
  if (log.mukellefId) {
    const m = db.mukellef.find(log.mukellefId)
    if (m) return m.sorumluPersonelId
  }
  return null
}

export interface BildirimSecenekleri {
  /** Kural alıcısı yerine bu kişilere (kişi başına bir bildirim) */
  alicilar?: string[]
  tur?: BildirimTur
  /** Kural dışı bir eylem için verilirse bildirim yine üretilir */
  baslik?: string
}

/** Aktivite kaydından bildirim(ler) üretir. `logActivity` her kayıttan sonra çağırır. */
export function bildirimUret(
  log: AktiviteLog,
  secenek: BildirimSecenekleri = {}
): Bildirim[] {
  const baslik = secenek.baslik ?? BASLIKLAR[log.eylem]
  if (!baslik) return []

  const alicilar = secenek.alicilar ?? [aliciBul(log)]
  const ortak = {
    tur: secenek.tur ?? log.eylem,
    aktorId: log.aktorId,
    baslik,
    aciklama: log.aciklama,
    link: bildirimLinki(log),
    mukellefId: log.mukellefId,
    hedefTip: log.hedefTip,
    hedefId: log.hedefId,
    zaman: log.zaman,
  }

  return alicilar.flatMap((aliciId) => {
    // Kişiye özel bildirimde aktör kendine bildirim göndermez
    if (aliciId !== null && aliciId === log.aktorId) return []
    return [
      db.bildirim.insert({
        ...ortak,
        aliciId,
        // Yayında aktör baştan "okumuş" sayılır; listede zaten görünmez
        okuyanlar: aliciId === null ? [log.aktorId] : [],
      }),
    ]
  })
}

/** Kullanıcının görebileceği bildirim mi? */
export function bildirimGorunurMu(b: Bildirim, kullaniciId: string): boolean {
  return b.aliciId === null
    ? b.aktorId !== kullaniciId
    : b.aliciId === kullaniciId
}
