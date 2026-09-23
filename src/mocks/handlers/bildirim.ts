import { HttpResponse, http } from "msw"
import { addDays } from "date-fns"

import { gecerlilikDurumu, kalanGun } from "@/features/arsiv/kurallar"
import { YANIT_UYARI_GUN } from "@/features/e-belge/kurallar"
import { gecikmisMi } from "@/features/gorev/kurallar"
import { bugun, fromYmd, toYmd } from "@/lib/tarih"
import { bildirimGorunurMu } from "@/mocks/bildirim-kurallari"
import { db } from "@/mocks/db"
import { api, notFound, requireActor } from "@/mocks/handlers/common"
import { ebelgeView } from "@/mocks/handlers/e-belge"
import { olaylariHesapla } from "@/mocks/handlers/takvim"
import type { BildirimListResponse, BildirimView } from "@/types/api"
import type { Bildirim } from "@/types/domain"
import { ARSIV_KATEGORI_ETIKET } from "@/types/domain"

/** Belge geçerliliği için hatırlatma penceresi (gün): dolmadan önce ve dolduktan sonra */
const GECERLILIK_PENCERE_GUN = 7
/** Beyan son gününe kaç gün kala hatırlatılır */
const BEYAN_PENCERE_GUN = 3

type Hatirlatma = Omit<Bildirim, "id" | "okuyanlar" | "zaman"> & {
  anahtar: string
}

/**
 * Zamana bağlı hatırlatmalar. Her istekte hesaplanır; `anahtar` sayesinde her durum için
 * yalnızca bir kez bildirim üretilir (gerçek backend'de zamanlanmış iş karşılığıdır).
 */
export function hatirlatmalariUret(bugunYmd: string = bugun()) {
  const mevcut = new Set(
    db.bildirim.all().flatMap((b) => (b.anahtar ? [b.anahtar] : []))
  )
  const yeni: Hatirlatma[] = []
  const ekle = (h: Hatirlatma) => {
    if (mevcut.has(h.anahtar)) return
    mevcut.add(h.anahtar)
    yeni.push(h)
  }

  for (const g of db.gorev.where((g) => gecikmisMi(g, bugunYmd))) {
    ekle({
      tur: "GOREV_GECIKTI",
      anahtar: `GOREV_GECIKTI:${g.id}:${g.sonTarih}`,
      aliciId: g.atananId,
      baslik: "Görevin son tarihi geçti",
      aciklama: g.baslik,
      link: `/gorevler?gorev=${g.id}`,
      mukellefId: g.mukellefId,
      hedefTip: "GOREV",
      hedefId: g.id,
    })
  }

  for (const d of db.arsiv.where((d) => !d.silindi && !!d.gecerlilikTarihi)) {
    const kalan = kalanGun(d.gecerlilikTarihi!, bugunYmd)
    if (Math.abs(kalan) > GECERLILIK_PENCERE_GUN) continue
    const m = db.mukellef.find(d.mukellefId)
    if (!m?.aktif) continue
    const durum = gecerlilikDurumu(d.gecerlilikTarihi!, bugunYmd)
    ekle({
      tur: "BELGE_GECERLILIK",
      anahtar: `BELGE_GECERLILIK:${d.id}:${d.gecerlilikTarihi}:${durum}`,
      aliciId: m.sorumluPersonelId,
      baslik:
        durum === "DOLDU"
          ? "Belgenin geçerlilik süresi doldu"
          : kalan === 0
            ? "Belgenin geçerliliği bugün doluyor"
            : `Belgenin geçerliliği ${kalan} gün içinde doluyor`,
      aciklama: `${m.unvan} · ${ARSIV_KATEGORI_ETIKET[d.kategori]}`,
      link: `/arsiv?mukellef=${m.id}&kategori=${d.kategori}`,
      mukellefId: m.id,
      hedefTip: "ARSIV",
      hedefId: d.id,
    })
  }

  const simdi = new Date()
  for (const e of db.ebelge.where(
    (e) => e.yon === "GELEN" && e.senaryo === "TICARI"
  )) {
    const v = ebelgeView(e, simdi)
    if (v.yanit !== "BEKLIYOR" || (v.yanitKalanGun ?? 99) > YANIT_UYARI_GUN)
      continue
    const m = db.mukellef.find(e.mukellefId)
    if (!m) continue
    ekle({
      tur: "EFATURA_YANIT_SURESI",
      anahtar: `EFATURA_YANIT_SURESI:${e.id}`,
      aliciId: m.sorumluPersonelId,
      baslik:
        v.yanitKalanGun === 0
          ? "e-Fatura yanıt süresi bugün doluyor"
          : `e-Fatura yanıt süresi ${v.yanitKalanGun} gün içinde doluyor`,
      aciklama: `${e.belgeNo} · ${m.unvan}`,
      link: `/e-belge/e-fatura?fatura=${e.id}`,
      mukellefId: m.id,
      hedefTip: "EBELGE",
      hedefId: e.id,
    })
  }

  // Beyanlar sorumlu + son gün bazında gruplanır (aynı güne düşen onlarca beyan tek bildirim)
  const beyanlar = olaylariHesapla(
    {
      baslangic: bugunYmd,
      bitis: toYmd(addDays(fromYmd(bugunYmd), BEYAN_PENCERE_GUN)),
    },
    bugunYmd
  ).filter((o) => o.durum !== "ONAYLANDI")
  const gruplar = new Map<string, typeof beyanlar>()
  for (const o of beyanlar) {
    const k = `${o.sorumluPersonelId}:${o.sonTarih}`
    gruplar.set(k, [...(gruplar.get(k) ?? []), o])
  }
  for (const [k, liste] of gruplar) {
    const ilk = liste[0]!
    const kalan = kalanGun(ilk.sonTarih, bugunYmd)
    ekle({
      tur: "BEYAN_YAKLASIYOR",
      anahtar: `BEYAN_YAKLASIYOR:${k}`,
      aliciId: ilk.sorumluPersonelId,
      baslik:
        kalan === 0
          ? `${liste.length} beyanın son günü bugün`
          : `${liste.length} beyanın son gününe ${kalan} gün kaldı`,
      aciklama:
        liste.length === 1
          ? ilk.mukellefUnvan
          : `${ilk.mukellefUnvan} ve ${liste.length - 1} mükellef daha`,
      link: "/takvim?durum=bekliyor",
      hedefTip: "TAKVIM",
    })
  }

  const zaman = new Date().toISOString()
  for (const h of yeni) db.bildirim.insert({ ...h, zaman, okuyanlar: [] })
}

