import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { changePassword } from '../lib/api'
import { useState } from 'react'

export default function ChangePasswordPage() {
  const { t, i18n } = useTranslation(['app', 'common', 'errors'])

  const schema = z.object({
    currentPassword: z.string().min(1, { message: t('errors:required', { defaultValue: 'Obrigatório' }) }),
    newPassword: z.string().min(6, { message: t('errors:min_chars', { count: 6, defaultValue: 'Mínimo de 6 caracteres' }) }),
    confirmPassword: z.string().min(6, { message: t('errors:min_chars', { count: 6, defaultValue: 'Mínimo de 6 caracteres' }) }),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: t('errors:passwords_must_match', { defaultValue: 'As senhas devem coincidir' }),
    path: ['confirmPassword']
  })

  type FormValues = z.infer<typeof schema>

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setError, clearErrors } = useForm<FormValues>({
    resolver: zodResolver(schema)
  })

  const [serverError, setServerError] = useState<string | null>(null)
  const [serverSuccess, setServerSuccess] = useState<string | null>(null)

  const onSubmit = async (values: FormValues) => {
    setServerError(null)
    setServerSuccess(null)
    clearErrors()
    try {
      await changePassword({
        current_password: values.currentPassword,
        new_password: values.newPassword,
      })
      reset()
      setServerSuccess(t('app:password_changed', { defaultValue: 'Senha alterada com sucesso.' }))
    } catch (err: any) {
      // Try to extract useful error message from backend
      const msg = err?.response?.data?.detail
        || err?.response?.data?.message
        || err?.message
        || t('errors:unknown', { defaultValue: 'Ocorreu um erro. Tente novamente.' })
      setServerError(msg)
      // If backend signals current password invalid via field errors
      const fieldErrors = err?.response?.data
      if (fieldErrors?.current_password) {
        setError('currentPassword', { type: 'server', message: String(fieldErrors.current_password) })
      }
      if (fieldErrors?.new_password) {
        setError('newPassword', { type: 'server', message: String(fieldErrors.new_password) })
      }
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-xl font-semibold">{t('app:changePassword', { defaultValue: 'Alterar senha' })}</h1>
      {serverError && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{serverError}</div>}
      {serverSuccess && <div className="rounded bg-green-50 p-3 text-sm text-green-700">{serverSuccess}</div>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm">{t('app:currentPassword', { defaultValue: 'Senha atual' })}</label>
          <input type="password" className="input" {...register('currentPassword')} />
          {errors.currentPassword && <p className="text-sm text-red-600">{errors.currentPassword.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm">{t('app:newPassword', { defaultValue: 'Nova senha' })}</label>
          <input type="password" className="input" {...register('newPassword')} />
          {errors.newPassword && <p className="text-sm text-red-600">{errors.newPassword.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm">{t('app:confirmPassword', { defaultValue: 'Confirmar nova senha' })}</label>
          <input type="password" className="input" {...register('confirmPassword')} />
          {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>}
        </div>
        <button className="btn w-full" disabled={isSubmitting}>
          {isSubmitting ? t('common:saving', { defaultValue: 'Salvando...' }) : t('common:save', { defaultValue: 'Salvar' })}
        </button>
      </form>
    </div>
  )
}
