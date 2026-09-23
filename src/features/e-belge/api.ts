import { http } from "@/lib/http"
import type {
  BaglantiKaydetRequest,
  BeratListParams,
  BeratListResponse,
  EBelgeDetay,
  EBelgeIcerikResponse,
  EBelgeListParams,
  EBelgeListResponse,
  EBelgeOzetResponse,
  EBelgeView,
  EFaturaYanitRequest,
  NilveraBaglantiView,
  SenkronRequest,
  SenkronResponse,
} from "@/types/api"

export const eBelgeApi = {
  baglantilar: () => http.get<NilveraBaglantiView[]>("/e-belge/baglantilar"),
  baglanti: (mukellefId: string) =>
    http.get<NilveraBaglantiView>(`/e-belge/baglantilar/${mukellefId}`),
  baglantiKaydet: (mukellefId: string, body: BaglantiKaydetRequest) =>
    http.put<NilveraBaglantiView>(`/e-belge/baglantilar/${mukellefId}`, body),
  baglantiKaldir: (mukellefId: string) =>
    http.delete<void>(`/e-belge/baglantilar/${mukellefId}`),
  senkron: (body: SenkronRequest = {}) =>
    http.post<SenkronResponse>("/e-belge/senkron", body),
  faturalar: (params: EBelgeListParams) =>
    http.get<EBelgeListResponse>("/e-belge/faturalar", {
      params: { ...params },
    }),
  fatura: (id: string) => http.get<EBelgeDetay>(`/e-belge/faturalar/${id}`),
  icerik: (id: string) =>
    http.get<EBelgeIcerikResponse>(`/e-belge/faturalar/${id}/icerik`),
  yanit: (id: string, body: EFaturaYanitRequest) =>
    http.post<EBelgeView>(`/e-belge/faturalar/${id}/yanit`, body),
  arsiveKaydet: (id: string) =>
    http.post<EBelgeView>(`/e-belge/faturalar/${id}/arsive-kaydet`),
  beratlar: (params: BeratListParams = {}) =>
    http.get<BeratListResponse>("/e-belge/beratlar", { params: { ...params } }),
  ozet: (params: { sorumlu?: string } = {}) =>
    http.get<EBelgeOzetResponse>("/e-belge/ozet", { params: { ...params } }),
}
