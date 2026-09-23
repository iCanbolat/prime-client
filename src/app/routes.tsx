import { Navigate, type RouteObject } from "react-router"

import { AppLayout } from "@/app/layouts/app-layout"
import { AuthLayout, PublicLayout } from "@/app/layouts/minimal-layouts"
import type { RouteHandle } from "@/app/route-handle"
import { LoadingState } from "@/components/shared/query-states"
import { NotFoundPage, RouteErrorPage } from "@/components/shared/status-pages"
import {
  RequireAuth,
  RequireRole,
} from "@/features/auth/components/require-auth"
import { MukellefCrumb } from "@/features/mukellef/components/mukellef-crumb"

const crumb = (label: string): RouteHandle => ({ crumb: label })

/**
 * Tüm rota ağacı. Hem `createBrowserRouter` (uygulama) hem `createMemoryRouter` (testler) bunu kullanır.
 * Henüz geliştirilmemiş sayfalar `PlaceholderPage` ile işaretli; ilgili fazda gerçek sayfa lazy import edilir.
 */
export const routes: RouteObject[] = [
  {
    errorElement: <RouteErrorPage />,
    // İlk yüklemede lazy route modülü gelene kadar gösterilir
    hydrateFallbackElement: <LoadingState />,
    children: [
      {
        path: "/login",
        element: <AuthLayout />,
        children: [
          {
            index: true,
            lazy: async () => ({
              Component: (await import("@/features/auth/pages/login-page"))
                .LoginPage,
            }),
          },
        ],
      },
      {
        path: "/p/:token",
        element: <PublicLayout />,
        children: [
          {
            index: true,
            lazy: async () => ({
              Component: (await import("@/features/portal/pages/portal-page"))
                .PortalPage,
            }),
          },
        ],
      },
      {
        path: "/",
        element: (
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        ),
        handle: crumb("Ana sayfa"),
        children: [
          {
            index: true,
            lazy: async () => ({
              Component: (
                await import("@/features/dashboard/pages/dashboard-page")
              ).DashboardPage,
            }),
          },
          {
            path: "mukellefler",
            handle: crumb("Mükellefler"),
            children: [
              {
                index: true,
                lazy: async () => ({
                  Component: (
                    await import("@/features/mukellef/pages/mukellef-list-page")
                  ).MukellefListPage,
                }),
              },
              {
                path: "yeni",
                handle: crumb("Yeni mükellef"),
                lazy: async () => ({
                  Component: (
                    await import("@/features/mukellef/pages/mukellef-form-pages")
                  ).MukellefCreatePage,
                }),
              },
              {
                path: ":id",
                handle: {
                  crumb: (params) => <MukellefCrumb id={params.id ?? ""} />,
                } satisfies RouteHandle,
                children: [
                  {
                    path: "duzenle",
                    handle: crumb("Düzenle"),
                    lazy: async () => ({
                      Component: (
                        await import("@/features/mukellef/pages/mukellef-form-pages")
                      ).MukellefEditPage,
                    }),
                  },
                  {
                    // Kart başlığı + sekmeler (pathless layout)
                    lazy: async () => ({
                      Component: (
                        await import("@/features/mukellef/pages/mukellef-kart-layout")
                      ).MukellefKartLayout,
                    }),
                    children: [
                      { index: true, element: <Navigate to="genel" replace /> },
                      {
                        path: "genel",
                        handle: crumb("Genel"),
                        lazy: async () => ({
                          Component: (
                            await import("@/features/mukellef/pages/mukellef-genel-tab")
                          ).MukellefGenelTab,
                        }),
                      },
                      {
                        path: "sifreler",
                        handle: crumb("Şifreler"),
                        lazy: async () => ({
                          Component: (
                            await import("@/features/kasa/pages/mukellef-sifreler-tab")
                          ).MukellefSifrelerTab,
                        }),
                      },
                      {
                        path: "takvim",
                        handle: crumb("Takvim"),
                        lazy: async () => ({
                          Component: (
                            await import("@/features/takvim/pages/mukellef-takvim-tab")
                          ).MukellefTakvimTab,
                        }),
                      },
                      {
                        path: "arsiv",
                        handle: crumb("Arşiv"),
                        lazy: async () => ({
                          Component: (
                            await import("@/features/arsiv/pages/mukellef-arsiv-tab")
                          ).MukellefArsivTab,
                        }),
                      },
                      {
                        path: "evrak-talepleri",
                        handle: crumb("Evrak Talepleri"),
                        lazy: async () => ({
                          Component: (
                            await import("@/features/evrak-talebi/pages/mukellef-evrak-tab")
                          ).MukellefEvrakTab,
                        }),
                      },
                      {
                        path: "gorevler",
                        handle: crumb("Görevler"),
                        lazy: async () => ({
                          Component: (
                            await import("@/features/gorev/pages/mukellef-gorevler-tab")
                          ).MukellefGorevlerTab,
                        }),
                      },
                      {
                        path: "e-belge",
                        handle: crumb("e-Belge"),
                        lazy: async () => ({
                          Component: (
                            await import("@/features/e-belge/pages/mukellef-ebelge-tab")
                          ).MukellefEBelgeTab,
                        }),
                      },
                      { path: "*", element: <NotFoundPage /> },
                    ],
                  },
                ],
              },
            ],
          },
          {
            path: "kasa",
            handle: crumb("Şifre Kasası"),
            lazy: async () => ({
              Component: (await import("@/features/kasa/pages/kasa-page"))
                .KasaPage,
            }),
          },
          {
            path: "takvim",
            handle: crumb("Takvim"),
            lazy: async () => ({
              Component: (await import("@/features/takvim/pages/takvim-page"))
                .TakvimPage,
            }),
          },
          {
            path: "arsiv",
            handle: crumb("Dijital Arşiv"),
            lazy: async () => ({
              Component: (await import("@/features/arsiv/pages/arsiv-page"))
                .ArsivPage,
            }),
          },
          {
            path: "evrak-talepleri",
            handle: crumb("Evrak Talepleri"),
            lazy: async () => ({
              Component: (
                await import("@/features/evrak-talebi/pages/evrak-talepleri-page")
              ).EvrakTalepleriPage,
            }),
          },
          {
            path: "gorevler",
            handle: crumb("Görevler"),
            lazy: async () => ({
              Component: (await import("@/features/gorev/pages/gorevler-page"))
                .GorevlerPage,
            }),
          },
          {
            path: "e-belge",
            handle: crumb("e-Belge"),
            lazy: async () => ({
              Component: (
                await import("@/features/e-belge/pages/e-belge-layout")
              ).EBelgeLayout,
            }),
            children: [
              { index: true, element: <Navigate to="e-fatura" replace /> },
              {
                path: "e-fatura",
                handle: crumb("e-Fatura"),
                lazy: async () => ({
                  Component: (
                    await import("@/features/e-belge/pages/fatura-pages")
                  ).EFaturaPage,
                }),
              },
              {
                path: "e-arsiv",
                handle: crumb("e-Arşiv"),
                lazy: async () => ({
                  Component: (
                    await import("@/features/e-belge/pages/fatura-pages")
                  ).EArsivPage,
                }),
              },
              {
                path: "e-defter",
                handle: crumb("e-Defter"),
                lazy: async () => ({
                  Component: (
                    await import("@/features/e-belge/pages/e-defter-page")
                  ).EDefterPage,
                }),
              },
              {
                path: "baglantilar",
                handle: crumb("Bağlantılar"),
                lazy: async () => ({
                  Component: (
                    await import("@/features/e-belge/pages/baglantilar-page")
                  ).BaglantilarPage,
                }),
              },
            ],
          },
          {
            path: "ayarlar",
            handle: crumb("Ayarlar"),
            lazy: async () => ({
              Component: (
                await import("@/features/ayarlar/pages/ayarlar-layout")
              ).AyarlarLayout,
            }),
            children: [
              { index: true, element: <Navigate to="buro" replace /> },
              {
                path: "buro",
                handle: crumb("Büro"),
                lazy: async () => ({
                  Component: (
                    await import("@/features/ayarlar/pages/buro-page")
                  ).BuroPage,
                }),
              },
              {
                path: "personel",
                handle: crumb("Personel"),
                lazy: async () => {
                  const { PersonelPage } =
                    await import("@/features/ayarlar/pages/personel-page")
                  return {
                    Component: () => (
                      <RequireRole roles={["YONETICI"]}>
                        <PersonelPage />
                      </RequireRole>
                    ),
                  }
                },
              },
              {
                path: "sablonlar",
                handle: crumb("Mesaj Şablonları"),
                lazy: async () => {
                  const { SablonlarPage } =
                    await import("@/features/ayarlar/pages/sablonlar-page")
                  return {
                    Component: () => (
                      <RequireRole roles={["YONETICI"]}>
                        <SablonlarPage />
                      </RequireRole>
                    ),
                  }
                },
              },
              {
                path: "gelistirici",
                handle: crumb("Geliştirici"),
                lazy: async () => ({
                  Component: (
                    await import("@/features/ayarlar/pages/gelistirici-page")
                  ).GelistiriciPage,
                }),
              },
            ],
          },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
]
