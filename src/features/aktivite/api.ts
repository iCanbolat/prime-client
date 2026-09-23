import { http } from "@/lib/http"
import type { AktiviteKaydi, AktiviteListParams } from "@/types/api"

export const aktiviteApi = {
  list: (params: AktiviteListParams) =>
    http.get<AktiviteKaydi[]>("/aktivite", { params: { ...params } }),
}
