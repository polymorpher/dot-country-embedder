import { type NextFunction, type Request, type Response } from 'express'
import { getSld, getSubdomain } from '../../common/domain-utils'
import { buildClient } from 'src/client.ts'

const substackDomainCache = {
  // uncomment the below for test purpose
  'www.polymorpher.localhost:3100': 'polymorpher.substack.com'
}

const client = buildClient()

const cache = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const host = req.get('host')

  if (!host) {
    return
  }

  let substackDomain = substackDomainCache[host]

  if (!substackDomain) {
    const subdomain = getSubdomain(host)
    const sld = getSld(host)

    substackDomain = await client.getLandingPage(sld, subdomain)

    if (!substackDomain.endsWith('.substack.com')) {
      throw new Error('Not substack page')
    }

    substackDomainCache[host] = substackDomain
  }

  res.locals.substackDomain = substackDomain

  next()
}

export default cache
