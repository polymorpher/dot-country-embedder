import { type DomainInfo } from '../types.js'
import config from '../../config.js'
import { getPostUrl } from './utils.js'
import { redisClient } from '../redis.js'

export const renderFarcasterMapBasicPartialTemplate = (domainInfo: DomainInfo, image?: string): string => {
  const postUrlHost = getPostUrl(domainInfo.sld, domainInfo.subdomain)
  const postUrl = `${config.farcast.postProtocol}://${postUrlHost}/${config.farcast.apiBase}/map-basic/callback`

  return `
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${image ?? config.farcast.defaultImageUrl}" />
        <meta property="fc:frame:post_url" content="${postUrl}" />
        <meta property="fc:frame:button:1" content="Get .country" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="https://1.country"/>
        
        <meta property="fc:frame:button:2" content="Mint $MAP" />
        <meta property="fc:frame:button:2:action" content="post" />
        <meta property="fc:frame:button:2:target" content="${postUrl}"/>
        <meta property="fc:frame:input:text" content="Enter your location, earn $MAP"/>
    `
}

export const renderFarcasterMapFullTemplate = async (domainInfo: DomainInfo): Promise<string> => {
  const postUrlHost = getPostUrl(domainInfo.sld, domainInfo.subdomain)
  const postUrl = `${config.farcast.postProtocol}://${postUrlHost}/${config.farcast.apiBase}/map/callback`
  const reviewUrl = `${config.farcast.postProtocol}://${postUrlHost}/${config.farcast.apiBase}/map/review`

  const totalMintedStr = await redisClient.get(`${config.redis.prefix}:farcast-map:supply`)
  const totalMinted = Number(totalMintedStr)
  const minted24h = await redisClient.zCount(`${config.redis.prefix}:farcast-map:mints`, Date.now() - 24 * 3600 * 1000, Date.now())
  const line1 = { text: `${totalMinted.toLocaleString()} $MAP minted total`, fontSize: 36 }
  const line2 = { text: `${minted24h.toLocaleString()} in the last 24 hours`, lineHeightMultiplier: 2, fontSize: 48 }
  const t = encodeURIComponent(`${JSON.stringify(line1)}\n${JSON.stringify(line2)}`)
  const image = `${config.farcast.postProtocol}://${postUrlHost}/${config.farcast.apiBase}/text/image?t=${t}`

  return `
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${image}" />
        <meta property="fc:frame:post_url" content="${postUrl}" />
        <meta property="fc:frame:button:1" content="Review this place" />
        <meta property="fc:frame:button:1:action" content="post" />
        <meta property="fc:frame:button:1:target" content="${reviewUrl}"/>
        
        <meta property="fc:frame:button:2" content="Check-in for $MAP" />
        <meta property="fc:frame:button:2:action" content="post" />
        <meta property="fc:frame:button:2:target" content="${postUrl}"/>
        <meta property="fc:frame:input:text" content="Review or check-in, earn $MAP"/>
      </head>
      <body>Hello, bot!</body>
    </html>
  `
}
