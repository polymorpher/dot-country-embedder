export interface EwsReadOverride {
  landingPageSetting: string
  allowedPages: string[]
  ewsType: number
}

// Temporary read-only fallback while Harmony's official RPC is unavailable.
// These values mirror the EWS state for www.harmony.one (harmony-mirror/www).
const harmonyOneOverride: EwsReadOverride = {
  landingPageSetting: '211747cea4e240248d941496ee203be8:strict:gtag=G-WEDH2EPKBR:hotjar=3650092,6',
  allowedPages: ['1acb705065f64667bbefc96af004ffff'],
  ewsType: 1
}

export function getEwsReadOverride (sld: string, subdomain: string): EwsReadOverride | undefined {
  if (sld === 'harmony-mirror' && subdomain === 'www') {
    return harmonyOneOverride
  }
}
