import { useSearchParams } from "react-router"
import {
  Alert02Icon,
  Calendar03Icon,
  CheckListIcon,
  FileNotFoundIcon,
  KanbanIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"

import { PageHeader } from "@/components/shared/page-header"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useArsivOzet } from "@/features/arsiv/queries"
import { useAuthStore } from "@/features/auth/store"
import { BelgeUyarilari } from "@/features/dashboard/components/belge-uyarilari"
import { EBelgeKarti } from "@/features/dashboard/components/e-belge-karti"
import { KpiSeridi, type Kpi } from "@/features/dashboard/components/kpi-seridi"
import { PersonelIsYuku } from "@/features/dashboard/components/personel-is-yuku"
import { YapilacaklarKarti } from "@/features/dashboard/components/yapilacaklar-karti"
import { YogunlukSeridi } from "@/features/dashboard/components/yogunluk-seridi"
import { useEBelgeOzet } from "@/features/e-belge/queries"
import { useGorevOzet } from "@/features/gorev/queries"
import { useMukellefList } from "@/features/mukellef/queries"
import { useTakvimOzet } from "@/features/takvim/queries"
import { formatDateLong } from "@/lib/format"

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [searchParams, setSearchParams] = useSearchParams()
  const benim = searchParams.get("kapsam") === "benim"
  const sorumlu = benim ? user?.id : undefined

  const mukellefler = useMukellefList({ durum: "aktif", sorumlu })
  const ozet = useTakvimOzet({ sorumlu })
  const arsiv = useArsivOzet({ sorumlu })
  const gorev = useGorevOzet({ atanan: sorumlu })
  const eBelge = useEBelgeOzet({ sorumlu })

  const takvimLinki = (sorgu: string) =>
    `/takvim?gorunum=liste&${sorgu}${sorumlu ? `&sorumlu=${sorumlu}` : ""}`
  const belgeUyarisi = arsiv.data?.gecerlilik.length
  const suresiDolan = arsiv.data?.gecerlilik.filter(
    (d) => d.gecerlilik === "DOLDU"
  ).length

  const kpiler: Kpi[] = [
    {
      label: "Aktif mükellef",
      value: mukellefler.data?.total,
      aciklama: benim ? "Sorumlu olduklarınız" : "Tüm büro",
      icon: UserGroupIcon,
      to: sorumlu ? `/mukellefler?sorumlu=${sorumlu}` : "/mukellefler",
    },
    {
      label: "Bu hafta son günü olan",
      value: ozet.data?.buHafta.length,
      aciklama: "Önümüzdeki 7 gün",
      icon: Calendar03Icon,
      to: takvimLinki("aralik=hafta"),
    },
    {
      label: "Geciken",
      value: ozet.data?.geciken.length,
      aciklama: "Son günü geçmiş, onaysız",
      icon: Alert02Icon,
      to: takvimLinki("aralik=geciken"),
      ton: "tehlike",
    },
    {
      label: "Onay bekleyen",
      value: ozet.data?.onayBekleyen,
      aciklama: "Hazırlanmış beyanlar",
      icon: CheckListIcon,
      to: takvimLinki("durum=hazirlandi"),
    },
    {
      label: "Açık görev",
      value: gorev.data?.acik,
      aciklama:
        gorev.data && gorev.data.geciken > 0
          ? `${gorev.data.geciken} görev gecikmiş`
          : benim
            ? "Size atanmış"
            : "Tüm büro",
      icon: KanbanIcon,
      to: benim ? "/gorevler?atanan=benim" : "/gorevler",
      ton: gorev.data && gorev.data.geciken > 0 ? "tehlike" : undefined,
    },
    {
      label: "Belge uyarısı",
      value: belgeUyarisi,
      aciklama:
        suresiDolan !== undefined && suresiDolan > 0
          ? `${suresiDolan} belgenin süresi doldu`
          : "30 gün içinde dolacak",
      icon: FileNotFoundIcon,
      to: "/arsiv",
      ton: "uyari",
    },
  ]

  return (
    <>
      <PageHeader
        title={`Merhaba, ${user?.ad ?? ""}`}
        description={formatDateLong(new Date())}
        actions={
          <ToggleGroup
            variant="outline"
            spacing={0}
            aria-label="Kapsam"
            value={[benim ? "benim" : "buro"]}
            onValueChange={(v) =>
              v[0] &&
              setSearchParams(v[0] === "benim" ? { kapsam: "benim" } : {}, {
                replace: true,
              })
            }
          >
            <ToggleGroupItem value="buro">Tüm büro</ToggleGroupItem>
            <ToggleGroupItem value="benim">Benim mükelleflerim</ToggleGroupItem>
          </ToggleGroup>
        }
      />

      <KpiSeridi kpiler={kpiler} />

      <div className="@container">
        <div className="grid items-start gap-4 @4xl:grid-cols-3">
          <div className="grid min-w-0 gap-4 @4xl:col-span-2">
            <YapilacaklarKarti
              ozet={ozet.data}
              hata={ozet.isError ? ozet.error : undefined}
              onRetry={() => ozet.refetch()}
              takvimLinki={takvimLinki}
            />
            <YogunlukSeridi ozet={ozet.data} sorumlu={sorumlu} />
          </div>
          <div className="grid min-w-0 gap-4">
            {!benim && <PersonelIsYuku ozet={ozet.data} />}
            <BelgeUyarilari
              ozet={arsiv.data}
              hata={arsiv.isError ? arsiv.error : undefined}
              onRetry={() => arsiv.refetch()}
            />
            <EBelgeKarti
              ozet={eBelge.data}
              hata={eBelge.isError ? eBelge.error : undefined}
              onRetry={() => eBelge.refetch()}
            />
          </div>
        </div>
      </div>
    </>
  )
}
