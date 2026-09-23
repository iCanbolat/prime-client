import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import { useIsDar } from "@/hooks/use-mobile"

export type ListeGorunum = "grid" | "liste"
type Ekran = "dar" | "genis"

interface GorunumTercihleri {
  /** sayfa anahtarı → ekran sınıfı → seçilen görünüm */
  secimler: Record<string, Partial<Record<Ekran, ListeGorunum>>>
  sec: (sayfa: string, ekran: Ekran, gorunum: ListeGorunum) => void
}

export const LISTE_GORUNUM_KEY = "prime-ofis:liste-gorunumu"

export const useGorunumTercihleri = create<GorunumTercihleri>()(
  persist(
    (set) => ({
      secimler: {},
      sec: (sayfa, ekran, gorunum) =>
        set((s) => ({
          secimler: {
            ...s.secimler,
            [sayfa]: { ...s.secimler[sayfa], [ekran]: gorunum },
          },
        })),
    }),
    {
      name: LISTE_GORUNUM_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ secimler: s.secimler }),
    }
  )
)

/**
 * Liste/ızgara görünümü: tablet ve altında varsayılan ızgara, geniş ekranda liste.
 * Kullanıcının seçimi ekran sınıfı başına saklanır; masaüstünde yapılan seçim mobil varsayılanı bozmaz.
 */
export function useListeGorunumu(
  sayfa: string
): [ListeGorunum, (g: ListeGorunum) => void] {
  const ekran: Ekran = useIsDar() ? "dar" : "genis"
  const secim = useGorunumTercihleri((s) => s.secimler[sayfa]?.[ekran])
  const sec = useGorunumTercihleri((s) => s.sec)
  return [
    secim ?? (ekran === "dar" ? "grid" : "liste"),
    (g) => sec(sayfa, ekran, g),
  ]
}
