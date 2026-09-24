/**
 * Mock veritabanı: bellekte tutulur, her yazma işleminde localStorage'a kaydedilir.
 * Sayfa yenilense de veri korunur; `resetDb()` ile seed'e dönülür.
 * Yeni feature koleksiyonları (credential, gorev, ...) `DbState`'e eklenip `STORAGE_KEY` sürümü artırılır.
 */
import { DEFAULT_SEED, createSeed } from "@/mocks/seed"
import { clearBlobs } from "@/mocks/blob-store"
import type {
  AktiviteLog,
  ArsivDosya,
  Bildirim,
  EBelge,
  EDefterBerat,
  EvrakTalebi,
  GelenEvrak,
  Gorev,
  Buro,
  Credential,
  KasaMeta,
  KontorAlim,
  Mizan,
  Mukellef,
  EntegratorBaglanti,
  Personel,
  PersonelKimlik,
  TakvimDurumKaydi,
  Tahakkuk,
  CariHareket,
  KesintiIceAktarim,
  KesintiKaydi,
  Tebligat,
  TebligatPostaKutusu,
  BildirimTercihi,
  Gonderim,
  KanalAyari,
  BelgeOkuma,
  MuhasebeFisi,
  FisHesapAyari,
  LucaAktarim,
} from "@/types/domain"

export interface DbState {
  buro: Buro[]
  personel: Personel[]
  /** Personel giriş şifresi özetleri (id = personelId); API yanıtlarına eklenmez */
  kimlik: PersonelKimlik[]
  mukellef: Mukellef[]
  aktivite: AktiviteLog[]
  /** Şifreli kasa kayıtları. Seed'de boştur; ilk kasa isteğinde `ensureVault()` doldurur. */
  credential: Credential[]
  kasa: KasaMeta[]
  /** Beyan durumları; takvim olaylarının kendisi kural motoruyla hesaplanır */
  takvim: TakvimDurumKaydi[]
  /** Arşiv dosyalarının meta verisi; içerik `blob-store` (IndexedDB) içinde */
  arsiv: ArsivDosya[]
  /** Magic link evrak talepleri */
  talep: EvrakTalebi[]
  /** Portaldan gelen dosyalar (meta); içerik `blob-store` içinde */
  gelen: GelenEvrak[]
  /** Büro içi görevler */
  gorev: Gorev[]
  /** Mükellef başına Luca bağlantısı (web servis anahtarı burada da tutulmaz) */
  baglanti: EntegratorBaglanti[]
  /** Luca'dan senkronize edilen e-Fatura / e-Arşiv başlıkları */
  ebelge: EBelge[]
  /** e-Defter berat durumları */
  berat: EDefterBerat[]
  /** Büronun Luca kontör alımları (tüketim e-belgelerden hesaplanır) */
  kontor: KontorAlim[]
  /** İçe aktarılan tahakkuk fişleri */
  tahakkuk: Tahakkuk[]
  /** İçe aktarılan mizanlar */
  mizan: Mizan[]
  /** Uygulama içi bildirimler (aktivite ve hatırlatmalardan üretilir) */
  bildirim: Bildirim[]
  /** Büronun mükelleflerle cari hesabı (ücret borçları, tahsilatlar) */
  cari: CariHareket[]
  /** İVD kesinti listesi içe aktarımları (yıl başına bir kayıt) */
  kesintiAktarim: KesintiIceAktarim[]
  kesinti: KesintiKaydi[]
  /** e-Tebligat kayıtları (posta kutusu taramasından veya elle) */
  tebligat: Tebligat[]
  /** Tebligat bildirimlerinin okunduğu IMAP kutusu (şifre burada da tutulmaz) */
  postaKutusu: TebligatPostaKutusu[]
  /** Büronun dış gönderim kanalları (gizli alanlar burada da tutulmaz) */
  kanal: KanalAyari[]
  /** Personel bildirim kanal tercihleri (id = personelId) */
  bildirimTercihi: BildirimTercihi[]
  /** Dış kanal gönderim kayıtları (outbox) */
  gonderim: Gonderim[]
  /** Onaylanan fiş / ekstrelerin okunması */
  okuma: BelgeOkuma[]
  /** Okumadan üretilen muhasebe fişleri (Luca'ya aktarılır) */
  fis: MuhasebeFisi[]
  /** Mükellef başına varsayılan hesaplar ve öğrenilen eşlemeler (id = mukellefId) */
  fisHesapAyari: FisHesapAyari[]
  /** İndirilen Luca Excel dosyaları */
  lucaAktarim: LucaAktarim[]
}

export const STORAGE_KEY = "prime-ofis:db:v12"

const ID_PREFIX: Record<keyof DbState, string> = {
  buro: "b",
  personel: "p",
  kimlik: "pw",
  mukellef: "m",
  aktivite: "a",
  credential: "c",
  kasa: "k",
  takvim: "t",
  arsiv: "d",
  talep: "e",
  gelen: "g",
  gorev: "o",
  baglanti: "n",
  ebelge: "f",
  berat: "r",
  kontor: "u",
  tahakkuk: "h",
  mizan: "z",
  bildirim: "i",
  cari: "ch",
  kesintiAktarim: "ki",
  kesinti: "ks",
  tebligat: "tb",
  postaKutusu: "pk",
  kanal: "kn",
  bildirimTercihi: "bt",
  gonderim: "gn",
  okuma: "ok",
  fis: "mf",
  fisHesapAyari: "fh",
  lucaAktarim: "la",
}

