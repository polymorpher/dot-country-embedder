import { type DomainInfo } from '../types.js'
import config from '../../config.js'
import { getPostUrl } from './utils.js'

export const renderFarcasterSwapTemplate = (domainInfo: DomainInfo, image?: string): string => {
  const postUrlHost = getPostUrl(domainInfo.sld, domainInfo.subdomain)
  const postUrl = `${config.farcast.postProtocol}://${postUrlHost}/${config.farcast.apiBase}/map/callback`

  return `
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${image ?? config.farcast.defaultImageUrl}" />
    <meta property="fc:frame:post_url" content="${postUrl}" />
    <meta property="fc:frame:button:1" content="Buy (10 WARPs)" />
    <meta property="fc:frame:button:1:action" content="post_redirect" />
    <meta property="fc:frame:button:2" content="Sell (8 WARPs)" />
    <meta property="fc:frame:button:2:action" content="post_redirect" />
    <meta property="fc:frame:button:2:target" content="${postUrl}"/>
  `
}
