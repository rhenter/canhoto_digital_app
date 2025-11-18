import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchDeliveries, type Delivery } from '../lib/api'

export default function DeliveriesPage() {
  const { t } = useTranslation(['deliveries', 'common'])
  const { data, isLoading, isError, refetch, isFetching } = useQuery<Delivery[]>({
    queryKey: ['deliveries'],
    queryFn: fetchDeliveries,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })

  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'pending' | 'delivered' | 'all'>('pending')

  const list = useMemo(() => {
    const items = (data ?? [])
      .filter((d) => filter === 'all' ? true : filter === 'pending' ? d.status === 'pending' : d.status === 'delivered')
      .filter((d) => {
        if (!q.trim()) return true
        const hay = [
          d.invoice.recipient_name,
          d.invoice.number,
          d.invoice.series,
          d.invoice.recipient_address_street,
          d.invoice.recipient_address_city,
          d.invoice.recipient_address_uf,
        ].join(' ').toLowerCase()
        return hay.includes(q.toLowerCase())
      })
    return items
  }, [data, q, filter])

  const statusClass = (s: Delivery['status']) => s === 'pending' ? 'status-pending' : s === 'delivered' ? 'status-delivered' : 'status-problem'
  const statusEmoji = (s: Delivery['status']) => s === 'pending' ? '🟠' : s === 'delivered' ? '🟢' : '🔴'

  if (isLoading) return <div>{t('deliveries:loading')}</div>
  if (isError) return (
    <div className="card">
      <p className="mb-2 text-red-600">{t('deliveries:load_error')}</p>
      <button className="btn" onClick={() => refetch()}>{t('common:retry')}</button>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <input
            className="input"
            placeholder={t('deliveries:search_placeholder', { defaultValue: 'Buscar por cliente, número ou endereço' }) as string}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Buscar"
          />
        </div>
        <div>
          <select
            className="input"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            aria-label="Filtro de status"
            title="Filtro de status"
          >
            <option value="pending">Pendentes</option>
            <option value="delivered">Entregues</option>
            <option value="all">Todos</option>
          </select>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
          onClick={() => refetch()}
          disabled={isFetching || !navigator.onLine}
          aria-busy={isFetching}
          title={!navigator.onLine ? t('common:offline', { defaultValue: 'Offline' }) : t('common:refresh', { defaultValue: 'Atualizar' })}
        >
          {isFetching ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" strokeWidth="4" opacity="0.25"/><path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" fill="none"/></svg>
              <span>{t('common:refreshing', { defaultValue: 'Atualizando...' })}</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2.9 10a7.1 7.1 0 111.5 4.4l1.1-.8A5.6 5.6 0 1010 4.4v1.9L6.9 3l3.1-3v1.9A7.1 7.1 0 012.9 10z"/></svg>
              <span>{t('common:refresh', { defaultValue: 'Atualizar' })}</span>
            </>
          )}
        </button>
      </div>

      <ul className="space-y-2">
        {list?.map((d) => (
          <li key={d.id} className="card bg-[#222]/60 text-white hover:bg-[#222]/80">
            <Link to={`/deliveries/${d.id}`} className="block">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm text-gray-300">#{d.code}</p>
                  <p className="text-lg font-semibold">{d.invoice.recipient_name}</p>
                  <p className="text-sm text-gray-300">{d.invoice.recipient_address_street}</p>
                  <p className="text-xs text-gray-400">{d.invoice.number}/{d.invoice.series}</p>
                </div>
                <div className="text-right">
                  <span className={`${statusClass(d.status)} inline-flex items-center gap-1`}>
                    <span aria-hidden>{statusEmoji(d.status)}</span>
                    <span className="capitalize">{d.status_display}</span>
                  </span>
                  <div className="mt-2 text-xs text-gray-400">{d.delivery_at ?? d.created_at}</div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

    </div>
  )
}
