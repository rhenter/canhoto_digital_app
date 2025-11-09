import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
import { getUser, setUser, User, mapPreferredLanguage } from '../lib/auth'

const schema = z.object({
  id: z.number(),
  name: z.string().min(1),
  username: z.string().min(1),
  first_name: z.string().optional().default(''),
  last_name: z.string().optional().default(''),
  cellphone: z.string().optional().nullable(),
  email: z.string().email(),
  allow_email_notifications: z.boolean(),
  allow_push_notifications: z.boolean(),
  allow_sms_notifications: z.boolean(),
  allow_whatsapp_notifications: z.boolean(),
  preferred_language: z.string().min(1),
  is_superuser: z.boolean(),
  is_active: z.boolean(),
  last_login: z.string().nullable(),
})

export default function PreferencesPage() {
  const { t } = useTranslation(['app', 'common'])
  const user = getUser()

  const { register, handleSubmit, reset, watch, formState: { isSubmitting, isDirty, errors } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: user ?? undefined as any,
  })

  useEffect(() => {
    // keep form in sync if user changes
    if (user) reset(user as any)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setSuccess(null)
    setError(null)
    try {
      // TODO: integrate with backend to update user profile
      await new Promise((r) => setTimeout(r, 400))
      setUser(values as unknown as User)
      // Change language immediately if updated
      if (values.preferred_language) {
        const lang = mapPreferredLanguage(values.preferred_language)
        if (i18n.language !== lang) await i18n.changeLanguage(lang)
      }
      setSuccess(t('common:saved', { defaultValue: 'Salvo.' }))
      // Reset form to clear dirty state
      reset(values)
    } catch (e) {
      setError(t('errors.generic', { defaultValue: 'Algo deu errado. Tente novamente.' }))
    }
  }

  if (!user) {
    return <p className="text-gray-600">{t('common:loading')}</p>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">{t('app:userPreferences', { defaultValue: 'Preferências do Usuário' })}</h1>
      {success && <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">{success}</div>}
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>}
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-1">
          <label className="mb-1 block text-sm">ID</label>
          <input type="number" className="input" {...register('id', { valueAsNumber: true })} readOnly />
        </div>
        <div className="md:col-span-1">
          <label className="mb-1 block text-sm">{t('common:name', { defaultValue: 'Nome' })}</label>
          <input className="input" {...register('name')} />
          {errors.name && <p className="text-sm text-red-600">{errors.name.message as any}</p>}
        </div>
        <div className="md:col-span-1">
          <label className="mb-1 block text-sm">Username</label>
          <input className="input" {...register('username')} />
          {errors.username && <p className="text-sm text-red-600">{errors.username.message as any}</p>}
        </div>
        <div className="md:col-span-1">
          <label className="mb-1 block text-sm">{t('common:firstName', { defaultValue: 'Nome' })}</label>
          <input className="input" {...register('first_name')} />
        </div>
        <div className="md:col-span-1">
          <label className="mb-1 block text-sm">{t('common:lastName', { defaultValue: 'Sobrenome' })}</label>
          <input className="input" {...register('last_name')} />
        </div>
        <div className="md:col-span-1">
          <label className="mb-1 block text-sm">{t('common:cellphone', { defaultValue: 'Celular' })}</label>
          <input className="input" {...register('cellphone')} />
        </div>
        <div className="md:col-span-1">
          <label className="mb-1 block text-sm">Email</label>
          <input className="input" {...register('email')} />
          {errors.email && <p className="text-sm text-red-600">{errors.email.message as any}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm">{t('common:language', { defaultValue: 'Idioma preferido' })}</label>
          <select className="input" {...register('preferred_language')}>
            <option value="pt">Português</option>
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </div>

        <fieldset className="md:col-span-2 rounded-md border p-3">
          <legend className="px-1 text-sm text-gray-700">{t('app:notifications', { defaultValue: 'Notificações' })}</legend>
          <label className="flex items-center gap-2 py-1">
            <input type="checkbox" {...register('allow_email_notifications')} />
            <span>Email</span>
          </label>
          <label className="flex items-center gap-2 py-1">
            <input type="checkbox" {...register('allow_push_notifications')} />
            <span>Push</span>
          </label>
          <label className="flex items-center gap-2 py-1">
            <input type="checkbox" {...register('allow_sms_notifications')} />
            <span>SMS</span>
          </label>
          <label className="flex items-center gap-2 py-1">
            <input type="checkbox" {...register('allow_whatsapp_notifications')} />
            <span>WhatsApp</span>
          </label>
        </fieldset>

        <div className="md:col-span-1">
          <label className="mb-1 block text-sm">Superuser</label>
          <input className="input" value={String(user.is_superuser)} readOnly />
        </div>
        <div className="md:col-span-1">
          <label className="mb-1 block text-sm">{t('common:status', { defaultValue: 'Ativo' })}</label>
          <input className="input" value={String(user.is_active)} readOnly />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm">Last login</label>
          <input className="input" value={user.last_login ?? '-'} readOnly />
        </div>

        <div className="md:col-span-2 mt-2">
          <button className="btn" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? t('common:saving', { defaultValue: 'Salvando...' }) : t('common:save', { defaultValue: 'Salvar' })}
          </button>
        </div>
      </form>
    </div>
  )
}
