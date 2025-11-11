import {useNavigate, useParams} from 'react-router-dom'
import {useEffect, useRef, useState} from 'react'
import {useTranslation} from 'react-i18next'
import SignatureCanvas from 'react-signature-canvas'
import imageCompression from 'browser-image-compression'
import {uploadPodMultipart} from '../lib/api'
import {enqueuePOD, processQueue} from '../lib/offlineQueue'
import { getClientMeta } from '../lib/meta'

export default function PodPage() {
    const {t} = useTranslation(['pod', 'errors', 'common'])
    const {id} = useParams()
    const navigate = useNavigate()
    const sigRef = useRef<SignatureCanvas | null>(null)

    const [receivedByName, setReceivedByName] = useState('')
    const [receivedByDoc, setReceivedByDoc] = useState('')
    const [observations, setObservations] = useState('')
    const [status, setStatus] = useState<'delivered' | 'failed' | 'partial'>('delivered')
    const [photoFiles, setPhotoFiles] = useState<File[]>([])
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
    const [signatureDataUrl, setSignatureDataUrl] = useState<string | undefined>()
    const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Attempt to prefetch geolocation (best effort)
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setGeo({lat: pos.coords.latitude, lng: pos.coords.longitude}),
                () => setGeo(null),
                {enableHighAccuracy: true, timeout: 5000}
            )
        }
    }, [])

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (!files.length) return
        try {
            const compressedPromises = files.map((file) => imageCompression(file, {
                maxSizeMB: 0.9,
                maxWidthOrHeight: 1920
            }))
            const compressed = await Promise.all(compressedPromises)
            setPhotoFiles(compressed as File[])
            // Generate previews
            const previews: string[] = []
            await Promise.all(
                compressed.map(
                    (f) =>
                        new Promise<void>((resolve) => {
                            const reader = new FileReader()
                            reader.onload = () => {
                                previews.push(reader.result as string)
                                resolve()
                            }
                            reader.readAsDataURL(f)
                        })
                )
            )
            setPhotoPreviews(previews)
        } catch (err) {
            console.error(err)
        }
    }

    const clearSignature = () => sigRef.current?.clear()
    const saveSignature = () => setSignatureDataUrl(sigRef.current?.getTrimmedCanvas().toDataURL('image/png'))

    const onSubmit = async () => {
        if (!id) return

        // Validation based on status rules
        if (status === 'delivered') {
            if (!signatureDataUrl) {
                setError(t('pod:save_signature_first'))
                return
            }
            if (!receivedByName) {
                setError(t('pod:enter_recipient_name'))
                return
            }
        }
        if (status === 'partial') {
            if (!signatureDataUrl) {
                setError(t('pod:save_signature_first'))
                return
            }
            if (!receivedByName) {
                setError(t('pod:enter_recipient_name'))
                return
            }
            if (!photoFiles.length) {
                setError(t('pod:photos_required'))
                return
            }
            if (!observations.trim()) {
                setError(t('pod:observations_required'))
                return
            }
        }
        if (status === 'failed') {
            if (!photoFiles.length) {
                setError(t('pod:photos_required'))
                return
            }
            if (!observations.trim()) {
                setError(t('pod:observations_required'))
                return
            }
        }

        setIsSubmitting(true)
        setError(null)

        try {
            if (navigator.onLine) {
                // Build multipart form
                const form = new FormData()
                // Required delivery id per new endpoint
                form.append('delivery', id)
                form.append('received_by_name', receivedByName)
                if (receivedByDoc) form.append('received_by_document', receivedByDoc)
                form.append('signed_at', new Date().toISOString())
                // New: send location as [lng, lat]
                if (geo?.lat != null && geo?.lng != null) {
                    form.append('location', JSON.stringify([geo.lng, geo.lat]))
                }
                form.append('status', status)
                if (observations) form.append('observations', observations)
                // Rich meta about device/browser/OS
                form.append('meta', JSON.stringify(getClientMeta('online')))

                // Append signature file (optional: required for delivered/partial)
                if (signatureDataUrl) {
                    const signatureBlob = dataURLtoBlob(signatureDataUrl)
                    form.append('signature_image', signatureBlob, 'signature.png')
                }

                // Append optional multiple photos (align key with new API: 'photos')
                photoFiles.forEach((file, idx) => {
                    form.append('photos', file, file.name || `photo_${idx + 1}.jpg`)
                })

                await uploadPodMultipart(id, form)
                // Process any queued items too (best effort)
                processQueue().catch(() => {
                })
            } else {
                // Offline: enqueue for later processing (keeps data URLs)
                await enqueuePOD(id, {
                    status,
                    observations: observations || undefined,
                    received_by_name: receivedByName || undefined,
                    received_by_document: receivedByDoc || undefined,
                    signed_at: new Date().toISOString(),
                    location: (geo?.lng != null && geo?.lat != null) ? [geo.lng, geo.lat] : undefined,
                    images: photoPreviews,
                    signature: signatureDataUrl,
                })
            }

            navigate('/')
        } catch (e: any) {
            setError(e?.message ?? t('errors:pod_submit_failed'))
            // Enqueue on fail for later processing
          await enqueuePOD(id, {
              status,
              observations: observations || undefined,
              received_by_name: receivedByName || undefined,
              received_by_document: receivedByDoc || undefined,
              signed_at: new Date().toISOString(),
              location: (geo?.lng != null && geo?.lat != null) ? [geo.lng, geo.lat] : undefined,
              images: photoPreviews,
              signature: signatureDataUrl,
          })
            navigate('/')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-4">
            <h1 className="text-xl font-semibold">{t('pod:title')}</h1>
            <div className="card space-y-4">
                <div>
                    <label className="mb-1 block text-sm">{t('pod:status')}</label>
                    <select className="input" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                        <option value="delivered">{t('pod:status_delivered')}</option>
                        <option value="partial">{t('pod:status_partial')}</option>
                        <option value="failed">{t('pod:status_failed')}</option>
                    </select>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                    <div>
                        <label className="mb-1 block text-sm">{t('pod:received_by_name')}</label>
                        <input className="input" value={receivedByName}
                               onChange={(e) => setReceivedByName(e.target.value)}/>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm">{t('pod:document_optional')}</label>
                        <input className="input" value={receivedByDoc}
                               onChange={(e) => setReceivedByDoc(e.target.value)}/>
                    </div>
                </div>

                <div>
                    <label className="mb-1 block text-sm">{t('pod:observations')}</label>
                    <textarea className="input min-h-[80px]" value={observations}
                              onChange={(e) => setObservations(e.target.value)}/>
                </div>
                <div>
                    <label className="mb-1 block text-sm">{t('pod:photo')}</label>
                    <input type="file" accept="image/*" multiple onChange={handleImageChange}/>
                    {!!photoPreviews.length && (
                        <div className="mt-2 grid grid-cols-3 gap-2">
                            {photoPreviews.map((src, i) => (
                                <img key={i} src={src} alt={`Preview ${i + 1}`}
                                     className="max-h-40 rounded border object-cover"/>
                            ))}
                        </div>
                    )}
                </div>
                <div>
                    <label className="mb-1 block text-sm">{t('pod:signature')}</label>
                    <div className="rounded border">
                        <SignatureCanvas ref={sigRef} penColor="#111827"
                                         canvasProps={{width: 500, height: 200, className: 'bg-white'}}/>
                    </div>
                    <div className="mt-2 flex gap-2">
                        <button className="btn" type="button" onClick={saveSignature}>{t('pod:save_signature')}</button>
                        <button className="btn" type="button" onClick={clearSignature}>{t('pod:clear')}</button>
                    </div>
                    {signatureDataUrl &&
                        <img src={signatureDataUrl} alt="Signature" className="mt-2 max-h-40 rounded border"/>}
                </div>
                {geo && (
                    <p className="text-xs text-gray-500">{t('pod:location')}: {geo.lat.toFixed(5)}, {geo.lng.toFixed(5)}</p>
                )}
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex gap-2">
                    <button className="btn" onClick={onSubmit}
                            disabled={isSubmitting}>{isSubmitting ? t('pod:submitting') : t('pod:submit')}</button>
                    <button className="btn bg-gray-600 hover:bg-gray-700" type="button"
                            onClick={() => navigate(-1)}>{t('pod:back')}</button>
                </div>
            </div>
        </div>
    )
}

function dataURLtoBlob(dataurl: string) {
    const arr = dataurl.split(',')
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream'
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) u8arr[n] = bstr.charCodeAt(n)
    return new Blob([u8arr], {type: mime})
}
