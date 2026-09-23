import { http } from "@/lib/http"
import type { DevStatsResponse } from "@/types/api"
import type { Buro } from "@/types/domain"

export const ayarlarApi = {
  buro: () => http.get<Buro>("/buro"),
  resetMockDb: () => http.post<void>("/dev/reset"),
  mockDbStats: () => http.get<DevStatsResponse>("/dev/stats"),
}
