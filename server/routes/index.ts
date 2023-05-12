import express from 'express'
import { StatusCodes } from 'http-status-codes'
import rateLimit from 'express-rate-limit'
import axios from 'axios'
import { getAllPageIds, getNotionPageId, getPage } from '../src/notion.ts'
import { getOGPage } from '../src/og.ts'
import { isValidNotionPageId } from '../../common/notion-utils.ts'

export const axiosBase = axios.create({ timeout: 15000 })

const router = express.Router()
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const limiter = (args?) => rateLimit({
  windowMs: 1000 * 60,
  max: 60,
  keyGenerator: req => req.fingerprint?.hash ?? '',
  ...args
})

router.get('/health', async (req, res) => {
  console.log('[/health]', JSON.stringify(req.fingerprint))
  res.send('OK').end()
})

router.get('/page',
  limiter(),
  async (req, res) => {
    try {
      if (!req.query.url) {
        throw new Error('URL query param is not specified')
      }
      const { data } = await axiosBase.get(req.query.url as string)
      res.status(200).send(data)
    } catch (ex: any) {
      console.error(ex)
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: ex.toString() })
    }
  })

router.get('/notion',
  limiter(),
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

router.get('/:substackHost/api/v1/archive',
  limiter(),
  async (req, res) => {
    const { data } = await axiosBase.get(`https://${req.params.substackHost}/api/v1/archive`, { params: req.query })
    res.status(200).send(data)
  }
)

// rendering preview data for crawler bots
router.get(['/*'], limiter(), async (req, res) => {
  try {
    const parts = req.hostname.split('.')
    const path = req.path.slice(1)
    if (path === 'robots.txt') {
      res.send('User-agent: *\nAllow: /')
      return
    }
    console.log('[/*]', req.hostname, req.path, 'ua:', req.header('user-agent'))
    if (path && !isValidNotionPageId(path)) {
      res.status(StatusCodes.BAD_REQUEST).json({})
      return
    }
    const subdomain = parts.length <= 2 ? '' : parts[parts.length - 3].toLowerCase()
    const sld = parts.length <= 1 ? '' : parts[parts.length - 2].toLowerCase()
    const page = await getOGPage(sld, subdomain, path)
    res.header('content-type', 'text/html; charset=utf-8').send(page)
  } catch (ex: any) {
    console.error(ex)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: ex.toString() })
  }
})
export default router
