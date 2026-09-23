import { useState, type FormEvent } from "react"
import { toast } from "sonner"

import { DatePicker } from "@/components/shared/date-picker"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { KategoriSelect } from "@/features/arsiv/components/kategori-select"
import { GECERLILIK_GEREKEN } from "@/features/arsiv/kurallar"
import { useArsivGuncelle } from "@/features/arsiv/queries"
import type { ArsivDosyaView } from "@/types/api"

function DuzenleForm({
  dosya,
  onClose,
}: {
  dosya: ArsivDosyaView
  onClose: () => void
}) {
  const guncelle = useArsivGuncelle()
  const [ad, setAd] = useState(dosya.ad)
  const [kategori, setKategori] = useState(dosya.kategori)
  const [gecerlilik, setGecerlilik] = useState(dosya.gecerlilikTarihi ?? "")
  const [hata, setHata] = useState<string>()
  const sureli = GECERLILIK_GEREKEN.includes(kategori)

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!ad.trim()) {
      setHata("Dosya adı zorunludur")
      return
    }
    guncelle.mutate(
      {
        id: dosya.id,
        ad,
        kategori,
        gecerlilikTarihi: sureli ? gecerlilik || null : undefined,
      },
      {
        onSuccess: () => {
          toast.success("Dosya güncellendi")
          onClose()
        },
        onError: (error) => toast.error(error.message),
      }
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Dosyayı düzenle</DialogTitle>
        <DialogDescription>{dosya.mukellefUnvan}</DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <Field data-invalid={Boolean(hata) || undefined}>
          <FieldLabel htmlFor="arsiv-ad">Dosya adı</FieldLabel>
          <Input
            id="arsiv-ad"
            value={ad}
            aria-invalid={Boolean(hata) || undefined}
            onChange={(e) => {
              setAd(e.target.value)
              setHata(undefined)
            }}
          />
          <FieldError>{hata}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="arsiv-kategori">Kategori</FieldLabel>
          <KategoriSelect
            id="arsiv-kategori"
            value={kategori}
            onValueChange={setKategori}
          />
        </Field>
        {sureli && (
          <Field>
            <FieldLabel htmlFor="arsiv-gecerlilik">
              Son geçerlilik tarihi
            </FieldLabel>
            <DatePicker
              id="arsiv-gecerlilik"
              value={gecerlilik}
              onChange={setGecerlilik}
              clearable
            />
            <FieldDescription>30 gün kala uyarı verilir.</FieldDescription>
          </Field>
        )}
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Vazgeç
        </Button>
        <Button type="submit" disabled={guncelle.isPending}>
          Kaydet
        </Button>
      </DialogFooter>
    </form>
  )
}

export function DuzenleDialog({
  dosya,
  onClose,
}: {
  dosya: ArsivDosyaView | null
  onClose: () => void
}) {
  return (
    <Dialog open={Boolean(dosya)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {dosya && (
          <DuzenleForm key={dosya.id} dosya={dosya} onClose={onClose} />
        )}
      </DialogContent>
    </Dialog>
  )
}
