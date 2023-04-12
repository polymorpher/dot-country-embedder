import express from 'express'
import { StatusCodes } from 'http-status-codes'
// import { body } from 'express-validator'
import rateLimit from 'express-rate-limit'
import { getPage } from '../src/notion'
// import appConfig from '../config'

const router = express.Router()
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const limiter = (args?) => rateLimit({
  windowMs: 1000 * 60,
  max: 60,
  keyGenerator: req => req.fingerprint?.hash ?? '',
  ...args
})

router.get('/health', async (req, res) => {
  console.log('[/health]', req.fingerprint)
  res.send('OK').end()
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
      res.status(StatusCodes.NOT_IMPLEMENTED).json({ ret })
    } catch (ex) {
      console.error(ex)
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: ex.toString() })
    }
  })

export default router
