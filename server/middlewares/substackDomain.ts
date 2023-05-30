import { type NextFunction, type Request, type Response } from 'express'
import { getSld, getSubdomain } from '../../common/domain-utils.ts'
import { buildClient } from '../src/client.ts'

const client = buildClient()

const getDomain = (host: string): string => {
  const res = host.split('://')
  if (res.length === 0) {
    return res[0]
  } else {
    return res[1]
  }
}

const substackDomain = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const host = req.get('host')

  if (!host) {
    return
  }

  const subdomain = getSubdomain(host)
  const sld = getSld(host)

  const substackDomain = await client.getLandingPage(sld, subdomain)

  if (!substackDomain.endsWith('.substack.com')) {
    res.status(401).send('Not substack page')
    return
  }

  res.locals.substackDomain = getDomain(substackDomain)

  next()
}

export default substackDomain
