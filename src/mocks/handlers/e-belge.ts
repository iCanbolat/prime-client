/**
 * `/api/e-belge/*` — backend'in e-Belge sözleşmesi. Nilvera'ya erişim `NilveraAdapter` üzerinden
 * (burada mock uygulaması) yapılır; gerçek backend aynı uçları kendi adaptörüyle karşılar.
 */
import { format, subMonths } from "date-fns"
import { HttpResponse, http } from "msw"

import {
  beratTakvimId,
  yanitDurumu,
  yanitKalanGun,
  yanitlanabilirMi,
  YANIT_UYARI_GUN,
} from "@/features/e-belge/kurallar"
import type { NilveraKimlik } from "@/features/e-belge/nilvera-adapter"
import { SAYFA_BOYUTU } from "@/features/e-belge/sabitler"
import { yukumlulukleriHesapla } from "@/features/takvim/motor"
import { bugun } from "@/lib/tarih"
import { putBlob } from "@/mocks/blob-store"
import { db } from "@/mocks/db"
import { donemListesi } from "@/mocks/factories/e-belge"
import {
  api,
  errorResponse,
  logActivity,
  notFound,
  requireActor,
  turkishIncludes,
} from "@/mocks/handlers/common"
import { beyanDurumuOku, beyanDurumuYaz } from "@/mocks/handlers/takvim"
import { mockNilveraAdapter as adapter } from "@/mocks/nilvera/mock-adapter"
import type {
  BaglantiKaydetRequest,
  BeratListResponse,
  BeratView,
  EBelgeDetay,
  EBelgeListResponse,
  EBelgeOzetResponse,
  EBelgeView,
  EFaturaYanitRequest,
  NilveraBaglantiView,
  SenkronRequest,
  SenkronResponse,
} from "@/types/api"
import type {
  EBelge,
  EBelgeTur,
  EBelgeYon,
  EFaturaYanit,
  GibDurumu,
  Mukellef,
  NilveraBaglanti,
  NilveraOrtam,
  Personel,
} from "@/types/domain"

const TURLER: EBelgeTur[] = ["E_FATURA", "E_ARSIV"]
const YONLER: EBelgeYon[] = ["GELEN", "GIDEN"]
const GIB_DURUMLARI: GibDurumu[] = ["BASARILI", "ISLENIYOR", "HATA", "IPTAL"]
const YANITLAR: EFaturaYanit[] = ["BEKLIYOR", "KABUL", "RED", "SURESI_DOLDU"]
const ORTAMLAR: NilveraOrtam[] = ["TEST", "CANLI"]
const YMD_RE = /^\d{4}-\d{2}-\d{2}$/

function baglantiView(m: Mukellef): NilveraBaglantiView {
  const kayit = db.nilvera.where((b) => b.mukellefId === m.id)[0]
  const temel: NilveraBaglanti = kayit ?? {
    id: `n_${m.id}`,
    mukellefId: m.id,
    durum: "BAGLI_DEGIL",
    ortam: "CANLI",
    eFatura: false,
    eArsiv: false,
    eDefter: false,
  }
  return {
    ...temel,
    mukellefUnvan: m.unvan,
    mukellefTur: m.tur,
    sorumluPersonelId: m.sorumluPersonelId,
  }
}

export function ebelgeView(e: EBelge, simdi = new Date()): EBelgeView {
  const yanit = yanitDurumu(e, simdi)
  return {
    ...e,
    yanit,
    yanitKalanGun:
      yanit === "BEKLIYOR" ? yanitKalanGun(e.alinmaTarihi, simdi) : undefined,
    mukellefUnvan: db.mukellef.find(e.mukellefId)?.unvan ?? "—",
  }
}

/** Backend anahtarı KMS'ten çözer; mock'ta anahtar hiç saklanmadığı için yer tutucu kullanılır. */
const kimlik = (b: NilveraBaglanti): NilveraKimlik => ({
  mukellefId: b.mukellefId,
  apiAnahtari: "<backend>",
  ortam: b.ortam,
})

/** Berat matrisi dönemleri: içinde bulunulan aydan önceki 12 ay */
export function beratDonemleri(bugunYmd = bugun()): string[] {
  const ay = new Date(`${bugunYmd.slice(0, 7)}-01T00:00:00`)
  return donemListesi(
    format(subMonths(ay, 12), "yyyy-MM"),
    format(subMonths(ay, 1), "yyyy-MM")
  )
}

