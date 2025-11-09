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
          <li key={d.id} className="card hover:bg-gray-50">
            <Link to={`/deliveries/${d.id}`} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{d.invoice.number}/{d.invoice.series}</p>
                <p className="text-sm text-gray-600">{d.invoice.recipient_name}</p>
                <p className="text-xs text-gray-500">{d.invoice.recipient_address_street}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-gray-100 px-2 py-1 text-xs capitalize text-gray-700">{d.status}</span>
                <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
