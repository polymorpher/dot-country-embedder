import express, { type Request, type Response } from 'express'
import axios from 'axios'
import lodash from 'lodash-es'
import { StatusCodes } from 'http-status-codes'
import { getAllPageIds, getNotionPageId, getPage } from '../src/notion.ts'
import { getOGPage } from '../src/og.ts'
import { getSld, getSubdomain } from '../../common/domain-utils.ts'
import limiter from '../middlewares/limiter.ts'
import cached from '../middlewares/cache.ts'
import substack from '../middlewares/substack.ts'
import { printError } from '../src/util.ts'

const router = express.Router()

const axiosBase = axios.create({ timeout: 15000 })
router.get('/health', async (req, res) => {
  console.log('[/health]', JSON.stringify(req.fingerprint))
  res.send('OK').end()
})

const substackCache: Record<string, { cacheTime: number, headers: unknown, data: unknown }> = {}
const cacheLife = 1000 * 60

const endpointHandler = (method: string) => async (req: Request, res: Response): Promise<void> => {
  const { substackDomain } = res.locals
  const { endpoint, 0: subEndpoint } = req.params
  const { accept, cookie } = req.headers
  try {
    const url = `https://${substackDomain}/api/v1/${endpoint}${subEndpoint ? '/' + subEndpoint : ''}`
    // console.log(req.params)
    // console.log(url)
    const cacheKey = `${url}-${JSON.stringify(req.query)}`

    let headers, data

    if (substackCache[cacheKey]?.cacheTime !== undefined && substackCache[cacheKey].cacheTime + cacheLife > Date.now()) {
      headers = substackCache[cacheKey].headers
      data = substackCache[cacheKey].data
    } else {
      const response = method === 'post'
        ? await axiosBase.post(url, req.body, { params: req.query, headers: { accept, cookie } })
        : await axiosBase.get(url, { params: req.query, headers: { accept, cookie } })
      headers = response.headers
      data = response.data

      substackCache[cacheKey] = {
        cacheTime: Date.now(),
        headers,
        data
      }
    }

    if (headers['transfer-encoding'] === 'chunked') {
      delete headers['transfer-encoding']
    }
    res.set(headers).send(data)
  } catch (ex: any) {
    printError(ex)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'cannot process request' })
  }
}
router.post('/substack/api/v1/:endpoint*',
  limiter(),
  substack,
  endpointHandler('post')
)

router.get('/substack/api/v1/:endpoint*',
  limiter(),
  substack,
  endpointHandler('get')
)

router.get('/substack',
  limiter(),
  substack,
  async (req, res) => {
    try {
      const { substackDomain } = res.locals
      const url = `https://${substackDomain}/${req.query.url}`

      let headers, data

      if (substackCache[url]?.cacheTime !== undefined && substackCache[url].cacheTime + cacheLife > Date.now()) {
        headers = substackCache[url].headers
        data = substackCache[url].data
      } else {
        const response = await axiosBase.get(url)
        headers = response.headers
        data = response.data

        substackCache[url] = {
          cacheTime: Date.now(),
          headers,
          data
        }
      }

      if (headers['transfer-encoding'] === 'chunked') {
        delete headers['transfer-encoding']
      }
      res.set(headers).send(data)
    } catch (ex: any) {
      printError(ex)
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'cannot process request' })
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
      printError(ex)
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
      printError(ex)
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ })
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
      printError(ex)
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ })
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
    const subdomain = getSubdomain(parts)
    const sld = getSld(parts)
    const page = await getOGPage(sld, subdomain, path, req.get('user-agent'))
    res.header('content-type', 'text/html; charset=utf-8').send(page)
  } catch (ex: any) {
    printError(ex)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ })
  }
})
export default router
