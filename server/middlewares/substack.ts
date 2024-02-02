import { type NextFunction, type Request, type Response } from 'express'
import { getSld, getSubdomain } from '../../common/domain-utils.ts'
import { buildClient } from '../src/client.ts'
import { parseSubstackUrl } from '../../common/substack-utils.ts'

const client = buildClient()

const substack = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const host = req.get('host')
  let pageUrl = req.query.url as string || ''

  if (!host) {
    return
  }
  if (!pageUrl) {
    const subdomain = getSubdomain(host)
    const sld = getSld(host)
    pageUrl = await client.getLandingPage(sld, subdomain)
  }
  const url = parseSubstackUrl(pageUrl)
  if (!url) {
    res.status(401).json({ error: 'Not substack page' })
    return
  }
  res.locals.substackDomain = url.host
  res.locals.substackUrl = pageUrl
  next()
}

export default substack
