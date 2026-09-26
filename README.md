# Prime Ofis

2-5 kişilik muhasebe büroları için mükellef, evrak ve görev takibi. e-Belge işlemleri TÜRMOB-Luca e-Entegratör üzerinden yürür; tahakkuk fişleri ve mizanlar dosya ile içe aktarılır. Büronun kendi tahsilatı (aylık ücret, SMMM kesinti kontrolü), e-Tebligat takibi (bildirim e-postası taraması) ve e-posta / Telegram / WhatsApp Business ile hatırlatma ve mükellefe gönderim de dahildir (SMS yoktur). Frontend şu an **mock API (MSW)** ile tamamen lokalde çalışır.

Geliştirme planı ve faz durumu: [.claude/FRONTEND_PLAN.md](.claude/FRONTEND_PLAN.md)

## Komutlar

```bash
pnpm install
pnpm dev            # http://localhost:5173 — MSW mock API otomatik açılır
pnpm test           # Vitest (birim + bileşen + akış testleri)
pnpm test:watch
pnpm test:coverage
pnpm test:e2e       # Playwright: iş akışları, erişilebilirlik (axe), klavye, mobil
                    # ilk kez: pnpm exec playwright install chromium
pnpm typecheck
pnpm lint
pnpm build && pnpm preview   # production build, mock API dahil (http://localhost:4173)
```

## Mock veri

- Veriler tarayıcıda `localStorage`'da tutulur (seed = 42, 40 mükellef, 4 personel).
- **Şifre kasası demo ana şifresi: `demo1234`** (kasa ilk açıldığında örnek şifreli kayıtlar oluşturulur).
- **Ayarlar → Geliştirici**: veritabanını sıfırlama, ağ gecikmesini açıp kapatma, belirli bir API yolu için 500 hatası simülasyonu.
- Gerçek backend henüz olmadığı için production build'de de mock API açıktır (`.env.production` → `VITE_ENABLE_MOCKS=true`). Backend bağlanınca bu satırı kaldırın veya ortam değişkenini `false` yapın.

## Vercel demo

`vercel.json` hazırdır: repoyu Vercel'e bağlamak yeterlidir (framework Vite, pnpm, çıktı `dist`). Tüm yollar SPA için `index.html`'e yönlenir; `mockServiceWorker.js` önbelleğe alınmaz. Demo verisi her ziyaretçinin kendi tarayıcısında tutulur, ziyaretçiler birbirinin değişikliğini görmez.

## Teknoloji

React 19 · Vite 8 · TypeScript · Tailwind v4 · shadcn/ui (Base UI) · Hugeicons · React Router 8 · TanStack Query · Zustand · MSW 2 · pdf.js · SheetJS · Vitest · Playwright
