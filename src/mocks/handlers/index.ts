import { aktiviteHandlers } from "@/mocks/handlers/aktivite"
import { arsivHandlers } from "@/mocks/handlers/arsiv"
import { bildirimHandlers } from "@/mocks/handlers/bildirim"
import { authHandlers } from "@/mocks/handlers/auth"
import { buroHandlers } from "@/mocks/handlers/buro"
import { simulationHandler } from "@/mocks/handlers/common"
import { devHandlers } from "@/mocks/handlers/dev"
import { eBelgeHandlers } from "@/mocks/handlers/e-belge"
import { evrakTalebiHandlers } from "@/mocks/handlers/evrak-talebi"
import { gorevHandlers } from "@/mocks/handlers/gorev"
import { kasaHandlers } from "@/mocks/handlers/kasa"
import { mukellefHandlers } from "@/mocks/handlers/mukellef"
import { portalHandlers } from "@/mocks/handlers/portal"
import { takvimHandlers } from "@/mocks/handlers/takvim"

/** Sıra önemli: simülasyon handler'ı her zaman ilk sırada kalmalı. */
export const handlers = [
  simulationHandler,
  ...devHandlers,
  ...authHandlers,
  ...buroHandlers,
  ...mukellefHandlers,
  ...kasaHandlers,
  ...aktiviteHandlers,
  ...takvimHandlers,
  ...arsivHandlers,
  ...evrakTalebiHandlers,
  ...portalHandlers,
  ...gorevHandlers,
  ...eBelgeHandlers,
  ...bildirimHandlers,
]