let state: DbState | null = null

function isDbState(value: unknown): value is DbState {
  if (!value || typeof value !== "object") return false
  return (Object.keys(ID_PREFIX) as (keyof DbState)[]).every((key) =>
    Array.isArray((value as Record<string, unknown>)[key])
  )
}

function load(): DbState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (isDbState(parsed)) return parsed
    }
  } catch {
    // Bozuk veri → seed'e dön
  }
  const seeded = createSeed(DEFAULT_SEED)
  save(seeded)
  return seeded
}

function save(next: DbState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch (error) {
    console.warn("[mock-db] localStorage'a yazılamadı", error)
  }
}

function getState(): DbState {
  state ??= load()
  return state
}

// Başka sekme (ör. aynı tarayıcıda açılan portal linki) DB'yi değiştirince bellekteki kopyayı
// bırak; yoksa bu sekmenin bir sonraki yazması diğer sekmenin değişikliklerini ezer.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY || event.key === null) state = null
  })
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`
}

type Row<K extends keyof DbState> = DbState[K][number]

function collection<K extends keyof DbState>(key: K) {
  const rows = () => getState()[key] as Row<K>[]
  const commit = (next: Row<K>[]) => {
    const current = getState()
    state = { ...current, [key]: next }
    save(state)
  }

  return {
    all: (): Row<K>[] => [...rows()],
    find: (id: string): Row<K> | undefined =>
      rows().find((row) => row.id === id),
    where: (predicate: (row: Row<K>) => boolean): Row<K>[] =>
      rows().filter(predicate),
    count: (predicate?: (row: Row<K>) => boolean): number =>
      predicate ? rows().filter(predicate).length : rows().length,
    insert: (input: Omit<Row<K>, "id"> & { id?: string }): Row<K> => {
      const row = { ...input, id: input.id ?? newId(ID_PREFIX[key]) } as Row<K>
      commit([...rows(), row])
      return row
    },
    /** Tek yazmayla toplu ekleme (her `insert` tüm DB'yi localStorage'a yazar) */
    insertMany: (
      inputs: (Omit<Row<K>, "id"> & { id?: string })[]
    ): Row<K>[] => {
      const eklenen = inputs.map(
        (input) =>
          ({ ...input, id: input.id ?? newId(ID_PREFIX[key]) }) as Row<K>
      )
      if (eklenen.length) commit([...rows(), ...eklenen])
      return eklenen
    },
    update: (
      id: string,
      patch: Partial<Omit<Row<K>, "id">>
    ): Row<K> | undefined => {
      let updated: Row<K> | undefined
      commit(
        rows().map((row) => {
          if (row.id !== id) return row
          updated = { ...row, ...patch, id } as Row<K>
          return updated
        })
      )
      return updated
    },
    remove: (id: string): boolean => {
      const before = rows()
      const after = before.filter((row) => row.id !== id)
      if (after.length === before.length) return false
      commit(after)
      return true
    },
  }
}

export const db = {
  buro: collection("buro"),
  personel: collection("personel"),
  kimlik: collection("kimlik"),
  mukellef: collection("mukellef"),
  aktivite: collection("aktivite"),
  credential: collection("credential"),
  kasa: collection("kasa"),
  takvim: collection("takvim"),
  arsiv: collection("arsiv"),
  talep: collection("talep"),
  gelen: collection("gelen"),
  gorev: collection("gorev"),
  baglanti: collection("baglanti"),
  ebelge: collection("ebelge"),
  berat: collection("berat"),
  kontor: collection("kontor"),
  tahakkuk: collection("tahakkuk"),
  mizan: collection("mizan"),
  bildirim: collection("bildirim"),
  cari: collection("cari"),
  kesintiAktarim: collection("kesintiAktarim"),
  kesinti: collection("kesinti"),
  tebligat: collection("tebligat"),
  postaKutusu: collection("postaKutusu"),
  kanal: collection("kanal"),
  bildirimTercihi: collection("bildirimTercihi"),
  gonderim: collection("gonderim"),
  okuma: collection("okuma"),
  fis: collection("fis"),
  fisHesapAyari: collection("fisHesapAyari"),
  lucaAktarim: collection("lucaAktarim"),
}

/** Veritabanını seed'e sıfırlar (Ayarlar → Geliştirici ve testler). */
export function resetDb(seed: number = DEFAULT_SEED) {
  state = createSeed(seed)
  save(state)
  void clearBlobs()
}

/** Testlerde elle hazırlanmış fixture durumunu yüklemek için. */
export function setDbState(next: DbState) {
  state = structuredClone(next)
  save(state)
}

export function getDbSnapshot(): DbState {
  return structuredClone(getState())
}
