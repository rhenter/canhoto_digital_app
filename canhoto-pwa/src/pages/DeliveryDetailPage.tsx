import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fetchDeliveryById, type Delivery } from '../lib/api'

export default function DeliveryDetailPage() {
  const { t } = useTranslation(['deliveries', 'common'])
  const { id } = useParams()

  const { data, isLoading, isError, refetch, isFetching } = useQuery<Delivery>({
    queryKey: ['delivery', id],
    queryFn: () => fetchDeliveryById(id as string),
    enabled: !!id,
    refetchInterval: 30000, // auto-polling every 30s
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  })

  if (!id) {
    return <div className="card">{t('deliveries:invalid_id', { defaultValue: 'Entrega inválida.' })}</div>
  }

  if (isLoading) {
    return <div>{t('deliveries:loading_detail', { defaultValue: 'Carregando entrega...' })}</div>
  }

  if (isError || !data) {
    return (
      <div className="card">
        <p className="mb-2 text-red-600">{t('deliveries:load_error', { defaultValue: 'Falha ao carregar entregas.' })}</p>
        <button className="btn" onClick={() => refetch()}>{t('common:retry', { defaultValue: 'Tentar novamente' })}</button>
      </div>
    )
  }

  const d = data
  const statusClass = (s: Delivery['status']) => s === 'pending' ? 'status-pending' : s === 'delivered' ? 'status-delivered' : 'status-problem'
  const statusEmoji = (s: Delivery['status']) => s === 'pending' ? '🟠' : s === 'delivered' ? '🟢' : '🔴'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {t('deliveries:detail_title', { defaultValue: 'Entrega' })} {d.invoice.number}/{d.invoice.series}
        </h1>
        <div className="flex items-center gap-2">
          <span className={`${statusClass(d.status)} inline-flex items-center gap-1 text-sm`}>
            <span aria-hidden>{statusEmoji(d.status)}</span>
            <span className="capitalize">{d.status_display}</span>
          </span>
          <button
            className="inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
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
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="card space-y-1">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('deliveries:invoice', { defaultValue: 'Nota Fiscal' })}</h2>
          <p><span className="text-gray-500 dark:text-gray-400">{t('deliveries:number', { defaultValue: 'Número' })}:</span> {d.invoice.number}</p>
          <p><span className="text-gray-500 dark:text-gray-400">{t('deliveries:series', { defaultValue: 'Série' })}:</span> {d.invoice.series}</p>
          <p><span className="text-gray-500 dark:text-gray-400">{t('deliveries:issuer', { defaultValue: 'Emitente' })}:</span> {d.invoice.issuer_name}</p>
          <p><span className="text-gray-500 dark:text-gray-400">{t('deliveries:issue_date', { defaultValue: 'Emissão' })}:</span> {d.invoice.issue_date}</p>
          <p><span className="text-gray-500 dark:text-gray-400">{t('deliveries:total_value', { defaultValue: 'Valor total' })}:</span> {d.invoice.total_value}</p>
        </div>
        <div className="card space-y-1">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('deliveries:recipient', { defaultValue: 'Destinatário' })}</h2>
          <p>{d.invoice.recipient_name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {d.invoice.recipient_address_street}, {d.invoice.recipient_address_number} - {d.invoice.recipient_address_neighborhood}<br />
            {d.invoice.recipient_address_city}/{d.invoice.recipient_address_uf} • {d.invoice.recipient_address_zip_code}
          </p>
        </div>
      </div>

      {d.observations && (
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('deliveries:observations', { defaultValue: 'Observações' })}</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300">{d.observations}</p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Link to="/" className="btn-gray">{t('common:back', { defaultValue: 'Voltar' })}</Link>
        {d.status !== 'delivered' && (
          <Link to={`/deliveries/${d.id}/pod`} className="btn">{t('deliveries:register_pod', { defaultValue: 'Registrar Entrega' })}</Link>
        )}
      </div>
    </div>
  )
}
