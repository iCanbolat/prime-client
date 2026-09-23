import { Navigate, useLocation, useNavigate } from "react-router"
import { toast } from "sonner"

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
import { Spinner } from "@/components/ui/spinner"
import { useLogin, usePersonelList } from "@/features/auth/queries"
import { useAuthStore } from "@/features/auth/store"
import { ROL_ETIKET } from "@/types/domain"

interface LocationState {
  from?: string
}

export function LoginPage() {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  const navigate = useNavigate()
  const personel = usePersonelList()
  const login = useLogin()

  const from = (location.state as LocationState | null)?.from ?? "/"

  if (user) return <Navigate to={from} replace />

  const handleSelect = (personelId: string) => {
    login.mutate(personelId, {
      onSuccess: ({ personel: p }) => {
        toast.success(`Hoş geldiniz, ${p.ad}`)
        navigate(from, { replace: true })
      },
      onError: (error) => toast.error(error.message),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Giriş yap</CardTitle>
        <CardDescription>
          Demo ortamı: devam etmek için bir kullanıcı seçin. Gerçek kimlik
          doğrulama backend ile gelecek.
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
          <ul className="grid gap-2">
            {personel.data
              .filter((p) => p.aktif)
              .map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={login.isPending}
                    onClick={() => handleSelect(p.id)}
                    className="flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/30 disabled:opacity-60"
                  >
                    <PersonelAvatar personel={p} />
                    <span className="grid flex-1 leading-tight">
                      <span className="font-medium">
                        {p.ad} {p.soyad}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {p.eposta}
                      </span>
                    </span>
                    {login.isPending && login.variables === p.id ? (
                      <Spinner />
                    ) : (
                      <Badge
                        variant={p.rol === "YONETICI" ? "default" : "secondary"}
                      >
                        {ROL_ETIKET[p.rol]}
                      </Badge>
                    )}
                  </button>
                </li>
              ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
