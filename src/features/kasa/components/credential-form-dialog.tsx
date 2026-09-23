import { useState } from "react"
import { useForm, type UseFormRegisterReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  MagicWand01Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons"

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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Input } from "@/components/ui/input"
import { SISTEMLER } from "@/features/kasa/sistemler"
import {
  useCreateCredential,
  useUpdateCredential,
} from "@/features/kasa/queries"
import { encryptJson, generatePassword } from "@/lib/crypto"
import { z } from "@/lib/zod"
import type { CredentialKaydi } from "@/types/api"
import type { CredentialSecret, Sistem } from "@/types/domain"

const credentialSchema = z.object({
  kullaniciAdi: z.string().trim().min(1, "Kullanıcı adı zorunludur").max(100),
  sifre: z.string().min(1, "Şifre zorunludur").max(200),
  ekSifre: z.string().max(200),
  not: z.string().trim().max(300, "En fazla 300 karakter"),
})

type CredentialFormValues = z.infer<typeof credentialSchema>

export interface CredentialFormHedef {
  mukellefId: string
  sistem: Sistem
  /** Düzenlemede mevcut kayıt ve çözülmüş gizli alanlar */
  mevcut?: { credential: CredentialKaydi; secret: CredentialSecret }
}

interface CredentialFormDialogProps {
  hedef: CredentialFormHedef | null
  /** Kasa anahtarı: form yalnızca kasa açıkken açılır */
  cryptoKey: CryptoKey | null
  onClose: () => void
}

function GizliAlan({
  id,
  label,
  error,
  registerProps,
  onGenerate,
}: {
  id: string
  label: string
  error?: string
  registerProps: UseFormRegisterReturn
  onGenerate: () => void
}) {
  const [gorunur, setGorunur] = useState(false)
  return (
    <Field data-invalid={Boolean(error) || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id={id}
          type={gorunur ? "text" : "password"}
          autoComplete="new-password"
          aria-invalid={Boolean(error) || undefined}
          className="font-mono"
          {...registerProps}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label={gorunur ? `${label} gizle` : `${label} göster`}
            onClick={() => setGorunur((v) => !v)}
          >
            <HugeiconsIcon
              icon={gorunur ? ViewOffSlashIcon : ViewIcon}
              strokeWidth={2}
            />
          </InputGroupButton>
          <InputGroupButton
            size="icon-xs"
            aria-label={`${label} üret`}
            onClick={onGenerate}
          >
            <HugeiconsIcon icon={MagicWand01Icon} strokeWidth={2} />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <FieldError>{error}</FieldError>
    </Field>
  )
}

function CredentialForm({
  hedef,
  cryptoKey,
  onClose,
}: {
  hedef: CredentialFormHedef
  cryptoKey: CryptoKey
  onClose: () => void
}) {
  const tanim = SISTEMLER[hedef.sistem]
  const create = useCreateCredential()
  const update = useUpdateCredential()
  const { register, handleSubmit, setValue, formState } =
    useForm<CredentialFormValues>({
      resolver: zodResolver(credentialSchema),
      defaultValues: {
        kullaniciAdi: hedef.mevcut?.credential.kullaniciAdi ?? "",
        sifre: hedef.mevcut?.secret.sifre ?? "",
        ekSifre: hedef.mevcut?.secret.ekSifre ?? "",
        not: hedef.mevcut?.credential.not ?? "",
      },
    })

  const onSubmit = handleSubmit(async (values) => {
    const secret: CredentialSecret = {
      sifre: values.sifre,
      ekSifre:
        tanim.ekSifreEtiketi && values.ekSifre ? values.ekSifre : undefined,
    }
    // Şifreler tarayıcıda şifrelenir; sunucuya yalnızca cipherText + iv gider.
    const encrypted = await encryptJson(secret, cryptoKey)
    const body = {
      kullaniciAdi: values.kullaniciAdi,
      not: values.not || undefined,
      ...encrypted,
    }
    try {
      if (hedef.mevcut) {
        await update.mutateAsync({ id: hedef.mevcut.credential.id, ...body })
        toast.success(`${tanim.ad} şifresi güncellendi`)
      } else {
        await create.mutateAsync({
          mukellefId: hedef.mukellefId,
          sistem: hedef.sistem,
          ...body,
        })
        toast.success(`${tanim.ad} şifresi eklendi`)
      }
      onClose()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kaydedilemedi")
    }
  })

  const hata = (alan: keyof CredentialFormValues) =>
    formState.errors[alan]?.message

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      <DialogHeader>
        <DialogTitle>
          {tanim.ad} şifresi {hedef.mevcut ? "düzenle" : "ekle"}
        </DialogTitle>
        <DialogDescription>{tanim.aciklama}</DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <Field data-invalid={Boolean(hata("kullaniciAdi")) || undefined}>
          <FieldLabel htmlFor="cred-kullanici">
            {tanim.kullaniciAdiEtiketi}
          </FieldLabel>
          <Input
            id="cred-kullanici"
            autoComplete="off"
            aria-invalid={Boolean(hata("kullaniciAdi")) || undefined}
            {...register("kullaniciAdi")}
          />
          <FieldError>{hata("kullaniciAdi")}</FieldError>
        </Field>
        <GizliAlan
          id="cred-sifre"
          label={tanim.sifreEtiketi}
          error={hata("sifre")}
          registerProps={register("sifre")}
          onGenerate={() =>
            setValue("sifre", generatePassword(), { shouldValidate: true })
          }
        />
        {tanim.ekSifreEtiketi && (
          <GizliAlan
            id="cred-ek-sifre"
            label={tanim.ekSifreEtiketi}
            error={hata("ekSifre")}
            registerProps={register("ekSifre")}
            onGenerate={() => setValue("ekSifre", generatePassword(8))}
          />
        )}
        <Field data-invalid={Boolean(hata("not")) || undefined}>
          <FieldLabel htmlFor="cred-not">Not</FieldLabel>
          <Input id="cred-not" {...register("not")} />
          <FieldDescription>
            Not şifrelenmez; buraya şifre veya gizli bilgi yazmayın.
          </FieldDescription>
          <FieldError>{hata("not")}</FieldError>
        </Field>
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Vazgeç
        </Button>
        <Button type="submit" disabled={formState.isSubmitting}>
          Kaydet
        </Button>
      </DialogFooter>
    </form>
  )
}

export function CredentialFormDialog({
  hedef,
  cryptoKey,
  onClose,
}: CredentialFormDialogProps) {
  const acik = Boolean(hedef && cryptoKey)
  return (
    <Dialog open={acik} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {hedef && cryptoKey && (
          <CredentialForm
            hedef={hedef}
            cryptoKey={cryptoKey}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
