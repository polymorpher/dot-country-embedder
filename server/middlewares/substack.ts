import { type NextFunction, type Request, type Response } from 'express'
import { getSld, getSubdomain } from '../../common/domain-utils.ts'
import { buildClient } from '../src/client.ts'

const client = buildClient()

function parseUrl (urlStr: string): URL | null {
  if (!urlStr?.startsWith('https://') && !urlStr?.startsWith('http://')) {
    return parseUrl(`https://${urlStr}`)
  }
  try {
    const url = new URL(urlStr)
    if (!url.host.endsWith('.substack.com')) {
      console.error(`${url} is not with substack.com`)
      return null
    }
    return url
  } catch (ex: any) {
    console.error(ex)
    return null
  }
}

const substack = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const host = req.get('host')
  if (!host) {
    return
  }
  const subdomain = getSubdomain(host)
  const sld = getSld(host)

  const landing = await client.getLandingPage(sld, subdomain)

  const url = parseUrl(landing)
  if (!url) {
    res.status(401).json({ error: 'Not substack page' })
    return
  }
  res.locals.substackDomain = url.host
  next()
}

export default substack
