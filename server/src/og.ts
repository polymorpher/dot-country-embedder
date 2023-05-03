import ethers from 'ethers'
import EWSAbi from '../../contract/abi/EWS.json' assert {
      type: 'json',
      integrity: 'sha384-ABC123'
}
import config from '../config.ts'
import { type OpenGraphData } from './types.ts'
import { type EWS } from '../../contract/typechain-types'
import { getOGDataFromPage, getPage } from './notion.ts'
import { encode } from 'html-entities'
import { type ExtendedRecordMap } from 'notion-types'
import { isValidNotionPageId } from '../../common/notion-utils.ts'

const escape = (s: string): string => {
  return s.replaceAll('"', '%22')
}
export const renderOpenGraphTemplate = (data: OpenGraphData): string => {
  return `<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${encode(data.title)}</title>
    <meta name="description" content="${encode(data.desc)}"/>
    <link rel="icon" href='${(data.icon)}' />
    ${data.image ? `<meta property="og:image" content="${data.image}"/>` : ''}
    <meta property="og:url" content="${data.url}"/>
    <meta property="og:title" content="${encode(data.title)}"/>
    <meta property="og:description" content="${encode(data.desc)}"/>
</head>
<body>Hello, bot!</body>
</html>`
}

const provider = new ethers.providers.StaticJsonRpcProvider(config.provider)

export const getOGPage = async (sld: string, path?: string): Promise<string> => {
  const c = new ethers.Contract(config.ewsContract, EWSAbi, provider) as EWS
  const node = ethers.utils.id(sld)
  const [landingPage, allowedPages] = await Promise.all([c.getLandingPage(node), c.getAllowedPages(node)])
  let page: ExtendedRecordMap
  if (path && isValidNotionPageId(path) && allowedPages.includes(path)) {
    page = await getPage(path)
  } else {
    page = await getPage(landingPage)
  }
  const ogData = getOGDataFromPage(page)
  const url = `https://${config.subdomain}.${sld}.${config.TLD}`
  return renderOpenGraphTemplate({ url, ...ogData })
}
