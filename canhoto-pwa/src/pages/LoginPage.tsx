import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { login, isAuthenticated } from '../lib/auth'
import { useNavigate, Navigate } from 'react-router-dom'

export default function LoginPage() {
  const { t, i18n } = useTranslation(['auth', 'errors'])
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  // Build schema with translated messages
  const schema = useMemo(() => z.object({
    username: z.string().min(1, { message: t('auth:username_required') }),
    password: z.string().min(1, { message: t('auth:password_required') }),
  }), [i18n.language])

  type FormValues = z.infer<typeof schema>

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema)
  })

  if (isAuthenticated()) {
    return <Navigate to="/" replace />
  }

  const onSubmit = async (values: FormValues) => {
    setError(null)
    try {
      await login(values.username, values.password)
      navigate('/')
    } catch (e: any) {
      setError(e?.message ?? t('errors:login_failed'))
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-md">
      <div className="card">
        <h1 className="mb-4 text-xl font-semibold">{t('auth:login')}</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm">{t('auth:username')}</label>
            <input className="input" {...register('username')} />
            {errors.username && <p className="text-sm text-red-600">{errors.username.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm">{t('auth:password')}</label>
            <input type="password" className="input" {...register('password')} />
            {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn w-full" disabled={isSubmitting}>
            {isSubmitting ? t('auth:signingIn') : t('auth:signIn')}
          </button>
        </form>
      </div>
    </div>
  )
}
