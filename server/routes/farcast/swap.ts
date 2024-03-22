import router from './index.js'
import { authMessage, getPageSetting } from './middlewares.js'
import config from '../../config.js'
import { lookupFid, renderImageResponse } from '../../src/farcaster.js'
import type { Request } from 'express'

const generateImageResponse = (text: string, req: Request, retry = false): string => {
  const host = req.get('host')
  const image = `${req.protocol}://${host}/${config.farcast.apiBase}/text/image?t=${encodeURIComponent(text)}`
  const restartTarget = `${req.protocol}://${host}/${config.farcast.apiBase}/callback/redirect`

  if (retry) {
    return renderImageResponse(image, 'Retry', 'post', restartTarget)
  }

  return renderImageResponse(image)
}

router.post('/swap/buy/callback', authMessage, getPageSetting, async (req, res) => {
  if (!req.validatedMessage) {
    const html = generateImageResponse('Failed to validate the message. Please try again later.', req, true)
    return res.send(html).end()
  }

  const balanceInSat = 0
  const price = 0

  // TODO: BUY

  const fid = req.validatedMessage.data?.fid

  if (!fid) {
    console.error('[/farcast/swap/buy/callback] No fid found in validatedMessage')
    const html = generateImageResponse('Failed to get fid. Please try again later.', req, true)
    return res.send(html).end()
  }

  try {
    const { owner } = await lookupFid(fid)

    const text = `${balanceInSat} $B sats @ $${price} BTC.\n${owner}`
    const html = generateImageResponse(text, req)

    res.send(html).end()
  } catch {
    const html = generateImageResponse('Failed to get owner from fid. Please try again later.', req, true)
    return res.send(html).end()
  }
})

router.post('/swap/sell/callback', authMessage, getPageSetting, async (req, res) => {
  if (!req.validatedMessage) {
    const html = generateImageResponse('Failed to validate the message. Please try again later.', req, true)
    return res.send(html).end()
  }

  const balanceInSat = 0
  const price = 0

  // TODO: SELL

  const fid = req.validatedMessage.data?.fid

  if (!fid) {
    console.error('[/farcast/swap/sell/callback] No fid found in validatedMessage')
    const html = generateImageResponse('Failed to get fid. Please try again later.', req, true)
    return res.send(html).end()
  }

  try {
    const { owner } = await lookupFid(fid)

    const text = `${balanceInSat} $B sats @ $${price} BTC.\n${owner}`
    const html = generateImageResponse(text, req)

    res.send(html).end()
  } catch {
    const html = generateImageResponse('Failed to get owner from fid. Please try again later.', req, true)
    return res.send(html).end()
  }
})
