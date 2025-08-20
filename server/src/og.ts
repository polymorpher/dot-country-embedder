import ethers from 'ethers'
import EWSAbi from '../../contract/abi/EWS.json' with { type: 'json' }
import config from '../config.ts'
import { type DomainInfo, EWSTypes, type OpenGraphData } from './types.ts'
import { type EWS } from '../../contract/typechain-types'
import { getOGDataFromPage, getPage } from './notion.ts'
import { encode } from 'html-entities'
import { type ExtendedRecordMap } from 'notion-types'
import { isValidNotionPageId, parsePath } from '../../common/notion-utils.ts'
import axios from 'axios'
import { parseSubstackUrl } from '../../common/substack-utils.ts'
import { renderFarcasterMapBasicPartialTemplate, renderFarcasterPartialTemplate, renderFarcasterTextTemplate, renderFarcasterMapFullTemplate } from './farcaster.ts'
import { JSDOM } from 'jsdom'
import { settingToDomainInfo } from './util.ts'

// const escape = (s: string): string => {
//   return s.replaceAll('"', '%22')
// }

const renderOpenGrapPartialTemplate = (data: OpenGraphData): string => {
  return `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${encode(data.title)}</title>
    <meta name="description" content="${encode(data.desc)}"/>
    <link rel="icon" href='${(data.icon)}' />
    ${data.image ? `<meta property="og:image" content="${data.image}"/>` : ''}
    <meta property="og:url" content="${data.url}"/>
    <meta property="og:title" content="${encode(data.title)}"/>
    <meta property="og:description" content="${encode(data.desc)}"/>
    <meta name="twitter:card" content="summary_large_image">
    ${data.image ? `<meta name="twitter:image" content="${data.image}"/>` : ''}
    <meta property="og:type" content="article">
    <meta property="og:locale" content="en_US">
   `
}

const renderOpenGraphTemplate = async (data: OpenGraphData, domain: DomainInfo): Promise<string> => {
  // console.log('[renderOpenGraphTemplate] domain', domain)
  const partial = renderOpenGrapPartialTemplate(data)
  let fcPartial = ''
  let fcFull = ''
  if (domain?.farcastEnabled) {
    if (domain.farcastBasicMap) {
      fcPartial = renderFarcasterMapBasicPartialTemplate(domain, data.image)
    } else if (domain.farcastMap) {
      fcFull = await renderFarcasterMapFullTemplate(domain)
    } else if (domain.farcastText) {
      fcPartial = renderFarcasterTextTemplate(domain, data.image)
    } else {
      fcPartial = renderFarcasterPartialTemplate(domain, data.image)
    }
  }
  if (fcFull) {
    return fcFull
  }
  return `
    <html>
      <head>
        ${partial}
        ${fcPartial}
      </head>
      <body>Hello, bot!</body>
    </html>
  `
}

const provider = new ethers.providers.StaticJsonRpcProvider(config.provider)

const getOGPageNotion = async (subdomain: string, sld: string, landingPageSetting: string, allowedPages: string[], path?: string, ua?: string): Promise<string> => {
  const rawPath = path
  path = parsePath(path)
  if (rawPath && !isValidNotionPageId(path)) {
    return EMPTY_PAGE
  }
  const domainInfo = settingToDomainInfo(sld, subdomain, landingPageSetting)
  let page: ExtendedRecordMap
  if (path && isValidNotionPageId(path) && (!!domainInfo.unrestrictedMode || allowedPages.includes(path))) {
    page = await getPage(path)
  } else {
    page = await getPage(domainInfo.landingPage ?? '')
  }
  const ogData = getOGDataFromPage(page, ua)
  const url = `https://${subdomain}${subdomain ? '.' : ''}${sld}.${config.TLD}`
  return await renderOpenGraphTemplate({ url, ...ogData }, domainInfo)
}

const EMPTY_PAGE = '<html></html>'

const substackAxiosBase = axios.create({ timeout: 15000 })
const getOGPageSubstack = async (subdomain: string, sld: string, landingPageSetting: string, path?: string): Promise<string> => {
  const domainInfo = settingToDomainInfo(sld, subdomain, landingPageSetting)
  const url = parseSubstackUrl(decodeURIComponent(domainInfo.landingPage ?? ''))
  if (!url) {
    return EMPTY_PAGE
  }

  const { data } = await substackAxiosBase.get(`https://${url.host}/${path}`)
  if (domainInfo.farcastEnabled) {
    const jsdom = new JSDOM(data)
    const image = jsdom.window.document.querySelector('meta[name="og:image"]')?.getAttribute('content') ?? undefined
    let farcasterPartial: string | undefined
    let farcasterFull: string | undefined
    if (domainInfo.farcastBasicMap) {
      farcasterPartial = renderFarcasterMapBasicPartialTemplate(domainInfo, image)
    } else if (domainInfo.farcastMap) {
      farcasterFull = await renderFarcasterMapFullTemplate(domainInfo)
      farcasterPartial = ''
    } else if (domainInfo.farcastText) {
      farcasterPartial = renderFarcasterTextTemplate(domainInfo, image)
    } else {
      farcasterPartial = renderFarcasterPartialTemplate(domainInfo, image)
    }
    if (farcasterFull) {
      return farcasterFull
    }
    const partialDom = JSDOM.fragment(farcasterPartial)
    jsdom.window.document.head.append(partialDom)
    return jsdom.serialize()
  }

  return data
}
export const getOGPage = async (sld: string, subdomain: string, path?: string, ua?: string): Promise<string> => {
  console.log('[-getOGPage]', { sld, subdomain, path })
  const c = new ethers.Contract(config.ewsContract, EWSAbi, provider) as unknown as EWS
  const node = ethers.utils.id(sld)
  const label = ethers.utils.id(subdomain)
  const [landingPageSetting, allowedPages, ewsType] = await Promise.all([
    c.getLandingPage(node, label),
    c.getAllowedPages(node, label),
    c.getEwsType(node, label)
  ])
  if (ewsType === EWSTypes.EWS_NOTION || ewsType === EWSTypes.EWS_NOTION) {
    return await getOGPageNotion(subdomain, sld, landingPageSetting, allowedPages, path, ua)
  }
  if (ewsType === EWSTypes.EWS_SUBSTACK) {
    return await getOGPageSubstack(subdomain, sld, landingPageSetting, path)
  }
  return EMPTY_PAGE
}
