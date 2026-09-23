import { ErrorState, LoadingState } from "@/components/shared/query-states"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useBuro } from "@/features/ayarlar/queries"
import { formatPhone } from "@/lib/format"

export function BuroPage() {
  const buro = useBuro()

  if (buro.isPending) return <LoadingState />
  if (buro.isError)
    return <ErrorState error={buro.error} onRetry={() => buro.refetch()} />

  const rows = [
    ["Unvan", buro.data.ad],
    ["VKN", buro.data.vkn],
    ["Vergi dairesi", buro.data.vergiDairesi],
    ["Telefon", formatPhone(buro.data.telefon)],
    ["E-posta", buro.data.eposta],
    ["Adres", buro.data.adres],
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Büro bilgileri</CardTitle>
        <CardDescription>
          Müşteri portalı ve mesaj şablonlarında kullanılır.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[10rem_1fr]">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}
