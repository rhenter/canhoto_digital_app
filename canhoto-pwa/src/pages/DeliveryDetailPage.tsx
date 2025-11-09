import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { fetchDeliveryById, type Delivery } from '../lib/api'

export default function DeliveryDetailPage() {
  const { t } = useTranslation(['deliveries', 'common'])
  const { id } = useParams()

  const { data, isLoading, isError, refetch } = useQuery<Delivery>({
    queryKey: ['delivery', id],
    queryFn: () => fetchDeliveryById(id as string),
    enabled: !!id,
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {t('deliveries:detail_title', { defaultValue: 'Entrega' })} {d.invoice.number}/{d.invoice.series}
        </h1>
        <span className="rounded bg-gray-100 px-2 py-1 text-xs capitalize text-gray-700">{d.status}</span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="card space-y-1">
          <h2 className="text-sm font-semibold text-gray-700">{t('deliveries:invoice', { defaultValue: 'Nota Fiscal' })}</h2>
          <p><span className="text-gray-500">{t('deliveries:number', { defaultValue: 'Número' })}:</span> {d.invoice.number}</p>
          <p><span className="text-gray-500">{t('deliveries:series', { defaultValue: 'Série' })}:</span> {d.invoice.series}</p>
          <p><span className="text-gray-500">{t('deliveries:issuer', { defaultValue: 'Emitente' })}:</span> {d.invoice.issuer_name}</p>
          <p><span className="text-gray-500">{t('deliveries:issue_date', { defaultValue: 'Emissão' })}:</span> {d.invoice.issue_date}</p>
          <p><span className="text-gray-500">{t('deliveries:total_value', { defaultValue: 'Valor total' })}:</span> {d.invoice.total_value}</p>
        </div>
        <div className="card space-y-1">
          <h2 className="text-sm font-semibold text-gray-700">{t('deliveries:recipient', { defaultValue: 'Destinatário' })}</h2>
          <p>{d.invoice.recipient_name}</p>
          <p className="text-sm text-gray-600">
            {d.invoice.recipient_address_street}, {d.invoice.recipient_address_number} - {d.invoice.recipient_address_neighborhood}<br />
            {d.invoice.recipient_address_city}/{d.invoice.recipient_address_uf} • {d.invoice.recipient_address_zip_code}
          </p>
        </div>
      </div>

      {d.observations && (
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700">{t('deliveries:observations', { defaultValue: 'Observações' })}</h2>
          <p className="text-sm text-gray-700">{d.observations}</p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Link to="/" className="btn bg-gray-600 hover:bg-gray-700">{t('common:back', { defaultValue: 'Voltar' })}</Link>
        {d.status !== 'delivered' && (
          <Link to={`/deliveries/${d.id}/pod`} className="btn">{t('deliveries:register_pod', { defaultValue: 'Enviar prova' })}</Link>
        )}
      </div>
    </div>
  )
}
