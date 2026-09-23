import { http } from "@/lib/http"
import type {
  TakvimDurumGuncelleRequest,
  TakvimListParams,
  TakvimOlayi,
  TakvimOzetParams,
  TakvimOzetResponse,
} from "@/types/api"
import type { BeyanDurumu } from "@/types/domain"

export const takvimApi = {
  list: (params: TakvimListParams) =>
    http.get<TakvimOlayi[]>("/takvim", { params: { ...params } }),
  ozet: (params: TakvimOzetParams = {}) =>
    http.get<TakvimOzetResponse>("/takvim/ozet", { params: { ...params } }),
  durumGuncelle: (id: string, body: TakvimDurumGuncelleRequest) =>
    http.patch<{ id: string; durum: BeyanDurumu }>(
      `/takvim/${encodeURIComponent(id)}`,
      body
    ),
}
