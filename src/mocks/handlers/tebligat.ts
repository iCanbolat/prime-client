/**
 * `/api/tebligat/*` — e-Tebligat takibi. Posta kutusuna erişim `PostaAdapter` üzerinden (burada
 * mock uygulaması) yapılır; gerçek backend aynı uçları IMAP adaptörüyle karşılar.
 */
import { addDays } from "date-fns"
import { HttpResponse, http } from "msw"

import { tebligatEpostasiAyristir } from "@/features/tebligat/eposta-ayristir"
import { sureDurumu, SURE_KURALLARI } from "@/features/tebligat/kurallar"
import type { PostaKimlik } from "@/features/tebligat/posta-adapter"
import { TEBLIGAT_TUR_ETIKET } from "@/features/tebligat/sabitler"
import { bugun, fromYmd, toYmd } from "@/lib/tarih"
import { putBlob } from "@/mocks/blob-store"
import { db } from "@/mocks/db"
import {
  api,
  errorResponse,
  logActivity,
  notFound,
  requireActor,
  turkishIncludes,
} from "@/mocks/handlers/common"
import { mockPostaAdapter as adapter } from "@/mocks/posta/mock-adapter"
import type {
  PostaKutusuKaydetRequest,
  TebligatBelgeRequest,
  TebligatEkleRequest,
  TebligatGuncelleRequest,
  TebligatKapsam,
  TebligatListResponse,
  TebligatOzetResponse,
  TebligatPostaKutusuView,
  TebligatTaraResponse,
  TebligatView,
} from "@/types/api"
import type {
  Tebligat,
  TebligatDurum,
  TebligatPostaKutusu,
  TebligatTur,
} from "@/types/domain"

const DURUMLAR: TebligatDurum[] = [
  "YENI",
  "INCELENDI",
  "ISLEM_YAPILDI",
  "KAPANDI",
]
const TURLER = Object.keys(SURE_KURALLARI) as TebligatTur[]
const KAPSAMLAR: TebligatKapsam[] = ["acik", "acil", "eslesmeyen", "kapali"]
const DATA_URL_RE = /^data:([^;,]+)[;,]/
const MAKS_DOSYA = 10 * 1024 * 1024

export function tebligatView(
  t: Tebligat,
  bugunYmd: string = bugun()
): TebligatView {
  const m = t.mukellefId ? db.mukellef.find(t.mukellefId) : undefined
  const a = t.atananId ? db.personel.find(t.atananId) : undefined
  return {
    ...t,
    ...sureDurumu(t, bugunYmd),
    mukellefUnvan: m?.unvan,
    sorumluPersonelId: m?.sorumluPersonelId,
    atananAd: a ? `${a.ad} ${a.soyad}` : undefined,
  }
}

/** Açıklar önce, son işlem gününe göre; kapalılar ulaşma tarihine göre yeniden eskiye */
function sirala(a: TebligatView, b: TebligatView) {
  if (a.acik !== b.acik) return a.acik ? -1 : 1
  if (a.acik) {
    const x = a.sonIslemTarihi ?? "9999"
    const y = b.sonIslemTarihi ?? "9999"
    if (x !== y) return x.localeCompare(y)
  }
  return b.ulasmaTarihi.localeCompare(a.ulasmaTarihi)
}

function postaKutusuView(
  k: TebligatPostaKutusu | undefined
): TebligatPostaKutusuView | null {
  if (!k) return null
  const { sonUid: _, ...view } = k
  return view
}

/** Yeni tebligat bildirimi: atanan / mükellef sorumlusu ve yöneticiler */
function tebligatAlicilari(t: Tebligat): string[] {
  const m = t.mukellefId ? db.mukellef.find(t.mukellefId) : undefined
  const yoneticiler = db.personel
    .where((p) => p.aktif && p.rol === "YONETICI")
    .map((p) => p.id)
  return [...new Set([...(m ? [m.sorumluPersonelId] : []), ...yoneticiler])]
}

function tebligatAciklama(t: Tebligat) {
  const m = t.mukellefId ? db.mukellef.find(t.mukellefId) : undefined
  return `${TEBLIGAT_TUR_ETIKET[t.tur]} · ${m?.unvan ?? `VKN ${t.vkn}`}`
}

