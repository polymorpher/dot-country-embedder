import express from 'express'
import axios from 'axios'
import { StatusCodes } from 'http-status-codes'
import { getAllPageIds, getNotionPageId, getPage } from '../src/notion.ts'
import { getOGPage } from '../src/og.ts'
import { getSld, getSubdomain } from '../../common/domain-utils.ts'
import limiter from '../middlewares/limiter.ts'
import cached from '../middlewares/cache.ts'
import substack from '../middlewares/substack.ts'

const router = express.Router()

router.get('/health', async (req, res) => {
  console.log('[/health]', JSON.stringify(req.fingerprint))
  res.send('OK').end()
})

const substackCache: Record<string, { cacheTime: number, headers: unknown, data: unknown }> = {}
const cacheLife = 1000 * 60

router.get('/substack/api/v1/:endpoint',
  limiter(),
  substack,
  async (req, res) => {
    const { substackDomain } = res.locals
    const { endpoint } = req.params
    try {
      const url = `https://${substackDomain}/api/v1/${endpoint}`
      const cacheKey = `${url}-${JSON.stringify(req.query)}`

      let headers, data

      if (substackCache[cacheKey]?.cacheTime !== undefined && substackCache[cacheKey].cacheTime + cacheLife > Date.now()) {
        headers = substackCache[cacheKey].headers
        data = substackCache[cacheKey].data
      } else {
        const response = await axiosBase.get(url, { params: req.query })
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
      console.error(ex)
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: ex.toString() })
    }
  }
)

const axiosBase = axios.create({ timeout: 15000 })

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
    const subdomain = getSubdomain(parts)
    const sld = getSld(parts)
    const page = await getOGPage(sld, subdomain, path, req.get('user-agent'))
    res.header('content-type', 'text/html; charset=utf-8').send(page)
  } catch (ex: any) {
    console.error(ex)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: ex.toString() })
  }
})
export default router
