import { http } from "@/lib/http"
import type {
  PostaKutusuKaydetRequest,
  TebligatBelgeRequest,
  TebligatEkleRequest,
  TebligatGuncelleRequest,
  TebligatListParams,
  TebligatListResponse,
  TebligatOzetResponse,
  TebligatPostaKutusuView,
  TebligatTaraResponse,
  TebligatView,
} from "@/types/api"
import type { Gorev } from "@/types/domain"

export const tebligatApi = {
  liste: (params: TebligatListParams = {}) =>
    http.get<TebligatListResponse>("/tebligat", { params: { ...params } }),
  ozet: (params: { sorumlu?: string } = {}) =>
    http.get<TebligatOzetResponse>("/tebligat/ozet", { params }),
  detay: (id: string) => http.get<TebligatView>(`/tebligat/${id}`),
  ekle: (body: TebligatEkleRequest) =>
    http.post<TebligatView>("/tebligat", body),
  guncelle: (id: string, body: TebligatGuncelleRequest) =>
    http.patch<TebligatView>(`/tebligat/${id}`, body),
  gorevOlustur: (id: string) => http.post<Gorev>(`/tebligat/${id}/gorev`),
  belgeYukle: (id: string, body: TebligatBelgeRequest) =>
    http.post<TebligatView>(`/tebligat/${id}/belge`, body),
  tara: () => http.post<TebligatTaraResponse>("/tebligat/tara"),
  postaKutusu: () =>
    http.get<TebligatPostaKutusuView | null>("/tebligat/posta-kutusu"),
  postaKutusuKaydet: (body: PostaKutusuKaydetRequest) =>
    http.put<TebligatPostaKutusuView>("/tebligat/posta-kutusu", body),
  postaKutusuKaldir: () => http.delete<void>("/tebligat/posta-kutusu"),
}
