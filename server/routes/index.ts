import { type NextFunction, type Request, type Response } from 'express'
import express from 'express'
import axios from 'axios'
import { StatusCodes } from 'http-status-codes'
import rateLimit from 'express-rate-limit'
import { getAllPageIds, getNotionPageId, getPage } from '../src/notion.ts'
import { getOGPage } from '../src/og.ts'
import { isValidNotionPageId, parsePath } from '../../common/notion-utils.ts'
import { isValidSubstackUrl } from '../../common/substack-utils.ts'
import { getSld, getSubdomain } from '../../common/domain-utils.ts'
import { LRUCache } from 'lru-cache'
import { buildClient } from '../src/client.ts'

const router = express.Router()
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const limiter = (args?) => rateLimit({
  windowMs: 1000 * 60,
  max: 60,
  keyGenerator: req => req.fingerprint?.hash ?? '',
  ...args
})

const cache = new LRUCache({
  max: 5000,
  maxSize: 50000,
  sizeCalculation: (value, key) => {
    return 1
  },
  ttl: 1000 * 60

})

const abbrv = (s: string | object, len: number = 10): string => {
  let printout = ''
  if (typeof s !== 'string') {
    printout = JSON.stringify(s)
  } else {
    printout = s
  }
  if (printout.length > len) {
    printout = printout.slice(0, len) + '...' + printout.slice(printout.length - 5)
  }
  return printout
}
const cached = (ttl?: number) => (req: Request, res: Response, next: NextFunction): void => {
  const key = `${req.method}|${req.path}|${JSON.stringify(req.query)}|${JSON.stringify(req.body)}|${req.header('user-agent')}`
  const keyContentType = key + '|header|content-type'
  const v = cache.get(key)
  if (v) {
    const contentType = cache.get(keyContentType)
    if (contentType) {
      console.log(`Cache header hit key=[${keyContentType}] value=`, contentType)
      res.header('content-type', contentType as string)
    }
    console.log(`Cache hit key=[${key}] value=`, abbrv(v), typeof v)
    res.send(v)
    return
  } else {
    // @ts-expect-error wrapper
    res.__send = res.send
    res.send = (r) => {
      console.log(`Cache set key=[${key}] value=`, abbrv(r), typeof r)
      cache.set(key, r, { ttl: ttl ?? 60 * 1000 })
      if (res.hasHeader('content-type')) {
        const h = res.getHeader('content-type')
        console.log(`Cache header set key=[${keyContentType}] value=`, h)
        cache.set(keyContentType, h, { ttl: ttl ?? 60 * 1000 })
      }
      // @ts-expect-error wrapper
      return res.__send(r)
    }
  }
  next()
}

router.get('/health', async (req, res) => {
  console.log('[/health]', JSON.stringify(req.fingerprint))
  res.send('OK').end()
})

const substackDomainCache = {
  // uncomment the below for test purpose
  'localhost:3100': 'polymorpher.substack.com'
}

const client = buildClient()

router.get('/substack/api/v1/archive',
  limiter(),
  async (req, res) => {
    const host = req.get('host')

    if (!host) {
      return
    }

    let substackDomain = substackDomainCache[host]

    if (!substackDomain) {
      const [subdomain, sld] = host?.split('.')

      substackDomain = await client.getLandingPage(sld, subdomain)

      if (!substackDomain.endsWith('.substack.com')) {
        throw new Error('Not substack page')
      }

      substackDomainCache[host] = substackDomain
    }

    const { data } = await axiosBase.get(`https://${substackDomain}/api/v1/archive`, { params: req.query })

    res.status(200).send(data)
  }
)

const axiosBase = axios.create({ timeout: 15000 })

router.get('/substack',
  limiter(),
  async (req, res) => {
    try {
      if (!req.query.url) {
        throw new Error('URL query param is not specified')
      }

      const url = decodeURI(req.query.url as string)

      if (!isValidSubstackUrl(url)) {
        throw new Error('Not substack url')
      }

      const { data } = await axiosBase.get(url)
      res.status(200).send(data)
    } catch (ex: any) {
      console.error(ex)
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: ex.toString() })
    }
  })

router.get('/notion',
  limiter(),
  cached(),
  async (req, res) => {
    const id = req.query?.id as (string | undefined)
    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: 'need id', id })
    }
    console.log('[/notion]', { id })
    try {
      const ret = await getPage(id)
      res.json(ret || {})
    } catch (ex: any) {
      console.error(ex)
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: ex.toString() })
    }
  })
router.post('/parse',
  limiter(),
  cached(30 * 1000),
  async (req, res) => {
    const url = req.body?.url as (string | undefined)
    if (!url) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: 'need url', url })
    }
    console.log('[/parse]', { url })
    try {
      const id = await getNotionPageId(url)
      res.json({ id })
    } catch (ex: any) {
      console.error(ex)
      const error = ex?.response?.data || ex.toString()
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error })
    }
  })

router.get('/links',
  limiter(),
  cached(30 * 1000),
  async (req, res) => {
    const id = req.query?.id as (string | undefined)
    const depth = Number(req.query?.depth ?? '0')
    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: 'need id', id })
    }
    console.log('[/links]', { id, depth })
    try {
      const ret = await getAllPageIds(id, depth)
      res.json(ret || {})
    } catch (ex: any) {
      console.error(ex)
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: ex.toString() })
    }
  })

// rendering preview data for crawler bots
router.get(['/*'], limiter(), cached(), async (req, res) => {
  try {
    const parts = req.hostname.split('.')
    const path = req.path.slice(1)
    if (path === 'robots.txt') {
      res.send('User-agent: *\nAllow: /')
      return
    }
    console.log('[/*]', req.hostname, req.path, 'ua:', req.header('user-agent'))
    const parsedPath = parsePath(path)
    if (path && !isValidNotionPageId(parsedPath)) {
      res.status(StatusCodes.BAD_REQUEST).json({})
      return
    }
    const subdomain = getSubdomain(parts)
    const sld = getSld(parts)
    const page = await getOGPage(sld, subdomain, parsedPath, req.get('user-agent'))
    res.header('content-type', 'text/html; charset=utf-8').send(page)
  } catch (ex: any) {
    console.error(ex)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: ex.toString() })
  }
})
export default router
