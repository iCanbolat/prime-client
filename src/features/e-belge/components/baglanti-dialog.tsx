import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useBaglantiKaydet } from "@/features/e-belge/queries"
import { ORTAM_ETIKET } from "@/features/e-belge/sabitler"
import { ApiError } from "@/lib/http"
import { z } from "@/lib/zod"
import type { NilveraBaglantiView } from "@/types/api"
import type { NilveraOrtam } from "@/types/domain"

const baglantiSchema = z.object({
  apiAnahtari: z
    .string()
    .trim()
    .min(16, "API anahtarı en az 16 karakter olmalı"),
  ortam: z.enum(["TEST", "CANLI"]),
})

type BaglantiFormValues = z.infer<typeof baglantiSchema>

/**
 * API anahtarı yalnızca bu formun (bellekteki) durumunda yaşar: backend'e bir kez gönderilir,
 * pencere kapanınca form yok olur. Yanıtta anahtarın yalnızca son 4 karakteri döner.
 */
function BaglantiForm({
  baglanti,
  onClose,
}: {
  baglanti: NilveraBaglantiView
  onClose: () => void
}) {
  const kaydet = useBaglantiKaydet()
  const { register, handleSubmit, control, setError, formState } =
    useForm<BaglantiFormValues>({
      resolver: zodResolver(baglantiSchema),
      defaultValues: { apiAnahtari: "", ortam: baglanti.ortam },
    })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await kaydet.mutateAsync({ mukellefId: baglanti.mukellefId, ...values })
      toast.success(`${baglanti.mukellefUnvan} Nilvera'ya bağlandı`)
      onClose()
    } catch (error) {
      // 422: Nilvera anahtarı reddetti → alana yaz
      if (error instanceof ApiError && error.status === 422)
        setError("apiAnahtari", { message: error.message })
      else toast.error(error instanceof Error ? error.message : "Kaydedilemedi")
    }
  })

  const hata = formState.errors.apiAnahtari?.message
  const yenileme = baglanti.durum !== "BAGLI_DEGIL"

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <DialogHeader>
        <DialogTitle>
          {yenileme ? "Nilvera bağlantısını yenile" : "Nilvera'ya bağla"}
        </DialogTitle>
        <DialogDescription>{baglanti.mukellefUnvan}</DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <Field data-invalid={Boolean(hata) || undefined}>
          <FieldLabel htmlFor="nilvera-anahtar">API anahtarı</FieldLabel>
          <Input
            id="nilvera-anahtar"
            type="password"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={Boolean(hata) || undefined}
            {...register("apiAnahtari")}
          />
          <FieldDescription>
            Mükellefin Nilvera hesabında oluşturulan API anahtarı. Anahtar
            sunucuda şifreli saklanır; bir daha görüntülenemez.
            {yenileme && baglanti.anahtarIpucu && (
              <> Mevcut anahtar: ••••{baglanti.anahtarIpucu}</>
            )}
          </FieldDescription>
          <FieldError>{hata}</FieldError>
        </Field>
        <Field>
          <FieldLabel id="nilvera-ortam">Ortam</FieldLabel>
          <Controller
            control={control}
            name="ortam"
            render={({ field }) => (
              <ToggleGroup
                variant="outline"
                spacing={0}
                aria-labelledby="nilvera-ortam"
                value={[field.value]}
                onValueChange={(v) =>
                  v[0] && field.onChange(v[0] as NilveraOrtam)
                }
              >
                {(Object.keys(ORTAM_ETIKET) as NilveraOrtam[]).map((o) => (
                  <ToggleGroupItem key={o} value={o}>
                    {ORTAM_ETIKET[o]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            )}
          />
        </Field>
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Vazgeç
        </Button>
        <Button type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? "Doğrulanıyor…" : "Bağla"}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function BaglantiDialog({
  baglanti,
  onClose,
}: {
  baglanti: NilveraBaglantiView | null
  onClose: () => void
}) {
  return (
    <Dialog
      open={Boolean(baglanti)}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="sm:max-w-md">
        {baglanti && <BaglantiForm baglanti={baglanti} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}
