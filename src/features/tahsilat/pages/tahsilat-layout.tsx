import { NavLink, Outlet } from "react-router"

import { PageHeader } from "@/components/shared/page-header"
import { cn } from "@/lib/utils"

const SEKMELER = [
  { to: "ozet", label: "Özet" },
  { to: "cari", label: "Cari hesaplar" },
  { to: "kesinti", label: "Kesinti kontrolü" },
] as const

export function TahsilatLayout() {
  return (
    <>
      <PageHeader
        title="Tahsilat"
        description="Mükelleflerden alınacak hizmet bedelleri, ödemeler ve SMMM stopaj kesintileri"
      />
      <nav
        aria-label="Tahsilat bölümleri"
        className="flex flex-wrap gap-1 border-b pb-2"
      >
        {SEKMELER.map((sekme) => (
          <NavLink
            key={sekme.to}
            to={sekme.to}
            className={({ isActive }) =>
              cn(
                "rounded-3xl px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                isActive && "bg-muted text-foreground"
              )
            }
          >
            {sekme.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </>
  )
}