function eDefterBaglantilari(mukellefId?: string | null) {
  return db.nilvera.where(
    (b) =>
      b.eDefter &&
      b.durum !== "BAGLI_DEGIL" &&
      (!mukellefId || b.mukellefId === mukellefId) &&
      Boolean(db.mukellef.find(b.mukellefId)?.aktif)
  )
}

function beratlariHesapla(mukellefId?: string | null): BeratListResponse {
  const donemler = beratDonemleri()
  const bugunYmd = bugun()
  const kayitlar = new Map(db.berat.all().map((b) => [b.id, b]))
  const items: BeratView[] = []

  for (const b of eDefterBaglantilari(mukellefId)) {
    const m = db.mukellef.find(b.mukellefId)!
    const sonTarihler = new Map(
      yukumlulukleriHesapla(m, {
        baslangic: `${donemler[0]}-01`,
        bitis: `${String(Number(bugunYmd.slice(0, 4)) + 1)}-12-31`,
      })
        .filter((y) => y.tip === "E_DEFTER_BERAT")
        .map((y) => [y.donem, y.sonTarih])
    )
    for (const donem of donemler) {
      const id = `${m.id}:${donem}`
      const kayit = kayitlar.get(id) ?? {
        id,
        mukellefId: m.id,
        donem,
        durum: "YUKLENMEDI" as const,
      }
      const sonTarih = sonTarihler.get(donem)
      items.push({
        ...kayit,
        mukellefUnvan: m.unvan,
        sonTarih,
        gecikti: Boolean(
          sonTarih && sonTarih < bugunYmd && kayit.durum !== "ONAYLANDI"
        ),
      })
    }
  }
  items.sort((a, b) => a.mukellefUnvan.localeCompare(b.mukellefUnvan, "tr-TR"))
  return { donemler, items }
}

interface SenkronSonucu {
  yeniFatura: number
  guncellenenFatura: number
  onaylananBerat: number
}

/** Tek mükellef için artımlı senkron: faturalar (ETTN ile upsert) ve beratlar. */
async function mukellefiSenkronizeEt(
  b: NilveraBaglanti,
  actor: Personel
): Promise<SenkronSonucu> {
  const sonuc: SenkronSonucu = {
    yeniFatura: 0,
    guncellenenFatura: 0,
    onaylananBerat: 0,
  }
  const turler = TURLER.filter((t) => (t === "E_FATURA" ? b.eFatura : b.eArsiv))
  for (const tur of turler) {
    for (const yon of YONLER) {
      const gelenler = await adapter.faturalariGetir(kimlik(b), {
        tur,
        yon,
        sonra: b.sonSenkron,
      })
      for (const f of gelenler) {
        const mevcut = db.ebelge.where((e) => e.ettn === f.ettn)[0]
        if (mevcut) {
          db.ebelge.update(mevcut.id, { gibDurumu: f.gibDurumu })
          sonuc.guncellenenFatura++
        } else {
          db.ebelge.insert({ ...f, mukellefId: b.mukellefId })
          sonuc.yeniFatura++
        }
      }
    }
  }

  if (b.eDefter) {
    const yillar = new Set(beratDonemleri().map((d) => d.slice(0, 4)))
    for (const yil of yillar) {
      for (const berat of await adapter.beratDurumlari(kimlik(b), yil)) {
        const id = `${b.mukellefId}:${berat.donem}`
        const onceki = db.berat.find(id)
        if (onceki?.durum === berat.durum) continue
        const kayit = { mukellefId: b.mukellefId, ...berat }
        if (onceki) db.berat.update(id, kayit)
        else db.berat.insert({ id, ...kayit })
        if (berat.durum !== "ONAYLANDI") continue
        sonuc.onaylananBerat++
        // Takvim senkronu yalnızca ileri yönde: zaten onaylı beyana dokunulmaz
        const takvimId = beratTakvimId(b.mukellefId, berat.donem)
        if (beyanDurumuOku(takvimId) !== "ONAYLANDI")
          beyanDurumuYaz(takvimId, "ONAYLANDI", actor, " (Nilvera berat)")
      }
    }
  }

  db.nilvera.update(b.id, { sonSenkron: new Date().toISOString() })
  return sonuc
}

