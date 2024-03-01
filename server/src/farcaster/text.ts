import { type RenderTextOptions } from './types.ts'
import { type DomainInfo } from '../types.ts'
import config from '../../config.js'
import { getPostUrl } from './utils.js'

export const renderTextSvg = (text: string, options?: RenderTextOptions): string => {
  const fontFamily = options?.fontFamily ?? 'Arial, sans-serif'
  const fontSize = `${(options?.fontSize ?? 60)}px`
  const color = options?.color ?? '#10b2e3'

  return `<?xml version="1.0" encoding="utf-8"?>
  <svg viewBox="0 0 978 512" xmlns="http://www.w3.org/2000/svg">
    <text style="white-space: pre; fill: ${color}; font-family: ${fontFamily}; font-size: ${fontSize};" x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">${text}</text>
  </svg>
  `
}

export const renderFarcasterTextTemplate = (domainInfo: DomainInfo, image?: string): string => {
  const postUrlHost = getPostUrl(domainInfo.sld, domainInfo.subdomain)
  const postUrl = `${config.farcast.postProtocol}://${postUrlHost}/${config.farcast.apiBase}/text/callback`

  return `
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${image ?? config.farcast.defaultImageUrl}" />
        <meta property="fc:frame:post_url" content="${postUrl}" />
        <meta property="fc:frame:button:1" content="Get .country" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="https://1.country"/>
        
        <meta property="fc:frame:button:2" content="Join raffle, get $COUNTRY" />
        <meta property="fc:frame:button:2:action" content="post" />
        <meta property="fc:frame:button:2:target" content="${postUrl}"/>
        <meta property="fc:frame:input:text" content="Message to inscribe"/>
    `
}
