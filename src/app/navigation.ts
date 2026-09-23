import type { IconSvgElement } from "@hugeicons/react"
import {
  Calendar03Icon,
  DashboardSquare01Icon,
  FolderLibraryIcon,
  Invoice03Icon,
  InboxUploadIcon,
  KanbanIcon,
  LockPasswordIcon,
  Settings01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"

import type { Rol } from "@/types/domain"

export interface NavItem {
  title: string
  to: string
  icon: IconSvgElement
  /** Arama paletinde eşleşme için ek anahtar kelimeler */
  keywords?: string[]
  roles?: Rol[]
  /** Menüde sayaç rozeti gösterilecek veri */
  sayac?: "gelenEvrak" | "yanitBekleyen"
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Genel",
    items: [
      {
        title: "Gösterge Paneli",
        to: "/",
        icon: DashboardSquare01Icon,
        keywords: ["dashboard", "özet"],
      },
      {
        title: "Mükellefler",
        to: "/mukellefler",
        icon: UserGroupIcon,
        keywords: ["müşteri", "firma"],
      },
      {
        title: "Şifre Kasası",
        to: "/kasa",
        icon: LockPasswordIcon,
        keywords: ["gib", "sgk", "şifre"],
      },
      {
        title: "Takvim",
        to: "/takvim",
        icon: Calendar03Icon,
        keywords: ["beyanname", "kdv", "son gün"],
      },
    ],
  },
  {
    label: "Evrak & İş",
    items: [
      {
        title: "Dijital Arşiv",
        to: "/arsiv",
        icon: FolderLibraryIcon,
        keywords: ["evrak", "dosya"],
      },
      {
        title: "Evrak Talepleri",
        to: "/evrak-talepleri",
        icon: InboxUploadIcon,
        keywords: ["whatsapp", "link", "portal", "gelen"],
        sayac: "gelenEvrak",
      },
      {
        title: "Görevler",
        to: "/gorevler",
        icon: KanbanIcon,
        keywords: ["kanban", "iş", "task"],
      },
      {
        title: "e-Belge",
        to: "/e-belge",
        icon: Invoice03Icon,
        keywords: [
          "nilvera",
          "e-fatura",
          "e-arşiv",
          "e-defter",
          "berat",
          "fatura",
        ],
        sayac: "yanitBekleyen",
      },
    ],
  },
  {
    label: "Yönetim",
    items: [
      {
        title: "Ayarlar",
        to: "/ayarlar",
        icon: Settings01Icon,
        keywords: ["büro", "personel"],
      },
    ],
  },
]

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items)

export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.to === "/") return pathname === "/"
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}
