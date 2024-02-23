import { type DomainInfo } from './types.ts'
import config from '../config.ts'
import axios from 'axios'

const getPostUrl = (sld: string, subdomain?: string): string => {
  if (!config.farcast.postUrlSubdomainPrefix) {
    return subdomain ? `${sld}.${config.TLD}` : `${subdomain}.${sld}.${config.TLD}`
  }

  if (!subdomain) {
    return `${config.farcast.postUrlSubdomainPrefix}.${sld}.${config.TLD}`
  }
  return `${config.farcast.postUrlSubdomainPrefix}-${subdomain}.${sld}.${config.TLD}`
}

const getDefaultTokenName = (domainInfo: DomainInfo): string => {
  if (domainInfo.farcastDefaultTokenName) {
    return domainInfo.farcastDefaultTokenName
  }
  if (domainInfo.subdomain) {
    if (domainInfo.subdomain === 'www') {
      return `$${domainInfo.sld.toUpperCase()}`
    }
    return `$${domainInfo.subdomain?.toUpperCase()}.${domainInfo.sld.toUpperCase()}`
  }
  return `$${domainInfo.sld.toUpperCase()}`
}

export const renderFarcasterPartialTemplate = (domainInfo: DomainInfo, image?: string): string => {
  const postUrlHost = getPostUrl(domainInfo.sld, domainInfo.subdomain)
  const postUrl = `${config.farcast.postProtocol}://${postUrlHost}/${config.farcast.postUrlPath}`
  const mintUrl = `${config.farcast.postProtocol}://${postUrlHost}/${config.farcast.postUrlPath}?action=mint`
  const mintTokenName = getDefaultTokenName(domainInfo)
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
        <meta property="fc:frame:image" content="${image ?? config.farcast.defaultImageUrl}" />
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

export const renderMintSuccess = (): string => {
  return `
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="https://storage.googleapis.com/dotcountry-farcaster/mint-success.png" />
        <meta property="og:image" content="https://storage.googleapis.com/dotcountry-farcaster/mint-success.png" />
      </head>
      <body>Hello, bot!</body>
    </html>
`
}

export const renderMintFailed = (restartTarget: string): string => {
  return `
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:post_url" content="${restartTarget}" />
        <meta property="fc:frame:image" content="https://storage.googleapis.com/dotcountry-farcaster/mint-fail.png" />
        <meta property="og:image" content="https://storage.googleapis.com/dotcountry-farcaster/mint-fail.png" />
        <meta property="fc:frame:button:1" content="Restart" />
        <meta property="fc:frame:button:1:action" content="post" />
        <meta property="fc:frame:button:1:target" content="${restartTarget}"/>
        <meta property="fc:frame:input:text" content="Send feedback to us"/>
        
      </head>
      <body>Hello, bot!</body>
    </html>
`
}

export interface FarcastUserInfo {
  fid: number
  owner: string
  username: string
  timestamp: number
}

export const lookupFid = async (fid: number): Promise<FarcastUserInfo> => {
  const { data } = await axios.get(`https://fnames.farcaster.xyz/transfers/current?fid=${fid}`)
  const { owner, username, timestamp }: { owner: string, username: string, timestamp: number } = data
  return { fid, owner, username, timestamp: timestamp * 1000 }
}
