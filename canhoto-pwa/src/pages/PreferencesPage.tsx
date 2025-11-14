import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'
import { getUser, setUser, User, mapPreferredLanguage } from '../lib/auth'
import { updateUserPreferences, UpdateUserPreferencesPayload } from '../lib/api'

// Friendly date-time formatter for ISO strings
const formatDateTime = (iso: string | null | undefined, locale: string) => {
  if (!iso) return '-'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return String(iso)
  try {
    return new Intl.DateTimeFormat(locale || 'pt-br', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d)
  } catch {
    return d.toLocaleString()
  }
}

// Normalize language code to backend expected codes
// Backend rejects 'pt'; use 'pt-br'. Keep others lowercase as-is.
const toBackendPreferredLanguage = (code: string) => {
  const c = (code || '').toLowerCase()
  switch (c) {
    case 'pt':
    case 'pt-br':
    case 'pt_br':
      return 'pt-br'
    default:
      return c
  }
}

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
      const payload: UpdateUserPreferencesPayload = {
        name: values.name,
        username: values.username,
        first_name: values.first_name,
        last_name: values.last_name,
        cellphone: values.cellphone ?? null,
        email: values.email,
        allow_email_notifications: values.allow_email_notifications,
        allow_push_notifications: values.allow_push_notifications,
        allow_sms_notifications: values.allow_sms_notifications,
        allow_whatsapp_notifications: values.allow_whatsapp_notifications,
        preferred_language: toBackendPreferredLanguage(values.preferred_language),
      }
      const resp = await updateUserPreferences(values.id, payload)
      const updated = (resp && typeof resp === 'object' && 'id' in resp)
        ? (resp as any)
        : ({ ...(getUser() as any), ...values })
      setUser(updated as unknown as User)
      // Change language immediately if updated
      if (updated.preferred_language) {
        const lang = mapPreferredLanguage(updated.preferred_language)
        if (i18n.language !== lang) await i18n.changeLanguage(lang)
      }
      setSuccess(t('common:saved', { defaultValue: 'Salvo.' }))
      // Reset form to clear dirty state
      reset(updated as any)
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
          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700 text-sm">{String(user.id)}</div>
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
            <option value="pt-br">Português</option>
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
          <div className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium ${user.is_superuser ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
            <span className={`h-2 w-2 rounded-full ${user.is_superuser ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            {user.is_superuser ? 'Yes' : 'No'}
          </div>
        </div>
        <div className="md:col-span-1">
          <label className="mb-1 block text-sm">{t('common:status', { defaultValue: 'Ativo' })}</label>
          <div className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <span className={`h-2 w-2 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
            {user.is_active ? t('common:active', { defaultValue: 'Active' }) : t('common:inactive', { defaultValue: 'Inactive' })}
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm">Last login</label>
          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700 text-sm" title={user.last_login ?? undefined}>{formatDateTime(user.last_login, i18n.language)}</div>
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
