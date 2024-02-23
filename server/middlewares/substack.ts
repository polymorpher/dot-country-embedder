import { type NextFunction, type Request, type Response } from 'express'
import { getSld, getSubdomain, parseSettings } from '../../common/domain-utils.ts'
import { buildClient } from '../src/client.ts'
import { parseSubstackUrl } from '../../common/substack-utils.ts'

const client = buildClient()

const substack = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const host = req.get('host')

  if (!host) {
    return
  }
  const subdomain = getSubdomain(host)
  const sld = getSld(host)
  const landing = await client.getLandingPage(sld, subdomain)
  const settings = parseSettings(landing)
  const url = parseSubstackUrl(settings.landingPage)
  console.log(landing, url)
  if (!url) {
    res.status(401).json({ error: 'Not substack page' })
    return
  }
  res.locals.substackDomain = url.host
  next()
}

export default substack
