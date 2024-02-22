import { type DomainInfo, type OpenGraphData } from './types.ts'
import config from '../config.ts'

const getPostUrl = (sld: string, subdomain?: string): string => {
  if (!subdomain) {
    return `${config.farcast.postUrlSubdomainPrefix}${sld}.${config.TLD}`
  }
  return `${config.farcast.postUrlSubdomainPrefix}-${subdomain}.${sld}.${config.TLD}`
}
export const renderFarcasterPartialTemplate = (data: OpenGraphData, domainInfo: DomainInfo) => {
  const postUrlHost = getPostUrl(domainInfo.sld, domainInfo.subdomain)
  const postUrl = `https://${postUrlHost}/${config.farcast.postUrlPath}`
  const mintUrl = `https://${postUrlHost}/${config.farcast.postUrlPath}?action=mint`
  const mintTokenName = `$${domainInfo.sld.toUpperCase()}`
  let customTokenName = ''
  let customTokenAddress = ''
  let customMintUrl = ''
  let customMintActionType = 'post'
  if (domainInfo.farcastMintCustomToken) {
    const contentDecoded = decodeURIComponent(domainInfo.farcastMintCustomToken)
    try {
      const url = new URL(contentDecoded)
      customMintUrl = url.toString()
      customMintActionType = 'link'
    } catch (ex) {
      const [name, address] = domainInfo.farcastMintCustomToken.split(',')
      if (!address) {
        customTokenAddress = name
        customTokenName = 'Mystery NFT'
      } else {
        customTokenName = name
        customTokenAddress = address
      }
      customMintUrl = `https://${postUrlHost}/${config.farcast.postUrlPath}?action=mint&name=${customTokenName}&address=${customTokenAddress}`
    }
  }

  return `
        <meta property="fc:frame" content="vNext" />
       ${data.image ? `<meta property="fc:frame:image" content="${data.image}" />` : ''}
        <meta property="fc:frame:post_url" content="${postUrl}" />
        <meta property="fc:frame:button:1" content="Get .country" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="https://1.country"/>
        
        <meta property="fc:frame:button:2" content="Mint ${mintTokenName}" />
        <meta property="fc:frame:button:2:action" content="post" />
        <meta property="fc:frame:button:2:target" content="${mintUrl}"/>

        ${domainInfo.farcastMintCustomToken
? `
        <meta property="fc:frame:button:3" content="Mint ${customTokenName}" />
        <meta property="fc:frame:button:3:action" content="${customMintActionType}" />
        <meta property="fc:frame:button:3:target" content="${customMintUrl}"/>
        `
: ''}

        `
}
