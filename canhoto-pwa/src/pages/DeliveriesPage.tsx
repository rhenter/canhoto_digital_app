import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchDeliveries, type Delivery } from '../lib/api'

export default function DeliveriesPage() {
  const { t } = useTranslation(['deliveries', 'common'])
  const { data, isLoading, isError, refetch } = useQuery<Delivery[]>({
    queryKey: ['deliveries'],
    queryFn: fetchDeliveries,
  })

  if (isLoading) return <div>{t('deliveries:loading')}</div>
  if (isError) return (
    <div className="card">
      <p className="mb-2 text-red-600">{t('deliveries:load_error')}</p>
      <button className="btn" onClick={() => refetch()}>{t('common:retry')}</button>
    </div>
  )

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">{t('deliveries:title')}</h1>
      <ul className="space-y-2">
        {data?.map((d) => (
          <li key={d.id} className="card flex items-center justify-between">
            <div>
              <p className="font-medium">{d.code}</p>
              <p className="text-sm text-gray-600">{d.recipient_expected}</p>
              <p className="text-xs text-gray-500">{d.address}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-gray-100 px-2 py-1 text-xs capitalize text-gray-700">{d.status}</span>
              {d.status !== 'delivered' && (
                <Link to={`/deliveries/${d.id}/pod`} className="btn">{t('deliveries:register_pod')}</Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
