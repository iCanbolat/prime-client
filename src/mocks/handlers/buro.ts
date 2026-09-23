import { HttpResponse, http } from "msw"

import { db } from "@/mocks/db"
import {
  api,
  errorResponse,
  logActivity,
  notFound,
  requireActor,
} from "@/mocks/handlers/common"
import type { MesajSablonlari } from "@/types/api"

const MAKS_SABLON = 1000

export const buroHandlers = [
  http.get(api("/buro"), () => {
    const [buro] = db.buro.all()
    return buro ? HttpResponse.json(buro) : notFound("Büro bilgisi bulunamadı")
  }),

  http.put<never, MesajSablonlari>(
    api("/buro/sablonlar"),
    async ({ request }) => {
      const actor = requireActor(request)
      if (actor instanceof Response) return actor
      if (actor.rol !== "YONETICI")
        return errorResponse(
          403,
          "Mesaj şablonlarını yalnızca yönetici değiştirebilir"
        )
      const [buro] = db.buro.all()
      if (!buro) return notFound("Büro bilgisi bulunamadı")

      const body = await request.json()
      for (const tip of ["TALEP", "RED"] as const) {
        const metin = body[tip]?.trim()
        if (!metin) return errorResponse(400, "Şablon boş olamaz")
        if (metin.length > MAKS_SABLON)
          return errorResponse(
            400,
            `Şablon en fazla ${MAKS_SABLON} karakter olabilir`
          )
        if (!metin.includes("{link}"))
          return errorResponse(400, "Şablon {link} değişkenini içermeli")
      }
      const guncel = db.buro.update(buro.id, {
        mesajSablonlari: { TALEP: body.TALEP.trim(), RED: body.RED.trim() },
      })!
      logActivity({ aktorId: actor.id, eylem: "SABLON_GUNCELLENDI" })
      return HttpResponse.json(guncel)
    }
  ),

  http.get(api("/personel"), () => HttpResponse.json(db.personel.all())),
]
