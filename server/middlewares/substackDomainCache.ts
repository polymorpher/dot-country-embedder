import { type NextFunction, type Request, type Response } from 'express'
import { getSld, getSubdomain } from '../../common/domain-utils.ts'
import { buildClient } from '../src/client.ts'

const substackDomainCache: Record<string, string> =
  process.env.DEBUG
    ? {
        'www.polymorpher.localhost:3100': 'polymorpher.substack.com',
        'localhost:3100': 'polymorpher.substack.com',
        'localhost:3002': 'polymorpher.substack.com'
      }
    : {}

const client = buildClient()

const getDomain = (host: string): string => {
  const res = host.split('://')
  if (res.length === 0) {
    return res[0]
  } else {
    return res[1]
  }
}

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

  substackDomain.startsWith('https://')

  res.locals.substackDomain = getDomain(substackDomain)

  next()
}

export default cache
