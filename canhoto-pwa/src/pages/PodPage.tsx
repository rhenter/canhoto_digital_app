import { useParams, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import SignatureCanvas from 'react-signature-canvas'
import imageCompression from 'browser-image-compression'
import { presignUploads, uploadToPresigned, createPod } from '../lib/api'
import { enqueuePOD, processQueue } from '../lib/offlineQueue'

export default function PodPage() {
  const { t } = useTranslation(['pod', 'errors', 'common'])
  const { id } = useParams()
  const navigate = useNavigate()
  const sigRef = useRef<SignatureCanvas | null>(null)

  const [receivedByName, setReceivedByName] = useState('')
  const [receivedByDoc, setReceivedByDoc] = useState('')
  const [note, setNote] = useState('')
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>()
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | undefined>()
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Attempt to prefetch geolocation (best effort)
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setGeo(null),
        { enableHighAccuracy: true, timeout: 5000 }
      )
    }
  }, [])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const compressed = await imageCompression(file, { maxSizeMB: 0.6, maxWidthOrHeight: 1920 })
      const reader = new FileReader()
      reader.onload = () => setImageDataUrl(reader.result as string)
      reader.readAsDataURL(compressed)
    } catch (err) {
      console.error(err)
    }
  }

  const clearSignature = () => sigRef.current?.clear()
  const saveSignature = () => setSignatureDataUrl(sigRef.current?.getTrimmedCanvas().toDataURL('image/png'))

  const onSubmit = async () => {
    if (!id) return
    if (!signatureDataUrl) {
      setError(t('pod:save_signature_first'))
      return
    }
    if (!receivedByName) {
      setError(t('pod:enter_recipient_name'))
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      if (navigator.onLine) {
        // Prepare filenames
        const files: string[] = ['signature.png']
        if (imageDataUrl) files.push('photo.jpg')

        // Request presigned URLs
        const { uploads } = await presignUploads(Number(id), files)
        const byName = Object.fromEntries(uploads.map(u => [u.filename, u]))

        // Upload files
        const signatureBlob = dataURLtoBlob(signatureDataUrl)
        const signatureUrl = await uploadToPresigned(byName['signature.png'], signatureBlob)
        let photoUrl: string | undefined
        if (imageDataUrl) {
          const photoBlob = dataURLtoBlob(imageDataUrl)
          photoUrl = await uploadToPresigned(byName['photo.jpg'], photoBlob)
        }

        // Create POD entry
        const payload = {
          received_by_name: receivedByName,
          received_by_document: receivedByDoc || undefined,
          signed_at: new Date().toISOString(),
          geo_lat: geo?.lat ?? null,
          geo_lng: geo?.lng ?? null,
          signature_image: signatureUrl,
          photos: photoUrl ? [photoUrl] : [],
          meta: { note: note || undefined, ua: navigator.userAgent }
        }

        await createPod(Number(id), payload)
        // Process any queued items too
        processQueue().catch(() => {})
      } else {
        await enqueuePOD(Number(id), {
          received_by_name: receivedByName,
          received_by_document: receivedByDoc || undefined,
          signed_at: new Date().toISOString(),
          geo: geo ?? undefined,
          note: note || undefined,
          image: imageDataUrl,
          signature: signatureDataUrl,
        })
      }

      navigate('/')
    } catch (e: any) {
      setError(e?.message ?? t('errors:pod_submit_failed'))
      // Enqueue on fail for later processing
      await enqueuePOD(Number(id), {
        received_by_name: receivedByName,
        received_by_document: receivedByDoc || undefined,
        signed_at: new Date().toISOString(),
        geo: geo ?? undefined,
        note: note || undefined,
        image: imageDataUrl,
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
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">{t('pod:received_by_name')}</label>
            <input className="input" value={receivedByName} onChange={(e) => setReceivedByName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm">{t('pod:document_optional')}</label>
            <input className="input" value={receivedByDoc} onChange={(e) => setReceivedByDoc(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm">{t('pod:note')}</label>
          <textarea className="input min-h-[80px]" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm">{t('pod:photo')}</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {imageDataUrl && (
            <img src={imageDataUrl} alt="Preview" className="mt-2 max-h-60 rounded border" />
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm">{t('pod:signature')}</label>
          <div className="rounded border">
            <SignatureCanvas ref={sigRef} penColor="#111827" canvasProps={{ width: 500, height: 200, className: 'bg-white' }} />
          </div>
          <div className="mt-2 flex gap-2">
            <button className="btn" type="button" onClick={saveSignature}>{t('pod:save_signature')}</button>
            <button className="btn" type="button" onClick={clearSignature}>{t('pod:clear')}</button>
          </div>
          {signatureDataUrl && <img src={signatureDataUrl} alt="Signature" className="mt-2 max-h-40 rounded border" />}
        </div>
        {geo && (
          <p className="text-xs text-gray-500">{t('pod:location')}: {geo.lat.toFixed(5)}, {geo.lng.toFixed(5)}</p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button className="btn" onClick={onSubmit} disabled={isSubmitting}>{isSubmitting ? t('pod:submitting') : t('pod:submit')}</button>
          <button className="btn bg-gray-600 hover:bg-gray-700" type="button" onClick={() => navigate(-1)}>{t('pod:back')}</button>
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
  return new Blob([u8arr], { type: mime })
}
