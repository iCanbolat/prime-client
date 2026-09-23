# Prime Ofis

2-5 kişilik muhasebe büroları için mükellef, evrak ve görev takibi. Frontend şu an **mock API (MSW)** ile tamamen lokalde çalışır.

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
pnpm build
```

## Mock veri

- Veriler tarayıcıda `localStorage`'da tutulur (seed = 42, 40 mükellef, 4 personel).
- **Şifre kasası demo ana şifresi: `demo1234`** (kasa ilk açıldığında örnek şifreli kayıtlar oluşturulur).
- **Ayarlar → Geliştirici**: veritabanını sıfırlama, ağ gecikmesini açıp kapatma, belirli bir API yolu için 500 hatası simülasyonu.
- Production build'de mock API'yi açmak için: `VITE_ENABLE_MOCKS=true pnpm build`.

## Teknoloji

React 19 · Vite 8 · TypeScript · Tailwind v4 · shadcn/ui (Base UI) · Hugeicons · React Router 8 · TanStack Query · Zustand · MSW 2 · Vitest · Playwright
