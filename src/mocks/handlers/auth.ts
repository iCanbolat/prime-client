import { HttpResponse, http } from "msw"

import { db } from "@/mocks/db"
import { api, errorResponse, notFound } from "@/mocks/handlers/common"
import type { LoginRequest, LoginResponse } from "@/types/api"

export const authHandlers = [
  http.post<never, LoginRequest>(api("/auth/login"), async ({ request }) => {
    const { personelId } = await request.json()
    const personel = db.personel.find(personelId)
    if (!personel) return notFound("Kullanıcı bulunamadı")
    if (!personel.aktif) return errorResponse(403, "Bu kullanıcı pasif durumda")

    db.aktivite.insert({
      aktorId: personel.id,
      eylem: "GIRIS",
      zaman: new Date().toISOString(),
    })
    return HttpResponse.json<LoginResponse>({ personel })
  }),

  http.post<never, LoginRequest>(api("/auth/logout"), async ({ request }) => {
    const { personelId } = await request.json()
    if (db.personel.find(personelId)) {
      db.aktivite.insert({
        aktorId: personelId,
        eylem: "CIKIS",
        zaman: new Date().toISOString(),
      })
    }
    return new HttpResponse(null, { status: 204 })
  }),
]
