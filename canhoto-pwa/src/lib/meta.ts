// Utilities to collect client/device/browser/OS metadata for POD submissions

export function getClientMeta(source: 'online' | 'offlineQueue' | string = 'online') {
  const nav = typeof navigator !== 'undefined' ? navigator : ({} as any)
  const screenObj = typeof screen !== 'undefined' ? screen : ({} as any)
  const ua = nav.userAgent || ''
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua)
  const tz = Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone

  return {
    source,
    timestamp: new Date().toISOString(),
    timezone: tz,
    language: nav.language,
    languages: nav.languages,
    userAgent: ua,
    platform: nav.platform,
    vendor: (nav as any).vendor,
    deviceMemory: (nav as any).deviceMemory,
    hardwareConcurrency: (nav as any).hardwareConcurrency,
    online: (nav as any).onLine,
    screen: {
      width: screenObj.width,
      height: screenObj.height,
      availWidth: screenObj.availWidth,
      availHeight: screenObj.availHeight,
      pixelRatio: (window as any)?.devicePixelRatio,
    },
    isMobile,
    appVersion: (nav as any).appVersion,
  }
}
