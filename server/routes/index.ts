import express from 'express'
import axios from 'axios'
import { StatusCodes } from 'http-status-codes'
import { getAllPageIds, getNotionPageId, getPage } from '../src/notion.ts'
import { getOGPage } from '../src/og.ts'
import { getSld, getSubdomain } from '../../common/domain-utils.ts'
import limiter from '../middlewares/limiter.ts'
import cached from '../middlewares/cache.ts'
import substack from '../middlewares/substack.ts'
import { printError } from '../src/util.ts'

const router = express.Router()

const AxiosBase = axios.create({ timeout: 15000 })
router.get('/health', async (req, res) => {
  console.log('[/health]', JSON.stringify(req.fingerprint))
  res.send('OK').end()
})

const SubstackCache: Record<string, { cacheTime: number, headers: unknown, data: unknown }> = {}
const CacheLife = 1000 * 60

router.post('/substack/api/v1/:endpoint*',
  limiter(),
  substack,
  async (req, res) => {
    const { substackDomain } = res.locals
    const { endpoint, 0: subEndpoint } = req.params
    const { accept, cookie } = req.headers
    try {
      const url = `https://${substackDomain}/api/v1/${endpoint}${subEndpoint ? '/' + subEndpoint : ''}`
      const { headers, data, status } = await AxiosBase.post(url, req.body, { params: req.query, headers: { accept, cookie }, validateStatus: () => true })
      if (headers['transfer-encoding'] === 'chunked') {
        delete headers['transfer-encoding']
      }
      res.status(status ?? 200).set(headers).send(data)
    } catch (ex: any) {
      printError(ex)
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'cannot process request' })
    }
  }
)

router.get('/substack/api/v1/:endpoint*',
  limiter(),
  substack,
  async (req, res) => {
    const { substackDomain } = res.locals
    const { endpoint, 0: subEndpoint } = req.params
    const { accept, cookie } = req.headers
    try {
      const url = `https://${substackDomain}/api/v1/${endpoint}${subEndpoint ? '/' + subEndpoint : ''}`
      const cacheKey = `${url}-${JSON.stringify(req.query)}`
      let headers, data, status
      if (SubstackCache[cacheKey]?.cacheTime !== undefined && SubstackCache[cacheKey].cacheTime + CacheLife > Date.now()) {
        headers = SubstackCache[cacheKey].headers
        data = SubstackCache[cacheKey].data
      } else {
        ({ headers, data, status } = await AxiosBase.get(url, { params: req.query, headers: { accept, cookie }, validateStatus: () => true }))
        SubstackCache[cacheKey] = { cacheTime: Date.now(), headers, data }
      }
      if (headers['transfer-encoding'] === 'chunked') {
        delete headers['transfer-encoding']
      }
      res.status(status ?? 200).set(headers).send(data)
    } catch (ex: any) {
      printError(ex)
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'cannot process request' })
    }
  }
)

router.get('/substack/subscribe',
  limiter(),
  substack,
  async (req, res) => {
    const { substackDomain } = res.locals
    const { accept, cookie } = req.headers
    try {
      const url = `https://${substackDomain}/subscribe`
      const { headers, data, status } = await AxiosBase.get(url, { params: req.query, headers: { accept, cookie }, validateStatus: () => true })
      if (headers['transfer-encoding'] === 'chunked') {
        delete headers['transfer-encoding']
      }
      res.status(status).set(headers).send(data)
    } catch (ex: any) {
      printError(ex)
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'cannot process request' })
    }
  }
)

router.get('/substack',
  limiter(),
  substack,
  async (req, res) => {
    try {
      const { substackDomain } = res.locals
      const url = `https://${substackDomain}/${req.query.url}`
      let headers, data
      if (SubstackCache[url]?.cacheTime !== undefined && SubstackCache[url].cacheTime + CacheLife > Date.now()) {
        headers = SubstackCache[url].headers
        data = SubstackCache[url].data
      } else {
        const response = await AxiosBase.get(url)
        headers = response.headers
        data = response.data
        SubstackCache[url] = { cacheTime: Date.now(), headers, data }
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
