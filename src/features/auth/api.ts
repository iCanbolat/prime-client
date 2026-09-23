import { http } from "@/lib/http"
import type { LoginResponse } from "@/types/api"
import type { Personel } from "@/types/domain"

export const authApi = {
  login: (personelId: string) =>
    http.post<LoginResponse>("/auth/login", { personelId }),
  logout: (personelId: string) =>
    http.post<void>("/auth/logout", { personelId }),
  personelList: () => http.get<Personel[]>("/personel"),
}
