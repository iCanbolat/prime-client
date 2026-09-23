import { useState } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Link01Icon,
  Message01Icon,
  WhatsappIcon,
} from "@hugeicons/core-free-icons"

import { Button, buttonVariants } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Textarea } from "@/components/ui/textarea"
import { useBuro } from "@/features/ayarlar/queries"
import {
  mesajOlustur,
  portalLinki,
  smsLinki,
  talepDegiskenleri,
  telefonNormalize,
  whatsappLinki,
} from "@/features/evrak-talebi/mesaj"
import { useTalepGonderim } from "@/features/evrak-talebi/queries"
import { VARSAYILAN_SABLONLAR } from "@/features/evrak-talebi/sabitler"
import { formatPhone } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { TalepView } from "@/types/api"
import type { MesajSablonTip, TalepKanal } from "@/types/domain"

interface GonderPaneliProps {
  talep: TalepView
  sablon?: MesajSablonTip
  /** RED şablonu için */
  neden?: string
}

async function kopyala(metin: string, mesaj: string) {
  try {
    await navigator.clipboard.writeText(metin)
    toast.success(mesaj)
  } catch {
    toast.error("Panoya kopyalanamadı")
  }
}

/**
 * Talep mesajının önizlemesi ve paylaşım eylemleri (WhatsApp, SMS, kopyala).
 * Her paylaşım "gönderim" olarak kaydedilir.
 */
export function GonderPaneli({
  talep,
  sablon = "TALEP",
  neden,
}: GonderPaneliProps) {
  const { data: buro } = useBuro()
  const gonderim = useTalepGonderim()
  const link = portalLinki(talep.token)
  const varsayilan = mesajOlustur(
    buro?.mesajSablonlari?.[sablon] ?? VARSAYILAN_SABLONLAR[sablon],
    talepDegiskenleri({
      mukellefUnvan: talep.mukellefUnvan,
      buroAd: buro?.ad ?? "",
      donem: talep.donem,
      istenenler: talep.istenenler,
      link,
      sonKullanma: talep.sonKullanma,
      neden,
    })
  )
  const [mesaj, setMesaj] = useState(varsayilan)
  const telefonGecerli = telefonNormalize(talep.mukellefTelefon) !== null
  const aktif = talep.durum === "AKTIF"

  const kaydet = (kanal: TalepKanal) => {
    if (!aktif) return
    gonderim.mutate(
      { id: talep.id, kanal },
      { onError: (error) => toast.error(error.message) }
    )
  }

  return (
    <div className="grid gap-4">
      <Field>
        <FieldLabel htmlFor="talep-mesaj">Mesaj</FieldLabel>
        <Textarea
          id="talep-mesaj"
          rows={5}
          value={mesaj}
          onChange={(e) => setMesaj(e.target.value)}
        />
        <FieldDescription>
          {telefonGecerli
            ? `Alıcı: ${formatPhone(talep.mukellefTelefon)}`
            : "Mükellefin geçerli bir cep telefonu yok; bağlantıyı kopyalayıp paylaşın."}
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="talep-link">Yükleme bağlantısı</FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <HugeiconsIcon icon={Link01Icon} strokeWidth={2} />
          </InputGroupAddon>
          <InputGroupInput
            id="talep-link"
            readOnly
            value={link}
            className="font-mono text-xs"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              aria-label="Bağlantıyı kopyala"
              onClick={() => void kopyala(link, "Bağlantı kopyalandı")}
            >
              <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </Field>

      <div className="grid gap-2 sm:grid-cols-3">
        <a
          href={
            telefonGecerli
              ? (whatsappLinki(talep.mukellefTelefon, mesaj) ?? undefined)
              : undefined
          }
          target="_blank"
          rel="noreferrer"
          aria-disabled={!telefonGecerli || undefined}
          onClick={() => kaydet("WHATSAPP")}
          className={cn(
            buttonVariants(),
            "bg-emerald-600 text-white hover:bg-emerald-700",
            !telefonGecerli && "pointer-events-none opacity-50"
          )}
        >
          <HugeiconsIcon
            icon={WhatsappIcon}
            strokeWidth={2}
            data-icon="inline-start"
          />
          WhatsApp'ta aç
        </a>
        <a
          href={
            telefonGecerli
              ? (smsLinki(talep.mukellefTelefon, mesaj) ?? undefined)
              : undefined
          }
          aria-disabled={!telefonGecerli || undefined}
          onClick={() => kaydet("SMS")}
          className={cn(
            buttonVariants({ variant: "outline" }),
            !telefonGecerli && "pointer-events-none opacity-50"
          )}
        >
          <HugeiconsIcon
            icon={Message01Icon}
            strokeWidth={2}
            data-icon="inline-start"
          />
          SMS ile gönder
        </a>
        <Button
          variant="outline"
          onClick={() => {
            void kopyala(mesaj, "Mesaj kopyalandı")
            kaydet("LINK")
          }}
        >
          <HugeiconsIcon
            icon={Copy01Icon}
            strokeWidth={2}
            data-icon="inline-start"
          />
          Mesajı kopyala
        </Button>
      </div>
    </div>
  )
}
