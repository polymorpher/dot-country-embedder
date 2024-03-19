import { type DomainInfo } from '../types.js'
import config from '../../config.js'
import { getPostUrl } from './utils.js'

export const renderFarcasterSwapTemplate = (domainInfo: DomainInfo): string => {
  const postUrlHost = getPostUrl(domainInfo.sld, domainInfo.subdomain)
  const baseUrl = `${config.farcast.postProtocol}://${postUrlHost}/${config.farcast.apiBase}/swap`
  const postBuyUrl = `${baseUrl}/buy/callback`
  const postSellUrl = `${baseUrl}/sell/callback`
  const vwap = 0 // TODO: get $b price here
  const image = `${config.farcast.postProtocol}://${postUrlHost}/${config.farcast.apiBase}/text/image?t=${encodeURIComponent(`$B price (vwap): ${vwap}`)}`

  return `
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${image ?? config.farcast.defaultImageUrl}" />

    <meta property="fc:frame:button:1" content="Buy (10 WARPs)" />
    <meta property="fc:frame:button:1:action" content="post" />
    <meta property="fc:frame:button:1:target" content="${postBuyUrl}" />

    <meta property="fc:frame:button:2" content="Sell (8 WARPs)" />
    <meta property="fc:frame:button:2:action" content="post" />
    <meta property="fc:frame:button:2:target" content="${postSellUrl}" />
  `
}