export const eBelgeHandlers = [
  // --- Bağlantılar ------------------------------------------------------------
  http.get(api("/e-belge/baglantilar"), () =>
    HttpResponse.json(
      db.mukellef
        .where((m) => m.aktif)
        .map(baglantiView)
        .sort((a, b) => a.mukellefUnvan.localeCompare(b.mukellefUnvan, "tr-TR"))
    )
  ),

  http.get<{ mukellefId: string }>(
    api("/e-belge/baglantilar/:mukellefId"),
    ({ params }) => {
      const m = db.mukellef.find(params.mukellefId)
      if (!m) return notFound("Mükellef bulunamadı")
      return HttpResponse.json(baglantiView(m))
    }
  ),

  http.put<{ mukellefId: string }, BaglantiKaydetRequest>(
    api("/e-belge/baglantilar/:mukellefId"),
    async ({ request, params }) => {
      const actor = requireActor(request)
      if (actor instanceof Response) return actor
      if (actor.rol !== "YONETICI")
        return errorResponse(
          403,
          "Nilvera bağlantısını yalnızca yönetici yönetebilir"
        )
      const m = db.mukellef.find(params.mukellefId)
      if (!m) return notFound("Mükellef bulunamadı")
      const body = await request.json()
      const anahtar = body.apiAnahtari?.trim() ?? ""
      if (!anahtar) return errorResponse(400, "API anahtarı zorunludur")
      if (!ORTAMLAR.includes(body.ortam))
        return errorResponse(400, "Geçersiz ortam")

      const dogrulama = await adapter.baglantiDogrula({
        mukellefId: m.id,
        apiAnahtari: anahtar,
        ortam: body.ortam,
      })
      if (!dogrulama.gecerli)
        return errorResponse(
          422,
          dogrulama.hataMesaji ?? "Nilvera bağlantısı doğrulanamadı"
        )

      // Anahtarın kendisi saklanmaz (gerçek backend: KMS ile şifreli); yalnızca ipucu
      const kayit: Omit<NilveraBaglanti, "id"> = {
        mukellefId: m.id,
        durum: "BAGLI",
        ortam: body.ortam,
        eFatura: dogrulama.eFatura,
        eArsiv: dogrulama.eArsiv,
        eDefter: dogrulama.eDefter,
        postaKutusu: dogrulama.postaKutusu,
        anahtarIpucu: anahtar.slice(-4),
        hataMesaji: undefined,
        baglayanId: actor.id,
        baglanmaTarihi: new Date().toISOString(),
      }
      const mevcut = db.nilvera.where((b) => b.mukellefId === m.id)[0]
      if (mevcut)
        db.nilvera.update(mevcut.id, {
          ...kayit,
          sonSenkron: mevcut.sonSenkron,
        })
      else db.nilvera.insert({ id: `n_${m.id}`, ...kayit })

      logActivity({
        aktorId: actor.id,
        eylem: "NILVERA_BAGLANDI",
        hedefTip: "MUKELLEF",
        hedefId: m.id,
        mukellefId: m.id,
        aciklama: `Nilvera (${body.ortam === "TEST" ? "test" : "canlı"})`,
      })
      return HttpResponse.json(baglantiView(m))
    }
  ),

  http.delete<{ mukellefId: string }>(
    api("/e-belge/baglantilar/:mukellefId"),
    ({ request, params }) => {
      const actor = requireActor(request)
      if (actor instanceof Response) return actor
      if (actor.rol !== "YONETICI")
        return errorResponse(
          403,
          "Nilvera bağlantısını yalnızca yönetici yönetebilir"
        )
      const mevcut = db.nilvera.where(
        (b) => b.mukellefId === params.mukellefId
      )[0]
      if (!mevcut) return notFound("Bağlantı bulunamadı")
      db.nilvera.remove(mevcut.id)
      logActivity({
        aktorId: actor.id,
        eylem: "NILVERA_BAGLANTI_KALDIRILDI",
        hedefTip: "MUKELLEF",
        hedefId: mevcut.mukellefId,
        mukellefId: mevcut.mukellefId,
      })
      return new HttpResponse(null, { status: 204 })
    }
  ),

  // --- Senkron ----------------------------------------------------------------
  http.post<never, SenkronRequest>(
    api("/e-belge/senkron"),
    async ({ request }) => {
      const actor = requireActor(request)
      if (actor instanceof Response) return actor
      const body = ((await request.json().catch(() => ({}))) ??
        {}) as SenkronRequest
      const hedefler = db.nilvera.where(
        (b) =>
          b.durum !== "BAGLI_DEGIL" &&
          (!body.mukellefId || b.mukellefId === body.mukellefId) &&
          Boolean(db.mukellef.find(b.mukellefId)?.aktif)
      )
      if (body.mukellefId && hedefler.length === 0)
        return errorResponse(409, "Mükellefin Nilvera bağlantısı yok")

      const yanit: SenkronResponse = {
        mukellefSayisi: 0,
        yeniFatura: 0,
        guncellenenFatura: 0,
        onaylananBerat: 0,
        hatali: [],
        sonSenkron: new Date().toISOString(),
      }
      for (const b of hedefler) {
        const unvan = db.mukellef.find(b.mukellefId)!.unvan
        if (b.durum === "HATA") {
          yanit.hatali.push({
            mukellefId: b.mukellefId,
            unvan,
            mesaj: b.hataMesaji ?? "Bağlantı hatası",
          })
          continue
        }
        const s = await mukellefiSenkronizeEt(b, actor)
        yanit.mukellefSayisi++
        yanit.yeniFatura += s.yeniFatura
        yanit.guncellenenFatura += s.guncellenenFatura
        yanit.onaylananBerat += s.onaylananBerat
      }

      logActivity({
        aktorId: actor.id,
        eylem: "EBELGE_SENKRONIZE_EDILDI",
        hedefTip: "EBELGE",
        mukellefId: body.mukellefId,
        aciklama: `${yanit.yeniFatura} yeni fatura, ${yanit.onaylananBerat} berat`,
      })
      return HttpResponse.json(yanit)
    }
  ),

  // --- Faturalar --------------------------------------------------------------
  http.get(api("/e-belge/faturalar"), ({ request }) => {
    const url = new URL(request.url)
    const p = (k: string) => url.searchParams.get(k)
    const mukellefId = p("mukellefId")
    const tur = p("tur") as EBelgeTur | null
    const yon = p("yon") as EBelgeYon | null
    const gib = p("gibDurumu") as GibDurumu | null
    const yanitF = p("yanit") as EFaturaYanit | null
    const q = p("q")?.trim()
    const baslangic = p("baslangic")
    const bitis = p("bitis")
    const sayfa = Math.max(Number(p("sayfa")) || 1, 1)
    const sayfaBoyutu = Math.min(Number(p("sayfaBoyutu")) || SAYFA_BOYUTU, 100)
    const artan = p("siralamaYonu") === "asc"
    const tutaraGore = p("sirala") === "toplam"

    if (tur && !TURLER.includes(tur)) return errorResponse(400, "Geçersiz tür")
    if (yon && !YONLER.includes(yon)) return errorResponse(400, "Geçersiz yön")
    if (gib && !GIB_DURUMLARI.includes(gib))
      return errorResponse(400, "Geçersiz GİB durumu")
    if (yanitF && !YANITLAR.includes(yanitF))
      return errorResponse(400, "Geçersiz yanıt durumu")
    if (
      (baslangic && !YMD_RE.test(baslangic)) ||
      (bitis && !YMD_RE.test(bitis))
    )
      return errorResponse(400, "Geçersiz tarih")

    const simdi = new Date()
    const filtreli = db.ebelge
      .where(
        (e) =>
          (!mukellefId || e.mukellefId === mukellefId) &&
          (!tur || e.tur === tur) &&
          (!yon || e.yon === yon) &&
          (!gib || e.gibDurumu === gib) &&
          (!baslangic || e.duzenlemeTarihi >= baslangic) &&
          (!bitis || e.duzenlemeTarihi <= bitis)
      )
      .map((e) => ebelgeView(e, simdi))
      .filter(
        (e) =>
          (!yanitF || e.yanit === yanitF) &&
          (!q ||
            turkishIncludes(e.belgeNo, q) ||
            turkishIncludes(e.karsiTaraf.unvan, q) ||
            e.karsiTaraf.vknTckn.includes(q) ||
            turkishIncludes(e.mukellefUnvan, q))
      )
      .sort((a, b) => {
        const fark = tutaraGore
          ? a.toplam - b.toplam
          : a.duzenlemeTarihi.localeCompare(b.duzenlemeTarihi) ||
            a.alinmaTarihi.localeCompare(b.alinmaTarihi)
        return artan ? fark : -fark
      })

    const yanitGovde: EBelgeListResponse = {
      items: filtreli.slice((sayfa - 1) * sayfaBoyutu, sayfa * sayfaBoyutu),
      total: filtreli.length,
      sayfa,
      sayfaBoyutu,
      toplamTutar:
        Math.round(
          filtreli
            .filter((e) => e.paraBirimi === "TRY")
            .reduce((t, e) => t + e.toplam, 0) * 100
        ) / 100,
    }
    return HttpResponse.json(yanitGovde)
  }),

  http.get<{ id: string }>(
    api("/e-belge/faturalar/:id"),
    async ({ params }) => {
      const e = db.ebelge.find(params.id)
      if (!e) return notFound("Fatura bulunamadı")
      const b = db.nilvera.where((n) => n.mukellefId === e.mukellefId)[0]
      const m = db.mukellef.find(e.mukellefId)
      const detay: EBelgeDetay = {
        ...ebelgeView(e),
        mukellefVknTckn: m?.vkn ?? m?.tckn ?? "",
        kalemler: b ? await adapter.faturaKalemleri(kimlik(b), e.ettn) : [],
      }
      return HttpResponse.json(detay)
    }
  ),

  http.get<{ id: string }>(
    api("/e-belge/faturalar/:id/icerik"),
    async ({ params }) => {
      const e = db.ebelge.find(params.id)
      if (!e) return notFound("Fatura bulunamadı")
      const b = db.nilvera.where((n) => n.mukellefId === e.mukellefId)[0]
      if (!b) return errorResponse(409, "Mükellefin Nilvera bağlantısı yok")
      return HttpResponse.json({
        dataUrl: await adapter.faturaIcerik(kimlik(b), e.ettn, "PDF"),
        ad: `${e.belgeNo}.pdf`,
      })
    }
  ),

  http.post<{ id: string }, EFaturaYanitRequest>(
    api("/e-belge/faturalar/:id/yanit"),
    async ({ request, params }) => {
      const actor = requireActor(request)
      if (actor instanceof Response) return actor
      const e = db.ebelge.find(params.id)
      if (!e) return notFound("Fatura bulunamadı")
      if (e.yon !== "GELEN" || e.senaryo !== "TICARI")
        return errorResponse(
          400,
          "Yalnızca gelen ticari faturalar yanıtlanabilir"
        )
      if (!yanitlanabilirMi(e))
        return errorResponse(
          409,
          yanitDurumu(e) === "SURESI_DOLDU"
            ? "8 günlük yanıt süresi dolmuş"
            : "Bu fatura zaten yanıtlanmış"
        )
      const body = await request.json()
      if (body.karar !== "KABUL" && body.karar !== "RED")
        return errorResponse(400, "Geçersiz karar")
      const neden = body.neden?.trim()
      if (body.karar === "RED" && !neden)
        return errorResponse(400, "Red nedeni zorunludur")
      const b = db.nilvera.where((n) => n.mukellefId === e.mukellefId)[0]
      if (b?.durum !== "BAGLI")
        return errorResponse(409, "Mükellefin Nilvera bağlantısı aktif değil")

      await adapter.ticariYanitGonder(kimlik(b), e.ettn, body.karar, neden)
      const guncel = db.ebelge.update(e.id, {
        yanit: body.karar,
        redNedeni: body.karar === "RED" ? neden : undefined,
        yanitlayanId: actor.id,
        yanitTarihi: new Date().toISOString(),
      })!
      logActivity({
        aktorId: actor.id,
        eylem:
          body.karar === "KABUL"
            ? "EFATURA_KABUL_EDILDI"
            : "EFATURA_REDDEDILDI",
        hedefTip: "EBELGE",
        hedefId: e.id,
        mukellefId: e.mukellefId,
        aciklama: `${e.belgeNo} · ${e.karsiTaraf.unvan}${neden ? ` — ${neden}` : ""}`,
      })
      return HttpResponse.json(ebelgeView(guncel))
    }
  ),

  http.post<{ id: string }>(
    api("/e-belge/faturalar/:id/arsive-kaydet"),
    async ({ request, params }) => {
      const actor = requireActor(request)
      if (actor instanceof Response) return actor
      const e = db.ebelge.find(params.id)
      if (!e) return notFound("Fatura bulunamadı")
      const onceki = e.arsivDosyaId ? db.arsiv.find(e.arsivDosyaId) : undefined
      if (onceki && !onceki.silindi)
        return HttpResponse.json(
          { message: "Fatura zaten arşivde", arsivDosyaId: onceki.id },
          { status: 409 }
        )
      const b = db.nilvera.where((n) => n.mukellefId === e.mukellefId)[0]
      if (!b) return errorResponse(409, "Mükellefin Nilvera bağlantısı yok")

      const icerik = await adapter.faturaIcerik(kimlik(b), e.ettn, "PDF")
      // "… A.Ş." ile biten unvanlarda çift nokta oluşmasın
      const ad = `${e.belgeNo} - ${e.karsiTaraf.unvan.replace(/\.+$/, "")}.pdf`
      const dosya = db.arsiv.insert({
        mukellefId: e.mukellefId,
        kategori: "FATURA",
        ad,
        mimeType: "application/pdf",
        boyut: Math.round((icerik.length * 3) / 4),
        yukleyenId: actor.id,
        yuklemeTarihi: new Date().toISOString(),
        silindi: false,
      })
      await putBlob(dosya.id, icerik)
      const guncel = db.ebelge.update(e.id, { arsivDosyaId: dosya.id })!
      logActivity({
        aktorId: actor.id,
        eylem: "EBELGE_ARSIVE_KAYDEDILDI",
        hedefTip: "ARSIV",
        hedefId: dosya.id,
        mukellefId: e.mukellefId,
        aciklama: ad,
      })
      return HttpResponse.json(ebelgeView(guncel))
    }
  ),

  // --- e-Defter ----------------------------------------------------------------
  http.get(api("/e-belge/beratlar"), ({ request }) => {
    const mukellefId = new URL(request.url).searchParams.get("mukellefId")
    return HttpResponse.json(beratlariHesapla(mukellefId))
  }),

  // --- Özet (dashboard, kenar çubuğu) -----------------------------------------
  http.get(api("/e-belge/ozet"), ({ request }) => {
    const sorumlu = new URL(request.url).searchParams.get("sorumlu")
    const kapsamda = (mukellefId: string) => {
      const m = db.mukellef.find(mukellefId)
      return Boolean(m?.aktif) && (!sorumlu || m?.sorumluPersonelId === sorumlu)
    }
    const simdi = new Date()
    const bekleyen = db.ebelge
      .where((e) => kapsamda(e.mukellefId))
      .map((e) => ebelgeView(e, simdi))
      .filter((e) => e.yanit === "BEKLIYOR")
    const baglantilar = db.nilvera.where((b) => kapsamda(b.mukellefId))
    const senkronlar = baglantilar
      .map((b) => b.sonSenkron)
      .filter((s): s is string => Boolean(s))
      .sort()
    const ozet: EBelgeOzetResponse = {
      yanitBekleyen: bekleyen.length,
      yanitSuresiYaklasan: bekleyen
        .filter((e) => (e.yanitKalanGun ?? 99) <= YANIT_UYARI_GUN)
        .sort((a, b) => a.alinmaTarihi.localeCompare(b.alinmaTarihi)),
      hataliGonderim: db.ebelge.count(
        (e) => kapsamda(e.mukellefId) && e.gibDurumu === "HATA"
      ),
      baglantiHatasi: baglantilar.filter((b) => b.durum === "HATA").length,
      bagliMukellef: baglantilar.filter((b) => b.durum === "BAGLI").length,
      beratGeciken: beratlariHesapla()
        .items.filter((b) => kapsamda(b.mukellefId))
        .filter((b) => b.durum !== "ONAYLANDI" && b.gecikti).length,
      sonSenkron: senkronlar.at(-1),
    }
    return HttpResponse.json(ozet)
  }),
]
