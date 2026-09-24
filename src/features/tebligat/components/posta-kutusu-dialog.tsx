import { useForm } from "react-hook-form"
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
import { usePostaKutusuKaydet } from "@/features/tebligat/queries"
import { ApiError } from "@/lib/http"
import { z } from "@/lib/zod"
import type { TebligatPostaKutusuView } from "@/types/api"

const kutuSchema = z.object({
  sunucu: z.string().trim().min(3, "IMAP sunucusunu yazın"),
  port: z.number("Port girin").int().min(1).max(65535),
  kullanici: z.string().trim().min(3, "Kullanıcı adını yazın"),
  klasor: z.string().trim().min(1, "Klasör adını yazın"),
  sifre: z.string().min(4, "Şifre en az 4 karakter olmalı"),
})

type KutuFormValues = z.infer<typeof kutuSchema>

/** Şifre yalnızca bu formda yaşar; backend'e bir kez gider, yanıtta son 4 karakteri döner */
function KutuForm({
  mevcut,
  onClose,
}: {
  mevcut: TebligatPostaKutusuView | null
  onClose: () => void
}) {
  const kaydet = usePostaKutusuKaydet()
  const { register, handleSubmit, setError, formState } =
    useForm<KutuFormValues>({
      resolver: zodResolver(kutuSchema),
      defaultValues: {
        sunucu: mevcut?.sunucu ?? "",
        port: mevcut?.port ?? 993,
        kullanici: mevcut?.kullanici ?? "",
        klasor: mevcut?.klasor ?? "INBOX",
        sifre: "",
      },
    })
  const { errors } = formState

  const onSubmit = handleSubmit(async (v) => {
    try {
      await kaydet.mutateAsync(v)
      toast.success("Tebligat posta kutusu bağlandı")
      onClose()
    } catch (error) {
      if (error instanceof ApiError && error.status === 422)
        setError("sifre", { message: error.message })
      else toast.error(error instanceof Error ? error.message : "Kaydedilemedi")
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6">
      <DialogHeader>
        <DialogTitle>Tebligat posta kutusu</DialogTitle>
        <DialogDescription>
          GİB/İVD'de mükelleflerin e-Tebligat bildirim adresi olarak bu kutuyu
          tanımlayın; bildirimler buradan okunur. Gmail / Outlook için hesap
          şifresi yerine uygulama şifresi kullanın.
        </DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
          <Field data-invalid={Boolean(errors.sunucu) || undefined}>
            <FieldLabel htmlFor="kutu-sunucu">IMAP sunucusu</FieldLabel>
            <Input
              id="kutu-sunucu"
              placeholder="imap.gmail.com"
              aria-invalid={Boolean(errors.sunucu) || undefined}
              {...register("sunucu")}
            />
            <FieldError>{errors.sunucu?.message}</FieldError>
          </Field>
          <Field data-invalid={Boolean(errors.port) || undefined}>
            <FieldLabel htmlFor="kutu-port">Port</FieldLabel>
            <Input
              id="kutu-port"
              type="number"
              inputMode="numeric"
              aria-invalid={Boolean(errors.port) || undefined}
              {...register("port", { valueAsNumber: true })}
            />
            <FieldError>{errors.port?.message}</FieldError>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
          <Field data-invalid={Boolean(errors.kullanici) || undefined}>
            <FieldLabel htmlFor="kutu-kullanici">
              E-posta / kullanıcı
            </FieldLabel>
            <Input
              id="kutu-kullanici"
              autoComplete="off"
              aria-invalid={Boolean(errors.kullanici) || undefined}
              {...register("kullanici")}
            />
            <FieldError>{errors.kullanici?.message}</FieldError>
          </Field>
          <Field data-invalid={Boolean(errors.klasor) || undefined}>
            <FieldLabel htmlFor="kutu-klasor">Klasör</FieldLabel>
            <Input id="kutu-klasor" {...register("klasor")} />
            <FieldError>{errors.klasor?.message}</FieldError>
          </Field>
        </div>
        <Field data-invalid={Boolean(errors.sifre) || undefined}>
          <FieldLabel htmlFor="kutu-sifre">Şifre</FieldLabel>
          <Input
            id="kutu-sifre"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.sifre) || undefined}
            {...register("sifre")}
          />
          <FieldDescription>
            {mevcut?.sifreIpucu
              ? `Kayıtlı şifre ••••${mevcut.sifreIpucu}. Değiştirmek için yenisini girin.`
              : "Şifre sunucuda şifreli saklanır, bir daha gösterilmez."}
          </FieldDescription>
          <FieldError>{errors.sifre?.message}</FieldError>
        </Field>
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Vazgeç
        </Button>
        <Button type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? "Bağlanıyor…" : "Bağla"}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function PostaKutusuDialog({
  open,
  mevcut,
  onClose,
}: {
  open: boolean
  mevcut: TebligatPostaKutusuView | null
  onClose: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {open && <KutuForm mevcut={mevcut} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}