function mukellefBul(vkn: string) {
  return db.mukellef.where((m) => m.vkn === vkn || m.tckn === vkn)[0]
}

/** Mock backend'de şifre saklanmaz; adaptöre yalnızca istek anında verilir */
const kimlik = (k: TebligatPostaKutusu, sifre = "mock"): PostaKimlik => ({
  sunucu: k.sunucu,
  port: k.port,
  kullanici: k.kullanici,
  klasor: k.klasor,
  sifre,
})

export const tebligatHandlers = [
  http.get(api("/tebligat/posta-kutusu"), () =>
    HttpResponse.json(postaKutusuView(db.postaKutusu.all()[0]))
  ),

  http.put<never, PostaKutusuKaydetRequest>(
    api("/tebligat/posta-kutusu"),
    async ({ request }) => {
      const actor = requireActor(request)
      if (actor instanceof Response) return actor
      if (actor.rol !== "YONETICI")
        return errorResponse(
          403,
          "Posta kutusunu yalnızca yönetici bağlayabilir"
        )
      const body = await request.json()
      if (!body.sunucu?.trim() || !body.kullanici?.trim())
        return errorResponse(400, "Sunucu ve kullanıcı adı zorunludur")
      if (!Number.isInteger(body.port) || body.port < 1 || body.port > 65535)
        return errorResponse(400, "Geçerli bir port girin")
      if (!body.sifre || body.sifre.length < 4)
        return errorResponse(400, "Şifre en az 4 karakter olmalı")
      const temel = {
        sunucu: body.sunucu.trim(),
        port: body.port,
        kullanici: body.kullanici.trim(),
        klasor: body.klasor?.trim() || "INBOX",
      }
      const sonuc = await adapter.baglantiDogrula({
        ...temel,
        sifre: body.sifre,
      })
      if (!sonuc.gecerli)
        return errorResponse(422, sonuc.hataMesaji ?? "Bağlantı kurulamadı")

      const [mevcut] = db.postaKutusu.all()
      const kayit = {
        ...temel,
        durum: "BAGLI" as const,
        sifreIpucu: body.sifre.slice(-4),
        hataMesaji: undefined,
        baglayanId: actor.id,
        baglanmaTarihi: new Date().toISOString(),
      }
      const k = mevcut
        ? db.postaKutusu.update(mevcut.id, kayit)!
        : db.postaKutusu.insert({ ...kayit, sonUid: 0 })
      logActivity(
        {
          aktorId: actor.id,
          eylem: "POSTA_KUTUSU_BAGLANDI",
          aciklama: `${k.kullanici} (${k.sunucu})`,
        },
        false
      )
      return HttpResponse.json(postaKutusuView(k))
    }
  ),

  http.delete(api("/tebligat/posta-kutusu"), ({ request }) => {
    const actor = requireActor(request)
    if (actor instanceof Response) return actor
    if (actor.rol !== "YONETICI")
      return errorResponse(403, "Posta kutusunu yalnızca yönetici kaldırabilir")
    const [k] = db.postaKutusu.all()
    if (!k) return notFound("Posta kutusu bağlı değil")
    db.postaKutusu.remove(k.id)
    logActivity(
      {
        aktorId: actor.id,
        eylem: "POSTA_KUTUSU_KALDIRILDI",
        aciklama: k.kullanici,
      },
      false
    )
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(api("/tebligat/tara"), async ({ request }) => {
    const actor = requireActor(request)
    if (actor instanceof Response) return actor
    const [k] = db.postaKutusu.all()
    if (!k || k.durum === "BAGLI_DEGIL")
      return errorResponse(
        409,
        "Önce Ayarlar → Kanallar'dan posta kutusunu bağlayın"
      )
    if (k.durum === "HATA")
      return errorResponse(
        409,
        k.hataMesaji ?? "Posta kutusu bağlantısı hatalı"
      )

    const { mesajlar, sonUid } = await adapter.yeniMesajlar(kimlik(k), k.sonUid)
    const mevcut = new Set(
      db.tebligat
        .all()
        .flatMap((t) => (t.epostaMesajId ? [t.epostaMesajId] : []))
    )
    let yeni = 0
    let eslesmeyen = 0
    let atlanan = 0
    for (const e of mesajlar) {
      const a = tebligatEpostasiAyristir(e)
      if (!a || mevcut.has(e.mesajId)) {
        atlanan++
        continue
      }
      const m = mukellefBul(a.vkn)
      const t = db.tebligat.insert({
        ...a,
        mukellefId: m?.id,
        durum: "YENI",
        kaynak: "EPOSTA",
        epostaMesajId: e.mesajId,
        olusturmaTarihi: new Date().toISOString(),
      })
      yeni++
      if (!m) eslesmeyen++
      logActivity(
        {
          aktorId: actor.id,
          eylem: "TEBLIGAT_ALINDI",
          hedefTip: "TEBLIGAT",
          hedefId: t.id,
          mukellefId: t.mukellefId,
          aciklama: tebligatAciklama(t),
        },
        {
          alicilar: tebligatAlicilari(t),
          baslik: m ? "Yeni e-Tebligat" : "Eşleşmeyen e-Tebligat",
        }
      )
    }
    const sonTarama = new Date().toISOString()
    db.postaKutusu.update(k.id, { sonUid, sonTarama })
    const yanit: TebligatTaraResponse = {
      okunan: mesajlar.length,
      yeni,
      eslesmeyen,
      atlanan,
      sonTarama,
    }
    return HttpResponse.json(yanit)
  }),

  http.get(api("/tebligat/ozet"), ({ request }) => {
    const sorumlu = new URL(request.url).searchParams.get("sorumlu")
    const bugunYmd = bugun()
    const views = db.tebligat
      .all()
      .map((t) => tebligatView(t, bugunYmd))
      .filter(
        (t) =>
          !sorumlu ||
          t.atananId === sorumlu ||
          (!t.atananId && t.sorumluPersonelId === sorumlu)
      )
    const acik = views.filter((t) => t.acik)
    const hafta = toYmd(addDays(fromYmd(bugunYmd), -7))
    const yanit: TebligatOzetResponse = {
      acik: acik.length,
      acil: acik.filter((t) => t.acil).length,
      geciken: acik.filter((t) => t.gecikti).length,
      eslesmeyen: acik.filter((t) => !t.mukellefId).length,
      yeni: views.filter((t) => t.ulasmaTarihi.slice(0, 10) >= hafta).length,
      yaklasan: acik
        .filter((t) => t.sonIslemTarihi)
        .sort(sirala)
        .slice(0, 5),
      postaKutusu: postaKutusuView(db.postaKutusu.all()[0]),
    }
    return HttpResponse.json(yanit)
  }),

  http.get(api("/tebligat"), ({ request }) => {
    const p = new URL(request.url).searchParams
    const q = p.get("q")?.trim() ?? ""
    const kapsamParam = p.get("kapsam") as TebligatKapsam | null
    const kapsam =
      kapsamParam && KAPSAMLAR.includes(kapsamParam) ? kapsamParam : null
    const tur = p.get("tur") as TebligatTur | null
    const mukellefId = p.get("mukellefId")
    const bugunYmd = bugun()
    const filtrelenen = db.tebligat
      .all()
      .map((t) => tebligatView(t, bugunYmd))
      .filter(
        (t) =>
          (!mukellefId || t.mukellefId === mukellefId) &&
          (!tur || !TURLER.includes(tur) || t.tur === tur) &&
          (kapsam !== "acik" || t.acik) &&
          (kapsam !== "acil" || t.acil || t.gecikti) &&
          (kapsam !== "eslesmeyen" || !t.mukellefId) &&
          (kapsam !== "kapali" || !t.acik) &&
          (!q ||
            turkishIncludes(t.mukellefUnvan, q) ||
            turkishIncludes(t.konu, q) ||
            t.vkn.includes(q) ||
            Boolean(t.belgeNo?.includes(q)))
      )
      .sort(sirala)
    const sayfaBoyutu = Math.min(
      Math.max(Number(p.get("sayfaBoyutu")) || 20, 1),
      100
    )
    const sonSayfa = Math.max(Math.ceil(filtrelenen.length / sayfaBoyutu), 1)
    const sayfa = Math.min(Math.max(Number(p.get("sayfa")) || 1, 1), sonSayfa)
    const yanit: TebligatListResponse = {
      items: filtrelenen.slice((sayfa - 1) * sayfaBoyutu, sayfa * sayfaBoyutu),
      total: filtrelenen.length,
      sayfa,
      sayfaBoyutu,
    }
    return HttpResponse.json(yanit)
  }),

  http.get<{ id: string }>(api("/tebligat/:id"), ({ params }) => {
    const t = db.tebligat.find(params.id)
    return t
      ? HttpResponse.json(tebligatView(t))
      : notFound("Tebligat bulunamadı")
  }),

  http.post<never, TebligatEkleRequest>(
    api("/tebligat"),
    async ({ request }) => {
      const actor = requireActor(request)
      if (actor instanceof Response) return actor
      const body = await request.json()
      const m = db.mukellef.find(body.mukellefId)
      if (!m) return errorResponse(400, "Mükellef seçin")
      if (!TURLER.includes(body.tur))
        return errorResponse(400, "Geçersiz tebligat türü")
      if (!body.konu?.trim()) return errorResponse(400, "Konu zorunludur")
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(body.ulasmaGunu ?? "") ||
        body.ulasmaGunu > bugun()
      )
        return errorResponse(400, "Geçerli bir ulaşma tarihi girin")
      if (
        body.sureGun !== undefined &&
        !(body.sureGun >= 1 && body.sureGun <= 365)
      )
        return errorResponse(400, "Süre 1–365 gün olmalı")
      const ulasma = fromYmd(body.ulasmaGunu)
      ulasma.setHours(9)
      const t = db.tebligat.insert({
        mukellefId: m.id,
        vkn: (m.vkn ?? m.tckn)!,
        kurum: body.kurum === "SGK" ? "SGK" : "GIB",
        tur: body.tur,
        konu: body.konu.trim(),
        belgeNo: body.belgeNo?.trim() || undefined,
        ulasmaTarihi: ulasma.toISOString(),
        sureGun: body.sureGun,
        durum: "YENI",
        atananId: actor.id,
        kaynak: "ELLE",
        olusturmaTarihi: new Date().toISOString(),
      })
      logActivity(
        {
          aktorId: actor.id,
          eylem: "TEBLIGAT_ALINDI",
          hedefTip: "TEBLIGAT",
          hedefId: t.id,
          mukellefId: m.id,
          aciklama: tebligatAciklama(t),
        },
        false
      )
      return HttpResponse.json(tebligatView(t), { status: 201 })
    }
  ),

  http.patch<{ id: string }, TebligatGuncelleRequest>(
    api("/tebligat/:id"),
    async ({ request, params }) => {
      const actor = requireActor(request)
      if (actor instanceof Response) return actor
      const t = db.tebligat.find(params.id)
      if (!t) return notFound("Tebligat bulunamadı")
      const body = await request.json()
      const patch: Partial<Tebligat> = {}
      const degisiklik: string[] = []

      if (body.durum !== undefined) {
        if (!DURUMLAR.includes(body.durum))
          return errorResponse(400, "Geçersiz durum")
        if (body.durum !== t.durum) degisiklik.push("durum")
        patch.durum = body.durum
      }
      if (body.atananId !== undefined) {
        if (body.atananId !== null && !db.personel.find(body.atananId))
          return errorResponse(400, "Personel bulunamadı")
        patch.atananId = body.atananId ?? undefined
        if (body.atananId !== t.atananId) degisiklik.push("atanan")
      }
      if (body.not !== undefined) patch.not = body.not.trim() || undefined
      if (body.sureGun !== undefined) {
        if (
          body.sureGun !== null &&
          !(body.sureGun >= 1 && body.sureGun <= 365)
        )
          return errorResponse(400, "Süre 1–365 gün olmalı")
        patch.sureGun = body.sureGun ?? undefined
      }
      if (body.mukellefId !== undefined) {
        const m = db.mukellef.find(body.mukellefId)
        if (!m) return errorResponse(400, "Mükellef bulunamadı")
        patch.mukellefId = m.id
        degisiklik.push("mükellef")
      }

      const guncel = db.tebligat.update(t.id, patch)!
      if (degisiklik.length)
        logActivity(
          {
            aktorId: actor.id,
            eylem: "TEBLIGAT_GUNCELLENDI",
            hedefTip: "TEBLIGAT",
            hedefId: t.id,
            mukellefId: guncel.mukellefId,
            aciklama: tebligatAciklama(guncel),
          },
          body.atananId && body.atananId !== t.atananId
            ? {
                alicilar: [body.atananId],
                baslik: "Bir e-Tebligat size atandı",
              }
            : false
        )
      return HttpResponse.json(tebligatView(guncel))
    }
  ),

  http.post<{ id: string }>(
    api("/tebligat/:id/gorev"),
    ({ request, params }) => {
      const actor = requireActor(request)
      if (actor instanceof Response) return actor
      const t = db.tebligat.find(params.id)
      if (!t) return notFound("Tebligat bulunamadı")
      if (!t.mukellefId)
        return errorResponse(409, "Önce tebligatı bir mükellefle eşleştirin")
      if (t.gorevId && db.gorev.find(t.gorevId))
        return errorResponse(409, "Bu tebligat için görev zaten var")
      const m = db.mukellef.find(t.mukellefId)!
      const v = tebligatView(t)
      const simdi = new Date().toISOString()
      const kural = SURE_KURALLARI[t.tur]
      const g = db.gorev.insert({
        baslik: `${TEBLIGAT_TUR_ETIKET[t.tur]}: ${t.konu}`,
        aciklama: [
          `e-Tebligat ${t.belgeNo ? `(${t.belgeNo}) ` : ""}tebliğ tarihi ${v.tebligTarihi}.`,
          kural.gun !== null
            ? `Süre içinde yapılacak: ${kural.islem}.`
            : undefined,
        ]
          .filter(Boolean)
          .join(" "),
        mukellefId: m.id,
        tip: "DIGER",
        atananId: t.atananId ?? m.sorumluPersonelId,
        durum: "YAPILACAK",
        oncelik: "YUKSEK",
        sonTarih: v.sonIslemTarihi ?? toYmd(addDays(fromYmd(bugun()), 7)),
        checklist: [],
        yorumlar: [],
        bagliTalepIdler: [],
        olusturanId: actor.id,
        olusturmaTarihi: simdi,
        guncellemeTarihi: simdi,
      })
      db.tebligat.update(t.id, {
        gorevId: g.id,
        durum: t.durum === "YENI" ? "INCELENDI" : t.durum,
      })
      logActivity({
        aktorId: actor.id,
        eylem: "GOREV_OLUSTURULDU",
        hedefTip: "GOREV",
        hedefId: g.id,
        mukellefId: m.id,
        aciklama: g.baslik,
      })
      return HttpResponse.json(g, { status: 201 })
    }
  ),

  http.post<{ id: string }, TebligatBelgeRequest>(
    api("/tebligat/:id/belge"),
    async ({ request, params }) => {
      const actor = requireActor(request)
      if (actor instanceof Response) return actor
      const t = db.tebligat.find(params.id)
      if (!t) return notFound("Tebligat bulunamadı")
      if (!t.mukellefId)
        return errorResponse(409, "Önce tebligatı bir mükellefle eşleştirin")
      const { dosya } = await request.json()
      const mimeType = DATA_URL_RE.exec(dosya?.dataUrl ?? "")?.[1]
      if (
        !mimeType ||
        !["application/pdf", "image/png", "image/jpeg"].includes(mimeType)
      )
        return errorResponse(400, "PDF, PNG veya JPG yükleyin")
      const boyut = Math.round(
        ((dosya.dataUrl.length - dosya.dataUrl.indexOf(",")) * 3) / 4
      )
      if (boyut > MAKS_DOSYA)
        return errorResponse(400, "Dosya 10 MB'tan büyük olamaz")
      const kayit = db.arsiv.insert({
        mukellefId: t.mukellefId,
        kategori: "TEBLIGAT",
        ad: dosya.ad,
        mimeType,
        boyut,
        yukleyenId: actor.id,
        yuklemeTarihi: new Date().toISOString(),
        silindi: false,
      })
      await putBlob(kayit.id, dosya.dataUrl)
      const guncel = db.tebligat.update(t.id, { arsivDosyaId: kayit.id })!
      logActivity(
        {
          aktorId: actor.id,
          eylem: "ARSIV_YUKLENDI",
          hedefTip: "ARSIV",
          hedefId: kayit.id,
          mukellefId: t.mukellefId,
          aciklama: dosya.ad,
        },
        false
      )
      return HttpResponse.json(tebligatView(guncel), { status: 201 })
    }
  ),
]
