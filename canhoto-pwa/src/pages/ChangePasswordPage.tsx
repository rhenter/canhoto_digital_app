import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'

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

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema)
  })

  const onSubmit = async (_values: FormValues) => {
    // TODO: integrate with backend endpoint when available
    await new Promise((r) => setTimeout(r, 600))
    reset()
    alert(t('app:password_changed', { defaultValue: 'Senha alterada (demo).' }))
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-xl font-semibold">{t('app:changePassword', { defaultValue: 'Alterar senha' })}</h1>
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