function toView(b: Bildirim, kullaniciId: string): BildirimView {
  const { okuyanlar, ...rest } = b
  const p = b.aktorId ? db.personel.find(b.aktorId) : undefined
  return {
    ...rest,
    okundu: okuyanlar.includes(kullaniciId),
    aktor: p ? { id: p.id, ad: p.ad, soyad: p.soyad, renk: p.renk } : null,
  }
}

const okunduEkle = (b: Bildirim, kullaniciId: string) => {
  if (!b.okuyanlar.includes(kullaniciId))
    db.bildirim.update(b.id, { okuyanlar: [...b.okuyanlar, kullaniciId] })
}

export const bildirimHandlers = [
  http.get(api("/bildirim"), ({ request }) => {
    const actor = requireActor(request)
    if (actor instanceof Response) return actor
    const p = new URL(request.url).searchParams
    const sadeceOkunmamis = p.get("sadeceOkunmamis") === "true"
    const limit = Math.min(Number(p.get("limit")) || 30, 100)

    hatirlatmalariUret()

    const gorunen = db.bildirim
      .where((b) => bildirimGorunurMu(b, actor.id))
      .sort((a, b) => b.zaman.localeCompare(a.zaman))
    const okunmamislar = gorunen.filter((b) => !b.okuyanlar.includes(actor.id))

    return HttpResponse.json<BildirimListResponse>({
      items: (sadeceOkunmamis ? okunmamislar : gorunen)
        .slice(0, limit)
        .map((b) => toView(b, actor.id)),
      okunmamis: okunmamislar.length,
    })
  }),

  http.post(api("/bildirim/okundu"), ({ request }) => {
    const actor = requireActor(request)
    if (actor instanceof Response) return actor
    for (const b of db.bildirim.where((b) => bildirimGorunurMu(b, actor.id)))
      okunduEkle(b, actor.id)
    return new HttpResponse(null, { status: 204 })
  }),

  http.post<{ id: string }>(
    api("/bildirim/:id/okundu"),
    ({ request, params }) => {
      const actor = requireActor(request)
      if (actor instanceof Response) return actor
      const b = db.bildirim.find(params.id)
      if (!b || !bildirimGorunurMu(b, actor.id))
        return notFound("Bildirim bulunamadı")
      okunduEkle(b, actor.id)
      return new HttpResponse(null, { status: 204 })
    }
  ),
]
