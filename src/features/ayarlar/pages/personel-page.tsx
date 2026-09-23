import { PersonelAvatar } from "@/components/shared/personel-avatar"
import { ErrorState, LoadingState } from "@/components/shared/query-states"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { usePersonelList } from "@/features/auth/queries"
import { formatPhone } from "@/lib/format"
import { ROL_ETIKET } from "@/types/domain"

export function PersonelPage() {
  const personel = usePersonelList()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personel</CardTitle>
        <CardDescription>
          Büro çalışanları ve rolleri. Ekleme/düzenleme ileride eklenecek.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {personel.isPending ? (
          <LoadingState />
        ) : personel.isError ? (
          <ErrorState
            error={personel.error}
            onRetry={() => personel.refetch()}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad Soyad</TableHead>
                <TableHead className="hidden md:table-cell">E-posta</TableHead>
                <TableHead className="hidden lg:table-cell">Telefon</TableHead>
                <TableHead>Rol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {personel.data.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="whitespace-normal md:whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <PersonelAvatar personel={p} size="sm" />
                      <div className="grid leading-tight">
                        {p.ad} {p.soyad}
                        {/* Dar ekranda gizlenen iletişim sütunlarının özeti */}
                        <span className="text-xs break-all text-muted-foreground md:hidden">
                          {p.eposta}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {p.eposta}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {formatPhone(p.telefon)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={p.rol === "YONETICI" ? "default" : "secondary"}
                    >
                      {ROL_ETIKET[p.rol]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
